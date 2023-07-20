/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai';

export enum ChatRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  FUNCTION = 'function'
}

/**
 * @class SoakpProxy
 */
export class SoakpProxy {
  private openai: OpenAIApi;

  /**
   * @constructor
   */
  constructor() {
    //
  }

  /**
   *
   * @param config
   */
  initAI(config: Configuration) {
    const configuration = new Configuration({
      apiKey: config.apiKey || '',
      organization: config.organization || null
    });
    this.openai = new OpenAIApi(configuration);

    console.log(`Initialized Soakp proxy with API key '${config.apiKey}'`);
  }

  /**
   *
   * Make OpenAI API call
   */
  async chatRequest(request: CreateChatCompletionRequest) {
    try {
      return await this.openai.createChatCompletion(request);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get list of OpenAI models with properties
   */
  async listModels() {
    return await this.openai.listModels();
  }

  /**
   * Retrieves a model instance, providing basic information about the model such as the owner and permissioning.
   *
   * @param {String} id
   */
  async getModel(id: string) {
    return await this.openai.retrieveModel(id);
  }
}
