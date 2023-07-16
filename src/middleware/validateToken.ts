import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { Message } from '../enums/Message.enum';
import { KeyStorage } from '../KeyStorage';
import { StatusCode } from '../enums/StatusCode.enum';

const validateToken = (jwtHash: string, storage: KeyStorage) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Assuming the token is provided in the "Authorization" header as "Bearer <token>"
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(StatusCode.NOT_AUTHORIZED).json({ message: Message.INVALID_JWT });
    }

    try {
      const verified = <jwt.Jwt>jwt.verify(token, jwtHash);

      storage.getRecentToken().then( async(recentToken) => {
        if (recentToken) {
          if (token === recentToken) {
            console.log('Found existing token');
            req.user.token = recentToken;
          }
        } else {
          const status = await storage.saveToken(token);
          console.log('Accepted and saved new token');

          if (status === StatusCode.CREATED) {
            req.user.token = token;
          } else {
            return res.status(StatusCode.INTERNAL_ERROR).json({ message: Message.INTERNAL_SERVER_ERROR });
          }
        }

        next();
      });
    } catch (error) {
      console.log(error);
      return res.status(StatusCode.INTERNAL_ERROR).json({ message: Message.INTERNAL_SERVER_ERROR });
    }
  };
};

export default validateToken;
