import express from 'express';
import { Responses } from '../http/Responses';
import { StatusCode } from '../enums/StatusCode.enum';
import { StatusMessage } from '../enums/StatusMessage.enum';
import path from 'path';
import { serverConfig } from '../configs';
import fs from 'fs';

export class OpenaiFilesApi {
  constructor() {
    //
  }

  /**
   * Send uploaded file to OpenAI API
   *
   * @param req
   * @param res
   */
  async sendFile(req: express.Request, res: express.Response) {
    try {
      if (!req.file || !(req.file instanceof Object)) {
        return Responses.error(res,'File not uploaded.', StatusCode.INTERNAL_ERROR, StatusMessage.UPLOAD_ERROR);
      }

      const title = String(req.body.title);
      if (title === '') {
        return Responses.error(res,'Invalid document title', StatusCode.BAD_REQUEST, StatusMessage.BAD_REQUEST);
      }

      req.body.convert = req.body.convert === 'true' || false;

      const docName = String(req.body.title);
      const purpose = 'fine-tune';
      const ext = path.extname(req.file.originalname);
      let response;

      if (ext === '.jsonl') {
        const file = `${serverConfig.dataDir}/jsonl/${req.file.filename}.jsonl`;
        await fs.promises.writeFile(file, req.file.buffer);
        // @ts-ignore
        response = await this.proxy.uploadFile(fs.createReadStream(file), purpose);
      } else {
        if (req.body.convert === true) {
          // Code to handle conversion if `convert` input field exists and is `true`
          const textExtensionsRegex = /\.txt|\.(t|c)sv|\.log|\.xml|\.jsonl?|\.ya?ml|\.md|\.rtf|\.html?|\.tsx?|\.jsx?$/i;

          if (textExtensionsRegex.test(req.file.originalname)) {
            // @ts-ignore
            const jsonlFile = await this.proxy.txt2jsonl(req.file, docName);
            // @ts-ignore
            response = await this.proxy.uploadFile(fs.createReadStream(jsonlFile), purpose);
          }
        } else {
          return Responses.error(
            res,
            'Provided file is not JSONL and `convert` was not specified.',
            StatusCode.UNSUPPORTED_MEDIA_TYPE,
            StatusMessage.WRONG_FILE_TYPE
          );
        }
      }

      if (response.status === StatusCode.SUCCESS) {
        return Responses.success(
          res,
          { response: response.data, responseConfig: response.config.data },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
      }
    } catch (error) {
      console.error(error);
      return Responses.serverError(res);
    }
  }

  /**
   * A list of files that belong to the user's organization
   *
   * @param req
   * @param res
   */
  async listFiles(req: express.Request, res: express.Response) {
    try {
      // @ts-ignore
      const response = await this.proxy.openai.listFiles();

      if (response.status === StatusCode.SUCCESS) {
        return Responses.success(
          res,
          { response: response.data, responseConfig: response.config.data },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
      }
    } catch (err: any) {
      console.log(err);
      return Responses.serverError(res);
    }
  }

  /**
   * Delete file from OpenAI storage
   *
   * @param req
   * @param res
   */
  async deleteFile(req: express.Request, res: express.Response) {
    const fileId = String(req.params.file_id);
    let response;

    // TODO: Add input validation

    try {
      // @ts-ignore
      response = await this.proxy.deleteFile(fileId);

      if (response.status === StatusCode.SUCCESS) {
        return Responses.success(
          res,
          { response: response.data, responseConfig: response.config.data },
          StatusMessage.RECEIVED_OPENAI_API_RESPONSE
        );
      }
    } catch (err: any) {
      if (err.message === 'Request failed with status code 404') {
        return Responses.error(
          res,
          'File not found.',
          StatusCode.NOT_FOUND,
          StatusMessage.NOT_FOUND,
        );
      }

      console.log(err);
      return Responses.serverError(res);
    }
  }

}
