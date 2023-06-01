/**
 * This endpoint is used for performing a search query
 * Path: `/v1/engines/{engine_id}/search`
 */
export interface OpenAISearchInterface {
  /**
   * The ID of the engine to use for the search
   */
  engine_id: string;
  /**
   * An array of documents on which the search query will be performed.
   */
  documents: any[];
  /**
   * The search query string
   */
  query: string;
  /**
   * The number of documents to return
   */
  max_documents?: number;
  /**
   * Specifies whether to return metadata along with search results
   */
  return_metadata?: boolean;
}
