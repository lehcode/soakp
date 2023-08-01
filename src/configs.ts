import path from 'path';
import 'dotenv/config';
import { ServerConfigInterface } from './SoakpServer';
import { StorageConfigInterface } from './KeyStorage';
import { ChatCompletionRequestMessage, CreateCompletionRequestPrompt, CreateCompletionRequestStop } from 'openai';
import { OpenAIConfigInterface } from './interfaces/OpenAIConfig.interface';

/**
 * Application configuration
 */
export const appConfig = {
  /**
   *  @type {RegExp}
   *  @memberOf appConfig
   */
  usernameRegex: /^[\w_]{3,16}$/,
  /**
   *  @type {RegExp}
   *  @memberOf appConfig
   */
  passwordRegex: /^[\w_]{8,32}$/,
  /**
   *  @type {RegExp}
   *  @memberOf appConfig
   */
  tokenRegex: /^[a-zA-Z0-9\/]+$/,
};

/**
 * Storage configuration
 */
export const storageConfig: StorageConfigInterface = {
  /**
   * @type {string}
   * @memberOf StorageConfigInterface
   */
  dbName: String(process.env.NODE_ENV) === 'testing' ? 'testing_secrets.sqlite' : String(process.env.SQLITE_DB),
  tableName: String(process.env.NODE_ENV) === 'testing' ? 'test_tokens' : String(process.env.SQLITE_TABLE),
  dataFileDir: path.resolve(String(process.env.DATA_DIR)),
  tokenLifetime: String(process.env.NODE_ENV) === 'testing' ? 600 : 604800
};

/**
 * OpenAI API configuration
 */
export const openaiConfig: OpenAIConfigInterface = {
  apiKey: undefined,
  orgId: String(process.env.OPENAI_ORG_ID),
};

export const serverConfig: ServerConfigInterface = {
  httpPort: 3003,
  sslPort: parseInt(process.env.SECURE_PORT, 10) || 3033,
  httpAuthUser: String(process.env.AUTH_USER),
  httpAuthPass: String(process.env.AUTH_PASS),
  dataDir: String(process.env.DATA_DIR),
  openAI: openaiConfig,
  validFiles: /\.txt|\.(t|c)sv|\.log|\.xml|\.jsonl?|\.ya?ml|\.md|\.rtf|\.html?|\.tsx?|\.jsx|\.py?$/i
};
