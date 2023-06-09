export default interface OpenAIRequestInterface {
  /*
   ID of the model to use
   */
  model: string;
  /*
   The prompt(s) to generate completions for,
   encoded as a string, array of strings, array of tokens, or array of token arrays.
   */
  prompt?: string | string[] | Record<string, any>[];
  apiKey?: string | null;
  apiOrgKey?: string;
  engineId?: string;
  /*
   What sampling temperature to use, between 0 and 2.
   Higher values like 0.8 will make the output more random,
   while lower values like 0.2 will make it more focused and deterministic
   */
  temperature?: number;
  /*
   The maximum number of tokens to generate in the completion
   */
  max_tokens?: number;
  /*
   The suffix that comes after a completion of inserted text.
   */
  suffix?: string;
}
