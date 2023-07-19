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
exports.SoakpProxy = exports.ChatRole = void 0;
/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
const openai_1 = require("openai");
var ChatRole;
(function (ChatRole) {
    ChatRole["SYSTEM"] = "system";
    ChatRole["USER"] = "user";
    ChatRole["ASSISTANT"] = "assistant";
    ChatRole["FUNCTION"] = "function";
})(ChatRole || (exports.ChatRole = ChatRole = {}));
/**
 * @class SoakpProxy
 */
class SoakpProxy {
    /**
     * @constructor
     */
    constructor() {
        //
    }
    /**
     *
     * @param config
     */
    initAI(config) {
        const configuration = new openai_1.Configuration({
            apiKey: config.apiKey || '',
            organization: config.organization || null
        });
        this.openai = new openai_1.OpenAIApi(configuration);
        console.log(`Initialized Soakp proxy with API key '${config.apiKey}'`);
    }
    /**
     *
     * Make OpenAI API call
     */
    chatRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.openai.createChatCompletion(request);
            }
            catch (error) {
                throw error;
            }
        });
    }
    /**
     * Get list of OpenAI models with properties
     */
    listModels() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.openai.listModels();
        });
    }
}
exports.SoakpProxy = SoakpProxy;
//# sourceMappingURL=SoakpProxy.js.map