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
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const SoakpServer_1 = __importDefault(require("./src/SoakpServer"));
const KeyStorage_1 = __importDefault(require("./src/KeyStorage"));
dotenv_1.default.config();
const fallback = {
    dataFileLocation: './fallback',
    dbName: 'fallback',
    tableName: 'fallback',
    serverPort: 3033
};
const dataFileLocation = process.env.DATA_DIR ? path_1.default.resolve(process.env.DATA_DIR) : fallback.dataFileLocation;
const dbName = process.env.SQLITE_DB || fallback.dbName;
const tableName = process.env.SQLITE_TABLE || fallback.tableName;
const serverPort = parseInt(process.env.SERVER_PORT, 10) || fallback.serverPort;
const storageType = process.env.STORAGE_TYPE;
const storageConfig = {
    dataFileLocation,
    sql: {
        dbName,
        tableName
    }
};
const server = new SoakpServer_1.default();
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const storage = yield KeyStorage_1.default.getInstance(storageType, storageConfig);
            try {
                yield server.start(serverPort, storage);
            }
            catch (initErr) {
                console.error('Error initializing server:', initErr);
                process.exit(1);
            }
        }
        catch (storageErr) {
            console.error('Error getting storage instance:', storageErr);
            process.exit(1);
        }
    });
}
start();
//# sourceMappingURL=server.js.map