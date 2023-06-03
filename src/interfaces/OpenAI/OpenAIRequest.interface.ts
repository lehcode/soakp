export interface OpenAIRequestInterface {
  apiKey: string;
  apiOrgKey: string;
  prompt: string;
  engineId: string;
  model: string;
  temperature: number;
  maxTokens: number;
}
