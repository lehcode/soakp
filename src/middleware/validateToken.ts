import { Request, Response, NextFunction } from 'express';
import { Message } from '../enums/Message.enum';
import { KeyStorage } from '../KeyStorage';
import { StatusCode } from '../enums/StatusCode.enum';
import jwt from 'jsonwebtoken';

const validateToken = (jwtHash: string, storage: KeyStorage) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(StatusCode.NOT_AUTHORIZED).json({ message: Message.INVALID_JWT });
    }

    try {
      const decoded = (await jwt.verify(token, jwtHash)) as { key: string };
      const recentToken = await storage.getRecentToken();
      const signed = storage.generateSignedJWT(req.user.apiKey, jwtHash);

      if (recentToken) {
        if (token === recentToken) {
          console.log('Found existing token');
        } else {
          await storage.updateToken(token, signed);
          console.log('Supplied token invalidated. Generating new one.');
        }
      } else {
        await storage.saveToken(token);
        console.log('Saved new token');
      }

      req.user = { token, apiKey: decoded.key };

      next();
    } catch (error) {
      console.error(error);
      return res.status(StatusCode.INTERNAL_ERROR).json({ message: Message.INTERNAL_SERVER_ERROR });
    }
  };
};

export default validateToken;
