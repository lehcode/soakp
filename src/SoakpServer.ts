/**
 * Author: Lehcode
 * Copyright: (C) Lehcode.com 2023
 */
import express, { Express } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import basicAuth from 'express-basic-auth';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { StatusCode } from './enums/StatusCode.enum';
import { Message } from './enums/Message.enum';
import { SoakpProxy } from './SoakpProxy';
import { OpenAIRequestInterface } from './interfaces/OpenAI/OpenAIRequest.interface';
import { Responses } from './http/Responses';
import { KeyStorage, StorageConfigInterface, DbSchemaInterface } from './KeyStorage';
import https from 'https';
import path from 'path';
import fs from 'fs';
import { appConfig } from './configs';

export interface ServerConfigInterface {
  storage: StorageConfigInterface;
  httpPort: number;
  sslPort: number;
  httpAuthUser: string;
  httpAuthPass: string;
}

export class SoakpServer {
  private app: Express;
  private keyStorage: KeyStorage;
  private proxy: SoakpProxy;
  private readonly config: ServerConfigInterface;

  constructor(config: ServerConfigInterface) {
    this.config = { ...config };

    console.log(this.config);

    this.initializeExpressApp();
    this.initializeEndpoints();

    this.proxy = new SoakpProxy({
      query: {
        model: 'text-gpt3.5-turbo',
        prompt: ['Say Hello!']
      }
    });
  }

  private initializeExpressApp() {
    this.app = express();

    // Configure middleware
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
  }

  /**
   * Initialize API endpoints
   *
   * @private
   */
  private initializeEndpoints() {
    try {
      if (this.basicAuthCredentialsValid()) {
        this.app.post(
          '/get-jwt',
          basicAuth({ users: { [process.env.AUTH_USER as string]: process.env.AUTH_PASS as string }}),
          this.handleGetJwt.bind(this)
        );
      }
    } catch (err) {
      throw err;
    }

    this.app.post('/openai/completions', this.handleOpenAIQuery.bind(this));
    this.app.post('/openai/models', this.handleOpenAIQuery.bind(this));
  }

  /**
   * Generate JWT secret
   *
   * @private
   */
  private get secret(): string {
    const secret = process.env.JWT_SECRET as string;
    return secret.trim();
  }

  /**
   *
   * @private
   */
  private get jwtHash(): string {
    return createHash('sha256').update(this.secret)
      .digest('hex');
  }

  /**
   * Handle GET `/get-jwt` request
   *
   * @param req
   * @param res
   * @private
   */
  private async handleGetJwt(req: express.Request, res: express.Response) {
    let openAIKey: string;

    if (this.isValidOpenAIKey(req.body.key)) {
      openAIKey = req.body.key;
    } else {
      console.error(Message.INVALID_KEY);
      return;
    }

    try {
      const existingTokens = await this.keyStorage.getActiveTokens();

      if (existingTokens instanceof Error) {
        // No saved JWTs found, generate and save a new one
        console.log('No matching tokens found. Generating a new one.');
        const savedToken = await this.generateAndSaveToken(openAIKey);
        Responses.tokenAdded(res, savedToken);
      } else {
        existingTokens.map(async (row: DbSchemaInterface) => {
          try {
            jwt.verify(row.token, this.jwtHash);
          } catch (err: any) {
            if (err.message === 'jwt expired') {
              console.log(`${Message.JWT_EXPIRED}. Replacing it...`);
              const updated = await this.generateAndUpdateToken(row.token, openAIKey, res);
              console.log('Token refreshed');
              Responses.tokenUpdated(res, updated);
            }
          }

          console.log(Message.JWT_ACCEPTED);
        });
      }
    } catch (err: any) {
      console.error(err.message);
    }
  }

  /**
   *
   * @param openAIKey
   * @param res
   * @private
   */
  private async generateAndSaveToken(openAIKey: string) {
    const signed = this.getSignedJWT(openAIKey);
    const saved = await this.keyStorage.saveToken(signed);

    if (saved === StatusCode.CREATED) {
      return signed;
    } else {
      throw new Error(Message.JWT_NOT_SAVED);
    }
  }

