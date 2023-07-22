import { Request, Response, NextFunction } from 'express';
import { StatusMessage } from '../enums/StatusMessage.enum';
import { KeyStorage } from '../KeyStorage';
import { StatusCode } from '../enums/StatusCode.enum';
import jwt from 'jsonwebtoken';
import { Configuration } from 'openai';
import { SoakpProxy } from '../SoakpProxy';

const validateToken = (jwtHash: string, storage: KeyStorage) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(StatusCode.NOT_AUTHORIZED).json({ message: StatusMessage.INVALID_JWT });
    }

    try {
      const decodedToken = (await jwt.verify(token, jwtHash)) as { key: string };
      const recentToken = await storage.getRecentToken();
      let newToken;

      if (recentToken) {
        if (token === recentToken) {
          console.log('Found existing token');
          newToken = recentToken;
        } else {
          newToken = storage.generateSignedJWT(decodedToken.key, jwtHash);
          await storage.updateToken(recentToken, newToken);
          console.log('Supplied token invalidated. Generating new one.');
        }
      } else {
        newToken = storage.generateSignedJWT(decodedToken.key, jwtHash);
        await storage.saveToken(newToken);
        console.log('Saved new token');
      }

      req.user = { token: newToken, apiKey: decodedToken.key };

      next();
    } catch (error) {
      console.error(error);
      return res.status(StatusCode.INTERNAL_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  };
};

export default validateToken;
