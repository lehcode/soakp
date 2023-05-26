/**
 * Author: Lehcode<53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023.
 */
import express from 'express';
import bodyParser from 'body-parser';
import basicAuth from 'express-basic-auth';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import sqlite3 from 'sqlite3';
import storage from 'node-persist';
import { JsonResponse } from './json-response';

interface KeyServerConfigInterface {
  storage: StorageType;
  port: number;
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

interface StorageConfigInterface {
  dataFileLocation?: string;
  sql?: {
    dbName: string;
    tableName: string;
  };
}

const defaults: KeyServerConfigInterface = {
  storage: StorageType.sqlite,
  port: 3050,
  dataFileLocation: 'uploads/',
  sql: {
    dbName: 'databaseName.db',
    tableName: 'tokens'
  }
};

class OpenAIProxy {
  private readonly app: express.Application;
  private readonly config: KeyServerConfigInterface;
  private jwtSecret = '';
  private jwtExpiration = 86400; // 24 hours
  private openAIKey = '';
  private basicUser = '';
  private basicPass = '';
  private readonly keyStorage: KeyStorage;

  constructor(private readonly configuration: KeyServerConfigInterface) {
    this.app = express();
    this.config = { ...defaults, ...configuration };
    this.basicUser = <string>process.env.AUTH_USER;
    this.basicPass = <string>process.env.AUTH_PASS;

    // Configure middleware
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    this.initializeEdnpoints();

    this.keyStorage = new KeyStorage(this.config.storage, <StorageConfigInterface>{
      port: this.config.port,
      dataFileLocation: this.config.dataFileLocation,
      sql: {
        dbName: this.config.sql.dbName,
        tableName: this.config.sql.tableName
      }
    });

    this.start(this.config.port);
  }

  /**
   * Initialize API ednpoints
   *
   * @private
   */
  private initializeEdnpoints() {
    this.app.post('/get-jwt', basicAuth({ users: { [this.basicUser]: this.basicPass } }), this.handleGetJwt.bind(this));
    this.app.post('/openai/query', this.handleOpenAIQuery.bind(this));
  }

  private setJWTSecret(openAIKey: string): void {
    this.jwtSecret = createHash('sha256').update(openAIKey).digest('hex');
  }

  private setOpenAIKey(key: string): void {
    this.openAIKey = key;
  }

  /**
   * Handle GET `/get-jwt` request
   *
   * @param req
   * @param res
   * @private
   */
  private handleGetJwt(req: express.Request, res: express.Response) {
    this.setOpenAIKey(req.body.openaiKey.trim());
    this.setJWTSecret(req.body.openaiKey.trim());

    const token = jwt.sign({ key: this.openAIKey }, this.jwtSecret, { expiresIn: this.jwtExpiration });

    this.keyStorage.storeJWT(token, res);
  }

  private async loadOpenAIKey(): Promise<void> {
    if (this.config.storage === StorageType.sqlite) {
      try {
        const token = await this.keyStorage.loadFromDB('openai');
        this.openAIKey = token;
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const data = await this.keyStorage.loadFromFile('openai');
        this.openAIKey = data;
      } catch (err) {
        console.error(err);
      }
    }
  }

  /**
   * Handle POST `/openai/query` request
   *
   * @param req
   * @param res
   */
  private handleOpenAIQuery(req: express.Request, res: express.Response) {
    const token = req.body.token;
    const query = req.body.query;
    const parameters = req.body.parameters;

    jwt.verify(token, this.jwtSecret, (err: any, decoded: any) => {
      if (err) {
        res.status(401).json(JsonResponse.getText(401));
        return;
      }

      const openaiKey = decoded.openaiKey;

      // Query OpenAI API with provided query and parameters
      // ...

      // Forward response back to user via websockets
      // ...
    });
  }

  /**
   * Start the server
   * @public
   */
  public start(port: number) {
    this.app.listen(port, () => {
      console.log(`OpenAIController listening on port ${port}`);
    });
  }
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
  private initializeDatabase(type: string): void {
    if (type === 'sqlite') {
      this.db = new sqlite3.Database(`./${this.config.sql?.dbName}`);
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
          res.status(status).json(JsonResponse.getText(status));
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

new OpenAIProxy({
  storage: <StorageType>process.env.STORAGE,
  port: Number(process.env.SERVER_PORT),
  dataFileLocation: <string>process.env.DATA_FILE_LOC,
  sql: {
    dbName: <string>process.env.SQL_DB_NAME,
    tableName: <string>process.env.SQL_TABLE_NAME
  }
});

export { OpenAIProxy };
