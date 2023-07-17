import { Request, Response, NextFunction } from 'express';
import { Message } from '../enums/Message.enum';
import { KeyStorage } from '../KeyStorage';
import { StatusCode } from '../enums/StatusCode.enum';
import { UserInterface } from '../interfaces/User.interface';
import jwt from 'jsonwebtoken';

const validateToken = (jwtHash: string, storage: KeyStorage) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Assuming the token is provided in the "Authorization" header as "Bearer <token>"
    const token = req.headers.authorization?.split(' ')[1];
    let apiKey;

    if (!token) {
      return res.status(StatusCode.NOT_AUTHORIZED).json({ message: Message.INVALID_JWT });
    }

    jwt.verify(token, jwtHash, (error, decoded: jwt.JwtPayload) => {
      storage
        .getRecentToken()
        .then(async (recentToken) => {
          if (recentToken) {
            if (token === recentToken) {
              console.log('Found existing token');

              if (error) {
                throw new Error(error.message);
              }

              req.user = <UserInterface>{
                token: recentToken,
                apiKey: decoded.key
              };
            }
          } else {
            const status = await storage.saveToken(token);
            console.log('Saved new token');

            if (status === StatusCode.CREATED) {
              req.user = <UserInterface>{
                token: recentToken,
                apiKey: recentToken
              };
            } else {
              return res.status(StatusCode.INTERNAL_ERROR)
                .json({ message: Message.INTERNAL_SERVER_ERROR });
            }
          }

          next();
        })
        .catch((error) => {
          throw new Error(error);
        });
    });
  };
};

export default validateToken;
