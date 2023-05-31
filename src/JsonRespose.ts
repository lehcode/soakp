/**
 * Author: Anton Repin<53556648+lehcode@users.noreply.github.com>
 * Copyright: (C)2023.
 */

import express from 'express';
import { Messages } from './enums/Messages';

/**
 * JSON responses for convenience and consistency
 */
class JsonResponse {
  /**
   *
   * @param status
   * @param data
   */
  public static getText(status: number, data?: Record<string, any>): Record<string, any> {
    let json = {};

    switch (status) {
      default:
        json = { status: 'error', message: Messages.UNKNOWN_ERROR };
        break;
      case 500:
        json = { status: 'error', message: Messages.INTERNAL_SERVER_ERROR };
        break;
      case 401:
        json = { status: 'error', message: Messages.NOT_AUTHORIZED_ERROR };
        break;
      case 200:
        json = { status: 'success', message: Messages.SUCCESS, content: data };
        break;
      case 201:
        json = { status: 'success', message: Messages.CREATED, content: data };
        break;
    }

    return json;
  }

  /**
   *
   * @param err Error message
   * @param res express.Response
   */
  public static err500(err: string, res: express.Response): void {
    const status = 500;
    console.error(err);
    res.status(status).json(JsonResponse.getText(status));
  }
}

export { JsonResponse };
