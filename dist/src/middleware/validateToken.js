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
const Message_enum_1 = require("../enums/Message.enum");
const StatusCode_enum_1 = require("../enums/StatusCode.enum");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validateToken = (jwtHash, storage) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return res.status(StatusCode_enum_1.StatusCode.NOT_AUTHORIZED).json({ message: Message_enum_1.Message.INVALID_JWT });
        }
        try {
            const decodedToken = (yield jsonwebtoken_1.default.verify(token, jwtHash));
            const recentToken = yield storage.getRecentToken();
            let newToken;
            if (recentToken) {
                if (token === recentToken) {
                    console.log('Found existing token');
                    newToken = recentToken;
                }
                else {
                    newToken = storage.generateSignedJWT(decodedToken.key, jwtHash);
                    yield storage.updateToken(recentToken, newToken);
                    console.log('Supplied token invalidated. Generating new one.');
                }
            }
            else {
                newToken = storage.generateSignedJWT(decodedToken.key, jwtHash);
                yield storage.saveToken(newToken);
                console.log('Saved new token');
            }
            req.user = { token: newToken, apiKey: decodedToken.key };
            next();
        }
        catch (error) {
            console.error(error);
            return res.status(StatusCode_enum_1.StatusCode.INTERNAL_ERROR).json({ message: Message_enum_1.Message.INTERNAL_SERVER_ERROR });
        }
    });
};
exports.default = validateToken;
//# sourceMappingURL=validateToken.js.map