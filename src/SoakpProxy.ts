/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
import { Configuration, OpenAIApi } from 'openai';
import { CreateCompletionRequest } from 'openai/api';
import { OpenAIConfigInterface } from './interfaces/OpenAI/OpenAIConfig.interface';
import { OpenAICallInterface } from './interfaces/OpenAI/OpenAICall.interface';

/**
 * @class SoakpProxy
 */
export class SoakpProxy {
  private openAI: OpenAIApi;

  /**
   * @constructor
   */
  constructor() {
    //
  }

  /**
   *
   * @param params
   */
  initAI(params: OpenAIConfigInterface) {
    const config = new Configuration({
      apiKey: params.apiKey || '',
      organization: params.orgId || ''
    });
    this.openAI = new OpenAIApi(config);

    console.log(`Initialized Soakp proxy with API key '${params.apiKey}'`);
  }

  /**
   *
   * Make OpenAI API call
   */
  async apiCall(params: OpenAICallInterface, type = 'completion') {
    try {
      let request: CreateCompletionRequest;

      switch (type) {
        default:
        case 'completion':
          request = params as CreateCompletionRequest;
          return await this.openAI.createCompletion(request);
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  /**
   * Get list of OpenAI models with properties
   */
  async getModels() {
    return await this.openAI.listModels();
  }
}
