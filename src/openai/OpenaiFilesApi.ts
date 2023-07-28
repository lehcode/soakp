import express from 'express';
import { Responses } from '../lib/Responses';
import { StatusCode } from '../enums/StatusCode.enum';
import { StatusMessage } from '../enums/StatusMessage.enum';
import path from 'path';
import { serverConfig } from '../configs';
import fs, { createReadStream, PathLike } from 'fs';
import { ServerConfigInterface, SoakpServer } from '../SoakpServer';
import validateToken from '../middleware/validateToken';
import getProxyInstance from '../middleware/getProxyInstance';
import uploadFiles from '../middleware/uploadFiles';
import extractFileId from '../middleware/extractFileId';
import { SoakpProxy } from '../SoakpProxy';
import { Readable, Stream, Duplex } from 'stream';
import { from, Observer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Timer } from '../lib/Timer';

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
  private proxy: SoakpProxy;

  /**
   * Server configuration
   *
   * @protected
   */
  protected config: ServerConfigInterface;

  /**
   * OpenaiFilesApi
   *
   * @constructor
   * @param ctx
   */
  constructor(ctx: SoakpServer) {
    this.appService = ctx.getApp();
    this.proxy = ctx.proxy;
    this.config = ctx.config;

    this.appService.post(
      '/openai/files',
      validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
      getProxyInstance(ctx),
      uploadFiles(),
      this.sendFiles.bind(ctx)
    );
    this.appService.get(
      '/openai/files',
      validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
      getProxyInstance(ctx),
      this.listFiles.bind(ctx)
    );
    this.appService.delete(
      '/openai/files/:file_id',
      validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
      getProxyInstance(ctx),
      this.deleteFile.bind(ctx)
    );
    this.appService.get(
      '/openai/files/:file_id',
      validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
      getProxyInstance(ctx),
      extractFileId(),
      this.getFile.bind(ctx)
    );
    this.appService.get(
      '/openai/files/:file_id/content',
      validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
      getProxyInstance(ctx),
      extractFileId(),
      this.getFileData.bind(ctx)
    );
  }

  /**
   * Send uploaded file to OpenAI API
   *
   * @param req
   * @param res
   */
  private async sendFile(req: express.Request, res: express.Response) {
    try {
      const title = String(req.body.title);
      if (title === '') {
        return Responses.error(res, 'Invalid document title', StatusCode.BAD_REQUEST, StatusMessage.BAD_REQUEST);
      }

      req.body.convert = req.body.convert === 'true' || false;

      const docName = String(req.body.document_title);
      const purpose = 'fine-tune';
      const ext = path.extname(req.file.originalname);
      let response;

      if (ext === '.jsonl') {
        const file = `${serverConfig.dataDir}/jsonl/${req.file.filename}.jsonl`;
        await fs.promises.writeFile(file, req.file.buffer);
        // @ts-ignore
        response = await this.proxy.uploadFile(fs.createReadStream(file), purpose);
      } else {
        if (req.body.convert === true) {
          // Code to handle conversion if `convert` input field exists and is `true`
          const validExtensions = this.config.validFiles;

          if (validExtensions.test(req.file.originalname)) {
            // @ts-ignore
            const jsonlFile = await this.proxy.txt2jsonl(req.file, docName);
            // @ts-ignore
            const formFile = fs.createReadStream(jsonlFile);
            response = await this.proxy.uploadFile(formFile, purpose);
          }
        } else {
          return Responses.error(
            res,
            'Provided file is not JSONL and `convert` was not specified.',
            StatusCode.UNSUPPORTED_MEDIA_TYPE,
            StatusMessage.WRONG_FILE_TYPE
          );
        }
      }

      if (response.status === StatusCode.SUCCESS) {
        return Responses.success(
          res,
          { response: response.data, responseConfig: response.config.data },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
      }
    } catch (error) {
      console.error(error);
      return Responses.serverError(res);
    }
  }

  /**
   * Process uploaded files. Create JSONL file from uploaded files and upload it to OpenAI API.
   *
   * @param req
   * @param res
   */
  protected async sendFiles(req: express.Request, res: express.Response): Promise<void> {
    try {
      if (!req.files || !(req.files instanceof Array)) {
        Responses.error(res, 'File(s) not specified.', StatusCode.INTERNAL_ERROR, StatusMessage.UPLOAD_ERROR);
      }

      const files: Express.Multer.File[] = req.files as Express.Multer.File[];

      // Check titles
      if (req.files.length === 1 && !req.body.titles) {
        Responses.error(
          res,
          'File needs a title which was not specified.',
          StatusCode.INTERNAL_ERROR,
          StatusMessage.UPLOAD_ERROR
        );
        return;
      } else if (parseInt(String(req.files.length)) > 1 && !(req.body.titles instanceof Array)) {
        Responses.error(
          res,
          'Each file needs its corresponding title.',
          StatusCode.INTERNAL_ERROR,
          StatusMessage.UPLOAD_ERROR
        );
        return;
      }

      if (files.map((file: Express.Multer.File) => this.config.validFiles.test(file.originalname)).length !== parseInt(String(req.files.length))) {
        Responses.error(
          res,
          'Mixing of JSONL and non-JSONL files not allowed.',
          StatusCode.INTERNAL_ERROR,
          StatusMessage.UPLOAD_ERROR
        );
        return;
      }

      if (files.filter((file: Express.Multer.File) => path.extname(file.originalname) === '.jsonl').length === 0) {
        // Convert files to JSONL, then concatenate and upload to OpenAI API
        const concatTxt2Jsonlines$ = from(this.proxy.concatTxt2Jsonlines(files, req.body.titles));

        concatTxt2Jsonlines$.pipe(
          mergeMap((concatenatedFile: Express.Multer.File) => {
            const jsonlDataReadStream = fs.createReadStream(concatenatedFile.path, { encoding: 'utf8' });
            return this.proxy.uploadFile(jsonlDataReadStream, 'fine-tune');
          })
        ).subscribe({
          next: (response) => {
            console.log('Received `uploadFile()` response');

            if (response.status === StatusCode.SUCCESS) {
              Responses.success(
                res,
                { response: response.data, responseConfig: response.config.data },
                StatusMessage.RECEIVED_OPENAI_API_RESPONSE
              );
            } else {
              Responses.error(res, 'Upload error', response.status, StatusMessage.GATEWAY_ERROR);
            }
          },
          error: (err) => {
            console.log(err);
            if (err instanceof Error) {
              Responses.error(res, err.message, StatusCode.INTERNAL_ERROR, StatusMessage.BAD_REQUEST);
            }
          },
          complete: () => console.log('Complete')
        });
      } else {
        // Concatenate uploaded files into single JSONL file and upload to OpenAI API
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
    let response;

    try {
      // @ts-ignore
      response = await this.proxy.getFileInfo(fileId);

      if (response.status === StatusCode.SUCCESS) {
        return Responses.success(
          res,
          { response: response.data, responseConfig: response.config.data },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
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
      // @ts-ignore
      const response = await this.proxy.getFileData(fileId);

      if (response.status === StatusCode.SUCCESS) {
        const parsed = await this.proxy.parseJSONL(response.data);

        return Responses.success(
          res,
          { response: parsed, responseConfig: response.config.data },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
      }
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * Method to concatenate multiple Buffer objects
   *
   * @param buffers
   * @private
   */
  private concatenateBuffers(buffers: Buffer[]): Buffer {
    let totalLength = 0;
    for (const buffer of buffers) {
      totalLength += buffer.length;
    }

    const concatenatedBuffer = Buffer.alloc(totalLength);
    let offset = 0;
    for (const buffer of buffers) {
      buffer.copy(concatenatedBuffer, offset);
      offset += buffer.length;
    }

    return concatenatedBuffer;
  }

  static toArrayBuffer(buffer: Buffer) {
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
      view[i] = buffer[i];
    }
    return arrayBuffer;
  }

  static toBuffer(arrayBuffer: ArrayBuffer) {
    const buffer = Buffer.alloc(arrayBuffer.byteLength);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
      buffer[i] = view[i];
    }
    return buffer;
  }
}
