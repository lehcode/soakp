/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
import { Configuration, OpenAIApi } from 'openai';
import { OpenAIConfigInterface } from './configs';
import { AxiosResponse } from 'axios';

export interface ProxyConfigInterface {
  apiHost?: string | undefined;
  apiRoot?: string | undefined;
  apiBaseUrl?: string | undefined;
  chatbot: OpenAIConfigInterface;
}

export class SoakpProxy {
  private config: ProxyConfigInterface;
  private openAI: OpenAIApi;

  /**
   *
   * @param proxyConfig
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
   * @param params
   */
  async makeRequest(params: OpenAIConfigInterface): Promise<AxiosResponse<any, any>> {
    const request: OpenAIConfigInterface = {
      model: params.model,
      prompt: params.prompt,
      max_tokens: params.max_tokens,
      temperature: params.temperature
    };

    // @ts-ignore
    return await this.openAI.createCompletion(request);
  }

  /**
   * Get list of OpenAI models with properties
   */
  async getModels() {
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
