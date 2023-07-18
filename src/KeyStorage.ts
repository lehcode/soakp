/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
import path from 'path';
import SqliteStorage from './backends/SQLite';
import { StatusCode } from './enums/StatusCode.enum';
import jwt from 'jsonwebtoken';

/**
 * @export
 * @interface DbSchemaInterface
 */
export interface DbSchemaInterface extends Object {
  id: null | number;
  token: string | null;
  createdAt: number | string;
  updatedAt: number | string;
  lastAccess: number | string;
  archived: boolean | 0 | 1 | '0' | '1';
}

/**
 * @export
 * @interface StorageConfigInterface
 */
export interface StorageConfigInterface {
  tableName: string;
  tokenLifetime: number;
  dbName?: string;
  dataFileDir?: string;
}

/**
 * @export
 * @class KeyStorage
 */
export class KeyStorage {
  private readonly config: StorageConfigInterface;
  private backend: SqliteStorage | null = null;

  /**
   * @param configuration
   */
  constructor(configuration: StorageConfigInterface) {
    this.config = { ...configuration };
  }

  /**
   * Retrieve database instance
   *
   * @returns {Promise<KeyStorage>}
   * @throws {Error}
   * @param {StorageConfigInterface} config
   */
  static async getInstance(config: StorageConfigInterface): Promise<KeyStorage> {
    const keyStorageInstance = new KeyStorage(config);
    const sqliteFile = path.resolve(config?.dataFileDir, `./${config.dbName}`);

    try {
      keyStorageInstance.backend = await SqliteStorage.getInstance(config.dbName, config.tableName, sqliteFile);
    } catch (err) {
      throw err;
    }

    return keyStorageInstance;
  }

  /**
   * Save JWT token to persistent storage
   *
   * @param {string} jwtToken
   */
  async saveToken(jwtToken: string): Promise<StatusCode | boolean> {
    try {
      const error = await this.backend.insert(jwtToken);

      if (error instanceof Error) {
        console.error(error.message);
        return StatusCode.INTERNAL_ERROR;
      } else {
        return StatusCode.CREATED;
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * Fetch JWT token from persistent storage
   *
   * @param {string} jwtToken
   */
  async fetchToken(jwtToken: string): Promise<string> {
    try {
      const row = await this.backend?.findOne('token', [`token = '${jwtToken}'`, 'archived != 1']);
      if (row instanceof Error) {
        console.error(row.message);
        return '';
      } else {
        return row.token;
      }
    } catch (err: any) {
      throw err;
    }
  }

  /**
   * Check if JWT token exists in DB
   *
   * @param {string} jwtToken
   */
  async jwtExists(jwtToken: string): Promise<string | boolean> {
    try {
      const row = await this.backend?.findOne('token', ['archived != 1', `token = '${jwtToken}'`]);
      if (row instanceof Error) {
        console.error(row.message);
        return false;
      } else {
        return row.token;
      }
    } catch (err: any) {
      throw err;
    }
  }

  /**
   * Archive JWT token
   *
   * @param {string} what
   */
  async archive(what: string): Promise<StatusCode | boolean> {
    try {
      const result = await this.backend.archive(what);

      if (result instanceof Error) {
        console.error(result.message);
        return false;
      } else {
        return StatusCode.ACCEPTED;
      }
    } catch (err: any) {
      throw err;
    }
  }

  /**
   * Get acive JWT tokens
   */
  async getActiveTokens(): Promise<DbSchemaInterface[] | Error> {
    try {
      return (await this.backend?.findAll('token')) ?? [];
    } catch (err: any) {
      throw err;
    }
  }

  /**
   * Get all JWT tokens
   */
  async getRecentToken(): Promise<string | false> {
    try {
      const result = await this.backend?.findOne();
      if (result instanceof Error) {
        console.error(result.message);
        return false;
      } else {
        return result?.token ?? false;
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * Update JWT token with `newToken`
   *
   * @param {string} oldToken
   * @param {string} newToken
   */
  async updateToken(oldToken: string, newToken: string): Promise<StatusCode | false> {
    try {
      const result = await this.backend.update(
        [`token = '${oldToken}'`],
        [`token = '${newToken}'`, `created_at = '${Date.now()}'`, `updated_at = '${Date.now()}'`]
      );

      if (result instanceof Error) {
        console.error(result.message);
        return false;
      } else {
        return StatusCode.ACCEPTED;
      }
    } catch (err: any) {
      throw err;
    }
  }

  /**
   * Get database instance
   */
  get database() {
    return this.backend;
  }

  /**
   * Get token lifetime
   */
  get tokenLifetime() {
    return this.config.tokenLifetime;
  }

  /**
   * Generate JWT token
   *
   * @param {string} openAIKey
   * @param {string} jwtHash
   */
  generateSignedJWT(openAIKey: string, jwtHash: string) {
    return jwt.sign({ key: openAIKey }, jwtHash, {
      expiresIn: this.tokenLifetime,
      audience: 'user',
      issuer: 'soakp',
      subject: 'openai-api'
    });
  }
}
