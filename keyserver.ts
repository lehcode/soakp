import express from 'express';
import bodyParser from 'body-parser';
import basicAuth from 'express-basic-auth';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import fs from 'fs';

// import { process } from 'child_process';

enum StorageType {
  sqlite = 'STORAGE_SQLITE',
  file = 'STORAGE_FILE'
}

interface KeyServerConfigInterface {
  storage: StorageType;
  port: number;
  dataFile?: string;
  sql?: {
    dbName: string;
    tableName: string;
  };
}

const defaults: KeyServerConfigInterface = {
  storage: StorageType.sqlite,
  port: 3050,
  dataFile: 'uploads/',
  sql: {
    dbName: 'databaseName.db',
    tableName: 'tokens'
  }
};

class OpenAIProxy {
  private readonly app: express.Application;
  private readonly config: KeyServerConfigInterface;
  private jwtSecret: string;
  private jwtExpiration: number;
  private openAIKey = '';
  private db: sqlite3.Database | undefined;

  constructor(private readonly configuration: KeyServerConfigInterface) {
    this.app = express();
    this.config = { ...defaults, ...configuration };

    // Configure middleware
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    this.app.post(
      '/get-jwt',
      basicAuth({ users: { [<string>process.env.AUTH_USER]: <string>process.env.AUTH_PASS } }),
      this.handleGetJwt.bind(this)
    );
    this.app.post('/openai/query', this.handleOpenAIQuery.bind(this));

    this.jwtSecret = 'my-secret-key';
    this.jwtExpiration = 60 * 60 * 24; // 24 hours

    if (this.config.storage === StorageType.sqlite) {
      this.db = new sqlite3.Database(`./${this.config.sql?.dbName}`);
      this.db.run(`CREATE TABLE IF NOT EXISTS ${this.config.sql?.tableName} (id INTEGER PRIMARY KEY, token TEXT)`);
    }

    this.start(3033);
  }

  /**
   * Handle GET `/get-jwt` request
   *
   * @param req
   * @param res
   * @private
   */
  private handleGetJwt(req: express.Request, res: express.Response) {
    const { username, password } = req.body;
    const openaiKey = req.body.openaiKey;

    // if (username !== this.username || password !== this.password) {
    //   res.status(401).send('Unauthorized');
    //   return;
    // }

    const token = jwt.sign({ openaiKey }, this.jwtSecret, { expiresIn: this.jwtExpiration });

    if (this.config.storage === StorageType.sqlite) {
      // @ts-ignore
      this.db.run('INSERT INTO tokens (token) VALUES (?)', [token], (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('Internal Server Error');
          return;
        }
        res.send(token);
      });
    } else {
      fs.writeFile('jwt.txt', token, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('Internal Server Error');
          return;
        }
        res.send(token);
      });
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
        res.status(401).send('Unauthorized');
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

    setInterval(function () {
      console.log('Keeping the event loop active...');
    }, 1000 * 60 * 60); // Log a message every hour
  }

  /**
   * Generate a new API key and save it to the desired storage (sqlite or file) based on the config
   * @public
   */
  private saveKey(userKey: string): void {
    if (this.config.storage === StorageType.sqlite) {
      this.db?.run(`INSERT INTO ${this.config.sql?.tableName}(key) VALUES(?)`, userKey, function (err: Error) {
        if (err) {
          console.error(err.message);
        }
      });
    } else if (this.config.storage === StorageType.file) {
      fs.writeFile(<string>this.config.dataFile, userKey, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
  }
}

new OpenAIProxy({
  storage: <StorageType>process.env.STORAGE,
  port: Number(process.env.SERVER_PORT),
  dataFile: <string>process.env.DATA_FILE_NAME,
  sql: {
    dbName: <string>process.env.SQL_DB_NAME,
    tableName: <string>process.env.SQL_TABLE_NAME
  }
});
