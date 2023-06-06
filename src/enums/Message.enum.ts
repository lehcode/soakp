export enum Message {
  CREATED = 'Created',
  FOUND = 'Found',
  INTERNAL_SERVER_ERROR = 'Internal server error',
  INVALID_KEY = 'Incorrect key supplied',
  INVALID_KEY_STORAGE = 'Invalid key storage',
  INVALID_OPENAI_KEY = 'OpenAI API key validation failed',
  INVALID_JWT = 'JWT validation failed',
  JWT_ADDED = 'JWT added',
  JWT_EXPIRED = 'JWT expired',
  JWT_NOT_SAVED = 'JWT not saved',
  JWT_UPDATED = 'JWT updated',
  LOADED_JWT_TOKEN = 'Loaded JWT token',
  NOT_AUTHORIZED = 'Not authorized',
  NOT_FOUND = 'Not found',
  SUCCESS = 'Success',
  UNKNOWN_ERROR = 'Unknown error',
  WRONG_REQUEST = 'Wrong Request'
}
