"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
                break;
            case 'jwt':
                return res.status(StatusCode_enum_1.StatusCode.NOT_AUTHORIZED).json({
                    status: Message_enum_1.Message.NOT_AUTHORIZED,
                    message: Message_enum_1.Message.INVALID_JWT
                });
                break;
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
exports.default = Responses;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVzcG9uc2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2h0dHAvUmVzcG9uc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsOERBQXNEO0FBQ3RELHdEQUFnRDtBQVNoRCxNQUFxQixTQUFTO0lBQzVCOzs7T0FHRztJQUNILE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBcUI7UUFDdEMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLDRCQUFVLENBQUMsY0FBYyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ2hELE1BQU0sRUFBRSxzQkFBTyxDQUFDLHFCQUFxQjtZQUNyQyxPQUFPLEVBQUUsc0JBQU8sQ0FBQyxhQUFhO1NBQy9CLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7O09BR0c7SUFDSCxNQUFNLENBQUMsWUFBWSxDQUFDLEdBQXFCO1FBQ3ZDLE9BQU8sU0FBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBcUIsRUFBRSxLQUFhO1FBQ3JELE9BQU8sR0FBRzthQUNQLE1BQU0sQ0FBQyw0QkFBVSxDQUFDLE9BQU8sQ0FBQzthQUMxQixJQUFJLENBQUM7WUFDSixNQUFNLEVBQUUsc0JBQU8sQ0FBQyxPQUFPO1lBQ3ZCLE9BQU8sRUFBRSxzQkFBTyxDQUFDLGdCQUFnQjtZQUNqQyxJQUFJLEVBQUUsS0FBSztTQUNaLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7O09BR0c7SUFDSCxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQXFCO1FBQ3JDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyw0QkFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUM3QyxNQUFNLEVBQUUsc0JBQU8sQ0FBQyxhQUFhO1lBQzdCLE9BQU8sRUFBRSxzQkFBTyxDQUFDLFdBQVc7U0FDN0IsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJ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