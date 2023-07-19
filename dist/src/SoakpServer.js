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
const configs_1 = require("./configs");
const Responses_1 = require("./http/Responses");
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const validateToken_1 = __importDefault(require("./middleware/validateToken"));
const initAi_1 = __importDefault(require("./middleware/initAi"));
/**
 * @class SoakpServer
 */
class SoakpServer {
    /**
     *
     * @param configuration
     * @param storage
     */
    constructor(configuration, storage) {
        this.config = Object.assign({}, configuration);
        this.keyStorage = storage;
        console.log(this.config);
        this.initializeExpressApp();
        this.initializeEndpoints();
        // this.proxy = new SoakpProxy();
    }
    /**
     * Initialize Express App
     *
     * @private
     */
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
            this.app.get('/openai/models', (0, validateToken_1.default)(this.jwtHash, this.keyStorage), (0, initAi_1.default)(this), this.listOpenAIModels.bind(this));
            this.app.post('/openai/completions', (0, validateToken_1.default)(this.jwtHash, this.keyStorage), (0, initAi_1.default)(this), this.makeChatCompletionRequest.bind(this));
            // this.app.get('/openai/models/model/{model}', validateToken(this.jwtHash, this.keyStorage), this.openAIModelDetails.bind(this));
        }
        catch (err) {
            throw err;
        }
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
                const signed = this.keyStorage.generateSignedJWT(openAIKey, this.jwtHash);
                if (existingTokens instanceof Error || existingTokens.length === 0) {
                    // No saved JWTs found, generate and save a new one
                    console.log('No matching tokens found. Generating a new one.');
                    yield this.keyStorage.saveToken(signed);
                    Responses_1.Responses.tokenAdded(res, signed);
                }
                else {
                    existingTokens.map((row) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            jsonwebtoken_1.default.verify(row.token, this.jwtHash);
                            console.log(Message_enum_1.Message.JWT_ACCEPTED);
                            Responses_1.Responses.tokenAccepted(res, signed);
                            return;
                        }
                        catch (err) {
                            if (err.message === 'jwt expired') {
                                console.log(`${Message_enum_1.Message.JWT_EXPIRED}. Replacing it...`);
                                yield this.keyStorage.updateToken(row.token, signed);
                                console.log(Message_enum_1.Message.JWT_UPDATED);
                                Responses_1.Responses.tokenUpdated(res, signed);
                                return;
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
     * Handle POST `/openai/query` request
     *
     * @param req
     * @param res
     */
    makeChatCompletionRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.proxy.chatRequest({
                    messages: req.body.messages || [
                        { 'role': SoakpProxy_1.ChatRole.SYSTEM, 'content': 'You are a helpful assistant.' },
                        { 'role': SoakpProxy_1.ChatRole.USER, 'content': 'Hello!' }
                    ],
                    model: req.body.model || 'text-davinci-003',
                    temperature: req.body.temperature || 0.7,
                    max_tokens: req.body.maxTokens || 100
                });
                // console.log(response);
                if (response.status === StatusCode_enum_1.StatusCode.SUCCESS) {
                    Responses_1.Responses.success(res, { response: response.data, responseConfig: response.config.data }, 'Received response from OpenAI API');
                }
            }
            catch (error) {
                console.debug(error);
                Responses_1.Responses.gatewayError(res);
            }
        });
    }
    /**
     * Start the server
     * @public
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
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
    /**
     * Handle GET `/openai/models` request
     *
     * @param req
     * @param res
     */
    listOpenAIModels(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.proxy.listModels();
                if (response.status === StatusCode_enum_1.StatusCode.SUCCESS) {
                    Responses_1.Responses.success(res, {
                        response: response.data,
                        responseConfig: response.config.data
                    }, 'Received OpenAI API response');
                }
            }
            catch (error) {
                console.error(error);
                Responses_1.Responses.serverError(res);
            }
        });
    }
}
exports.SoakpServer = SoakpServer;
//# sourceMappingURL=SoakpServer.js.map