"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Responses = void 0;
const StatusCode_enum_1 = require("../enums/StatusCode.enum");
const Message_enum_1 = require("../enums/Message.enum");
class Responses {
    /**
     *
     * @param res
     */
    static jwtNotSaved(res) {
        return res.status(StatusCode_enum_1.StatusCode.INTERNAL_ERROR).json({
            status: Message_enum_1.Message.INTERNAL_SERVER_ERROR,
            message: Message_enum_1.Message.JWT_NOT_SAVED
        });
    }
    /**
     *
     * @param res
     */
    static unknownError(res) {
        return Responses.serverError(res);
    }
    /**
     *
     * @param res
     * @param token
     */
    static loadedToken(res, token) {
        return res
            .status(StatusCode_enum_1.StatusCode.SUCCESS)
            .json({
            status: Message_enum_1.Message.SUCCESS,
            message: Message_enum_1.Message.LOADED_JWT_TOKEN,
            data: token
        });
    }
    /**
     *
     * @param res
     */
    static invalidJwt(res) {
        return res.status(StatusCode_enum_1.StatusCode.BAD_REQUEST).json({
            status: Message_enum_1.Message.WRONG_REQUEST,
            message: Message_enum_1.Message.INVALID_JWT
        });
    }
    /**
     *
     * @param res
     * @param what
     */
    static notAuthorized(res, what) {
        switch (what) {
            case 'key':
                return res.status(StatusCode_enum_1.StatusCode.NOT_AUTHORIZED).json({
                    status: Message_enum_1.Message.NOT_AUTHORIZED,
                    message: Message_enum_1.Message.INVALID_KEY
                });
            case 'jwt':
                return res.status(StatusCode_enum_1.StatusCode.NOT_AUTHORIZED).json({
                    status: Message_enum_1.Message.NOT_AUTHORIZED,
                    message: Message_enum_1.Message.INVALID_JWT
                });
            default:
                return res.status(StatusCode_enum_1.StatusCode.NOT_AUTHORIZED).json({
                    status: Message_enum_1.Message.INTERNAL_SERVER_ERROR,
                    message: Message_enum_1.Message.UNKNOWN_ERROR
                });
        }
    }
    /**
     *
     * @param res
     * @param data
     * @param msg
     */
    static success(res, data, msg) {
        res.status(StatusCode_enum_1.StatusCode.SUCCESS).json({ status: Message_enum_1.Message.SUCCESS, message: msg, data: data });
    }
    /**
     *
     * @param res
     */
    static serverError(res) {
        return res.status(StatusCode_enum_1.StatusCode.INTERNAL_ERROR)
            .json({
            status: Message_enum_1.Message.INTERNAL_SERVER_ERROR,
            message: Message_enum_1.Message.INTERNAL_SERVER_ERROR
        });
    }
    static tokenAdded(res, token) {
        return res.status(StatusCode_enum_1.StatusCode.SUCCESS).json({
            status: Message_enum_1.Message.SUCCESS,
            message: Message_enum_1.Message.JWT_ADDED,
            data: { jwt: token }
        });
    }
    static tokenUpdated(res, token) {
        return res.status(StatusCode_enum_1.StatusCode.ACCEPTED).json({
            status: StatusCode_enum_1.StatusCode.ACCEPTED,
            message: Message_enum_1.Message.JWT_UPDATED,
            data: { jwt: token }
        });
    }
}
exports.Responses = Responses;
//# sourceMappingURL=Responses.js.map