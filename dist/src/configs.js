"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const path_1 = __importDefault(require("path"));
require("dotenv/config");
exports.appConfig = {
    usernameRegex: /^[\w_]{3,16}$/,
    passwordRegex: /^[\w_]{8,32}$/,
};
const serverConfig = {
    storage: {
        dbName: process.env.NODE_ENV === 'testing' ? 'testing_secrets.sqlite' : process.env.SQLITE_DB,
        tableName: process.env.NODE_ENV === 'testing' ? 'test_tokens' : process.env.SQLITE_TABLE,
        dataFileDir: path_1.default.resolve(process.env.DATA_DIR),
        lifetime: process.env.NODE_ENV === 'testing' ? 60 : 86400
    },
    httpPort: 3003,
    sslPort: parseInt(process.env.SECURE_PORT, 10) || 3033,
    httpAuthUser: process.env.AUTH_USER,
    httpAuthPass: process.env.AUTH_PASS
};
exports.default = serverConfig;
//# sourceMappingURL=configs.js.map