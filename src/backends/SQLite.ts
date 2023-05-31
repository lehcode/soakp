import { StorageStrategy } from './Storage.strategy';
import { StatusCodes } from '../enums/Codes';
import fs from 'fs/promises';
import { Database } from 'sqlite3';

class SqliteStorage implements StorageStrategy {
  private db: Database;
  private dbName: string;
  private tableName: string;
  private dbFile: string;

  /**
   * @param {string} dbName
   * @param {string} tableName
   * @param {string} dbFile
   */
  constructor(dbName: string, tableName: string, dbFile: string) {
    this.dbName = dbName;
    this.tableName = tableName;
    this.dbFile = dbFile;
  }

  /**
   * Initialize database
   */
  static async getInstance(dbName: string, tableName: string, dbFile: string) {
    // Delete the existing database file if it exists
    try {
      await fs.access(dbFile);
      await fs.unlink(dbFile);
    } catch (err) {
      // File doesn't exist, do nothing
    }

    const db = new Database(dbFile);

    await db.run(
      `CREATE TABLE '${tableName}'
        (
          id INTEGER PRIMARY KEY,
          key TEXT NOT NULL
            CHECK(LENGTH(key) <= 255),
          token TEXT 
            CHECK(LENGTH(token) <= 255),
          created_at INTEGER,
          updated_at INTEGER,
          key_last_access INTEGER,
          archived BOOLEAN NOT NULL
            CHECK (archived IN (0, 1)));`,
      (err) => {
        if (err) {
          throw Error(err);
        }
      }
    );

    return new SqliteStorage(dbFile, dbName, tableName);
  }

  /**
   * Inset SQLite row
   *
   * @param openAIKey
   * @private
   */
  async insert(openAIKey: string): Promise<Record<string, any>> {
    const params = new Map<string, string | number>();
    params.set('key', openAIKey);
    params.set('token', null);
    params.set('created_at', new Date().getTime());
    params.set('updated_at', new Date().getTime());
    params.set('key_last_access', null);
    params.set('archived', 0);

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO ${this.tableName} (
key, token, created_at, updated_at, key_last_access, archived
) VALUES (?, ?, ?, ?, ?, ?)`,
        [...params],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(StatusCodes.CREATED);
          }
        }
      );
    });
  }

  /**
   * Update SQLite row
   *
   * @param where
   * @param values
   */
  async update(where: string[], values: string[]): Promise<Record<string, any>> {
    const vals = [...values].join(',');
    const queryParams = '';
    return this.db.run(`UPDATE ${this.tableName} SET ${vals}, WHERE ${queryParams}`);
  }

  archive(what: string): Promise<Record<string, any>> {
    return Promise.resolve(undefined);
  }

  find(what: string, where: string[]): Promise<Record<string, any>> {
    const whereQuery = [...where].join(' AND ');
    return Promise.resolve(this.db.run(`SELECT ${what} FROM ${this.tableName} WHERE ${whereQuery}`));
  }

  query(query: string, vars: string[]): Promise<Record<string, any>> {
    return Promise.resolve(undefined);
  }

  /**
   * @private
   */
  private async dropDb(): Promise<void> {
    return fs
      .access(this.dbFile, fs.constants.F_OK)
      .then((err) => {
        if (!err) {
          fs.unlink(this.dbFile);
        }
      })
      .catch(console.info);
  }
}

export { SqliteStorage };
