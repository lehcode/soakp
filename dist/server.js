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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QixvRUFBNEM7QUFDNUMsa0VBQTJEO0FBRTNELGdCQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7QUFFaEIsTUFBTSxRQUFRLEdBQUc7SUFDZixnQkFBZ0IsRUFBRSxZQUFZO0lBQzlCLE1BQU0sRUFBRSxVQUFVO0lBQ2xCLFNBQVMsRUFBRSxVQUFVO0lBQ3JCLFVBQVUsRUFBRSxJQUFJO0NBQ2pCLENBQUM7QUFFRixNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztBQUMvRyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDO0FBQ3hELE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxJQUFJLFFBQVEsQ0FBQyxTQUFTLENBQUM7QUFDakUsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUM7QUFDaEYsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUEyQixDQUFDO0FBRTVELE1BQU0sYUFBYSxHQUFHO0lBQ3BCLGdCQUFnQjtJQUNoQixHQUFHLEVBQUU7UUFDSCxNQUFNO1FBQ04sU0FBUztLQUNWO0NBQ0YsQ0FBQztBQUVGLE1BQU0sTUFBTSxHQUFHLElBQUkscUJBQVcsRUFBRSxDQUFDO0FBRWpDLFNBQWUsS0FBSzs7UUFDbEIsSUFBSTtZQUNGLE1BQU0sT0FBTyxHQUFHLE1BQU0sb0JBQVUsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3pFLElBQUk7Z0JBQ0YsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQzthQUN6QztZQUFDLE9BQU8sT0FBTyxFQUFFO2dCQUNoQixPQUFPLENBQUMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUNyRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ2pCO1NBQ0Y7UUFBQyxPQUFPLFVBQVUsRUFBRTtZQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzdELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDakI7SUFDSCxDQUFDO0NBQUE7QUFFRCxLQUFLLEVBQUUsQ0FBQyJ9