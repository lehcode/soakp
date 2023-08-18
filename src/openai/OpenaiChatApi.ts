import express from 'express';
import { ChatRole } from '../enums/ChatRole.enum';
import { StatusCode } from '../enums/StatusCode.enum';
import { Responses } from '../lib/Responses';
import { SoakpServer } from '../SoakpServer';
import validateToken from '../middleware/validateToken';
import getProxyInstance from '../middleware/getProxyInstance';
import { StatusMessage } from '../enums/StatusMessage.enum';
import { CreateChatCompletionRequest, CreateCompletionRequest } from 'openai';
import { SoakpProxy } from '../SoakpProxy';

/**
 * @class OpenaiChatApi
 */
export class OpenaiChatApi {
  /**
   * Express application
   *
   * @private
   */
  private appService: express.Application;

  /**
   * SOAKP proxy service
   *
   * @private
   */
  private proxyService: SoakpProxy;

  /**
   * @constructor
   */
  constructor(ctx: SoakpServer) {
    this.appService = ctx.app;
    this.proxyService = ctx.proxy;

    this.appService.post('/openai/completions',
                         validateToken(ctx.jwtHash, ctx.keyStorage, ctx.getUser()),
                         getProxyInstance(ctx),
                         this.makeChatCompletionRequest.bind(ctx));
  }

  /**
   * Handle POST `/openai/query` request
   *
   * @param req
   * @param res
   */
  async makeChatCompletionRequest(req: express.Request, res: express.Response) {
    try {
      const legacy = (req.body.model !== 'gpt-3.5-turbo');
      // @ts-ignore
      const apiRequest = this.generateChatRequest(req, res, legacy);
      const response = await this.proxyService.chatRequest(apiRequest, legacy);

      if (response.status === StatusCode.SUCCESS) {
        Responses.success( res, { response: response.data, responseConfig: response.config.data }, 'Received response from OpenAI API');
        return;
      }
      // @ts-ignore
    } catch (error: Error) {
      console.log(error);
      Responses.error(res, error.response.data.error.message, StatusCode.BAD_GATEWAY, StatusMessage.GATEWAY_ERROR);
    }
  }
}
