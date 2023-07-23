import { Request, Response, NextFunction } from 'express';
import { StatusMessage } from '../enums/StatusMessage.enum';
import { DbSchemaInterface, KeyStorage } from '../KeyStorage';
import { StatusCode } from '../enums/StatusCode.enum';
import jwt from 'jsonwebtoken';
import { UserInterface } from '../interfaces/User.interface';

const validateToken = (jwtHash: string, storage: KeyStorage, user: UserInterface) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(StatusCode.NOT_AUTHORIZED).json({ message: StatusMessage.INVALID_JWT });
    }

    try {
      const existingTokens = await storage.getActiveTokens();
      const signed = storage.generateSignedJWT(req.body.key, jwtHash);
      const expiredTokenCleanup = async (token: string) => {
        await storage.deleteJwt(token);
        user.token = undefined;
        console.log(`Deleted JWT '${token.substring(0, 64)}...'`);
      };

      if (existingTokens instanceof Error || existingTokens.length === 0) {
        // No saved JWTs found, generate and save a new one
        console.log('No matching tokens found. Generating a new one.');
        await storage.saveToken(signed);
        // Responses.tokenAdded(res, signed);
        user.token = signed;
      } else {
        existingTokens.map(async (row: DbSchemaInterface) => {
          try {
            jwt.verify(row.token, jwtHash);
            console.log(`Verified JWT '${row.token.substring(0, 64)}...'`);
            user.token = row.token;
          } catch (err: any) {
            if ((err instanceof Error) && err.message === 'jwt expired') {
              console.log(`${StatusMessage.JWT_EXPIRED}.\nReplacing JWT '${row.token.substring(0, 64)}...'`);
              await storage.updateToken(row.token, signed);
              console.log(StatusMessage.JWT_UPDATED);
              await expiredTokenCleanup(row.token);
            }
          }
        });
      }

      next();
    } catch (err: any) {
      next(err.message);
    }
  };
};

export default validateToken;
