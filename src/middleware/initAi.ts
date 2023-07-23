import { NextFunction, Request, Response } from 'express';
import { SoakpProxy } from '../SoakpProxy';
import { Configuration } from 'openai';
import { SoakpServer } from '../SoakpServer';
import { StatusCode } from '../enums/StatusCode.enum';
import { StatusMessage } from '../enums/StatusMessage.enum';
import { openaiConfig } from '../configs';

const initAi = (server: SoakpServer) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!server.proxy) {
        server.proxy = new SoakpProxy();
      }

      server.proxy.initOpenai({
        apiKey: server.getUser().apiKey,
        organization: openaiConfig.orgId
      } as Configuration);

      next();
    } catch (error) {
      // console.error(error);
      next(error);
    }
  };
};

export default initAi;
