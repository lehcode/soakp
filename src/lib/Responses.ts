import { StatusCode } from '../enums/StatusCode.enum';
import { StatusMessage } from '../enums/StatusMessage.enum';
import express from 'express';

export interface ResponseInterface {
  status: undefined | StatusCode;
  message: undefined | StatusMessage;
  data: undefined | null | [];
}

/**
 * Pre-defined HTTP responses and templates
 */
export class Responses {
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

  /**
   * Unknown server error
   *
   * @param res
   * @param msg
   */
  static unknownServerError(res: express.Response, msg?: string) {
    return res.status(StatusCode.INTERNAL_ERROR)
      .json({
        status: StatusMessage.INTERNAL_SERVER_ERROR,
        message: msg || StatusMessage.INTERNAL_SERVER_ERROR,
      });
  }
}
