"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
var Message;
(function (Message) {
    Message["CREATED"] = "Created";
    Message["FOUND"] = "Found";
    Message["INTERNAL_SERVER_ERROR"] = "Internal server error";
    Message["INVALID_KEY"] = "Incorrect key supplied";
    Message["INVALID_KEY_STORAGE"] = "Invalid key storage";
    Message["INVALID_OPENAI_KEY"] = "OpenAI API key validation failed";
    Message["INVALID_JWT"] = "JWT validation failed";
    Message["JWT_ACCEPTED"] = "JWT accepted";
    Message["JWT_ADDED"] = "JWT added";
    Message["JWT_EXPIRED"] = "JWT expired";
    Message["JWT_NOT_FOUND"] = "JWT not found";
    Message["JWT_NOT_SAVED"] = "JWT not saved";
    Message["JWT_UPDATED"] = "JWT updated";
    Message["GATEWAY_ERROR"] = "Gateway error";
    Message["LOADED_JWT_TOKEN"] = "Loaded JWT token";
    Message["NOT_AUTHORIZED"] = "Not authorized";
    Message["NOT_FOUND"] = "Not found";
    Message["SUCCESS"] = "Success";
    Message["UNKNOWN_ERROR"] = "Unknown error";
    Message["WRONG_REQUEST"] = "Wrong Request";
})(Message || (exports.Message = Message = {}));
//# sourceMappingURL=Message.enum.js.map