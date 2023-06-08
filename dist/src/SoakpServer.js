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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU29ha3BTZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvU29ha3BTZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxzREFBOEI7QUFDOUIsZ0RBQXdCO0FBQ3hCLDhEQUFxQztBQUNyQyw0RUFBMkM7QUFDM0MsZ0VBQStCO0FBQy9CLG1DQUFvQztBQUNwQyw2REFBcUQ7QUFDckQsdURBQStDO0FBQy9DLDZDQUEwQztBQUUxQyxpRUFBeUM7QUFHekMsa0RBQTBCO0FBQzFCLGdEQUF3QjtBQUN4Qiw0Q0FBb0I7QUFFcEIsTUFBcUIsV0FBVztJQVM5QjtRQVBRLGtCQUFhLEdBQUcsS0FBSyxDQUFDO1FBRXRCLFdBQU0sR0FBMEI7WUFDdEMsSUFBSSxFQUFFLElBQUk7U0FDWCxDQUFDO1FBSUEsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFBLGlCQUFPLEdBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFBLGNBQUksR0FBRSxDQUFDLENBQUM7UUFFckIsdUJBQXVCO1FBQ3ZCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxxQkFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFeEQsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFFM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLHVCQUFVLENBQUM7WUFDMUIsS0FBSyxFQUFFO2dCQUNMLEtBQUssRUFBRSxtQkFBbUI7Z0JBQzFCLE1BQU0sRUFBRSxDQUFDLFlBQVksQ0FBQzthQUN2QjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ssbUJBQW1CO1FBQ3pCLElB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