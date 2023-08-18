import { Request, Response, NextFunction } from 'express';
import { StatusMessage } from '../enums/StatusMessage.enum';
import { DbSchemaInterface, KeyStorage } from '../KeyStorage';
import { StatusCode } from '../enums/StatusCode.enum';
import jwt from 'jsonwebtoken';
import { UserInterface } from '../interfaces/User.interface';
import { Responses } from '../lib/Responses';

const validateToken = (jwtHash: string, storage: KeyStorage, user: UserInterface) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(StatusCode.NOT_AUTHORIZED).json({ message: StatusMessage.INVALID_JWT });
    }

    try {
      const existingTokens = await storage.getActiveTokens();
      // @ts-ignore
      user.apiKey = jwt.verify(token, jwtHash).key;
      const signed = storage.generateSignedJWT(user.apiKey, jwtHash);

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

            if (process.env.NODE_ENV === 'production') {
              console.log('Verified JWT \'[scrubbed]\'');
            } else {
              console.log(`Verified JWT '${row.token.substring(0, row.token.length/2)}[scrubbed]'`);
            }

            user.token = row.token;
          } catch (err: any) {
            const newToken = storage.generateSignedJWT(user.apiKey, jwtHash);

            if ((err instanceof Error) && err.message === 'jwt expired') {
              if (process.env.NODE_ENV === 'production') {
                console.log(`${StatusMessage.JWT_EXPIRED}.\nReplacing JWT '[scrubbed]'`);
              } else {
                const sub = row.token.substring(0, row.token.length/2);
                console.log(`${StatusMessage.JWT_EXPIRED}.\nReplacing JWT '${sub}[scrubbed]'`);
              }

              await storage.updateToken(row.token, newToken);
              console.log(StatusMessage.JWT_UPDATED);
              await expiredTokenCleanup(row.token);
              user.token = newToken;
            }
          }
        });
      }

      next();
    } catch (err: any) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  };
};

export default validateToken;
