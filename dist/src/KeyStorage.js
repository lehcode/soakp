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
        this.config = Object.assign({}, configuration);
        this.type = type;
    }
    static getInstance(storageType, config) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const keyStorageInstance = new KeyStorage(storageType, config);
            const sqliteFile = path_1.default.resolve(config.dataFileLocation, `./${(_a = config.sql) === null || _a === void 0 ? void 0 : _a.dbName}`);
            try {
                keyStorageInstance.backend = yield SQLite_1.default.getInstance((_b = config.sql) === null || _b === void 0 ? void 0 : _b.dbName, (_c = config.sql) === null || _c === void 0 ? void 0 : _c.tableName, sqliteFile);
            }
            catch (err) {
                throw err;
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
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const row = yield this.backend.findOne('token', [`token = ${jwtToken}`, 'archived != 1']);
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
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const row = yield this.backend.findOne('token', ['archived != 1', `token = ${jwtToken}`]);
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
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.backend.findAll('token');
            }
            catch (err) {
                throw err;
            }
        });
    }
    getRecentToken() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.backend.findOne();
                if (result instanceof Error) {
                    console.error(result.message);
                    return false;
                }
                else {
                    return result.token;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiS2V5U3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9LZXlTdG9yYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdEQUF3QjtBQUN4QiwrREFBOEM7QUFDOUMsNkRBQXFEO0FBV3JELElBQVksV0FJWDtBQUpELFdBQVksV0FBVztJQUNyQix3Q0FBeUIsQ0FBQTtJQUN6QixvQ0FBcUIsQ0FBQTtJQUNyQix3Q0FBeUIsQ0FBQTtBQUMzQixDQUFDLEVBSlcsV0FBVywyQkFBWCxXQUFXLFFBSXRCO0FBRUQsTUFBcUIsVUFBVTtJQUs3QixZQUFZLElBQWlCLEVBQUUsYUFBcUM7UUFDbEUsSUFBSSxDQUFDLE1BQU0scUJBQVEsYUFBYSxDQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDbkIsQ0FBQztJQUVELE1BQU0sQ0FBTyxXQUFXLENBQUMsV0FBd0IsRUFBRSxNQUE4Qjs7O1lBQy9FLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxVQUFVLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQy9ELE1BQU0sVUFBVSxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFFLEtBQUssTUFBQSxNQUFNLENBQUMsR0FBRywwQ0FBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBRXBGLElBQUk7Z0JBQ0Ysa0JBQWtCLENBQUMsT0FBTyxHQUFHLE1BQU0sZ0JBQWEsQ0FBQyxXQUFXLENBQUMsTUFBQSxNQUFNLENBQUMsR0FBRywwQ0FBRSxNQUFNLEVBQUUsTUFBQSxNQUFNLENBQUMsR0FBRywwQ0FBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7YUFDckg7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixNQUFNLEdBQUcsQ0FBQzthQUNYO1lBRUQsT0FBTyxrQkFBa0IsQ0FBQzs7S0FDM0I7SUFFSyxTQUFTLENBQUMsUUFBZ0I7O1lB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