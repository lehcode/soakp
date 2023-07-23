import { UserInterface } from '../interfaces/User.interface';
import { SoakpProxy } from '../SoakpProxy';

export {};

declare global {
  namespace Express {
    interface Request {
      user: UserInterface;
      proxy: SoakpProxy;
      file: Record<string, any>;
      // Whether to convert uploaded file to JSONL format
      convert: boolean;
    }
  }
}
