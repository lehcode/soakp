/**
 * This endpoint is used for performing text classification.
 * Path: `/v1/engines/{engine_id}/classifications`
 */
export interface OpenAIClassificationInterface {
  /**
   * The ID of the engine to use for classification
   */
  engine_id: string;
  /**
   * An array of example objects containing the label and text.
   */
  examples: Record<string, string>[];
  /**
   * The model to use for search (overrides the engine's default search model)
   */
  search_model?: string;
  /**
   *  The model to use for classification (overrides the engine's default model)
   */
  model: string;
}
