/**
 * Author: Anton Repin<53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023.
 */
import path from 'path';
import { SqliteStorage } from './backends/SQLite';
// import { FileStorage } from './backends/File';
import { KeyStorageInterface } from './interfaces/KeyStorage.interface';
import { Tokens } from './enums/Tokens';
import { StatusCodes } from './enums/Codes';

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
  // private readonly response: express.Response;

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
  async saveKey(openAIKey: string) {
    try {
      const statusCode = await this.backend.insert('key', openAIKey);
      console.log('OpenAI key successfully saved');
      return statusCode;
    } catch (error) {
      console.error('Error saving OpenAI key:', error);
      return StatusCodes.INTERNAL_ERROR;
    }
  }

  /**
   * Get OpenAI key
   *
   * @param openAIKey
   */
  async fetchKey(openAIKey: string) {
    const result = await this.backend.find(Tokens.OPENAI_KEY, [`key = ${openAIKey}`]);
  }

  /**
   * Check for OpenAI key existence
   *
   * @param openAIKey
   */
  async keyExists(openAIKey: string) {
    const result = await this.backend.find(Tokens.OPENAI_KEY, [`key = ${openAIKey}`]);
  }

  /**
   *
   * @param jwtToken
   * @param openAIKey
   */
  async saveJWT(jwtToken: string, openAIKey: string) {
    try {
      const statusCode = await this.backend.update([`key ='${openAIKey}'`], [`token ='${jwtToken}'`]);

      if (statusCode === StatusCodes.ACCEPTED) {
        console.log('JWT token successfully saved');
        return statusCode;
      } else {
        console.error('Error saving JWT token:', statusCode);
      }
    } catch (e) {
      console.error(e);
      return;
    }
  }

  /**
   *
   * @param jwtToken
   */
  async fetchJWT(jwtToken: string) {
    const result = this.backend.find('*', [`token = ${jwtToken}`]);
  }

  /**
   * Check for JWT token existence
   *
   * @param openAIKey
   */
  async jwtExists(openAIKey: string) {
    return await this.backend.find(Tokens.JWT, openAIKey);
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
