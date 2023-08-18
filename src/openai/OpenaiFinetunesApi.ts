import { SoakpServer } from '../SoakpServer';
import validateToken from '../middleware/validateToken';
import getProxyInstance from '../middleware/getProxyInstance';
import { SoakpProxy } from '../SoakpProxy';
import express from 'express';
import { StatusCode } from '../enums/StatusCode.enum';
import { StatusMessage } from '../enums/StatusMessage.enum';
import { Responses } from '../lib/Responses';
import { CreateFineTuneRequest } from 'openai';
import { Project } from 'ts-morph';

/**
 * `OpenaiFinetunesApi` class provides a set of methods that work with the OpenAI API to handle fine-tuning related jobs.
 * The methods provided allow to create, list, retrieve details, list events, and cancel fine-tuning jobs.
 * Each method corresponds to an API endpoint, and uses an Express application service and a proxy instance to communicate with OpenAI.
 * This class must be instantiated with a `SoakpServer` context which provides access to application services and utilities.
 */
export class OpenaiFinetunesApi {
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
   * OpenaiFinetunesApi constructor
   *
   * @constructor
   * @param ctx
   */
  constructor(ctx: SoakpServer) {
    this.appService = ctx.getApp();
    this.proxy = ctx.proxy;

    this.appService.post('/openai/fine-tunes',
                         validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
                         getProxyInstance(ctx),
                         this.createJob.bind(ctx));
    this.appService.get('/openai/fine-tunes',
                        validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
                        getProxyInstance(ctx),
                        this.listFineTunes.bind(ctx));
    this.appService.get('/openai/fine-tunes/:fine_tune_id',
                        validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
                        getProxyInstance(ctx),
                        this.getJob.bind(ctx));
    this.appService.get('/openai/fine-tunes/:fine_tune_id/events',
                        validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
                        getProxyInstance(ctx),
                        this.listEvents.bind(ctx));
    this.appService.post('/openai/fine-tunes/:fine_tune_id/cancel',
                         validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
                         getProxyInstance(ctx),
                         this.cancelJob.bind(ctx));
  
    this.appService.post('/openai/fine-tunes/upload',
                         validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
                         getProxyInstance(ctx),
                         this.uploadFineTuneFile.bind(ctx));
  }

  /**
   * `createJob` method initiates a fine-tuning job on the specified model using a given dataset.
   * It expects the incoming request body to include `training_file` (ID of the file to be used for training)
   * and `model` (model to be fine-tuned) parameters. It communicates with the OpenAI API via SoakpProxy.
   *
   * @param req
   * @param res
   *
   * TODO: Add input validation
   */
  async createJob(req: express.Request, res: express.Response) {
    try {
      const fileId = String(req.body.training_file);
      const response = await this.proxy.createFineTune(fileId);

      if (response.status === StatusCode.SUCCESS) {
        Responses.success( res, { response: response.data, responseConfig: response.config.data }, StatusMessage.RECEIVED_OPENAI_API_RESPONSE );
      }
      // @ts-ignore
    } catch (err: Error) {
      if (err.response.status === StatusCode.BAD_REQUEST) {
        Responses.error( res, err.message, StatusCode.BAD_REQUEST );
      } else {
        Responses.error( res, err.message, StatusCode.INTERNAL_ERROR );
      }
    }
  }

  /**
   * `listFineTunes` method retrieves a list of all fine-tuning jobs of the organization.
   * It does not require any specific parameters and fetches the data from OpenAI API via SoakpProxy.
   *
   * @param req
   * @param res
   */
  async listFineTunes(req: express.Request, res: express.Response) {
    try {
      const response = await this.proxy.listFineTunes();

      if (response.status === StatusCode.SUCCESS) {
        Responses.success( res, { response: response.data, responseConfig: response.config.data }, StatusMessage.RECEIVED_OPENAI_API_RESPONSE );
      }
      // @ts-ignore
    } catch (err: Error) {
      Responses.error( res, err.message, StatusCode.INTERNAL_ERROR );
    }
  }

