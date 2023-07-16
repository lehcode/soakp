/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
import { Configuration, OpenAIApi } from 'openai';
import { OpenAIConfigInterface } from './configs';
import { AxiosResponse } from 'axios';

export interface ProxyConfigInterface {
  apiHost?: string;
  apiBaseUrl?: string;
  openAI: OpenAIConfigInterface;
  prompt: string | Record<string, string>[];
}

export class SoakpProxy {
  private config: ProxyConfigInterface;
  private openAI: OpenAIApi;
  private openAIConfig: OpenAIConfigInterface;
  // private query: {
  //
  // };

  /**
   *
   * @param configuration
   */
  constructor(proxyConfig: ProxyConfigInterface) {
    this.config = proxyConfig;
  }

  /**
   *
   * @param params
   */
  initAI(params: OpenAIConfigInterface) {
    const config = new Configuration({
      apiKey: params.apiKey || '',
      organization: params.apiOrgKey || ''
    });
    this.openAI = new OpenAIApi(config);

    console.log(`Initialized Soakp proxy with ${params.apiKey}`);
  }

  /**
   *
   * @param config
   */
  async makeRequest(config: OpenAIConfigInterface): Promise<AxiosResponse<any, any>> {
    const request: OpenAIConfigInterface = {
      model: config.model,
      prompt: config.prompt,
      max_tokens: config.max_tokens,
      temperature: config.temperature
    };

    // @ts-ignore
    return await this.openAI.createCompletion(request);
  }

  /**
   * Get list of OpenAI models with properties
   *
   * @param config
   */
  async getModels(config: OpenAIConfigInterface) {
    const configuration: OpenAIConfigInterface = {
      apiKey: config.apiKey
    };

    return await this.openAI.listModels();
  }

  // /**
  //  *
  //  * @param config
  //  */
  // set queryParams(config: OpenAIConfigInterface) {
  //   this.query = configuration;
  // }
}
