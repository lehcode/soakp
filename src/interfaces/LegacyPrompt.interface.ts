export interface LegacyPromptInterface {
  /**
   * ID of the model to use
   */
  model: string;
  /**
   * The prompt(s) to generate completions for, encoded as a string,
   * array of strings, array of tokens, or array of token arrays.
   * Note that <|endoftext|> is the document separator that the model sees during
   * training, so if a prompt is not specified the model will generate as if
   * from the beginning of a new document.
   */
  prompt: string | string[];
  /**
   * The suffix that comes after a completion of inserted text.
   */
  suffix?: string | null;
  /**
   * The maximum number of tokens to generate in the completion.
   * The token count of your prompt plus max_tokens cannot exceed the model's context length.
   */
  max_tokens?: number | 16;
  temperature
}
