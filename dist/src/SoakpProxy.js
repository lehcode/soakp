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
const openai_1 = require("openai");
class SoakpProxy {
    /**
     *
     * @param configuration
     */
    constructor(configuration) {
        this.query = {
            apiKey: '',
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
    request(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                model: params.model,
                prompt: params.prompt,
                max_tokens: params.max_tokens,
                temperature: params.temperature
            };
            try {
                return yield this.openAI.createCompletion(request);
            }
            catch (error) {
                throw error;
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU29ha3BQcm94eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Tb2FrcFByb3h5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUNBLG1DQUFrRDtBQUdsRCxNQUFhLFVBQVU7SUFVckI7OztPQUdHO0lBQ0gsWUFBWSxhQUFtQztRQVh2QyxVQUFLLEdBQTJCO1lBQ3RDLE1BQU0sRUFBRSxFQUFFO1lBQ1YsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCO1lBQ3hDLE1BQU0sRUFBRSx5QkFBeUI7WUFDakMsS0FBSyxFQUFFLGtCQUFrQjtTQUMxQixDQUFDO1FBT0EsSUFBSSxDQUFDLE1BQU0scUJBQVEsYUFBYSxDQUFFLENBQUM7SUFDckMsQ0FBQztJQUVEOzs7T0FHRztJQUNILE1BQU0sQ0FBQyxNQUE4QjtRQUNuQyxNQUFNLE1BQU0sR0FBRyxJQUFJLHNCQUFhLENBQUM7WUFDL0IsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLElBQUksRUFBRTtZQUMzQixZQUFZLEVBQUUsTUFBTSxDQUFDLFNBQVMsSUFBSSxFQUFFO1NBQ3JDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxrQkFBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXBDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRDs7O09BR0c7SUFDRyxPQUFPLENBQUMsTUFBOEI7O1lBQzFDLE1BQU0sT0FBTyxHQUEyQjtnQkFDdEMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLO2dCQUNuQixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07Z0JBQ3JCLFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVTtnQkFDN0IsV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXO2FBQ2hDLENBQUM7WUFFRixJQUFJO2dCQUNGLE9BQU8sTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3BEO1lBQUMsT0FBTyxLQUFLLEVBQUU7Z0JBQ2QsTUFBTSxLQUFLLENBQUM7YUFDYjtRQUNILENBQUM7S0FBQTtJQUVEOzs7T0FHRztJQUNILElBQUksV0FBVyxDQUFDLEtBQTZCO1FBQzNDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQTFERCxnQ0EwREMifQ==