/**
 * Author: Lehcode<53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023
 */
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import basicAuth from 'express-basic-auth';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { StatusCode } from './enums/StatusCode.enum';
import { Message } from './enums/Message.enum';
import { SoakpProxy } from './SoakpProxy';
import { OpenAIRequestInterface } from './interfaces/OpenAI/OpenAIRequest.interface';
import Responses from './http/Responses';
import { DbSchemaInterface } from './interfaces/DbSchema.interface';
import KeyStorage from './KeyStorage';
import https from 'https';
import path from 'path';
import fs from 'fs';

export default class SoakpServer {
  private app: any;
  private jwtExpiration = 86400;
  private keyStorage: KeyStorage;
  private config: ServerConfigInterface = {
    port: 3033
  };
  private proxy: SoakpProxy;

  constructor() {
    this.app = express();
    this.app.use(cors());

    // Configure middleware
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    this.initializeEndpoints();

    this.proxy = new SoakpProxy({
      query: {
        model: 'text-gpt3.5-turbo',
        prompt: ['Say Hello!']
      }
    });
  }

  /**
   * Initialize API endpoints
   *
   * @private
   */
  private initializeEndpoints() {
    if (this.basicAuthCredentialsValidated) {
      this.app.post(
        '/get-jwt',
        basicAuth({ users: { [<string>process.env.AUTH_USER]: <string>process.env.AUTH_PASS }}),
        this.handleGetJwt.bind(this)
      );
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
    const secret = (<string>process.env.JWT_SECRET) as string;
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
        console.log('No matching tokens found. Generateing a new one.');
        const savedToken = await this.generateAndSaveToken(openAIKey, res);
        Responses.tokenAdded(res, savedToken);
      } else {
        const verified: DbSchemaInterface[] = existingTokens.filter(async (row: DbSchemaInterface) => {
          try {
            return jwt.verify(row.token, this.jwtHash);
          } catch (err: any) {
            if (err.message === 'jwt expired') {
              console.log(`${Message.JWT_EXPIRED}. Replacing it...`);
              const updated = await this.generateAndUpdateToken(row.token, openAIKey, res);
              console.log('Token refreshed');
              Responses.tokenUpdated(res, updated);
            }
          }
        });
      }
    } catch (err: any) {
      console.error(err.message);
    }
  }

  /**
   *
   * @param openAIKey
   * @private
   */
  private async generateAndSaveToken(openAIKey: string, res: express.Response) {
    try {
      const signed = this.getSignedJWT(openAIKey);
      const saved = await this.keyStorage.saveToken(signed);

      if (saved === StatusCode.CREATED) {
        return signed;
      } else {
        throw new Error(Message.JWT_NOT_SAVED);
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   *
   * @param oldToken
   * @param openAIKey
   * @private
   */
  private async generateAndUpdateToken(oldToken: string, openAIKey: string, res: express.Response) {
    try {
      const token = this.getSignedJWT(openAIKey);
      const accepted = await this.keyStorage.updateToken(oldToken, token);

      if (accepted === StatusCode.ACCEPTED) {
        return token;
      }
    } catch (err) {
      throw err;
    }
  }

  private getSignedJWT(openAIKey: string) {
    return jwt.sign({ key: openAIKey }, this.jwtHash, { expiresIn: this.jwtExpiration });
  }

  // /**
  //  *
  //  * @param token
  //  * @param openAIKey
  //  */
  // private async jwtVerify(token: string, openAIKey: string): boolean {
  //   let verified = jwt.verify(token, this.jwtHash);
  //
  //   return verified;
  // }

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
            const response = await this.proxy.request(params);
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
    } catch (e) {
      throw e;
    }
  }

  /**
   * Start the server
   * @public
   */
  public start(port: number, storage: KeyStorage) {
    this.keyStorage = storage;
    this.app.listen(3035, () => {
      console.log(
        `Started Secure OpenAI Key Proxy on port ${port}.\nPlease consider to provide your support: https://opencollective.com/soakp`
      );
    });
    this.initSSL(this.app, port);
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

  /**
   *
   * @param app
   */
  private initSSL(app: express.Application, port: number) {
    const privateKey = fs.readFileSync(
      path.join(process.env.SSL_CERT_DIR as string, `${process.env.SERVER_HOST as string}-key.pem`),
      'utf8'
    );

    const certificate = fs.readFileSync(
      path.join(process.env.SSL_CERT_DIR as string, `${process.env.SERVER_HOST as string}-crt.pem`),
      'utf8'
    );

    const credentials = { key: privateKey, cert: certificate };
    this.app = https.createServer(credentials, app);
    this.app.listen(port);
  }
}

interface ServerConfigInterface {
  port: number;
}
