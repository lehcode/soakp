import { UserInterface } from '../interfaces/User.interface';
import { SoakpProxy } from '../SoakpProxy';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export {};

declare global {
  namespace Express {
    interface Request {
      user: UserInterface;
      proxy: SoakpProxy;
      userFiles: Record<string | Buffer, any>[];
      uploadedFile: RequestHandler<ParamsDictionary, any, any, ParsedQs, Record<string, any>>;
      // Whether to convert uploaded file to JSONL format
      convert: boolean;
    }
  }
}
