/**
 * Author: Lehcode
 * Copyright: (C)Lehcode.com 2023
 */
/**
 * Author: Lehcode
 * Copyright: (C)Lehcode.com 2023
 */
import { KeyStorage, StorageConfigInterface, DbSchemaInterface } from '../KeyStorage';
import SqliteStorage from '../backends/SQLite';
import { StatusCode } from '../enums/StatusCode.enum';
// Mock the SqliteStorage class
jest.mock('../backends/SQLite');
// Create a configuration object
const config: StorageConfigInterface = {
  tableName: 'test_table',
  lifetime: 1000,
  dbName: 'test_db',
  dataFileDir: './tmp',
};

describe('KeyStorage', () => {
  beforeEach(() => {
    const db = SqliteStorage.getInstance(config.dbName, config.tableName, `${config.dataFileDir}/${config.dbName}.sqlite`);
    SqliteStorage.getInstance = jest.fn().mockResolvedValue(db);
  });

  it('getInstance should return a KeyStorage instance', async () => {
    const keyStorageInstance = await KeyStorage.getInstance(config);
    expect(keyStorageInstance).toBeInstanceOf(KeyStorage);
  });

  // it('saveToken should return CREATED status code on success', async () => {
  //   const keyStorageInstance = await KeyStorage.getInstance(config);
  //   keyStorageInstance['backend'].insert = jest.fn().mockResolvedValue(null);
  //   const result = await keyStorageInstance.saveToken('test_token');
  //   expect(result).toBe(StatusCode.CREATED);
  // });
  //
  // it('saveToken should return false on error', async () => {
  //   const keyStorageInstance = await KeyStorage.getInstance(config);
  //   keyStorageInstance['backend'].insert = jest.fn().mockRejectedValue(new Error('Test error'));
  //   const result = await keyStorageInstance.saveToken('test_token');
  //   expect(result).toBe(false);
  // });
  //
  // it('fetchToken should return the token if found', async () => {
  //   const keyStorageInstance = await KeyStorage.getInstance(config);
  //   keyStorageInstance['backend'].findOne = jest.fn().mockResolvedValue({ token: 'test_token' });
  //   const result = await keyStorageInstance.fetchToken('test_token');
  //   expect(result).toBe('test_token');
  // });
  //
  // it('fetchToken should return an empty string if not found', async () => {
  //   const keyStorageInstance = await KeyStorage.getInstance(config);
  //   keyStorageInstance['backend'].findOne = jest.fn().mockRejectedValue(new Error('Not found'));
  //   const result = await keyStorageInstance.fetchToken('test_token');
  //   expect(result).toBe('');
  // });
  //
  // it('jwtExists should return the token if exists', async () => {
  //   const keyStorageInstance = await KeyStorage.getInstance(config);
  //   keyStorageInstance['backend'].findOne = jest.fn().mockResolvedValue({ token: 'test_token' });
  //   const result = await keyStorageInstance.jwtExists('test_token');
  //   expect(result).toBe('test_token');
  // });
  //
  // it('jwtExists should return false if not exists', async () => {
  //   const keyStorageInstance = await KeyStorage.getInstance(config);
  //   keyStorageInstance['backend'].findOne = jest.fn().mockRejectedValue(new Error('Not found'));
  //   const result = await keyStorageInstance.jwtExists('test_token');
  //   expect(result).toBe(false);
  // });
  //
  // it('archive should return ACCEPTED status code on success', async () => {
  //   const keyStorageInstance = await KeyStorage.getInstance(config);
  //   keyStorageInstance['backend'].archive = jest.fn().mockResolvedValue(null);
  //   const result = await keyStorageInstance.archive('test_token');
  //   expect(result).toBe(StatusCode.ACCEPTED);
  // });
  //
  // it('archive should return false on error', async () => {
  //   const keyStorageInstance = await KeyStorage.getInstance(config);
  //   keyStorageInstance['backend'].archive = jest.fn().mockRejectedValue(new Error('Test error'));
  //   const result = await keyStorageInstance.archive('test_token');
  //   expect(result).toBe(false);
  // });
  //
  // it('getActiveTokens should return an array of tokens', async () => {
  //   const keyStorageInstance = await KeyStorage.getInstance(config);
  //   const tokens: DbSchemaInterface[] = [
  //     { id: 1, token: 'token1', createdAt: '123', updatedAt: '123', lastAccess: '123', archived: 0 },
  //     { id: 2, token: 'token2', createdAt: '123', updatedAt: '123', lastAccess: '123', archived: 0 },
  //   ];
  //   keyStorageInstance['backend'].findAll = jest.fn().mockResolvedValue(tokens);
  //   const result = await keyStorageInstance.getActiveTokens();
  //   expect(result).toEqual(tokens);
  // });
  //
  // it('getRecentToken should return the most recent token', async () => {
  //   const keyStorageInstance = await KeyStorage.getInstance(config);
  //   keyStorageInstance['backend'].findOne = jest.fn().mockResolvedValue({ token: 'test_token' });
  //   const result = await keyStorageInstance.getRecentToken();
  //   expect(result).toBe('test_token');
  // });
  //
  // it('getRecentToken should return false if no recent token is found', async () => {
  //   const keyStorageInstance = await KeyStorage.getInstance(config);
  //   keyStorageInstance['backend'].findOne = jest.fn().mockRejectedValue(new Error('Not found'));
  //   const result = await keyStorageInstance.getRecentToken();
  //   expect(result).toBe(false);
  // });
  //
  // it('updateToken should return ACCEPTED status code on success', async () => {
  //   const keyStorageInstance = await KeyStorage.getInstance(config);
  //   keyStorageInstance['backend'].update = jest.fn().mockResolvedValue(null);
  //   const result = await keyStorageInstance.updateToken('old_token', 'new_token');
  //   expect(result).toBe(StatusCode.ACCEPTED);
  // });
  //
  // it('updateToken should return false on error', async () => {
  //   const keyStorageInstance = await KeyStorage.getInstance(config);
  //   keyStorageInstance['backend'].update = jest.fn().mockRejectedValue(new Error('Test error'));
  //   const result = await keyStorageInstance.updateToken('old_token', 'new_token');
  //   expect(result).toBe(false);
  // });
});
