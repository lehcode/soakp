/**
 * Author: Anton Repin<53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023.
 */
import { StorageType } from './key-storage';
import { OpenAIProxy } from './key-server';

export * from './json-response';
export * from './key-server';

new OpenAIProxy({
  storage: <StorageType>process.env.STORAGE,
  port: Number(process.env.SERVER_PORT),
  dataFileLocation: <string>process.env.DATA_FILE_LOC,
  sql: {
    dbName: <string>process.env.SQL_DB_NAME,
    tableName: <string>process.env.SQL_TABLE_NAME
  }
});
