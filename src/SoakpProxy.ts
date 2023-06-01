import { ProxyConfigInterface } from './interfaces/ProxyConfig.interface';
import { Configuration, OpenAIApi } from 'openai';
import { OpenAIRequestInterface } from './interfaces/OpenAI/OpenAIRequest.interface';

export class SoakpProxy {
  private config: ProxyConfigInterface;
  private openAI: OpenAIApi;
  private query = {
    apiKey: '',
    apiOrgKey: 'org-euRh4hyXOmAEh9QagXatalSU',
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

    console.log(`Initialized Soakp proxy with ${this.config.query.apiKey}`);
  }

  /**
   *
   * @param params
   * @param maxTokens
   * @param temperature
   */
  async request(params: OpenAIRequestInterface, maxTokens = 100, temperature = 0.5) {
    const request = {
      model: params.model,
      prompt: params.prompt,
      max_tokens: maxTokens,
      temperature: temperature
    };

    try {
      const response = await this.openAI.createCompletion(request, { maxRate: 1 });
      console.log(response);
    } catch (error) {
      console.log(error);
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
