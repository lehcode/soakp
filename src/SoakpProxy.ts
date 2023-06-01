import { ProxyConfigInterface } from './interfaces/ProxyConfig.interface';
import { Configuration, OpenAIApi } from 'openai';

export class SoakpProxy {
  private config: ProxyConfigInterface;
  private openAI: OpenAIApi;

  constructor(configuration: ProxyConfigInterface) {
    this.config = { ...configuration };
    const apiConfig = new Configuration({
      apiKey: this.config.query.apiKey,
      organization: this.config.query.apiOrgKey
    });
    this.openAI = new OpenAIApi(apiConfig);
  }

  async request(prompt: string, maxTokens = 100, temperature = 0.5) {
    try {
      const completion = await this.openAI.createCompletion(
        {
          model: 'gpt-3.5-turbo',
          prompt: prompt,
          max_tokens: maxTokens,
          temperature: temperature
        },
        {
          maxRate: 0.001
        }
      );
      console.log(completion);
    } catch (err) {
      console.error(err);
    }
  }
}
