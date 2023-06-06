import { OpenAIRequestInterface } from './OpenAI/OpenAIRequest.interface';

export interface ProxyConfigInterface {
  apiHost?: string;
  apiBaseUrl?: string;
  query: OpenAIRequestInterface;
}
