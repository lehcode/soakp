import { StorageStrategy } from './Storage.strategy';
import { StatusCode } from '../enums/StatusCode.enum';
import fs from 'fs/promises';
import { Database } from 'sqlite3';
import { Message } from '../enums/Message.enum';
import { SchemeInterface } from '../interfaces/Scheme.interface';
import { ResponseInterface } from '../interfaces/Response.interface';

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
    const db = new Database(dbFile);

    console.log(`Database '${dbName}' created`);

    await db.run(
      `CREATE TABLE IF NOT EXISTS '${tableName}'
        (
          id INTEGER PRIMARY KEY,
          token TEXT UNIQUE
            CHECK(LENGTH(token) <= 255),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          last_access INTEGER NOT NULL,
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
   * @param jwtToken
   * @private
   */
  async insert(jwtToken: string) {
    const defaults: SchemeInterface = {
      id: null,
      token: jwtToken,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      lastAccess: new Date().getTime(),
      archived: false
    };
    const params = Object.values(this.prepareRow(defaults));
    const query = `INSERT INTO ${this.tableName} (
id, token, created_at, updated_at, last_access, archived
) VALUES (?, ?, ?, ?, ?, ?)`;

    return new Promise((resolve, reject) => {
      this.db.run(query, [...params], (err) => {
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
  private prepareRow(row: Record<string, any>): Record<string, string> {
    row.createdAt = row.createdAt.toString();
    row.updatedAt = row.updatedAt.toString();
    row.lastAccess = row.lastAccess.toString();
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
   * @param limit
   */
  async find(what: string, where: string[], limit = 1): Promise<Record<string, any>> {
    const qWhere = [...where].join(' AND ');

    return new Promise((resolve, reject) => {
      this.db.get(`SELECT ${what} FROM ${this.tableName} WHERE ${qWhere} LIMIT ${limit}`, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            status: data === undefined ? StatusCode.NOT_FOUND : StatusCode.SUCCESS,
            message: data === undefined ? Message.NOT_FOUND : Message.FOUND,
            data: data === undefined ? [] : data
          } as ResponseInterface);
        }
      });
    });
  }

  /**
   *
   * @param selectQuery
   */
  async select(selectQuery: string): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      this.db.all(selectQuery, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            status: rows === undefined ? StatusCode.NOT_FOUND : StatusCode.SUCCESS,
            message: rows === undefined ? Message.NOT_FOUND : Message.FOUND,
            data: rows === undefined ? [] : rows
          } as ResponseInterface);
        }
      });
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
