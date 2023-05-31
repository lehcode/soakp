/**
 * Author: Anton Repin<53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023.
 */
import path from 'path';
import { SqliteStorage } from './backends/SQLite';
// import { FileStorage } from './backends/File';
import { KeyStorageInterface } from './interfaces/KeyStorage.interface';
import { StatusCode } from './enums/StatusCode';

interface StorageConfigInterface {
  dataFileLocation?: string;
  sql?: {
    dbName: string;
    tableName: string;
  };
}

enum StorageType {
  SQLITE = 'STORAGE_SQLITE',
  FILE = 'STORAGE_FILE',
  MEMORY = 'STORAGE_MEMORY'
}

class KeyStorage implements KeyStorageInterface {
  private readonly type: StorageType;
  private readonly config: StorageConfigInterface;
  private backend: SqliteStorage;

  /**
   * Class KeyStorage.
   * SQLite/file/memory storage for tokens.
   *
   * @param type
   * @param configuration
   */
  constructor(type: StorageType, configuration: StorageConfigInterface) {
    this.config = { ...configuration };
    this.type = type;
  }

  /**
   *
   * @param storageType
   * @param config
   */
  static async getInstance(storageType: StorageType, config: StorageConfigInterface) {
    const keyStorageInstance = new KeyStorage(storageType, config);

    switch (storageType) {
      default:
      case StorageType.SQLITE:
        const sqliteFile = path.resolve(config.dataFileLocation, `./${config.sql?.dbName}`);

        try {
          keyStorageInstance.backend = await SqliteStorage.getInstance(
            config.sql?.dbName,
            config.sql?.tableName,
            sqliteFile
          );
          console.log('Key Storage backend initialized');
        } catch (error) {
          console.error('Error initializing SQLite backend:', error);
          throw error;
        }
        break;

      // case StorageType.FILE:
      //   const dataFileLocation = path.resolve(this.config.dataFileLocation);
      //   this.backend = new FileStorage(dataFileLocation);
      //   break;
      //
      // case StorageType.MEMORY:
      //   this.backend = new Datastore();
      //   break;
    }

    return keyStorageInstance;
  }

  /**
   * @param openAIKey
   */
  async saveKey(openAIKey: string): Promise<boolean | StatusCode> {
    try {
      const statusCode = await this.backend.insert('key', openAIKey);
      console.log('OpenAI key successfully saved');

      return statusCode === StatusCode.SUCCESS;
    } catch (error) {
      console.warn('Error saving OpenAI key:', error);
      return StatusCode.INTERNAL_ERROR;
    }
  }

  /**
   * Get OpenAI key
   *
   * @param jwtToken
   */
  async fetchKey(jwtToken: string) {
    try {
      const rows = await this.backend.find('key', [`token ='${jwtToken}'`], 1);

      if (rows.data[0]?.length) {
        return result.data[0].key;
      }
    } catch (e) {
      throw e;
    }
  }

  /**
   * Check for OpenAI key existence
   *
   * @param openAIKey
   * @param jwtSigned
   */
  async keyExists(openAIKey: string, jwtSigned: string): Promise<string | boolean> {
    try {
      const found = await this.backend.find('*', [`key ='${openAIKey}'`], 1);

      if (found.status === StatusCode.SUCCESS) {
        console.log(`OK. OpenAI key '${openAIKey}' was found in DB`);

        if (!found.data.token) {
          console.warn(`JWT for key '${openAIKey}' was not found in DB. Adding it`);

          try {
            const resultStatus = await this.saveJWT(jwtSigned, openAIKey);
            if (resultStatus !== StatusCode.ACCEPTED) {
              return false;
            }
          } catch (e) {
            throw e;
          }
        } else {
          console.log(`Matching JWT token ${found.data.token} found`);
          return found.data.token;
        }
      } else {
        throw new Error('Application error');
      }
    } catch (e) {
      throw e;
    }
  }

  /**
   *
   * @param jwtToken
   * @param openAIKey
   */
  async saveJWT(jwtToken: string, openAIKey: string): Promise<StatusCode> {
    try {
      const statusCode = await this.backend.update([`key ='${openAIKey}'`], [`token ='${jwtToken}'`]);

      if (statusCode === StatusCode.ACCEPTED) {
        console.log('JWT token successfully saved');
      }

      return StatusCode.ACCEPTED;
    } catch (e) {
      console.error(e);
    }
  }

  /**
   *
   * @param jwtToken
   */
  async fetchJWT(jwtToken: string) {
    const result = this.backend.find('*', [`token = ${jwtToken}`], 1);
  }

  /**
   * Check for JWT token existence
   *
   * @param jwtToken
   */
  async jwtExists(jwtToken: string): Promise<string | boolean> {
    try {
      const result = await this.backend.find('*', [`token ='${jwtToken}'`], 1);

      if (result.status === StatusCode.SUCCESS) {
        console.log(`JWT found: '${jwtToken}'`);
        return result.data[0].token;
      } else {
        return false;
      }
    } catch (e) {
      throw e;
    }
  }

  /**
   *
   * @param what
   */
  async archive(what: string) {
    debugger;

    const result = await this.backend.archive(what);
  }
}

export { KeyStorage, StorageType, StorageConfigInterface };
