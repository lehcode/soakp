import multer from 'multer';
import { NextFunction, Request, Response } from 'express';
import { StatusCode } from '../enums/StatusCode.enum';
import { Responses } from '../http/Responses';
import { StatusMessage } from '../enums/StatusMessage.enum';

const uploadFile = () => {
  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    limits: { files: 1, fileSize: 5 * 1024 * 1024 }
  }).single('file');

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      multer().none();
      upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
          console.error(err);
          return Responses.error(res, err.message, StatusCode.BAD_REQUEST, StatusMessage.UPLOAD_ERROR);
        } else if (err) {
          console.error(err);
          return Responses.error(res, err.message, StatusCode.UNSUPPORTED_MEDIA_TYPE, StatusMessage.WRONG_FILE_TYPE);
        }

        // File was uploaded successfully
        req.documentFile = req.file;

        next();
      });
      // @ts-ignore
    } catch (error: Error) {
      return Responses.error(res, error.message, StatusCode.INTERNAL_ERROR, StatusMessage.INTERNAL_SERVER_ERROR);
    }
  };
};

export default uploadFile;
