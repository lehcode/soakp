/**
 * Author: Anton Repin<53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023.
 */
import path from 'path';
import { SqliteStorage } from './backends/SQLite';
// import { FileStorage } from './backends/File';
import { KeyStorageInterface } from './interfaces/KeyStorage.interface';
import { Tokens } from './enums/Tokens';

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
          const backend = await SqliteStorage.getInstance(config.sql?.dbName, config.sql?.tableName, sqliteFile);
          keyStorageInstance.backend = backend;
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
  async saveKey(openAIKey: string): Promise<Record<string, any>> {
    const result = this.backend.insert(openAIKey);
  }

  /**
   * Get OpenAI key
   *
   * @param openAIKey
   */
  fetchKey(openAIKey: string): Promise<any> {
    const result = this.backend.find(Tokens.OPENAI_KEY, [`key = ${openAIKey}`]);
  }

  /**
   * Check for OpenAI key existence
   *
   * @param openAIKey
   */
  keyExists(openAIKey: string): Promise<boolean> {
    const result = this.backend.find(Tokens.OPENAI_KEY, [`key = ${openAIKey}`]);
  }

  /**
   *
   * @param jwtToken
   */
  saveJWT = async (jwtToken: string) => {
    const row = await this.backend.find('*', [`token = '${jwtToken}'`]);
    const result = await this.backend.update([`id = ${row.id}`], [`token = ${jwtToken}`]);
    debugger;
  };

  /**
   *
   * @param jwtToken
   */
  async fetchJWT(jwtToken: string) {
    return Promise.resolve(this.backend.find('*', [`token = ${jwtToken}`])).then((result) => {
      debugger;
    });
  }

  /**
   * Check for JWT token existence
   *
   * @param openAIKey
   */
  async jwtExists(openAIKey: string): Promise<boolean> {
    return await this.backend.find(Tokens.JWT, openAIKey);
  }

  /**
   *
   * @param what
   */
  async archive(what: string): Promise<void> {
    debugger;

    return await this.backend.archive(what);
  }
}

export { KeyStorage, StorageType, StorageConfigInterface };
