import express from 'express';
import { StatusCode } from '../enums/StatusCode.enum';
import { Responses } from '../http/Responses';
import { StatusMessage } from '../enums/StatusMessage.enum';
import validateToken from '../middleware/validateToken';
import initAi from '../middleware/initAi';
import { SoakpServer } from '../SoakpServer';

/**
 * @class OpenaiModelsApi
 */
export class OpenaiModelsApi {
  /**
   * Express application
   *
   * @private
   */
  private appService: express.Application;

  /**
   * OpenaiModelsApi
   *
   * @constructor
   * @param ctx
   */
  constructor(ctx: SoakpServer) {
    this.appService = ctx.getApp();

    this.appService.get('/openai/models',
                        validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
                        initAi(ctx),
                        this.getModels.bind(ctx));
    this.appService.get('/openai/models/:model_id',
                        validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
                        initAi(ctx),
                        this.getModel.bind(ctx));
  }
  /**
   * Handle GET `/openai/models` request
   *
   * @param req
   * @param res
   */
  async getModels(req: express.Request, res: express.Response) {
    try {
      // @ts-ignore
      const response = await this.proxy.listModels();

      if (response.status === StatusCode.SUCCESS) {
        Responses.success( res, { response: response.data, responseConfig: response.config.data }, StatusMessage.RECEIVED_OPENAI_API_RESPONSE );
      }
    } catch (error) {
      if (error instanceof Error) {
        return Responses.unknownServerError(res, error.message);
      } else {
        return Responses.unknownServerError(res, StatusMessage.UNKNOWN_ERROR);
      }
    }
  }

  /**
   * Handle GET `/openai/models/:model_id` request
   *
   * @param req
   * @param res
   *
   * TODO: Add route parameter validation
   */
  async getModel(req: express.Request, res: express.Response) {
    try {
      const modelId = String(req.params.model_id);
      // @ts-ignore
      const response = await this.proxy.getModel(modelId);

      if (response.status === StatusCode.SUCCESS) {
        return Responses.success( res, { response: response.data, responseConfig: response.config.data }, StatusMessage.RECEIVED_OPENAI_API_RESPONSE );
      }
    } catch (error) {
      if (error instanceof Error) {
        return Responses.unknownServerError(res, error.message);
      } else {
        return Responses.unknownServerError(res, StatusMessage.UNKNOWN_ERROR);
      }
    }
  }
}
