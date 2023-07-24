/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
import { SoakpServer } from './src/SoakpServer';
import { serverConfig, storageConfig } from './src/configs';
import { StatusMessage } from './src/enums/StatusMessage.enum';
import { KeyStorage } from './src/KeyStorage';

const startServer = async () => {
  try {
    const storage = await KeyStorage.getInstance(storageConfig);
    const server = new SoakpServer(serverConfig, storage);
    await server.start();

    console.log(`Started Secure OpenAI Key Proxy with TLS on port ${serverConfig.sslPort}.
Please provide support here: https://opencollective.com/soakp`);
    if (serverConfig.openAI.apiKey === undefined) {
      console.log('Existing valid JWT not found. You can generate new one using:\n' +
        'curl --location-trusted \'https://localhost:3033/jwt/generate\'' + ' \\\n\t' +
        '--header \'Content-Type: application/json\'' + ' \\\n\t' +
        '--header \'Authorization: Basic <basic_auth_token>\'' + ' \\\n\t' +
        '--data \'{ "key": "<sk-apikey>", "orgId": "<org-orgId>" }\'');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else if (typeof error === 'string') {
      throw new Error(error);
    } else {
      throw new Error(StatusMessage.UNKNOWN_ERROR);
    }
  }
};

startServer();
