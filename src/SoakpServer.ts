/**
 * Author: Lehcode<53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023
 */
import express from 'express';
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

class SoakpServer {
  private readonly app: express.Application;
  private jwtExpiration = 86400;
  private keyStorage: KeyStorage;
  private config: ServerConfigInterface = {
    port: 3033
  };
  private proxy: SoakpProxy;

  constructor(private readonly configuration: ServerConfigInterface) {
    this.app = express();
    this.config = { ...configuration };

    // Configure middleware
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

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
   *
   * @param storage
   */
  async init(storage) {
    this.keyStorage = storage;
    this.initializeEndpoints();
    this.start(this.config.port);
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
    const openAIKey = req.body.key;
    const openAIOrg = req.body.org;
    const existingTokens = await this.keyStorage.custom(
      `SELECT token FROM ${this.keyStorage.tableName} WHERE archived !='1' ORDER BY last_access DESC`
    );

    if (existingTokens.length > 0) {
      return Promise.resolve(
        existingTokens.filter((row) => {
          let verified = false;

          jwt.verify(row.token as string, this.jwtHash, async (err: any, decoded: any) => {
            if (decoded.key === openAIKey) {
              verified = true;
            }
          });

          return verified;
        })
      ).then(async (verified) => {
        if (Array.isArray(verified) && verified.length > 0) {
          // Return the most recently accessed JWT if many are found
          res.json({
            status: StatusCode.SUCCESS,
            message: Message.LOADED_JWT_TOKEN,
            data: verified[0].token
          });
        } else {
          // No saved JWT's found
          // Generate and save a new one
          try {
            const jwtSigned = jwt.sign({ key: openAIKey }, this.jwtHash, { expiresIn: this.jwtExpiration });
            const jwtSaved = await this.keyStorage.saveJWT(jwtSigned);

            if (jwtSaved === StatusCode.CREATED) {
              res.json({
                status: StatusCode.CREATED,
                message: Message.JWT_ADDED,
                data: { jwt: jwtSigned }
              });
            } else {
              throw new Error('JWT not saved');
            }
          } catch (err) {
            throw err;
          }
        }
      });
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
    const tokenFound = await this.keyStorage.jwtExists(token.replace('Bearer ', '').trim());

    if (tokenFound) {
      jwt.verify(tokenFound as string, this.jwtHash, async (err: any, decoded: any) => {
        if (err) {
          res.status(StatusCode.NOT_AUTHORIZED).json({
            status: StatusCode.NOT_AUTHORIZED,
            message: Message.NOT_AUTHORIZED_ERROR
          });
          // return early if token is invalid
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

          // Forward response back to user via websockets
          // TODO: Implement websocket response
        } catch (error) {
          console.error(error);
          // Handle error appropriately
        }
      });
    } else {
      res.json({
        status: StatusCode.BAD_REQUEST,
        message: Message.NOT_FOUND
      });
    }
  }

  /**
   * Start the server
   * @public
   */
  public start(port: number) {
    this.app.listen(port, () => {
      console.log(
        `Started Secure OpenAI Key Proxy on port ${port}.\nPlease consider to provide your support: https://lehcode.opencollective.org`
      );
    });
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
}

export { SoakpServer };
