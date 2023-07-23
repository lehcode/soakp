export const modelEndpointMap: Record<string, string[]> = {
  '/v1/chat/completions': [
    'gpt-4',
    'gpt-4-0613',
    'gpt-4-32k',
    'gpt-4-32k-0613',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-0613',
    'gpt-3.5-turbo-16k',
    'gpt-3.5-turbo-16k-0613'
  ],
  '/v1/audio/transcriptions': ['whisper-1'],
  '/v1/fine-tunes': [
    'davinci',
    'curie',
    'babbage',
    'ada'
  ],
  '/v1/embeddings': [
    'text-embedding-ada-002',
    'text-similarity-*-001',
    'text-search-*-*-001',
    'code-search-*-*-001'
  ],
  '/v1/moderations': [
    'text-moderation-stable',
    'text-moderation-latest'
  ]
};
