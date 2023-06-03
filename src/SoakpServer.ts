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
import { KeyStorage } from './KeyStorage';
import { StatusCode } from './enums/StatusCode.enum';
import { Message } from './enums/Message.enum';
import { ServerConfigInterface } from './interfaces/ServerConfig.interface';
import { SoakpProxy } from './SoakpProxy';
import { ProxyConfigInterface } from './interfaces/ProxyConfig.interface';
import { OpenAIRequestInterface } from './interfaces/OpenAI/OpenAIRequest.interface';
import { Response } from './http/Response';
import { DbSchemaInterface } from './interfaces/DbSchema.interface';
import { ResponseInterface } from './interfaces/Response.interface';
import https from 'https';
import path from 'path';
import fs from 'fs';
import tls from 'tls';

class SoakpServer {
  private app: Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
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
      apiHost: 'https://api.openai.com',
      apiBaseUrl: '/v1',
      query: {
        // apiKey: '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',
        apiKey: '',
        apiOrgKey: 'org-euRh4hyXOmAEh9QagXatalSU',
        prompt: 'Hello World, Buddy! :-)',
        engineId: '',
        model: 'text-davinci-003'
      } as OpenAIRequestInterface
    } as ProxyConfigInterface);
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
    const secret = (<string>process.env.JWT_SECRET) as string;
    return secret.trim();
  }

  /**
   *
   * @private
   */
  private get jwtHash(): string {
    return createHash('sha256').update(this.secret).digest('hex');
  }

  /**
   * Handle GET `/get-jwt` request
   *
   * @param req
   * @param res
   * @private
   */
  private async handleGetJwt(req: express.Request, res: express.Response) {
    try {
      let openAIKey: string;

      if (this.isValidOpenAIKey(req.body.key)) {
        openAIKey = req.body.key;
      } else {
        console.error(Message.INVALID_KEY);
        return;
      }

      const existingTokens = await this.keyStorage.getActiveTokens();

      let verified = [];
      if (existingTokens.length) {
        verified = existingTokens.filter((row: DbSchemaInterface) => this.jwtVerify(row.token, openAIKey));
      }

      if (verified.length) {
        // Return the most recently accessed JWT
        Response.loadedToken(res, verified[0].token);
      } else {
        // No saved JWTs found, generate and save a new one
        const token = await this.generateAndSaveToken(openAIKey);

        if (token) {
          Response.tokenAdded(res, token);
        } else {
          throw new Error(Message.JWT_NOT_SAVED);
        }
      }
    } catch (err) {
      console.error(err);

      if (err.message === Message.JWT_NOT_SAVED) {
        Response.jwtNotSaved(res);
      } else {
        Response.serverError(res);
      }
    }
  }

  /**
   *
   * @param openAIKey
   * @private
   */
  private async generateAndSaveToken(openAIKey: string) {
    try {
      const jwtSigned = jwt.sign({ key: openAIKey }, this.jwtHash, { expiresIn: this.jwtExpiration });
      const jwtSaved = await this.keyStorage.saveJWT(jwtSigned);

      if (jwtSaved === StatusCode.CREATED) {
        return jwtSigned;
      } else {
        return false;
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   *
   * @param token
   * @param openAIKey
   */
  private jwtVerify(token: string, openAIKey: string): boolean {
    let verified = false;

    jwt.verify(token, this.jwtHash, (err: any, decoded: any) => {
      if (decoded.key === openAIKey) verified = true;
    });

    return verified;
  }

  /**
   * Handle POST `/openai/query` request
   *
   * @param req
   * @param res
   */
  private async handleOpenAIQuery(req: express.Request, res: express.Response) {
    try {
      const row: DbSchemaInterface = await this.keyStorage.getRecentToken();
      if (row?.token) {
        jwt.verify(row.token, this.jwtHash, async (err: any, decoded: any) => {
          if (err) {
            Response.notAuthorized(res, 'jwt');
            return;
          }

          // Update parameters without reinitializing the OpenAI client
          const params: OpenAIRequestInterface = {
            apiKey: decoded.key,
            apiOrgKey: 'org-euRh4hyXOmAEh9QagXatalSU',
            prompt: req.body.prompt || 'Hello world!',
            engineId: req.body.engineId || 'text-davinci-003',
            model: req.body.model || 'text-davinci-003'
          };
          this.proxy.queryParams = params;
          this.proxy.initAI(params);

          try {
            // Query OpenAI API with provided query and parameters
            const response = await this.proxy.request(params);
            console.log(response);

            if (response.status === StatusCode.SUCCESS) {
              Response.success(
                res,
                {
                  response: response.data,
                  config: response.config.data
                },
                'Received response from OpenAI'
              );
            }
          } catch (error) {
            console.error(error);
            Response.unknownError(res);
          }
        });
      } else {
        Response.notAuthorized(res, 'jwt');
      }
    } catch (e) {
      throw e;
    }
  }

  /**
   * Start the server
   * @public
   */
  public start(port: number, storage) {
    this.keyStorage = storage;
    this.app.listen(3035, () => {
      console.log(
        `Started Secure OpenAI Key Proxy on port ${port}.\nPlease consider to provide your support: https://lehcode.opencollective.org`
      );
    });
    this.iniSSL(this.app, port);
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
  private iniSSL(app: express.Application, port) {
    const privateKey = fs.readFileSync(
      path.join(process.env.SSL_CERTS_DIR as string, `${process.env.SERVER_HOST as string}-key.pem`),
      'utf8'
    );
    console.log(`Using SSL private key ${privateKey}`);
    const certificate = fs.readFileSync(
      path.join(process.env.SSL_CERTS_DIR as string, `${process.env.SERVER_HOST as string}-crt.pem`),
      'utf8'
    );
    console.log(`Using SSL certificate ${certificate}`);
    const credentials = { key: privateKey, cert: certificate };
    this.app = https.createServer(credentials, app).listen(port);
  }
}

export { SoakpServer };