  /**
   *
   * @param oldToken
   * @param openAIKey
   * @param res
   * @private
   */
  private async generateAndUpdateToken(oldToken: string, openAIKey: string) {
    try {
      const token = this.getSignedJWT(openAIKey);
      const accepted = await this.keyStorage.updateToken(oldToken, token);

      if (accepted === StatusCode.ACCEPTED) {
        return token;
      }
    } catch (err) {
      console.error(err);
    }
  }

  /**
   *
   * @param openAIKey
   * @private
   */
  private getSignedJWT(openAIKey: string) {
    return jwt.sign({ key: openAIKey }, this.jwtHash, { expiresIn: this.config.storage.lifetime });
  }

  /**
   * Handle POST `/openai/query` request
   *
   * @param req
   * @param res
   */
  private async handleOpenAIQuery(req: express.Request, res: express.Response) {
    try {
      const token = await this.keyStorage.getRecentToken();

      if (token !== false) {
        jwt.verify(token, this.jwtHash, async (err: any, decoded: any) => {
          if (err) {
            Responses.notAuthorized(res, 'jwt');
            return;
          }

          // Update parameters without reinitializing the OpenAI client
          const params: OpenAIRequestInterface = {
            apiKey: decoded.key,
            apiOrgKey: process.env.OPENAI_API_ORG_ID as string,
            prompt: req.body.messages || '',
            engineId: req.body.engineId || 'text-davinci-003',
            model: req.body.model || 'text-davinci-003',
            temperature: req.body.temperature || 0.7,
            max_tokens: req.body.maxTokens || 100
          };
          this.proxy.queryParams = params;
          this.proxy.initAI(params);

          try {
            // Query OpenAI API with provided query and parameters
            const response = await this.proxy.makeRequest(params);
            console.log(response);

            if (response.status === StatusCode.SUCCESS) {
              Responses.success(
                res,
                {
                  response: response.data,
                  responseConfig: response.config.data
                },
                'Received OpenAI API response'
              );
            }
          } catch (error) {
            console.error(error);
            Responses.unknownError(res);
          }
        });
      } else {
        Responses.notAuthorized(res, 'jwt');
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * Start the server
   * @public
   */
  public async start() {
    this.keyStorage = await KeyStorage.getInstance(this.config.storage);

    this.app.listen(this.config.httpPort);
    this.initSSL(this.app);
  }

  /**
   * Validate OpenAI API key
   *
   * @param key
   * @private
   */
  private isValidOpenAIKey(key: string): boolean {
    const regex = /^(sk|pk|org)-\w+$/;
    return regex.test(key);
  }

  /**
   * Validate basic auth credentials
   *
   * @private
   */
  private basicAuthCredentialsValid(): boolean {
    if (!process.env.AUTH_USER || !process.env.AUTH_PASS) {
      throw new Error('Missing required environment variables AUTH_USER and/or AUTH_PASS');
    }

    // Check username
    if (!appConfig.usernameRegex.test(process.env.AUTH_USER as string)) {
      throw new Error('Username provided for Basic HTTP Authorization cannot be validated');
    }

    // Check password
    if (!appConfig.passwordRegex.test(process.env.AUTH_PASS as string)) {
      throw new Error('Password provided for Basic HTTP Authorization cannot be validated');
    }

    return true;
  }

  /**
   *
   * @param app
   */
  private initSSL(app: express.Application) {
    const privateKey = fs.readFileSync(
      path.join(process.env.SSL_CERT_DIR as string, `${process.env.SERVER_HOST as string}-key.pem`),
      'utf8'
    );

    const certificate = fs.readFileSync(
      path.join(process.env.SSL_CERT_DIR as string, `${process.env.SERVER_HOST as string}-crt.pem`),
      'utf8'
    );

    // @ts-ignore
    this.app = https.createServer({ key: privateKey, cert: certificate }, app);
    this.app.listen(this.config.sslPort);
  }
}
