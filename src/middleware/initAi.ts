import { NextFunction, Request, Response } from 'express';
import { SoakpProxy } from '../SoakpProxy';
import { Configuration } from 'openai';
import { SoakpServer } from '../SoakpServer';
import { StatusCode } from '../enums/StatusCode.enum';
import { Message } from '../enums/Message.enum';

const initAi = (server: SoakpServer) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const proxy = new SoakpProxy();
      proxy.initAI({
        apiKey: req.user.apiKey,
        organization: req.user.orgId || null
      } as Configuration);

      server.proxy = proxy;
    } catch (error) {
      console.error(error);
      return res.status(StatusCode.INTERNAL_ERROR).json({ message: Message.INTERNAL_SERVER_ERROR });
    }

    next();
  };
};

export default initAi;
