"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusCode = void 0;
var StatusCode;
(function (StatusCode) {
    StatusCode[StatusCode["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    StatusCode[StatusCode["CREATED"] = 201] = "CREATED";
    StatusCode[StatusCode["FORBIDDEN"] = 403] = "FORBIDDEN";
    StatusCode[StatusCode["INTERNAL_ERROR"] = 500] = "INTERNAL_ERROR";
    StatusCode[StatusCode["NO_CONTENT"] = 204] = "NO_CONTENT";
    StatusCode[StatusCode["NOT_FOUND"] = 404] = "NOT_FOUND";
    StatusCode[StatusCode["NOT_AUTHORIZED"] = 401] = "NOT_AUTHORIZED";
    StatusCode[StatusCode["SUCCESS"] = 200] = "SUCCESS";
    StatusCode[StatusCode["ACCEPTED"] = 202] = "ACCEPTED";
})(StatusCode || (exports.StatusCode = StatusCode = {}));
//# sourceMappingURL=StatusCode.enum.js.map