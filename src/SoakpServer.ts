/**
 * Author: Lehcode
 * Copyright: (C) Lehcode.com 2023
 */
import express, { Express } from 'express';
import cors from 'cors';
import basicAuth from 'express-basic-auth';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { StatusCode } from './enums/StatusCode.enum';
import { StatusMessage } from './enums/StatusMessage.enum';
import { ChatRole } from './enums/ChatRole.enum';
import { SoakpProxy } from './SoakpProxy';
import { appConfig, serverConfig } from './configs';
import { Responses } from './http/Responses';
import { DbSchemaInterface, KeyStorage } from './KeyStorage';
import https from 'https';
import path from 'path';
import fs from 'fs';
import validateToken from './middleware/validateToken';
import { OpenAIConfigInterface } from './interfaces/OpenAIConfig.interface';
import initAi from './middleware/initAi';
import uploadFile from './middleware/uploadFile';
import { File } from 'buffer';

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
                   this.listOpenAIModels.bind(this));
      this.app.post('/openai/completions',
                    validateToken(this.jwtHash, this.keyStorage),
                    initAi(this),
                    this.makeChatCompletionRequest.bind(this));
      // this.app.get('/openai/models/model/{model}', validateToken(this.jwtHash, this.keyStorage), this.openAIModelDetails.bind(this));
      this.app.post('/openai/files',
                    validateToken(this.jwtHash, this.keyStorage),
                    initAi(this),
                    uploadFile(),
                    this.sendFile.bind(this));
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
  async listOpenAIModels(req: express.Request, res: express.Response) {
    try {
      const response = await this.proxy.listModels();

      if (response.status === StatusCode.SUCCESS) {
        Responses.success(
          res,
          {
            response: response.data,
            responseConfig: response.config.data
          },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
      }
    } catch (error) {
      console.error(error);
      Responses.serverError(res);
    }
  }

  /**
   * Send uploaded file to OpenAI API
   *
   * @param req
   * @param res
   */
  async sendFile(req: express.Request, res: express.Response) {
    try {
      if (!req.file || !(req.file instanceof Object)) {
        return Responses.error(res,'File not uploaded.', StatusCode.INTERNAL_ERROR, StatusMessage.UPLOAD_ERROR);
      }

      const title = String(req.body.title);
      if (title === '') {
        return Responses.error(res,'Invalid document title', StatusCode.BAD_REQUEST, StatusMessage.BAD_REQUEST);
      }

      req.body.convert = req.body.convert === 'true' || false;

      const docName = String(req.body.title);
      const purpose = 'fine-tune';
      // const contentType = 'application/jsonl';
      let response;

      if (path.extname(req.file.originalname) === '.jsonl') {
        const file = `${serverConfig.dataDir}/jsonl/${req.file.filename}.jsonl`;
        await fs.promises.writeFile(file, req.file.buffer);
        response = await this.proxy.uploadFile(file, purpose);
      } else {
        if (req.body.convert === true) {
          // Code to handle conversion if `convert` input field exists and is `true`
          switch (req.file.mimetype) {
            case 'text/plain':
            case 'text/markdown':
              const jsonlFile = await this.proxy.txt2jsonl(req.file, docName);
              response = await this.proxy.uploadFile(
                fs.createReadStream(jsonlFile),
                purpose
              );
              break;
            default:
              return Responses.error(
                res,
                'This file cannot be converted to JSONL by SOAKP',
                StatusCode.UNSUPPORTED_MEDIA_TYPE,
                StatusMessage.WRONG_FILE_TYPE
              );
          }
        } else {
          return Responses.error(
            res,
            'Please provide properly formatted JSONL file.',
            StatusCode.UNSUPPORTED_MEDIA_TYPE,
            StatusMessage.WRONG_FILE_TYPE
          );
        }
      }

      if (response.status === StatusCode.SUCCESS) {
        return Responses.success(
          res,
          {
            response: response.data,
            responseConfig: response.config.data
          },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
      }
    } catch (error) {
      console.error(error);
      return Responses.serverError(res);
    }
  }
}
