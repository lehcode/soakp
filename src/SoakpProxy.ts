import { ProxyConfigInterface } from './interfaces/ProxyConfig.interface';
import { Configuration, OpenAIApi } from 'openai';
import { OpenAIRequestInterface } from './interfaces/OpenAI/OpenAIRequest.interface';

export class SoakpProxy {
  private config: ProxyConfigInterface;
  private openAI: OpenAIApi;
  private query = {
    apiKey: '',
    apiOrgKey: process.env.OPENAI_API_ORG_ID,
    prompt: 'Hello World, Buddy! :-)',
    model: 'text-davinci-003'
  };

  /**
   *
   * @param configuration
   */
  constructor(configuration: ProxyConfigInterface) {
    this.config = { ...configuration };
  }

  /**
   *
   * @param params
   */
  initAI(params: OpenAIRequestInterface) {
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
  async request(params: OpenAIRequestInterface) {
    const request: OpenAIRequestInterface = {
      model: params.model,
      prompt: params.messages,
      max_tokens: params.max_tokens,
      temperature: params.temperature
    };

    try {
      return await this.openAI.createCompletion(request);
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param value
   */
  set queryParams(value: OpenAIRequestInterface) {
    this.query = value;
  }
}
