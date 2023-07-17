import path from 'path';
import 'dotenv/config';
import { ServerConfigInterface } from './SoakpServer';
import { StorageConfigInterface } from './KeyStorage';
import { ProxyConfigInterface } from './SoakpProxy';

export const appConfig = {
  usernameRegex: /^[\w_]{3,16}$/,
  passwordRegex: /^[\w_]{8,32}$/,
  tokenRegex: /^[a-zA-Z0-9\/]+$/,
};

export const storageConfig: StorageConfigInterface = {
  dbName: process.env.NODE_ENV === 'testing' ? 'testing_secrets.sqlite' : process.env.SQLITE_DB,
  tableName: process.env.NODE_ENV === 'testing' ? 'test_tokens' : process.env.SQLITE_TABLE,
  dataFileDir: path.resolve(process.env.DATA_DIR),
  lifetime: process.env.NODE_ENV === 'testing' ? 600 : 604800
};

export const serverConfig: ServerConfigInterface = {
  httpPort: 3003,
  sslPort: parseInt(process.env.SECURE_PORT, 10) || 3033,
  httpAuthUser: process.env.AUTH_USER as string,
  httpAuthPass: process.env.AUTH_PASS as string,
  openAI: {
    model: 'text-davinci-003',
    apiKey: undefined,
    apiOrgKey: undefined,
  }
};

export const proxyConfig: ProxyConfigInterface = {
  apiHost: 'https://api.openai.com',
  apiRoot: '/v1',
  apiBaseUrl: '/models',
  chatbot: <OpenAIConfigInterface>{
    model: 'text-davinci-003',
    apiKey: undefined,
    apiOrgKey: undefined,
    // engineId: 'davinci-codex'
  },
  prompt: 'Are you a chat bot?',
};

export interface OpenAIConfigInterface {
  /*
   ID of the model to use
   */
  model?: string;
  /*
   The prompt(s) to generate completions for,
   encoded as a string, array of strings, array of tokens, or array of token arrays.
   */
  prompt?: string | string[] | Record<string, any>[];
  apiKey?: string | undefined;
  apiOrgKey?: string | undefined;
  // engineId:? string | undefined;
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
