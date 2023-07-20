import multer from 'multer';
import * as util from 'util';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { StatusCode } from '../enums/StatusCode.enum';
import { File } from 'buffer';

const uploadFile = () => {
  return async  (req: Request, res: Response, next: NextFunction) => {
    if (req.file === undefined) {
      return res.status(StatusCode.BAD_REQUEST).send({ message: 'File was not specified' });
    }
    
    try {
      const maxSize = 2 * 1024 * 1024;
      const storage = multer.diskStorage({
        destination: path.resolve(__basedir, '/uploads/'),
        filename: (req: express.Request, file: any, cb) => {
          console.log(file.originalname);
          cb(null, file.originalname);
        },
      });

      const uploadFile = multer({
        storage: storage,
        limits: { fileSize: maxSize },
      }).single('file');

      req.files.uploaded = util.promisify(uploadFile);

      // create the exported middleware object
      //     const uploadFileMiddleware = util.promisify(uploadFile);
      //     module.exports = uploadFileMiddleware;
    } catch (error) {
      throw error;
    }

    next();
  };
};

export default uploadFile;
