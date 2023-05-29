/**
 * Author: Lehcode<53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023
 */
import express from "express";
import bodyParser from "body-parser";
import basicAuth from "express-basic-auth";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { KeyStorage, StorageConfigInterface, StorageType } from "./key-storage";
import { JsonResponse } from "./json-response";

interface ServerConfigInterface {
  storage: StorageType;
  port: number;
  dataFileLocation?: string;
  sql?: {
    dbName: string;
    tableName: string;
  };
}

const defaults: ServerConfigInterface = {
  storage: StorageType.sqlite,
  port: 3033,
  dataFileLocation: 'uploads/',
  sql: {
    dbName: 'databaseName.db',
    tableName: 'tokens'
  }
};

class Soakp {
  private readonly app: express.Application;
  private readonly config: ServerConfigInterface;
  private jwtSecret = '';
  private jwtExpiration = 86400; // 24 hours
  private openAIKey = '';
  private basicUser = '';
  private basicPass = '';
  private readonly keyStorage: KeyStorage;

  constructor(private readonly configuration: ServerConfigInterface) {
    this.app = express();
    this.config = { ...defaults, ...configuration };
    this.basicUser = <string>process.env.AUTH_USER;
    this.basicPass = <string>process.env.AUTH_PASS;
    this.jwtSecret = <string>process.env.JWT_SECRET;

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
    const openAiAPIKey = req.header('Authorization');

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
      console.log(`Secure OpenAI Key Proxy is listening on port ${port}.\nPlease help to support project `);
    });
  }
}

export { OpenAIProxy };
