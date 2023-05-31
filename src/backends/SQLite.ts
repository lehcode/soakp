import { StorageStrategy } from './Storage.strategy';
import { StatusCode } from '../enums/StatusCode';
import fs from 'fs/promises';
import { Database } from 'sqlite3';
import { Message } from '../enums/Message';
import { SchemeInterface } from '../interfaces/Scheme.interface';

class SqliteStorage implements StorageStrategy {
  private db: Database;
  private dbName: string;
  private tableName: string;
  private dbFile: string;

  /**
   * @constructor
   * @param db
   * @param dbName
   * @param tableName
   * @param dbFile
   */
  constructor(db: Database, dbName: string, tableName: string, dbFile: string) {
    this.db = db;
    this.dbName = dbName;
    this.tableName = tableName;
    this.dbFile = dbFile;
  }

  /**
   * Initialize database
   */
  static async createDatabase(dbName: string, tableName: string, dbFile: string) {
    // // Delete the existing database file if it exists
    // try {
    //   await fs.access(dbFile);
    //   await fs.unlink(dbFile);
    // } catch (err) {
    //   // File doesn't exist, do nothing
    // }

    const db = new Database(dbFile);

    console.log(`Database '${dbName}' created`);

    await db.run(
      `CREATE TABLE IF NOT EXISTS '${tableName}'
        (
          id INTEGER PRIMARY KEY,
          key TEXT NOT NULL UNIQUE
            CHECK(LENGTH(key) <= 255),
          token TEXT UNIQUE
            CHECK(LENGTH(token) <= 255),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          token_last_access INTEGER NOT NULL,
          archived BOOLEAN NOT NULL
            CHECK (archived IN (0, 1)));`,
      (err) => {
        if (err) {
          throw err;
        }
      }
    );

    console.log(`Table '${tableName}' created successfully`);

    return db;
  }

  static async getInstance(dbName: string, tableName: string, dbFile: string): Promise<SqliteStorage> {
    const db = await SqliteStorage.createDatabase(dbName, tableName, dbFile);
    return new SqliteStorage(db, dbName, tableName, dbFile);
  }

  /**
   * Inset SQLite row
   *
   * @param column
   * @param value
   * @private
   */
  async insert(column: string, value: string) {
    const defaults: SchemeInterface = {
      id: null,
      key: null,
      token: null,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      tokenLastAccess: new Date().getTime(),
      archived: false
    };

    const row = <Record<string, string>>Object.assign(defaults, { [column]: value });
    const queryParams = Object.values(this.prepareRow(row));
    const query = `INSERT INTO ${this.tableName} (
id, key, token, created_at, updated_at, token_last_access, archived
) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    return new Promise((resolve, reject) => {
      this.db.run(query, [...queryParams], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(StatusCode.CREATED);
        }
      });
    });
  }

  /**
   *
   * @param row
   * @private
   */
  private prepareRow(row: Record<string, string>): Record<string, string> {
    row.createdAt = row.createdAt.toString();
    row.updatedAt = row.updatedAt.toString();
    row.tokenLastAccess = row.tokenLastAccess.toString();
    row.archived = row.archived === true ? '1' : '0';
    return row;
  }

  /**
   * Update SQLite row
   *
   * @param where
   * @param values
   */
  async update(where: string[], values: string[]) {
    const vals = [...values].join(',');
    const query = `UPDATE '${this.tableName}' SET ${vals} WHERE ${where}`;

    return new Promise((resolve, reject) => {
      this.db.run(query, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(StatusCode.ACCEPTED);
        }
      });
    });
  }

  /**
   * Archive SQLite row
   *
   * @param what
   */
  archive(what: string): Promise<Record<string, any>> {
    return Promise.resolve(undefined);
  }

  /**
   *
   * @param what
   * @param where
   */
  async find(what: string, where: string[]): Promise<Record<string, any>> {
    const qWhere = [...where].join(' AND ');

    return new Promise((resolve, reject) => {
      this.db.get(`SELECT ${what} FROM ${this.tableName} WHERE ${qWhere} LIMIT 1`, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            status: row === undefined ? StatusCode.NOT_FOUND : StatusCode.SUCCESS,
            message: row === undefined ? Message.NOT_FOUND : Message.FOUND,
            data: row === undefined ? [] : [row]
          });
        }
      });
    });
  }

  query(query: string, vars: string[]): Promise<Record<string, any>> {
    return Promise.resolve(this.db.run(query, ...vars)).then((rows) => {
      debugger;
      return {
        status: StatusCode.SUCCESS,
        message: Message.SUCCESS
      };
    });
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
