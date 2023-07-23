import { NextFunction, Request, Response } from 'express';
import { SoakpProxy } from '../SoakpProxy';
import { Configuration } from 'openai';
import { SoakpServer } from '../SoakpServer';
import { StatusCode } from '../enums/StatusCode.enum';
import { StatusMessage } from '../enums/StatusMessage.enum';

const initAi = (server: SoakpServer) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!server.proxy) {
        server.proxy = new SoakpProxy();
      }

      server.proxy.initOpenai({
        apiKey: server.getUser().apiKey,
        organization: server.getUser().orgId
      } as Configuration);

      next();
    } catch (error) {
      console.error(error);
      return res.status(StatusCode.INTERNAL_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  };
};

export default initAi;
