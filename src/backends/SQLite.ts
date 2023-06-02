import { StorageStrategy } from './Storage.strategy';
import { StatusCode } from '../enums/StatusCode.enum';
import path from 'path';
import { Database } from 'sqlite3';
import { Message } from '../enums/Message.enum';
import { DbSchemaInterface } from '../interfaces/DbSchema.interface';
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
    const db = (process.env.SQLITE_MEMORY as string) === 'yes' ? new Database(':memory:') : new Database(dbFile);

    if ((process.env.SQLITE_MEMORY as string) === 'yes') {
      console.log('In-memory database initialized');
    } else {
      console.log(`Database '${path.resolve(dbFile)}' initialized`);
    }

    if ((process.env.RESET_DB as string) === 'yes') {
      await db.run(`DROP TABLE IF EXISTS '${tableName}';`);
      console.log(`Table '${tableName}' dropped`);
    }

    await db.run(
      `CREATE TABLE IF NOT EXISTS '${tableName}'
        (
          'id' INTEGER PRIMARY KEY,
          'token' TEXT UNIQUE
            CHECK(LENGTH('token') <= 255),
          'created_at' INTEGER NOT NULL,
          'updated_at' INTEGER NOT NULL,
          'last_access' INTEGER NOT NULL,
          'archived' BOOLEAN NOT NULL
            CHECK ('archived' IN (0, 1)));`,
      (err) => {
        if (err) {
          throw err;
        }
      }
    );

    console.log(process.env.RESET_DB === 'yes' ? `Table '${tableName}' created` : `Table '${tableName}' initialized`);

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
    const defaults: DbSchemaInterface = {
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
   * @param token
   */
  archive(token: string): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      this.db.run(`UPDATE '${this.tableName}' SET archived ='1' WHERE token =?`, [token]);
    });
  }

  /**
   *
   * @param where
   * @param archived
   */
  async find(
    what = 'token',
    where: string[] | null = null,
    order: 'last_access' | 'created_at' = 'last_access',
    sort: 'ASC' | 'DESC' = 'ASC',
    limit?: number
  ): Promise<ResponseInterface> {
    const qWhere = [...where].join(' AND ');

    let sql = `SELECT ${what} FROM ${this.tableName} WHERE ${qWhere}`;
    if (limit) sql = `${sql} LIMIT ${limit}`;

    try {
      return new Promise((resolve, reject) => {
        this.db.all(sql, (err, rows: DbSchemaInterface[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    } catch (err) {
      throw err;
    }
  }

  /**
   *
   * @param selectQuery
   */
  async select(selectQuery: string): Promise<ResponseInterface> {
    return new Promise((resolve, reject) => {
      this.db.all(selectQuery, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          try {
            resolve(this.formatData(rows));
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  /**
   *
   * @param rows
   * @private
   */
  private formatData(rows: DbSchemaInterface[]): ResponseInterface {
    const result: ResponseInterface = {
      status: StatusCode.NOT_FOUND,
      message: Message.NOT_FOUND,
      data: []
    };

    if (rows.length) {
      result.status = StatusCode.SUCCESS;
      result.message = Message.FOUND;
      result.data = rows;
    }

    return result;
  }

  /**
   *
   * @param query
   */
  async custom(query: string): Promise<Record<string, string | number>[]> {
    try {
      const result = await this.db.all(query, (err, rows) => {
        if (result.status === StatusCode.SUCCESS) {
          console.log(`Custom query executed: ${query}`);
          return result.data;
        } else {
          return [];
        }
      });
    } catch (e) {
      throw e;
    }
  }

  limit: number;
  sort: 'ASC' | 'DESC';

  Promise<ResponseInterface>() {}
}

export { SqliteStorage };
