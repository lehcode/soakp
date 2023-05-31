/**
 * Author: Anton Repin <53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023.
 */
import dotenv from 'dotenv';
import { KeyStorage, StorageType } from './src/KeyStorage';
import { SoakpServer } from './src/SoakpServer';

dotenv.config();

export * from './src/JsonRespose';
export * from './src/SoakpServer';

const fallback = {
  dataFileLocation: './fallback',
  dbName: 'fallback',
  tableName: 'fallback',
  serverPort: 3000
};

const storageConfig = {
  dataFileLocation: process.env.DATA_FILE_DIR || fallback.dataFileLocation,
  sql: {
    dbName: process.env.SQL_DB_NAME || fallback.dbName,
    tableName: process.env.SQL_TABLE_NAME || fallback.tableName
  }
};

const storageType = process.env.STORAGE_TYPE as StorageType;

const storage = new KeyStorage(storageType, storageConfig);

const server = new SoakpServer({
  port: parseInt(process.env.SERVER_PORT, 10) || fallback.serverPort
});

async function start() {
  try {
    const storage = await KeyStorage.getInstance(storageType, storageConfig);
    await server.init(storage);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();
