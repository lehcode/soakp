import { SoakpServer } from '../SoakpServer';
import validateToken from '../middleware/validateToken';
import getProxyInstance from '../middleware/getProxyInstance';
import { SoakpProxy } from '../SoakpProxy';
import express from 'express';
import { StatusCode } from '../enums/StatusCode.enum';
import { Responses } from '../lib/Responses';
import { StatusMessage } from '../enums/StatusMessage.enum';

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
  }

  /**
   * Creates a job that fine-tunes a specified model from a given dataset.
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
   * List your organization's fine-tuning jobs
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
   * Retrieve fine-tune. Gets info about the fine-tune job.
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
   * List fine-tune events. Get fine-grained status updates for a fine-tune job.
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
   * Cancel fine-tune. Immediately cancel a fine-tune job.
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
}
