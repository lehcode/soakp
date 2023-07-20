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
import { ChatRole, SoakpProxy } from './SoakpProxy';
import { appConfig } from './configs';
import { Responses } from './http/Responses';
import { DbSchemaInterface, KeyStorage } from './KeyStorage';
import https from 'https';
import path from 'path';
import fs from 'fs';
import validateToken from './middleware/validateToken';
import initAi from './middleware/initAi';


export interface ServerConfigInterface {
  httpPort?: number;
  sslPort?: number;
  httpAuthUser?: string;
  httpAuthPass?: string;
}


/**
 * @class SoakpServer
 */
export class SoakpServer {
  private app: Express;
  private readonly keyStorage: KeyStorage;
  proxy: SoakpProxy;
  private readonly config: ServerConfigInterface;


  /**
   *
   * @param configuration
   * @param storage
   */
  constructor(configuration: ServerConfigInterface, storage: KeyStorage) {
    this.config = { ...configuration };
    this.keyStorage = storage;

    console.log(this.config);

    this.initializeExpressApp();
    this.initializeEndpoints();
  }

  /**
   * Initialize Express App
   *
   * @private
   */
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

      this.app.get('/openai/models',
                   validateToken(this.jwtHash, this.keyStorage),
                   initAi(this),
                   this.listOpenAIModels.bind(this));
      this.app.get('/openai/models/:modelId',
                   validateToken(this.jwtHash, this.keyStorage),
                   initAi(this),
                   this.openaiModelDetails.bind(this));
      this.app.post('/openai/completions',
                    validateToken(this.jwtHash, this.keyStorage),
                    initAi(this),
                    this.makeChatCompletionRequest.bind(this));
    } catch (err) {
      throw err;
    }
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
    let openaiKey: string;

    if (this.isValidOpenAIKey(req.body.key)) {
      openaiKey = req.body.key;
    } else {
      console.error(Message.INVALID_KEY);
      return;
    }

    try {
      const existingTokens = await this.keyStorage.getActiveTokens();
      const signed = this.keyStorage.generateSignedJWT(openaiKey, this.jwtHash);

      if (existingTokens instanceof Error || existingTokens.length === 0) {
        // No saved JWTs found, generate and save a new one
        console.log('No matching tokens found. Generating a new one.');
        await this.keyStorage.saveToken(signed);
        Responses.tokenAdded(res, signed);
      } else {
        existingTokens.map(async (row: DbSchemaInterface) => {
          try {
            jwt.verify(row.token, this.jwtHash);
            console.log(Message.JWT_ACCEPTED);
            Responses.tokenAccepted(res, signed);
            return;
          } catch (err: any) {
            if (err.message === 'jwt expired') {
              console.log(`${Message.JWT_EXPIRED}. Replacing it...`);
              await this.keyStorage.updateToken(row.token, signed);
              console.log(Message.JWT_UPDATED);
              Responses.tokenUpdated(res, signed);
              return;
            }
          }
        });
      }
    } catch (err: any) {
      console.error(err.message);
    }
  }

  /**
   * Handle POST `/openai/query` request
   *
   * @param req
   * @param res
   */
  private async makeChatCompletionRequest(req: express.Request, res: express.Response) {
    try {
      const response = await this.proxy.chatRequest({
        messages: req.body.messages || [
          { 'role': ChatRole.SYSTEM, 'content': 'You are a helpful assistant.' },
          { 'role': ChatRole.USER, 'content': 'Hello!' }
        ],
        model: req.body.model || 'gpt-3.5-turbo',
        temperature: req.body.temperature || 0.7,
        max_tokens: req.body.maxTokens || 100
      });

      // console.log(response);

      if (response.status === StatusCode.SUCCESS) {
        Responses.success( res, { response: response.data, responseConfig: response.config.data }, 'Received response from OpenAI API');
      }
    } catch (error) {
      console.debug(error);
      Responses.gatewayError(res);
    }
  }

  /**
   * Start the server
   * @public
   */
  public async start() {
    this.app.listen(this.config.httpPort);
    this.initSSL(this.app);
  }

  /**
   * Validate OpenAI API key
   *
   * @param key
   * @private
   */
  private isValidOpenAIKey(key: string) {
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

  /**
   * Handle GET `/openai/models` request
   *
   * @param req
   * @param res
   */
  private async listOpenAIModels(req: express.Request, res: express.Response) {
    try {
      const response = await this.proxy.listModels();

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
      Responses.serverError(res);
    }
  }

  private async openaiModelDetails(req: express.Request, res: express.Response) {
    try {
      const response = await this.proxy.getModel(req.params.modelId);

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
      Responses.serverError(res);
    }
  }
}
