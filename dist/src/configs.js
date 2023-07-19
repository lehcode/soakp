"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverConfig = exports.openAIConfig = exports.storageConfig = exports.appConfig = void 0;
const path_1 = __importDefault(require("path"));
require("dotenv/config");
/**
 * Application configuration
 */
exports.appConfig = {
    /**
     *  @type {RegExp}
     *  @memberOf appConfig
     */
    usernameRegex: /^[\w_]{3,16}$/,
    /**
     *  @type {RegExp}
     *  @memberOf appConfig
     */
    passwordRegex: /^[\w_]{8,32}$/,
    /**
     *  @type {RegExp}
     *  @memberOf appConfig
     */
    tokenRegex: /^[a-zA-Z0-9\/]+$/,
};
/**
 * Storage configuration
 */
exports.storageConfig = {
    /**
     * @type {string}
     * @memberOf StorageConfigInterface
     */
    dbName: process.env.NODE_ENV === 'testing' ? 'testing_secrets.sqlite' : process.env.SQLITE_DB,
    tableName: process.env.NODE_ENV === 'testing' ? 'test_tokens' : process.env.SQLITE_TABLE,
    dataFileDir: path_1.default.resolve(process.env.DATA_DIR),
    tokenLifetime: process.env.NODE_ENV === 'testing' ? 600 : 604800
};
exports.openAIConfig = {
    apiKey: undefined,
    orgId: process.env.OPENAI_ORG_ID,
};
exports.serverConfig = {
    httpPort: 3003,
    sslPort: parseInt(process.env.SECURE_PORT, 10) || 3033,
    httpAuthUser: process.env.AUTH_USER,
    httpAuthPass: process.env.AUTH_PASS,
    openAI: exports.openAIConfig
};
//# sourceMappingURL=configs.js.map