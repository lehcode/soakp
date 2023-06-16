/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
import { StatusCode } from '../enums/StatusCode.enum';
import { Database } from 'sqlite3';
import { promises as fs } from 'fs';
import { DbSchemaInterface } from '../KeyStorage';
import path from 'path';
import { Message } from '../enums/Message.enum';

/**
 * Database connection management class prototype.
 */
abstract class StorageStrategy {
  /**
   * @abstract
   * @param jwtToken
   * @return {Promise<number | Error>}
   */
  abstract insert(jwtToken: string): Promise<number | Error>;

  /**
   * @abstract
   * @param where
   * @param values
   * @return {Promise<number | Error>}
   */
  abstract update(where: string[], values: string[]): Promise<number | Error>;

  /**
   * @abstract
   * @param what
   * @param where
   * @param order
   * @param sort
   * @param limit
   * @return {Promise<DbSchemaInterface[] | Error>}
   */
  abstract findAll(
    what: string,
    where: string[] | null,
    order: 'last_access' | 'created_at',
    sort: 'ASC' | 'DESC',
    limit?: number
  ): Promise<DbSchemaInterface[] | Error>;

  /**
   * @abstract
   * @param what
   * @param where
   * @param order
   * @param sort
   * @return {Promise<DbSchemaInterface | Error>}
   */
  abstract findOne(
    what: string,
    where: string[] | null,
    order: 'last_access' | 'created_at',
    sort: 'ASC' | 'DESC'
  ): Promise<DbSchemaInterface | Error>;

  /**
   * @abstract
   * @param what
   * @return {Promise<number | Error>}
   */
  abstract archive(what: string): Promise<number | Error>;
}

/**
 * SQLite storage class
 */
export default class SqliteStorage extends StorageStrategy {
  private db: Database;
  private dbName: string;
  private tableName: string;
  private dbFile: string;

  constructor(db: Database, dbName: string, tableName: string, dbFile: string) {
    super();
    this.db = db;
    this.dbName = dbName;
    this.tableName = tableName;
    this.dbFile = dbFile;
  }


  static async createDatabase(dbName: string, tableName: string, dbFile: string): Promise<Database> {
    if (process.env.SQLITE_MEMORY_DB === 'no' && process.env.SQLITE_RESET === 'yes') {
      try {
        await fs.unlink(path.resolve(dbFile));
      } catch (e) {
        console.log(e);
      }
    }
    const db = process.env.SQLITE_MEMORY_DB === 'yes' ? new Database(':memory:') : new Database(dbFile);
    if (process.env.SQLITE_MEMORY_DB === 'yes') {
      console.log('In-memory database initialized');
    } else {
      console.log(`Database '${path.resolve(dbFile)}' initialized`);
    }
    return new Promise((resolve, reject) => {
      db.run(
        `CREATE TABLE IF NOT EXISTS '${tableName}'
          (
            id INTEGER PRIMARY KEY,
            token TEXT UNIQUE
              CHECK(LENGTH(token) <= 255),
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            last_access INTEGER NOT NULL,
            archived INTEGER NOT NULL
              CHECK (archived IN (0, 1))
          );`,
        (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(process.env.RESET_DB === 'yes' ? `Table '${tableName}' created` : `Table '${tableName}' initialized`);
            resolve(db);
          }
        }
      );
    });
  }

  static async getInstance(dbName: string, tableName: string, dbFile: string): Promise<SqliteStorage> {
    const db = await SqliteStorage.createDatabase(dbName, tableName, dbFile);
    return new SqliteStorage(db, dbName, tableName, dbFile);
  }

  async insert(jwtToken: string): Promise<StatusCode | Error> {
    const defaults: DbSchemaInterface = {
      id: null,
      token: jwtToken,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      lastAccess: new Date().getTime(),
      archived: 0
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

  private prepareRow(row: DbSchemaInterface): DbSchemaInterface {
    row.createdAt = row.createdAt.toString();
    row.updatedAt = row.updatedAt.toString();
    row.lastAccess = row.lastAccess.toString();
    row.archived = row.archived === true ? '1' : '0';
    return row;
  }

  async update(where: string[], values: string[]): Promise<StatusCode | Error> {
    const vals = [...values].join(',');
    const query = `UPDATE '${this.tableName}' SET ${vals} WHERE ${where.join(' AND ')}`;
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

  archive(token: string): Promise<StatusCode | Error> {
    return new Promise((resolve, reject) => {
      this.db.run(`UPDATE '${this.tableName}' SET archived ='1' WHERE token =? AND archived ='0'`, [token], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(StatusCode.SUCCESS);
        }
      });
    });
  }

  async findAll(
    what = 'token',
    where: string[] = ['archived != 1'],
    order: 'last_access' | 'created_at' = 'last_access',
    sort: 'ASC' | 'DESC' = 'DESC',
    limit?: number
  ): Promise<DbSchemaInterface[] | Error> {
    const qWhere = [...where].join(' AND ');
    let sql = `SELECT ${what} FROM ${this.tableName} WHERE ${qWhere}`;
    if (order) sql += ` ORDER BY ${order} ${sort}`;
    if (limit) sql += ` LIMIT ${limit}`;
    return new Promise((resolve, reject) => {
      this.db.all(sql, (err, rows: DbSchemaInterface[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async findOne(
    what = 'token',
    where: string[] = ['archived !=1 '],
    order: 'last_access' | 'created_at' = 'last_access',
    sort: 'ASC' | 'DESC' = 'DESC'
  ): Promise<DbSchemaInterface | Error> {
    const qWhere = [...where].join(' AND ');
    let sql = `SELECT ${what} FROM ${this.tableName} WHERE ${qWhere}`;
    if (order) sql += ` ORDER BY ${order} ${sort} LIMIT 1`;
    return new Promise((resolve, reject) => {
      this.db.get(sql, (err, row: DbSchemaInterface) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  public close() {
    this.db.close(() => {
      console.error(Message.UNKNOWN_ERROR);
    });
  }
}
