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

    if (serverConfig.openAI.apiKey === undefined) {
      console.log(`Existing valid JWT not found. You can generate new one using:
curl -l 'https://localhost:3033/jwt/generate' --header 'Content-Type: application/json' --header 'Authorization: Basic <basic_auth_token>' --data '{ "key": "<sk-apikey>", "orgId": "<org-orgId>"`);
    }

    const server = new SoakpServer(serverConfig, storage);
    await server.start();

    console.log(`Started Secure OpenAI Key Proxy with TLS on port ${serverConfig.sslPort}.
Please provide support here: https://opencollective.com/soakp`);
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
