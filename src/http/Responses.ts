import { StatusCode } from '../enums/StatusCode.enum';
import { StatusMessage } from '../enums/StatusMessage.enum';
import express from 'express';

export interface ResponseInterface {
  status: undefined | StatusCode;
  message: undefined | StatusMessage;
  data: undefined | null | [];
}

export class Responses {
  /**
   *
   * @param res
   */
  static jwtNotSaved(res: express.Response) {
    return res.status(StatusCode.INTERNAL_ERROR).json({
      status: StatusMessage.INTERNAL_SERVER_ERROR,
      message: StatusMessage.JWT_NOT_SAVED
    });
  }

  /**
   *
   * @param res
   */
  static unknownError(res: express.Response) {
    return Responses.serverError(res);
  }

  /**
   *
   * @param res
   * @param token
   */
  static loadedToken(res: express.Response, token: string) {
    return res
      .status(StatusCode.SUCCESS)
      .json({
        status: StatusMessage.SUCCESS,
        message: StatusMessage.LOADED_JWT_TOKEN,
        data: token
      });
  }

  /**
   *
   * @param res
   */
  static invalidJwt(res: express.Response) {
    return res.status(StatusCode.BAD_REQUEST).json({
      status: StatusMessage.WRONG_REQUEST,
      message: StatusMessage.INVALID_JWT
    });
  }

  /**
   *
   * @param res
   * @param what
   */
  static notAuthorized(res: express.Response, what?: 'key' | 'jwt') {
    switch (what) {
      case 'key':
        return res.status(StatusCode.NOT_AUTHORIZED).json({
          status: StatusMessage.NOT_AUTHORIZED,
          message: StatusMessage.INVALID_KEY
        });
      case 'jwt':
        return res.status(StatusCode.NOT_AUTHORIZED).json({
          status: StatusMessage.NOT_AUTHORIZED,
          message: StatusMessage.INVALID_JWT
        });
      default:
        return res.status(StatusCode.NOT_AUTHORIZED).json({
          status: StatusMessage.INTERNAL_SERVER_ERROR,
          message: StatusMessage.UNKNOWN_ERROR
        });
    }
  }

  /**
   *
   * @param res
   * @param data
   * @param msg
   */
  static success(res: express.Response, data: Record<string, any>, msg: string) {
    res.status(StatusCode.SUCCESS).json({ status: StatusCode.SUCCESS, message: msg, data: data });
  }

  /**
   *
   * @param res
   */
  static serverError(res: express.Response) {
    return res.status(StatusCode.INTERNAL_ERROR)
      .json({
        status: StatusMessage.INTERNAL_SERVER_ERROR,
        message: StatusMessage.INTERNAL_SERVER_ERROR
      });
  }

  /**
   *
   * @param res
   * @param token
   */
  static tokenAdded(res: express.Response, token: string) {
    return res.status(StatusCode.SUCCESS).json({
      status: StatusMessage.SUCCESS,
      message: StatusMessage.JWT_ADDED,
      data: { jwt: token }
    });
  }

  /**
   *
   * @param res
   * @param token
   */
  static tokenUpdated(res: express.Response, token: string) {
    return res.status(StatusCode.ACCEPTED).json({
      status: StatusCode.ACCEPTED,
      message: StatusMessage.JWT_UPDATED,
      data: { jwt: token }
    });
  }

  /**
   *
   * @param res
   * @param token
   */
  static tokenAccepted(res: express.Response, token: string) {
    return res.status(StatusCode.ACCEPTED).json({
      status: StatusCode.ACCEPTED,
      message: StatusMessage.JWT_ACCEPTED,
      data: { jwt: token }
    });
  }

  /**
   *
   * @param res
   */
  static gatewayError(res: express.Response) {
    return res.status(StatusCode.BAD_GATEWAY)
      .json({
        status: StatusMessage.GATEWAY_ERROR,
        message: StatusMessage.GATEWAY_ERROR
      });
  }

  /**
   *
   * @param res
   * @param msg
   * @param statusCode
   * @param statusMessage
   */
  static error(res: express.Response, msg: string, statusCode?: StatusCode, statusMessage?: StatusMessage) {
    return res.status(statusCode || StatusCode.INTERNAL_ERROR)
      .json({
        status: statusMessage || StatusMessage.UNKNOWN_ERROR,
        message: msg || StatusMessage.UNKNOWN_ERROR,
      });
  }
}
