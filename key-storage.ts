/**
 * Author: Anton Repin<53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023.
 */
import sqlite3 from 'sqlite3';
import storage from 'node-persist';
import { JsonResponse } from './json-response';
import express from 'express';

interface StorageConfigInterface {
  dataFileLocation?: string;
  sql?: {
    dbName: string;
    tableName: string;
  };
}

enum StorageType {
  sqlite = 'STORAGE_SQLITE',
  file = 'STORAGE_FILE'
}

/**
 * SQLite/File storage for tokens
 *
 * TODO: More to follow
 */
class KeyStorage {
  private readonly type: StorageType;
  private db: sqlite3.Database;
  private config: StorageConfigInterface;

  /**
   *
   * @param type
   * @param configuration
   */
  constructor(type: StorageType, configuration: StorageConfigInterface) {
    this.config = { ...configuration };
    this.type = type; // Assign the type parameter to the this.type property

    switch (this.type) {
      default:
      case StorageType.sqlite:
        this.initializeDatabase('sqlite');
        break;

      case StorageType.file:
        this.initializeFileStorage();
        break;
    }
  }

  /**
   * Initialize database table
   *
   * @private
   */
  private initializeDatabase(): void {
    if (this.type === StorageType.sqlite) {
      this.db = new sqlite3.Database(`./${this.config.sql?.dbName}`);
      this.createSqlTable();
    }
  }

  /**
   * Initialize file storage
   */
  async initializeFileStorage(): Promise<void> {
    await storage.init({ dir: this.config.dataFileLocation });
  }

  /**
   * Create SQL table
   *
   * @private
   */
  private createSqlTable(): void {
    this.db.run(
      `CREATE TABLE IF NOT EXISTS ${this.config.sql?.tableName} (id INTEGER PRIMARY KEY, token_type TEXT, token TEXT)`
    );
  }

  /**
   * Run user query on DB
   *
   * @param query
   */
  runQuery(query: string): void {
    try {
      this.db.run(query);
    } catch (error) {
      throw new Error(<string>error);
    }
  }

  storeJWT(token: string, res: express.Response) {
    let status: number;

    if (this.type === StorageType.sqlite) {
      this.sqlInsert('jwt', token)
        .then(() => {
          status = 201;
          res.status(status).json(JsonResponse.getText(status, { token: token }));
        })
        .catch((err) => JsonResponse.err500(err, res));
    } else {
      storage
        .setItem('jwt', token)
        .then(() => {
          status = 200;
          res.status(status).json(JsonResponse.getText(status, { token: token }));
        })
        .catch((err: string) => JsonResponse.err500(err, res));
    }
  }

  /**
   * Inset SQL record
   *
   * @private
   */
  private async sqlInsert(token_type: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO ${this.config.sql?.tableName} (token_type, token) VALUES (?, ?)`,
        [token_type, token],
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  public async loadFromDB(type: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT token FROM ${this.config.sql?.tableName} WHERE token_type = ? LIMIT 1`,
        type,
        (err, row: Record<string, any>) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve(row.token);
          }
        }
      );
    });
  }

  public async loadFromFile(type: string): Promise<string> {
    try {
      const data = await storage.getItem(type);
      return data;
    } catch (err) {
      console.error(`Error reading file from disk: ${err}`);
      return '';
    }
  }
}

export { KeyStorage, StorageType, StorageConfigInterface };
