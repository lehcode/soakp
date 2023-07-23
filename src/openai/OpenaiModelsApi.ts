import express from 'express';
import { StatusCode } from '../enums/StatusCode.enum';
import { Responses } from '../http/Responses';
import { StatusMessage } from '../enums/StatusMessage.enum';

export class OpenaiModelsApi {
  constructor() {
    //
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
        Responses.success(
          res,
          {
            response: response.data,
            responseConfig: response.config.data
          },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
      }
    } catch (error) {
      console.error(error);
      Responses.serverError(res);
    }
  }

  /**
   * Handle GET `/openai/models/:model_id` request
   *
   * @param req
   * @param res
   */
  async getModel(req: express.Request, res: express.Response) {
    try {
      // @ts-ignore
      const response = await this.proxy.getModel(req.params.model_id);

      if (response.status === StatusCode.SUCCESS) {
        Responses.success(
          res,
          {
            response: response.data,
            responseConfig: response.config.data
          },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
      }
    } catch (error) {
      console.error(error);
      Responses.serverError(res);
    }
  }
}
