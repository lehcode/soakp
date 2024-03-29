import express from 'express';
import { ChatRole } from '../enums/ChatRole.enum';
import { StatusCode } from '../enums/StatusCode.enum';
import { Responses } from '../lib/Responses';
import { SoakpServer } from '../SoakpServer';
import validateToken from '../middleware/validateToken';
import getProxyInstance from '../middleware/getProxyInstance';

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
   * @constructor
   */
  constructor(ctx: SoakpServer) {
    this.appService = ctx.getApp();

    this.appService.post('/openai/completions',
                         validateToken(ctx.jwtHash, ctx.getKeyStorage(), ctx.getUser()),
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
      // @ts-ignore
      const response = await this.proxy.chatRequest({
        messages: req.body.messages || [
          { 'role': ChatRole.SYSTEM, 'content': 'You are a helpful assistant.' },
          { 'role': ChatRole.USER, 'content': 'Hello!' }
        ],
        model: req.body.model || 'gpt-3.5-turbo',
        temperature: req.body.temperature || 0.7,
        max_tokens: req.body.maxTokens || 100
      });

      // console.log(response);

      if (response.status === StatusCode.SUCCESS) {
        Responses.success( res, { response: response.data, responseConfig: response.config.data }, 'Received response from OpenAI API');
      }
    } catch (error) {
      console.debug(error);
      Responses.gatewayError(res);
    }
  }
}
