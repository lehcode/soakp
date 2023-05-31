/**
 * Author: Anton Repin <53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023.
 */
import dotenv from 'dotenv';
import { KeyStorage, StorageType } from './src/KeyStorage';
import { SoakpServer } from './src/SoakpServer';
import path from 'path';

dotenv.config();

export * from './src/JsonRespose';
export * from './src/SoakpServer';

const fallback = {
  dataFileLocation: path.resolve('./fallback'),
  dbName: 'fallback',
  tableName: 'fallback',
  serverPort: 3033
};

const storageConfig = {
  dataFileLocation: path.resolve(process.env.DATA_FILE_DIR) || fallback.dataFileLocation,
  sql: {
    dbName: process.env.SQLITE_DB || fallback.dbName,
    tableName: process.env.SQLITE_TABLE || fallback.tableName
  }
};

const server = new SoakpServer({
  port: parseInt(process.env.SERVER_PORT, 10) || fallback.serverPort
});

async function start() {
  try {
    const storage = await KeyStorage.getInstance(process.env.STORAGE_TYPE as StorageType, storageConfig);
    await server.init(storage);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();
