"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
const SoakpServer_1 = require("./src/SoakpServer");
const config_1 = __importDefault(require("./src/config"));
const Message_enum_1 = require("./src/enums/Message.enum");
Promise.resolve(new SoakpServer_1.SoakpServer(config_1.default).start()).then(() => {
    console.log(`Started Secure OpenAI Key Proxy with TLS on port ${config_1.default.sslPort}.
Please provide support here: https://opencollective.com/soakp`);
}, (error) => {
    if (error instanceof Error) {
        throw error;
    }
    else if (typeof error === 'string') {
        throw new Error(error);
    }
    else {
        throw new Error(Message_enum_1.Message.UNKNOWN_ERROR);
    }
});
//# sourceMappingURL=server.js.map