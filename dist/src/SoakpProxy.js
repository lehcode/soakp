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
exports.SoakpProxy = void 0;
/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
const openai_1 = require("openai");
class SoakpProxy {
    /**
     *
     * @param configuration
     */
    constructor(configuration) {
        this.query = {
            apiKey: null,
            apiOrgKey: process.env.OPENAI_API_ORG_ID,
            prompt: 'Hello World, Buddy! :-)',
            model: 'text-davinci-003'
        };
        this.config = Object.assign({}, configuration);
    }
    /**
     *
     * @param params
     */
    initAI(params) {
        const config = new openai_1.Configuration({
            apiKey: params.apiKey || '',
            organization: params.apiOrgKey || ''
        });
        this.openAI = new openai_1.OpenAIApi(config);
        console.log(`Initialized Soakp proxy with ${params.apiKey}`);
    }
    /**
     *
     * @param params
     */
    makeRequest(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                model: params.model,
                prompt: params.prompt,
                max_tokens: params.max_tokens,
                temperature: params.temperature
            };
            // @ts-ignore
            return yield this.openAI.createCompletion(request);
        });
    }
    /**
     *
     * @param value
     */
    set queryParams(value) {
        this.query = value;
    }
}
exports.SoakpProxy = SoakpProxy;
//# sourceMappingURL=SoakpProxy.js.map