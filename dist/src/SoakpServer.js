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
exports.SoakpServer = void 0;
/**
 * Author: Lehcode
 * Copyright: (C) Lehcode.com 2023
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
const Responses_1 = require("./http/Responses");
const KeyStorage_1 = require("./KeyStorage");
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const configs_1 = require("./configs");
class SoakpServer {
    constructor(config) {
        this.config = Object.assign({}, config);
        console.log(this.config);
        this.initializeExpressApp();
        this.initializeEndpoints();
        this.proxy = new SoakpProxy_1.SoakpProxy({
            query: {
                model: 'text-gpt3.5-turbo',
                prompt: ['Say Hello!']
            }
        });
    }
    initializeExpressApp() {
        this.app = (0, express_1.default)();
        // Configure middleware
        this.app.use((0, cors_1.default)());
        this.app.use(body_parser_1.default.json());
        this.app.use(body_parser_1.default.urlencoded({ extended: true }));
    }
    /**
     * Initialize API endpoints
     *
     * @private
     */
    initializeEndpoints() {
        try {
            if (this.basicAuthCredentialsValid()) {
                this.app.post('/get-jwt', (0, express_basic_auth_1.default)({ users: { [process.env.AUTH_USER]: process.env.AUTH_PASS } }), this.handleGetJwt.bind(this));
            }
        }
        catch (err) {
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
                    console.log('No matching tokens found. Generating a new one.');
                    const savedToken = yield this.generateAndSaveToken(openAIKey);
                    Responses_1.Responses.tokenAdded(res, savedToken);
                }
                else {
                    existingTokens.map((row) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            jsonwebtoken_1.default.verify(row.token, this.jwtHash);
                        }
                        catch (err) {
                            if (err.message === 'jwt expired') {
                                console.log(`${Message_enum_1.Message.JWT_EXPIRED}. Replacing it...`);
                                const updated = yield this.generateAndUpdateToken(row.token, openAIKey);
                                console.log('Token refreshed');
                                Responses_1.Responses.tokenUpdated(res, updated);
                            }
                        }
                        console.log(Message_enum_1.Message.JWT_ACCEPTED);
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
     * @param res
     * @private
     */
    generateAndSaveToken(openAIKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const signed = this.getSignedJWT(openAIKey);
            const saved = yield this.keyStorage.saveToken(signed);
            if (saved === StatusCode_enum_1.StatusCode.CREATED) {
                return signed;
            }
            else {
                throw new Error(Message_enum_1.Message.JWT_NOT_SAVED);
            }
        });
    }
    /**
     *
     * @param oldToken
     * @param openAIKey
     * @param res
     * @private
     */
    generateAndUpdateToken(oldToken, openAIKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = this.getSignedJWT(openAIKey);
                const accepted = yield this.keyStorage.updateToken(oldToken, token);
                if (accepted === StatusCode_enum_1.StatusCode.ACCEPTED) {
                    return token;
                }
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    /**
     *
     * @param openAIKey
     * @private
     */
    getSignedJWT(openAIKey) {
        return jsonwebtoken_1.default.sign({ key: openAIKey }, this.jwtHash, { expiresIn: this.config.storage.lifetime });
    }
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
                            Responses_1.Responses.notAuthorized(res, 'jwt');
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
                            const response = yield this.proxy.makeRequest(params);
                            console.log(response);
                            if (response.status === StatusCode_enum_1.StatusCode.SUCCESS) {
                                Responses_1.Responses.success(res, {
                                    response: response.data,
                                    responseConfig: response.config.data
                                }, 'Received OpenAI API response');
                            }
                        }
                        catch (error) {
                            console.error(error);
                            Responses_1.Responses.unknownError(res);
                        }
                    }));
                }
                else {
                    Responses_1.Responses.notAuthorized(res, 'jwt');
                }
            }
            catch (err) {
                throw err;
            }
        });
    }
    /**
     * Start the server
     * @public
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.keyStorage = yield KeyStorage_1.KeyStorage.getInstance(this.config.storage);
            this.app.listen(this.config.httpPort);
            this.initSSL(this.app);
        });
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
    basicAuthCredentialsValid() {
        if (!process.env.AUTH_USER || !process.env.AUTH_PASS) {
            throw new Error('Missing required environment variables AUTH_USER and/or AUTH_PASS');
        }
        // Check username
        if (!configs_1.appConfig.usernameRegex.test(process.env.AUTH_USER)) {
            throw new Error('Username provided for Basic HTTP Authorization cannot be validated');
        }
        // Check password
        if (!configs_1.appConfig.passwordRegex.test(process.env.AUTH_PASS)) {
            throw new Error('Password provided for Basic HTTP Authorization cannot be validated');
        }
        return true;
    }
    /**
     *
     * @param app
     */
    initSSL(app) {
        const privateKey = fs_1.default.readFileSync(path_1.default.join(process.env.SSL_CERT_DIR, `${process.env.SERVER_HOST}-key.pem`), 'utf8');
        const certificate = fs_1.default.readFileSync(path_1.default.join(process.env.SSL_CERT_DIR, `${process.env.SERVER_HOST}-crt.pem`), 'utf8');
        // @ts-ignore
        this.app = https_1.default.createServer({ key: privateKey, cert: certificate }, app);
        this.app.listen(this.config.sslPort);
    }
}
exports.SoakpServer = SoakpServer;
//# sourceMappingURL=SoakpServer.js.map