/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
import { SoakpServer } from './src/SoakpServer';
import serverConfig from './src/config';
import { Message } from './src/enums/Message.enum';

Promise.resolve(new SoakpServer(serverConfig).start()).then(() => {
  console.log(`Started Secure OpenAI Key Proxy with TLS on port ${serverConfig.sslPort}.
Please provide support here: https://opencollective.com/soakp`);
}, (error: any) => {
  if (error instanceof Error) {
    throw error;
  } else if (typeof error === 'string') {
    throw new Error(error);
  } else {
    throw new Error(Message.UNKNOWN_ERROR);
  }
});
