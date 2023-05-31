/**
 * Author: Lehcode<53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023
 */
import express from 'express';
import bodyParser from 'body-parser';
import basicAuth from 'express-basic-auth';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { KeyStorage, StorageType } from './KeyStorage';
import { JsonResponse } from './JsonRespose';

interface ServerConfigInterface {
  // storage: StorageType;
  port: number;
  // dataFileLocation?: string;
  // sql?: {
  //   dbName: string;
  //   tableName: string;
  // };
}

const defaults: ServerConfigInterface = {
  storage: StorageType.SQLITE,
  port: 3033,
  dataFileLocation: 'uploads/',
  sql: {
    dbName: 'databaseName.db',
    tableName: 'tokens'
  }
};

class SoakpServer {
  private readonly app: express.Application;
  private readonly config: ServerConfigInterface;
  private jwtExpiration = 86400; // 24 hours
  private openAIKey = '';
  private keyStorage: KeyStorage;
  private jwt: string;

  constructor(private readonly configuration: ServerConfigInterface) {
    this.app = express();
    this.config = { ...defaults, ...configuration };

    // Configure middleware
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
  }

  async init(storage) {
    this.keyStorage = storage;
    this.initializeEndpoints();
    this.start(this.config.port);
  }

  /**
   * Initialize API endnpoints
   *
   * @private
   */
  private initializeEndpoints() {
    if (this.basicAuthCredentialsValidated) {
      this.app.post(
        '/get-jwt',
        basicAuth({ users: { [<string>process.env.AUTH_USER]: <string>process.env.AUTH_PASS } }),
        this.handleGetJwt.bind(this)
      );
    }
    this.app.post('/openai/query', this.handleOpenAIQuery.bind(this));
  }

  /**
   * Generate JWT secret
   *
   * @private
   */
  private get secret(): string {
    const secret = <string>process.env.JWT_SECRET.trim();
    return createHash('sha256').update(secret).digest('hex');
  }

  /**
   * Handle GET `/get-jwt` request
   *
   * @param req
   * @param res
   * @private
   */
  private handleGetJwt(req: express.Request, res: express.Response) {
    this.openAIKey = req.body.key;
    const jwtString = jwt.sign({ key: this.openAIKey }, this.secret, { expiresIn: this.jwtExpiration });
    try {
      this.keyStorage.saveJWT(jwtString).then((result) => {
        debugger;
      });
    } catch (e) {
      console.error(e);
      debugger;
    }
  }

  /**
   * Handle POST `/openai/query` request
   *
   * @param req
   * @param res
   */
  private async handleOpenAIQuery(req: express.Request, res: express.Response) {
    const token = req.get('Authorization');
    const query = req.body.query;
    const parameters = req.body.parameters;

    const tokenExists = await this.keyStorage.tokenExists(token.replace('Bearer ', '').trim());
    if (tokenExists) {
      this.jwt = await this.keyStorage.getOpenAIKey(this.config.storage, 'openai');
    } else {
    }

    jwt.verify(token, this.jwtSecret, (err: any, decoded: any) => {
      if (err) {
        res.status(Codes.NOT_AUTHORIZED).json(JsonResponse.getText(Codes.NOT_AUTHORIZED));
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
      console.log(`Started Secure OpenAI Key Proxy on port ${port}.\nPlease help to support project `);
    });
  }

  private isValidOpenAIKey(key: string): boolean {
    const regex = /^(sk|pk)-\w+$/;
    return regex.test(key);
  }

  /**
   * Validate basic auth credentials
   *
   * @private
   */
  private get basicAuthCredentialsValidated() {
    if (!process.env.AUTH_USER || !process.env.AUTH_PASS) {
      throw new Error('Missing required environment variables AUTH_USER and/or AUTH_PASS');
    }

    const username = process.env.AUTH_USER as string;
    const password = process.env.AUTH_PASS as string;

    // Check username
    const usernameRegex = /^[\w\d_]{3,16}$/;
    if (!usernameRegex.test(username)) {
      throw new Error('Invalid username format');
    }

    // Check password
    const passwordRegex = /^[\w\d_]{8,32}$/;
    if (!passwordRegex.test(password)) {
      throw new Error('Invalid password format');
    }

    return true;
  }
}

export { SoakpServer };
