import { UserInterface } from '../interfaces/User.interface';
import { SoakpProxy } from '../SoakpProxy';

export {};

declare global {
  namespace Express {
    interface Request {
      user: UserInterface;
      proxy?: SoakpProxy;
      files?: Express.Multer.File[],
      openaiFileId: string;
      titles: string[];
    }
  }
}