  /**
   * `getJob` method retrieves detailed information about a specific fine-tuning job.
   * It expects a `fine_tune_id` parameter in the request URL that specifies the ID of the fine-tuning job to fetch.
   * The method communicates with the OpenAI API via proxy.
   *
   * @param req
   * @param res
   */
  async getJob(req: express.Request, res: express.Response) {
    try {
      const jobId = String(req.params.fine_tune_id);
      const response = await this.proxy.getFineTuneJob(jobId);

      if (response.status === StatusCode.SUCCESS) {
        Responses.success( res, { response: response.data, responseConfig: response.config.data }, StatusMessage.RECEIVED_OPENAI_API_RESPONSE );
      }
      // @ts-ignore
    } catch (err: Error) {
      Responses.error( res, err.message, StatusCode.INTERNAL_ERROR );
    }
  }

  /**
   * `listEvents` method retrieves a list of all events related to a specific fine-tuning job.
   * It expects a `fine_tune_id` parameter in the request URL that specifies the ID of the fine-tuning job.
   * The method communicates with the OpenAI API via proxy.
   *
   * @param req
   * @param res
   */
  async listEvents(req: express.Request, res: express.Response) {
    try {
      const jobId = String(req.params.fine_tune_id);
      const response = await this.proxy.getFineTuneJobEvents(jobId);

      if (response.status === StatusCode.SUCCESS) {
        Responses.success( res, { response: response.data, responseConfig: response.config.data }, StatusMessage.RECEIVED_OPENAI_API_RESPONSE );
      }
      // @ts-ignore
    } catch (err: Error) {
      Responses.error( res, err.message, StatusCode.INTERNAL_ERROR );
    }
  }

  /**
   * `cancelJob` method cancels a currently running fine-tuning job.
   * It expects a `fine_tune_id` parameter in the request URL that specifies the ID of the fine-tuning job to be cancelled.
   * The method communicates with the OpenAI API via proxy.
   *
   * @param req
   * @param res
   */
  async cancelJob(req: express.Request, res: express.Response) {
    try {
      const jobId = String(req.params.fine_tune_id);
      const response = await this.proxy.cancelFineTuneJob(jobId);

      if (response.status === StatusCode.SUCCESS) {
        Responses.success( res, { response: response.data, responseConfig: response.config.data }, StatusMessage.RECEIVED_OPENAI_API_RESPONSE );
      }
      // @ts-ignore
    } catch (err: Error) {
      Responses.error( res, err.message, StatusCode.INTERNAL_ERROR );
    }
  }

  /**
   * `uploadFineTuneFile` method uploads a file for fine-tuning a model.
   * It expects a file and a purpose in the request body. The purpose should be 'fine-tune'.
   * The method communicates with the OpenAI API via proxy.
   *
   * @param req
   * @param res
   */
  async uploadFineTuneFile(req: express.Request, res: express.Response) {
    try {
      const file = req.body.file;
      const purpose = req.body.purpose || 'fine-tune';

      if (!file) {
        Responses.error(res, 'File is required.', StatusCode.BAD_REQUEST);
        return;
      }

      if (!this.proxy) {
        Responses.error(res, 'Invalid proxy object.', StatusCode.INTERNAL_ERROR);
        return;
      }

      const response = await this.proxy.uploadFile(file, purpose);

      if (response.status === StatusCode.SUCCESS) {
        Responses.success(res, { response: response.data, responseConfig: response.config.data }, StatusMessage.RECEIVED_OPENAI_API_RESPONSE);
      } else {
        Responses.error(res, 'An error occurred during file upload.', StatusCode.INTERNAL_ERROR);
      }
    } catch (err: any) {
      Responses.error(res, err.message, StatusCode.INTERNAL_ERROR);
    }
  }
}
