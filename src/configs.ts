import path from 'path';
import 'dotenv/config';
import { ServerConfigInterface } from './SoakpServer';
import { StorageConfigInterface } from './KeyStorage';
import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateCompletionRequestPrompt,
  CreateCompletionRequestStop
} from 'openai';

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
  dbName: process.env.NODE_ENV === 'testing' ? 'testing_secrets.sqlite' : process.env.SQLITE_DB,
  tableName: process.env.NODE_ENV === 'testing' ? 'test_tokens' : process.env.SQLITE_TABLE,
  dataFileDir: path.resolve(process.env.DATA_DIR),
  tokenLifetime: process.env.NODE_ENV === 'testing' ? 600 : 604800
};

export const openAIConfig = {
  apiKey: undefined,
  organization: process.env.OPENAI_ORG_ID as string,
} as Configuration;

export const serverConfig: ServerConfigInterface = {
  httpPort: 3003,
  sslPort: parseInt(process.env.SECURE_PORT, 10) || 3033,
  httpAuthUser: process.env.AUTH_USER as string,
  httpAuthPass: process.env.AUTH_PASS as string,
};
