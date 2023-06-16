/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
import dotenv from 'dotenv';
import { SoakpServer, fallback, ServerConfigInterface } from './src/SoakpServer';
import path from 'path';

dotenv.config();

const httpPort = 3003;
const sslPort = parseInt(process.env.SERVER_PORT, 10) || fallback.serverPort;

(async () => {
  const config: ServerConfigInterface = {
    storage: {
      tableName: process.env.SQLITE_TABLE || fallback.tableName,
      dbName: process.env.SQLITE_DB || fallback.dbName,
      dataFileDir: process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : fallback.dataFileLocation,
      lifetime: 86400
    },
    httpPort: httpPort,
    sslPort: sslPort
  };

  try {
    await new SoakpServer(config).start();
  } catch (initErr) {
    console.error('Error initializing server:', initErr);
    process.exit(1);
  }
})();
