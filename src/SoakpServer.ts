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
import { StatusCode } from './enums/StatusCode.enum';
import { UserInterface } from './interfaces/User.interface';

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
  private readonly config: ServerConfigInterface;
  private readonly chat: OpenaiChatApi;
  private readonly models: OpenaiModelsApi;
  private readonly files: OpenaiFilesApi;
  private user: UserInterface;
  proxy: SoakpProxy;


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
    this.user = { token: undefined, apiKey: undefined, orgId: undefined };
    this.proxy = new SoakpProxy();

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
          basicAuth({ users: { [this.config.httpAuthUser]: this.config.httpAuthPass }}),
          this.handleGetJwt.bind(this)
        );
      }

      this.app.get('/openai/models',
                   validateToken(this.jwtHash, this.keyStorage, this.user),
                   initAi(this),
                   this.models.getModels.bind(this));
      this.app.get('/openai/models/model/{model}',
                   validateToken(this.jwtHash, this.keyStorage, this.user),
                   initAi(this),
                   this.models.getModel.bind(this));
      this.app.post('/openai/completions',
                    validateToken(this.jwtHash, this.keyStorage, this.user),
                    initAi(this),
                    this.chat.makeChatCompletionRequest.bind(this));
      this.app.post('/openai/files',
                    validateToken(this.jwtHash, this.keyStorage, this.user),
                    initAi(this),
                    uploadFile(),
                    this.files.sendFile.bind(this));
      this.app.get('/openai/files',
                   validateToken(this.jwtHash, this.keyStorage, this.user),
                   initAi(this),
                   this.files.listFiles.bind(this));
      this.app.delete('/openai/files/:file_id',
                      validateToken(this.jwtHash, this.keyStorage, this.user),
                      initAi(this),
                      this.files.deleteFile.bind(this));
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
    return String(process.env.JWT_SECRET).trim();
  }

  /**
   *
   * @private
   */
  private get jwtHash(): string {
    return createHash('sha256')
      .update(this.secret)
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
    if (this.isValidOpenAIKey(req.body.key)) {
      this.user = <UserInterface>{
        token: undefined,
        apiKey: req.body.key,
        orgId: req.body.orgId
      };
    } else {
      return Responses.error(res, StatusMessage.INVALID_OPENAI_KEY, StatusCode.NOT_AUTHORIZED, StatusMessage.NOT_AUTHORIZED);
    }

    try {
      const existingTokens = await this.keyStorage.getActiveTokens();
      let signed: string;

      if (((existingTokens instanceof Array) && existingTokens.length === 0) || (existingTokens instanceof Error)) {
        // No saved JWTs found, generate and save a new one
        console.log('No matching tokens found. Generating a new one.');
        signed = this.keyStorage.generateSignedJWT(this.user.apiKey, this.jwtHash);
        await this.keyStorage.saveToken(signed);

        return Responses.tokenAdded(res, signed);
      } else {
        existingTokens.filter(async (row: DbSchemaInterface) => {
          try {
            jwt.verify(row.token, this.jwtHash);
            console.log(StatusMessage.JWT_ACCEPTED);

            return true;
          } catch (err: any) {
            if (err.message === 'jwt expired') {
              console.log(`${StatusMessage.JWT_EXPIRED}: '${row.token.substring(0, 64)}...'`);
            }

            return false;
          }
        });

        if (existingTokens.length) {
          return Responses.tokenAccepted(res, existingTokens.pop().token);
        }
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
    return /^(sk|pk|org)-\w+$/.test(key);
  }

  /**
   * Validate basic auth credentials
   *
   * @private
   */
  private basicAuthCredentialsValid(): boolean {
    const user = String(process.env.AUTH_USER);
    const pass = String(process.env.AUTH_PASS);

    if (!user || !pass) {
      throw new Error('Missing required environment variables AUTH_USER and/or AUTH_PASS');
    }

    // Check username
    if (!appConfig.usernameRegex.test(user)) {
      throw new Error('Username provided for Basic HTTP Authorization cannot be validated');
    }

    // Check password
    if (!appConfig.passwordRegex.test(pass)) {
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
      path.join(String(process.env.SSL_CERT_DIR), `${String(process.env.SERVER_HOST)}-key.pem`),
      'utf8'
    );

    const certificate = fs.readFileSync(
      path.join(String(process.env.SSL_CERT_DIR), `${String(process.env.SERVER_HOST)}-crt.pem`),
      'utf8'
    );

    // @ts-ignore
    this.app = https.createServer({ key: privateKey, cert: certificate }, app);
    this.app.listen(this.config.sslPort);
  }

  /**
   * User properties setter
   *
   * @param value
   */
  setUser(value: UserInterface) {
    this.user = value;
  }

  /**
   * User properties getter
   */
  getUser(): UserInterface {
    return this.user;
  }
}
