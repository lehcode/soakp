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
exports.StorageType = void 0;
const path_1 = __importDefault(require("path"));
const SQLite_1 = __importDefault(require("./backends/SQLite"));
const StatusCode_enum_1 = require("./enums/StatusCode.enum");
var StorageType;
(function (StorageType) {
    StorageType["SQLITE"] = "STORAGE_SQLITE";
    StorageType["FILE"] = "STORAGE_FILE";
    StorageType["MEMORY"] = "STORAGE_MEMORY";
})(StorageType || (exports.StorageType = StorageType = {}));
class KeyStorage {
    constructor(type, configuration) {
        this.backend = null;
        this.config = Object.assign({}, configuration);
        this.type = type;
    }
    static getInstance(storageType, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyStorageInstance = new KeyStorage(storageType, config);
            if (config.sql && config.dataFileLocation) {
                const sqliteFile = path_1.default.resolve(config.dataFileLocation, `./${config.sql.dbName}`);
                try {
                    keyStorageInstance.backend = yield SQLite_1.default.getInstance(config.sql.dbName, config.sql.tableName, sqliteFile);
                }
                catch (err) {
                    throw err;
                }
            }
            return keyStorageInstance;
        });
    }
    saveToken(jwtToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const error = yield this.backend.insert(jwtToken);
                if (error instanceof Error) {
                    console.error(error.message);
                    return false;
                }
                else {
                    return StatusCode_enum_1.StatusCode.CREATED;
                }
            }
            catch (err) {
                throw err;
            }
        });
    }
    fetchToken(jwtToken) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const row = yield ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.findOne('token', [`token = '${jwtToken}'`, 'archived != 1']));
                if (row instanceof Error) {
                    console.error(row.message);
                    return '';
                }
                else {
                    return row.token;
                }
            }
            catch (err) {
                throw err;
            }
        });
    }
    jwtExists(jwtToken) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const row = yield ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.findOne('token', ['archived != 1', `token = '${jwtToken}'`]));
                if (row instanceof Error) {
                    console.error(row.message);
                    return false;
                }
                else {
                    return row.token;
                }
            }
            catch (err) {
                throw err;
            }
        });
    }
    archive(what) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.backend.archive(what);
                if (result instanceof Error) {
                    console.error(result.message);
                    return false;
                }
                else {
                    return StatusCode_enum_1.StatusCode.ACCEPTED;
                }
            }
            catch (err) {
                throw err;
            }
        });
    }
    getActiveTokens() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (_b = yield ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.findAll('token'))) !== null && _b !== void 0 ? _b : [];
            }
            catch (err) {
                throw err;
            }
        });
    }
    getRecentToken() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.findOne());
                if (result instanceof Error) {
                    console.error(result.message);
                    return false;
                }
                else {
                    return (_b = result === null || result === void 0 ? void 0 : result.token) !== null && _b !== void 0 ? _b : false;
                }
            }
            catch (err) {
                throw err;
            }
        });
    }
    updateToken(oldToken, newToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.backend.update([`token = '${oldToken}'`], [`token = '${newToken}'`, `created_at = '${Date.now()}'`, `updated_at = '${Date.now()}'`]);
                if (result instanceof Error) {
                    console.error(result.message);
                    return false;
                }
                else {
                    return StatusCode_enum_1.StatusCode.ACCEPTED;
                }
            }
            catch (err) {
                throw err;
            }
        });
    }
}
exports.default = KeyStorage;
//# sourceMappingURL=KeyStorage.js.map