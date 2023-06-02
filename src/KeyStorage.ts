/**
 * Author: Anton Repin<53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023.
 */
import path from 'path';
import { SqliteStorage } from './backends/SQLite';
// import { FileStorage } from './backends/File';
import { KeyStorageInterface } from './interfaces/KeyStorage.interface';
import { StatusCode } from './enums/StatusCode.enum';
import { ResponseInterface } from './interfaces/Response.interface';

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
    }

    return keyStorageInstance;
  }

  /**
   *
   * @param jwtToken
   */
  async saveJWT(jwtToken: string): Promise<StatusCode> {
    try {
      const statusCode = await this.backend.insert(jwtToken);

      if (statusCode === StatusCode.CREATED) {
        console.log('JWT token successfully saved');
      }

      return StatusCode.CREATED;
    } catch (e) {
      console.error(e);
    }
  }

  /**
   *
   * @param jwtToken
   */
  async fetchJWT(jwtToken: string): Promise<string | null> {
    try {
      const row = await this.backend.findToken(jwtToken);

      if (row.status === StatusCode.SUCCESS) {
        return row.data.token;
      }

      return;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Check for JWT token existence
   *
   * @param jwtToken
   */
  async jwtExists(jwtToken: string): Promise<string | boolean> {
    try {
      const result = await this.backend.find('*', [`token ='${jwtToken}'`]);

      if (result.status === StatusCode.SUCCESS) {
        console.log('JWT supplied to API was found in DB');
        return result.data.token;
      } else {
        console.log('Supplied JWT was not found in DB');
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

  /**
   *
   */
  async getActiveTokens() {
    try {
      const tokens = await this.backend.find('*', ['archived != 1']);
      if (tokens) {
        if (tokens.length === 0) {
          console.info('No active tokens found');
        }

        return tokens;
      } else {
      }
    } catch (e) {
      throw e;
    }

    // const rows = result.data;
    // return Promise.resolve()
    // // .then(rows => rows.map(row => row.data.token));
    //   .then((rows) => {
    //     if (rows.data.length) {
    //       return rows.data;
    //     } else {
    //       console.warn('No active tokens found');
    //     }
    //   });
  }

  /**
   *
   */
  get tableName(): string {
    return this.config.sql?.tableName;
  }

  /**
   *
   * @param query
   */
  async custom(query: string): Promise<Record<string, string | number>[]> {
    return await this.backend.custom(query);
  }

  /**
   *
   */
  get dbInstance(): SqliteStorage {
    return this.backend;
  }
}

export { KeyStorage, StorageType, StorageConfigInterface };
