import path from 'path';
import dotenv from 'dotenv';
import { SoakpServer } from './src/SoakpServer';
import { KeyStorage, StorageType } from './src/KeyStorage';

dotenv.config();

const fallback = {
  dataFileLocation: './fallback',
  dbName: 'fallback',
  tableName: 'fallback',
  serverPort: 3033
};

const dataFileLocation = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : fallback.dataFileLocation;
const dbName = process.env.SQLITE_DB || fallback.dbName;
const tableName = process.env.SQLITE_TABLE || fallback.tableName;
const serverPort = parseInt(process.env.SERVER_PORT, 10) || fallback.serverPort;
const storageType = process.env.STORAGE_TYPE as StorageType;

const storageConfig = {
  dataFileLocation,
  sql: {
    dbName,
    tableName
  }
};

const server = new SoakpServer();

async function start() {
  try {
    const storage = await KeyStorage.getInstance(storageType, storageConfig);
    try {
      await server.start(serverPort, storage);
    } catch (initErr) {
      console.error('Error initializing server:', initErr);
      process.exit(1);
    }
  } catch (storageErr) {
    console.error('Error getting storage instance:', storageErr);
    process.exit(1);
  }
}

start();
