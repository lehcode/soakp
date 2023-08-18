import express from 'express';
import { Responses } from '../lib/Responses';
import { StatusCode } from '../enums/StatusCode.enum';
import { StatusMessage } from '../enums/StatusMessage.enum';
import path from 'path';
import fs from 'fs';
import { ServerConfigInterface, SoakpServer } from '../SoakpServer';
import validateToken from '../middleware/validateToken';
import getProxyInstance from '../middleware/getProxyInstance';
import uploadFiles from '../middleware/uploadFiles';
import extractFileId from '../middleware/extractFileId';
import { SoakpProxy } from '../SoakpProxy';
import { from, Observable, bindNodeCallback, map, mergeAll, of, tap } from 'rxjs';
import { mergeMap, toArray } from 'rxjs/operators';
import { JSONL, JsonlLineInterface } from '../lib/JSONL';
import jsonlines from 'jsonlines';
import readline from 'readline';
import { serverConfig } from '../configs';
import { Readable } from 'stream';

export class OpenaiFilesApi {
  /**
   * Express application
   *
   * @private
   */
  private appService: express.Application;

  /**
   * Proxy instance
   *
   * @private
   */
  private proxyService: SoakpProxy;

  /**
   * Server configuration
   *
   * @protected
   */
  protected serverConfig: ServerConfigInterface;

  /**
   * JSONL parsing and generation
   *
   * @protected
   */
  jsonlService: JSONL;

  /**
   * OpenaiFilesApi
   *
   * @constructor
   * @param ctx
   */
  constructor(ctx: SoakpServer) {
    this.appService = ctx.app;
    this.serverConfig = ctx.config;
    this.jsonlService = ctx.jsonl;

    this.appService.post(
      '/openai/files',
      validateToken(ctx.jwtHash, ctx.keyStorage, ctx.getUser()),
      getProxyInstance(ctx),
      uploadFiles(),
      this.sendFiles.bind(ctx)
    );
    this.appService.get(
      '/openai/files',
      validateToken(ctx.jwtHash, ctx.keyStorage, ctx.getUser()),
      getProxyInstance(ctx),
      this.listFiles.bind(ctx)
    );
    this.appService.delete(
      '/openai/files/:file_id',
      validateToken(ctx.jwtHash, ctx.keyStorage, ctx.getUser()),
      getProxyInstance(ctx),
      this.deleteFile.bind(ctx)
    );
    this.appService.get(
      '/openai/files/:file_id',
      validateToken(ctx.jwtHash, ctx.keyStorage, ctx.getUser()),
      getProxyInstance(ctx),
      extractFileId(),
      this.getFile.bind(ctx)
    );
    this.appService.get(
      '/openai/files/:file_id/content',
      validateToken(ctx.jwtHash, ctx.keyStorage, ctx.getUser()),
      getProxyInstance(ctx),
      extractFileId(),
      this.getFileData.bind(ctx)
    );
  }


  /**
   * Process uploaded files. Create JSONL file from uploaded files and upload it to OpenAI API.
   *
   * @param req
   * @param res
   */
  protected async sendFiles(req: Express.Request, res: express.Response): Promise<void> {
    try {
      if (!req.files || !(req.files instanceof Array)) {
        Responses.error(res, 'File(s) not specified.', StatusCode.INTERNAL_ERROR, StatusMessage.UPLOAD_ERROR);
        return;
      }

      const files: Express.Multer.File[] = req.files as Express.Multer.File[];

      if (files.some((file: Express.Multer.File) => !this.serverConfig.validFiles.test(file.originalname))) {
        Responses.error(
          res,
          'Mixing of JSONL and non-JSONL files not allowed.',
          StatusCode.INTERNAL_ERROR,
          StatusMessage.UPLOAD_ERROR
        );
        return;
      }

      const processedFiles = await this.jsonlService.encodeFiles(files);

      const concatenatedFilesReadStream = processedFiles.map((file: any) =>
        fs.createReadStream(file.path, { encoding: 'utf8' }));

      const response = await this.proxyService.uploadFile(concatenatedFilesReadStream, 'fine-tune');

      console.log('Received `uploadFiles()` response');

      if (response.status === StatusCode.SUCCESS) {
        Responses.success(
          res,
          { response: response.data, responseConfig: response.config.data },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
      } else {
        Responses.error(res, 'Upload error', response.status, StatusMessage.GATEWAY_ERROR);
      }
    } catch (err: any) {
      console.log(err);
      if (err instanceof Error) {
        Responses.error(res, err.message, StatusCode.INTERNAL_ERROR, StatusMessage.BAD_REQUEST);
      }
    }
  }



  /**
   * A list of files that belong to the user's organization
   *
   * @param req
   * @param res
   */
  protected async listFiles(req: express.Request, res: express.Response) {
    try {
      // @ts-ignore
      const response = await this.proxy.openai.listFiles();

      if (response.status === StatusCode.SUCCESS) {
        Responses.success(
          res,
          { response: response.data, responseConfig: response.config.data },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
      }
    } catch (err: any) {
      console.log(err);
      Responses.serverError(res);
    }
  }

  /**
   * Delete file from OpenAI storage
   *
   * @param req
   * @param res
   *
   * TODO: Add input validation
   */
  protected async deleteFile(req: express.Request, res: express.Response) {
    const fileId = String(req.params.file_id);
    let response;

    try {
      // @ts-ignore
      response = await this.proxy.deleteFile(fileId);

      if (response.status === StatusCode.SUCCESS) {
        Responses.success(
          res,
          { response: response.data, responseConfig: response.config.data },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
      }
    } catch (err: any) {
      if (err.message === 'Request failed with status code 404') {
        Responses.error(res, 'File not found.', StatusCode.NOT_FOUND, StatusMessage.NOT_FOUND);
      }

      // console.log(err);
      Responses.error(res, err.message, StatusCode.INTERNAL_ERROR, StatusMessage.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get information about single previously uploaded JSONL file from the OpenAI storage
   *
   * @param req
   * @param res
   *
   * TODO: Add input validation
   */
  protected async getFile(req: express.Request, res: express.Response) {
    const fileId = String(req.openaiFileId);

    try {
      const response = await this.proxyService.getFileInfo(fileId);

      if (response.status === StatusCode.SUCCESS) {
        Responses.success(
          res,
          { response: response.data, responseConfig: response.config.data },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
        return;
      }
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * Get content of single previously uploaded JSONL file from the OpenAI storage
   *
   * @param req
   * @param res
   *
   * TODO: Add input validation
   */
  protected async getFileData(req: express.Request, res: express.Response) {
    const fileId = String(req.openaiFileId);

    try {
      const response = await this.proxyService.getFileData(fileId);

      if (response.status === StatusCode.SUCCESS) {
        const parsed = await this.jsonlService.parseJSONL(response.data);

        Responses.success(
          res,
          { response: parsed, responseConfig: response.config.data },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
        return;
      }
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }
}
