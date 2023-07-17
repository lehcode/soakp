import { UserInterface } from '../interfaces/User.interface';

export {};

declare global {
  namespace Express {
    interface Request {
      user: UserInterface;
    }
  }
}
