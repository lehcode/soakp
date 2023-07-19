/**
 * This endpoint vreates a model response for the given chat conversation.
 * Path: /v1/chat/completions
 */
export interface OpenAIChatCompletionsInterface {
  /**
   * The ID of the engine to use for the completion
   */
  engine_id: string;
  /**
   * The input text or prompt for which completion is requested
   */
  prompt: string;
  /**
   * The maximum number of tokens in the generated completion
   */
  max_tokens?: string;
  /**
   * Controls the randomness of the output
   */
  temperature?: number;
  /**
   * The cumulative probability of tokens to consider in the generated completion
   */
  top_p?: number;
  /**
   * Controls the diversity of the output by penalizing frequently used tokens
   */
  freq_penalty?: number;
  /**
   * Encourages the model to include or avoid certain content
   */
  presence_penalty?: number;
  /**
   * Specifies a stopping sequence for the generated completion
   */
  stop?: string;
}
