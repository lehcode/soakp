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
const SoakpProxy_1 = require("../SoakpProxy");
const StatusCode_enum_1 = require("../enums/StatusCode.enum");
const Message_enum_1 = require("../enums/Message.enum");
const initAi = (server) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const proxy = new SoakpProxy_1.SoakpProxy();
            proxy.initAI({
                apiKey: req.user.apiKey,
                organization: req.user.orgId || null
            });
            server.proxy = proxy;
        }
        catch (error) {
            console.error(error);
            return res.status(StatusCode_enum_1.StatusCode.INTERNAL_ERROR).json({ message: Message_enum_1.Message.INTERNAL_SERVER_ERROR });
        }
        next();
    });
};
exports.default = initAi;
//# sourceMappingURL=initAi.js.map