import path from 'path';
import 'dotenv/config';
import { ServerConfigInterface } from './SoakpServer';

export const appConfig = {
  usernameRegex: /^[\w_]{3,16}$/,
  passwordRegex: /^[\w_]{8,32}$/,
};

const serverConfig: ServerConfigInterface = {
  storage: {
    dbName: process.env.NODE_ENV === 'testing' ? 'testing_secrets.sqlite' : process.env.SQLITE_DB,
    tableName: process.env.NODE_ENV === 'testing' ? 'test_tokens' : process.env.SQLITE_TABLE,
    dataFileDir: path.resolve(process.env.DATA_DIR),
    lifetime: process.env.NODE_ENV === 'testing' ? 60 : 86400
  },
  httpPort: 3003,
  sslPort: parseInt(process.env.SECURE_PORT, 10) || 3033,
  httpAuthUser: process.env.AUTH_USER as string,
  httpAuthPass: process.env.AUTH_PASS as string
};

export default serverConfig;
