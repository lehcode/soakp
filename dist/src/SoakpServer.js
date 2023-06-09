"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Author: Lehcode<53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_basic_auth_1 = __importDefault(require("express-basic-auth"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const StatusCode_enum_1 = require("./enums/StatusCode.enum");
const Message_enum_1 = require("./enums/Message.enum");
const SoakpProxy_1 = require("./SoakpProxy");
const Responses_1 = __importDefault(require("./http/Responses"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class SoakpServer {
    constructor() {
        this.jwtExpiration = 86400;
        this.config = {
            port: 3033
        };
        this.app = (0, express_1.default)();
        this.app.use((0, cors_1.default)());
        // Configure middleware
        this.app.use(body_parser_1.default.json());
        this.app.use(body_parser_1.default.urlencoded({ extended: true }));
        this.initializeEndpoints();
        this.proxy = new SoakpProxy_1.SoakpProxy({
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
    initializeEndpoints() {
        if (this.basicAuthCredentialsValidated) {
            this.app.post('/get-jwt', (0, express_basic_auth_1.default)({ users: { [process.env.AUTH_USER]: process.env.AUTH_PASS } }), this.handleGetJwt.bind(this));
        }
        this.app.post('/openai/completions', this.handleOpenAIQuery.bind(this));
        this.app.post('/openai/models', this.handleOpenAIQuery.bind(this));
    }
    /**
     * Generate JWT secret
     *
     * @private
     */
    get secret() {
        const secret = process.env.JWT_SECRET;
        return secret.trim();
    }
    /**
     *
     * @private
     */
    get jwtHash() {
        return (0, crypto_1.createHash)('sha256').update(this.secret)
            .digest('hex');
    }
    /**
     * Handle GET `/get-jwt` request
     *
     * @param req
     * @param res
     * @private
     */
    handleGetJwt(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let openAIKey;
            if (this.isValidOpenAIKey(req.body.key)) {
                openAIKey = req.body.key;
            }
            else {
                console.error(Message_enum_1.Message.INVALID_KEY);
                return;
            }
            try {
                const existingTokens = yield this.keyStorage.getActiveTokens();
                if (existingTokens instanceof Error) {
                    // No saved JWTs found, generate and save a new one
                    console.log('No matching tokens found. Generateing a new one.');
                    const savedToken = yield this.generateAndSaveToken(openAIKey, res);
                    Responses_1.default.tokenAdded(res, savedToken);
                }
                else {
                    const verified = existingTokens.filter((row) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            return jsonwebtoken_1.default.verify(row.token, this.jwtHash);
                        }
                        catch (err) {
                            if (err.message === 'jwt expired') {
                                console.log(`${Message_enum_1.Message.JWT_EXPIRED}. Replacing it...`);
                                const updated = yield this.generateAndUpdateToken(row.token, openAIKey, res);
                                console.log('Token refreshed');
                                Responses_1.default.tokenUpdated(res, updated);
                            }
                        }
                    }));
                }
            }
            catch (err) {
                console.error(err.message);
            }
        });
    }
    /**
     *
     * @param openAIKey
     * @private
     */
    generateAndSaveToken(openAIKey, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const signed = this.getSignedJWT(openAIKey);
                const saved = yield this.keyStorage.saveToken(signed);
                if (saved === StatusCode_enum_1.StatusCode.CREATED) {
                    return signed;
                }
                else {
                    throw new Error(Message_enum_1.Message.JWT_NOT_SAVED);
                }
            }
            catch (err) {
                throw err;
            }
        });
    }
    /**
     *
     * @param oldToken
     * @param openAIKey
     * @private
     */
    generateAndUpdateToken(oldToken, openAIKey, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = this.getSignedJWT(openAIKey);
                const accepted = yield this.keyStorage.updateToken(oldToken, token);
                if (accepted === StatusCode_enum_1.StatusCode.ACCEPTED) {
                    return token;
                }
            }
            catch (err) {
                throw err;
            }
        });
    }
    getSignedJWT(openAIKey) {
        return jsonwebtoken_1.default.sign({ key: openAIKey }, this.jwtHash, { expiresIn: this.jwtExpiration });
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
    handleOpenAIQuery(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = yield this.keyStorage.getRecentToken();
                if (token !== false) {
                    jsonwebtoken_1.default.verify(token, this.jwtHash, (err, decoded) => __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            Responses_1.default.notAuthorized(res, 'jwt');
                            return;
                        }
                        // Update parameters without reinitializing the OpenAI client
                        const params = {
                            apiKey: decoded.key,
                            apiOrgKey: process.env.OPENAI_API_ORG_ID,
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
                            const response = yield this.proxy.request(params);
                            console.log(response);
                            if (response.status === StatusCode_enum_1.StatusCode.SUCCESS) {
                                Responses_1.default.success(res, {
                                    response: response.data,
                                    responseConfig: response.config.data
                                }, 'Received OpenAI API response');
                            }
                        }
                        catch (error) {
                            console.error(error);
                            Responses_1.default.unknownError(res);
                        }
                    }));
                }
                else {
                    Responses_1.default.notAuthorized(res, 'jwt');
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Start the server
     * @public
     */
    start(port, storage) {
        this.keyStorage = storage;
        this.app.listen(3035, () => {
            console.log(`Started Secure OpenAI Key Proxy on port ${port}.\nPlease consider to provide your support: https://opencollective.com/soakp`);
        });
        this.initSSL(this.app, port);
    }
    /**
     * Validate OpenAI API key
     *
     * @param key
     * @private
     */
    isValidOpenAIKey(key) {
        const regex = /^(sk|pk|org)-\w+$/;
        return regex.test(key);
    }
    /**
     * Validate basic auth credentials
     *
     * @private
     */
    get basicAuthCredentialsValidated() {
        if (!process.env.AUTH_USER || !process.env.AUTH_PASS) {
            throw new Error('Missing required environment variables AUTH_USER and/or AUTH_PASS');
        }
        const username = process.env.AUTH_USER;
        const password = process.env.AUTH_PASS;
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
    initSSL(app, port) {
        const privateKey = fs_1.default.readFileSync(path_1.default.join(process.env.SSL_CERT_DIR, `${process.env.SERVER_HOST}-key.pem`), 'utf8');
        const certificate = fs_1.default.readFileSync(path_1.default.join(process.env.SSL_CERT_DIR, `${process.env.SERVER_HOST}-crt.pem`), 'utf8');
        const credentials = { key: privateKey, cert: certificate };
        this.app = https_1.default.createServer(credentials, app);
        this.app.listen(port);
    }
}
exports.default = SoakpServer;
//# sourceMappingURL=SoakpServer.js.map