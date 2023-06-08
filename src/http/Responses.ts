import { StatusCode } from '../enums/StatusCode.enum';
import { Message } from '../enums/Message.enum';
import express from 'express';

export interface ResponseInterface {
  status: undefined | StatusCode;
  message: undefined | Message;
  data: undefined | null | [];
}

export default class Responses {
  /**
   *
   * @param res
   */
  static jwtNotSaved(res: express.Response) {
    return res.status(StatusCode.INTERNAL_ERROR).json({
      status: Message.INTERNAL_SERVER_ERROR,
      message: Message.JWT_NOT_SAVED
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
        status: Message.SUCCESS,
        message: Message.LOADED_JWT_TOKEN,
        data: token
      });
  }

  /**
   *
   * @param res
   */
  static invalidJwt(res: express.Response) {
    return res.status(StatusCode.BAD_REQUEST).json({
      status: Message.WRONG_REQUEST,
      message: Message.INVALID_JWT
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
          status: Message.NOT_AUTHORIZED,
          message: Message.INVALID_KEY
        });
      case 'jwt':
        return res.status(StatusCode.NOT_AUTHORIZED).json({
          status: Message.NOT_AUTHORIZED,
          message: Message.INVALID_JWT
        });
      default:
        return res.status(StatusCode.NOT_AUTHORIZED).json({
          status: Message.INTERNAL_SERVER_ERROR,
          message: Message.UNKNOWN_ERROR
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
    res.status(StatusCode.SUCCESS).json({ status: Message.SUCCESS, message: msg, data: data });
  }

  /**
   *
   * @param res
   */
  static serverError(res: express.Response) {
    return res.status(StatusCode.INTERNAL_ERROR)
    .json({
      status: Message.INTERNAL_SERVER_ERROR,
      message: Message.INTERNAL_SERVER_ERROR
    });
  }

  static tokenAdded(res: express.Response, token: string) {
    return res.status(StatusCode.SUCCESS).json({
      status: Message.SUCCESS,
      message: Message.JWT_ADDED,
      data: { jwt: token }
    });
  }

  static tokenUpdated(res: express.Response, token: string) {
    return res.status(StatusCode.ACCEPTED).json({
      status: StatusCode.ACCEPTED,
      message: Message.JWT_UPDATED,
      data: { jwt: token }
    });
  }
}
