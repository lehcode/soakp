/**
 * This endpoint is used for extracting answers from a given context.
 * Path: `/v1/engines/{engine_id}/answer`
 */
export interface OpenAIAnswerInterface {
  /**
   * The ID of the engine to use for answering questions
   */
  engine_id: string;
  /**
   * An array of documents containing the context in which the question is asked
   */
  documents: any[];
  /**
   * The question to be answered
   */
  question: string;
  /**
   * The model to use for search (overrides the engine's default search model)
   */
  search_model?: string;
  /**
   * The model to use for answering the question (overrides the engine's default model)
   */
  model?: string;
  /**
   * An array of example objects for instruction-based fine-tuning
   */
  examples?: any[];
}
