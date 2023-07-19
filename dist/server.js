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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
const SoakpServer_1 = require("./src/SoakpServer");
const configs_1 = require("./src/configs");
const Message_enum_1 = require("./src/enums/Message.enum");
const KeyStorage_1 = require("./src/KeyStorage");
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storage = yield KeyStorage_1.KeyStorage.getInstance(configs_1.storageConfig);
        const server = new SoakpServer_1.SoakpServer(configs_1.serverConfig, storage);
        yield server.start();
        console.log(`Started Secure OpenAI Key Proxy with TLS on port ${configs_1.serverConfig.sslPort}.
Please provide support here: https://opencollective.com/soakp`);
    }
    catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        else if (typeof error === 'string') {
            throw new Error(error);
        }
        else {
            throw new Error(Message_enum_1.Message.UNKNOWN_ERROR);
        }
    }
});
startServer();
//# sourceMappingURL=server.js.map