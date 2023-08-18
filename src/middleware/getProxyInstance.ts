import { NextFunction, Request, Response } from 'express';
import { SoakpProxy } from '../SoakpProxy';
import { Configuration } from 'openai';
import { SoakpServer } from '../SoakpServer';
import { StatusCode } from '../enums/StatusCode.enum';
import { StatusMessage } from '../enums/StatusMessage.enum';
import { openaiConfig } from '../configs';

const getProxyInstance = (ctx: SoakpServer) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!ctx.proxy) {
        ctx.proxy = new SoakpProxy();
      }

      ctx.proxyService.initOpenai({
        apiKey: ctx.getUser().apiKey,
        organization: openaiConfig.orgId
      } as Configuration);

      next();
    } catch (error: any) {
      // console.error(error);
      next(error);
    }
  };
};

export default getProxyInstance;
