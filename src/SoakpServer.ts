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
import { Responses } from './lib/Responses';
import { DbSchemaInterface, KeyStorage } from './KeyStorage';
import https from 'https';
import path from 'path';
import fs from 'fs';
import { OpenAIConfigInterface } from './interfaces/OpenAIConfig.interface';
import { OpenaiChatApi } from './openai/OpenaiChatApi';
import { OpenaiModelsApi } from './openai/OpenaiModelsApi';
import { OpenaiFilesApi } from './openai/OpenaiFilesApi';
import { StatusCode } from './enums/StatusCode.enum';
import { UserInterface } from './interfaces/User.interface';
import { OpenaiFinetunesApi } from './openai/OpenaiFinetunesApi';
import { CreateChatCompletionRequest, CreateCompletionRequest } from 'openai';
import { ChatRole } from './enums/ChatRole.enum';
import rateLimit from 'express-rate-limit';
import { JSONL } from './lib/JSONL';

export interface ServerConfigInterface {
  httpPort: number;
  sslPort: number;
  httpAuthUser: string;
  httpAuthPass: string;
  dataDir: string;
  openAI: OpenAIConfigInterface;
  validFiles: RegExp;
}


/**
 * @class SoakpServer
 */
export class SoakpServer {
  /**
   * Express application service
   * @protected
   */
  protected appService: Express;
  /**
   * JWT storage service
   *
   * @private
   */
  private readonly keyStorageService: KeyStorage;
  /**
   * Server configuration
   */
  private readonly serverConfig: ServerConfigInterface;
  private readonly chat: OpenaiChatApi;
  private readonly models: OpenaiModelsApi;
  private readonly files: OpenaiFilesApi;
  private user: UserInterface;
  proxyService: SoakpProxy;
  private readonly finetunes: OpenaiFinetunesApi;
  /**
   * JSONL parsing and generation
   *
   * @protected
   */
  protected jsonlService: JSONL;


  /**
   *
   * @param configuration
   * @param storage
   */
  constructor(configuration: ServerConfigInterface, storage: KeyStorage) {
    this.serverConfig = { ...configuration };
    this.keyStorageService = storage;
    this.user = { token: undefined, apiKey: undefined, orgId: undefined };
    this.jsonlService = new JSONL();

    this.initializeExpressApp();

    this.chat = new OpenaiChatApi(this);
    this.models = new OpenaiModelsApi(this);
    this.files = new OpenaiFilesApi(this);
    this.finetunes = new OpenaiFinetunesApi(this);

    console.log(this.serverConfig);

    try {
      if (this.basicAuthCredentialsValid()) {
        this.appService.post(
          '/jwt/generate',
          basicAuth({ users: { [this.serverConfig.httpAuthUser]: this.serverConfig.httpAuthPass }}),
          this.generateJwt.bind(this)
        );
      }
    } catch (err: any) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * Initialize Express App
   *
   * @private
   */
  private initializeExpressApp() {
    this.appService = express();

    // Configure middleware
    this.appService.use(cors());
    this.appService.use(express.json());
    this.appService.use(express.urlencoded({ extended: true }));

    this.appService.use(rateLimit({
      // 1 minute
      windowMs: 2*1000,
      max: 10
    }));
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
   * Sign JWT with encoded secret key
   *
   * @private
   */
  get jwtHash(): string {
    return createHash('sha256')
      .update(this.secret)
      .digest('hex');
  }

  /**
   * Handle GET `/get-jwt` request.
   * Generate JWT token for user-provided OpenAI API key.
   *
   * @param req
   * @param res
   * @private
   */
  private async generateJwt(req: express.Request, res: express.Response) {
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
      const existingTokens = await this.keyStorageService.getActiveTokens();
      let signed: string;

      if (((existingTokens instanceof Array) && existingTokens.length === 0) || (existingTokens instanceof Error)) {
        // No saved JWTs found, generate and save a new one
        console.log('No matching tokens found. Generating a new one.');
        signed = this.keyStorageService.generateSignedJWT(this.user.apiKey, this.jwtHash);
        await this.keyStorageService.saveToken(signed);

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
          return Responses.success(res, { data: existingTokens.pop().token }, '');
        }
      }
    } catch (err: any) {
      return Responses.unknownServerError(res, err.message);
    }
  }

  /**
   * Start the server
   * @public
   */
  public async start() {
    this.appService.listen(this.serverConfig.httpPort);
    this.initSSL(this.appService);
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
    this.appService = https.createServer({ key: privateKey, cert: certificate }, app);
    this.appService.listen(this.serverConfig.sslPort);
  }

  /**
   * Expose user properties
   */
  getUser(): UserInterface {
    return this.user;
  }

  /**
   * Expose key storage
   */
  get keyStorage() {
    return this.keyStorageService;
  }

  /**
   * Expose ExpressJS application
   */
  get app() {
    return this.appService;
  }

  /**
   * Getter for proxy service
   */
  get proxy() {
    return this.proxyService;
  }

  /**
   * Setter for proxy service
   * 
   * @param value
   */
  set proxy(value: SoakpProxy) {
    this.proxyService = value;
  }

  /**
   * SOAKP server configuration getter
   */
  get config() {
    return this.serverConfig;
  }

  /**
   * JSONL service getter
   */
  get jsonl() {
    return this.jsonlService;
  }
}
