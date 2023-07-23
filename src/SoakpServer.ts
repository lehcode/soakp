/**
 * Author: Lehcode
 * Copyright: (C) Lehcode.com 2023
 */
import express, { Express } from 'express';
import cors from 'cors';
import basicAuth from 'express-basic-auth';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { StatusMessage } from './enums/StatusMessage.enum';
import { SoakpProxy } from './SoakpProxy';
import { appConfig } from './configs';
import { Responses } from './http/Responses';
import { DbSchemaInterface, KeyStorage } from './KeyStorage';
import https from 'https';
import path from 'path';
import fs from 'fs';
import validateToken from './middleware/validateToken';
import { OpenAIConfigInterface } from './interfaces/OpenAIConfig.interface';
import initAi from './middleware/initAi';
import uploadFile from './middleware/uploadFile';
import { OpenaiChatApi } from './openai/OpenaiChatApi';
import { OpenaiModelsApi } from './openai/OpenaiModelsApi';
import { OpenaiFilesApi } from './openai/OpenaiFilesApi';

export interface ServerConfigInterface {
  httpPort: number;
  sslPort: number;
  httpAuthUser: string;
  httpAuthPass: string;
  dataDir: string;
  openAI: OpenAIConfigInterface;
}


/**
 * @class SoakpServer
 */
export class SoakpServer {
  private app: Express;
  private keyStorage: KeyStorage;
  proxy: SoakpProxy;
  private readonly config: ServerConfigInterface;
  private readonly chat: OpenaiChatApi;
  private readonly models: OpenaiModelsApi;
  private readonly files: OpenaiFilesApi;


  /**
   *
   * @param configuration
   * @param storage
   */
  constructor(configuration: ServerConfigInterface, storage: KeyStorage) {
    this.config = { ...configuration };
    this.keyStorage = storage;
    this.chat = new OpenaiChatApi();
    this.models = new OpenaiModelsApi();
    this.files = new OpenaiFilesApi();

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
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
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
          '/jwt/generate',
          basicAuth({ users: { [process.env.AUTH_USER as string]: process.env.AUTH_PASS as string }}),
          this.handleGetJwt.bind(this)
        );
      }

      this.app.get('/openai/models',
                   validateToken(this.jwtHash, this.keyStorage),
                   initAi(this),
                   this.models.getModels.bind(this));
      this.app.post('/openai/completions',
                    validateToken(this.jwtHash, this.keyStorage),
                    initAi(this),
                    this.chat.makeChatCompletionRequest.bind(this));
      // this.app.get('/openai/models/model/{model}', validateToken(this.jwtHash, this.keyStorage), this.openAIModelDetails.bind(this));
      this.app.post('/openai/files',
                    validateToken(this.jwtHash, this.keyStorage),
                    initAi(this),
                    uploadFile(),
                    this.files.sendFile.bind(this));
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
    let openAIKey: string;

    if (this.isValidOpenAIKey(req.body.key)) {
      openAIKey = req.body.key;
    } else {
      console.error(StatusMessage.INVALID_KEY);
      return;
    }

    try {
      const existingTokens = await this.keyStorage.getActiveTokens();
      const signed = this.keyStorage.generateSignedJWT(openAIKey, this.jwtHash);

      if (existingTokens instanceof Error || existingTokens.length === 0) {
        // No saved JWTs found, generate and save a new one
        console.log('No matching tokens found. Generating a new one.');
        await this.keyStorage.saveToken(signed);
        Responses.tokenAdded(res, signed);
      } else {
        existingTokens.map(async (row: DbSchemaInterface) => {
          try {
            jwt.verify(row.token, this.jwtHash);
            console.log(StatusMessage.JWT_ACCEPTED);
            Responses.tokenAccepted(res, signed);
            return;
          } catch (err: any) {
            if (err.message === 'jwt expired') {
              console.log(`${StatusMessage.JWT_EXPIRED}. Replacing it...`);
              await this.keyStorage.updateToken(row.token, signed);
              console.log(StatusMessage.JWT_UPDATED);
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
}
