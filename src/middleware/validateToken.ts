import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { Message } from '../enums/Message.enum';
import { KeyStorage } from '../KeyStorage';

const validateToken = (key: string, storage: KeyStorage) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Assuming the token is provided in the "Authorization" header as "Bearer <token>"
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: Message.INVALID_JWT });
    }

    try {
      const decoded = jwt.verify(token, key);
      storage.getRecentToken().then(token => {
        if (token === decoded.token) {
          return res.status(200).json({ message: Message.JWT_ACCEPTED });
        } else {
          storage.saveToken(decoded.token);
        }
      });

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: Message.INVALID_JWT });
    }
  };
};

export default validateToken;
