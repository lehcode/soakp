import express, { NextFunction } from 'express';

const extractFileId = () => {
  return async (req: express.Request, res: express.Response, next: NextFunction) => {
    req.openaiFileId = req.params.file_id;
    next();
  };
};

export default extractFileId;
