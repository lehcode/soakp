/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai';
import * as readline from 'readline';
import fs, { promises } from 'fs';
import path from 'path';
import jsonlines from 'jsonlines';
import { Stream } from 'stream';
import { serverConfig } from './configs';
import { StatusMessage } from './enums/StatusMessage.enum';
import { StatusCode } from './enums/StatusCode.enum';

/**
 * @class SoakpProxy
 */
export class SoakpProxy {
  /**
   * OpenAI API
   *
   * @private
   */
  private openai: OpenAIApi;

  /**
   * @constructor
   */
  constructor() {
    //
  }

  /**
   *
   * @param config
   */
  initOpenai(config: Configuration) {
    const configuration = new Configuration({
      apiKey: config.apiKey || '',
      organization: config.organization || null
    });
    this.openai = new OpenAIApi(configuration);

    if (process.env.NODE_ENV === 'production') {
      console.log(`${StatusMessage.INITIALIZED_SOAKP_PROXY_WITH_API_KEY} '[scrubbed]'`);
    } else {
      // const sub = config.apiKey.substring(0, Math.round(config.apiKey.length/2));
      console.log(`${StatusMessage.INITIALIZED_SOAKP_PROXY_WITH_API_KEY} '[scrubbed]'`);
    }
  }

  /**
   *
   * Make OpenAI API call
   */
  async chatRequest(request: CreateChatCompletionRequest) {
    try {
      return await this.openai.createChatCompletion(request);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get list of OpenAI models with properties
   */
  async listModels() {
    return await this.openai.listModels();
  }

  /**
   * Upload a file that contains document(s) to be used across various
   * endpoints/features. Currently, the size of all the files uploaded by one
   * organization can be up to 1 GB.
   * Please contact us if you need to increase the storage limit.
   * Purpose can be 'answers' or 'fine-tune'
   *
   * @param file
   * @param purpose
   */
  async uploadFile(file: any, purpose?: string) {
    return await this.openai.createFile(file, purpose);
  }

  /**
   *
   * @param txtFile
   * @param title
   */
  async txt2jsonl(txtFile: Record<string, any>, title: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const buffer = Buffer.from(txtFile.buffer);
        const basename = path.basename(txtFile.originalname);
        const readableStream = new Stream.Readable();
        readableStream.push(buffer);
        readableStream.push(null);

        const jsonlFilePath = path.resolve(`${serverConfig.dataDir}/jsonl/${basename}.jsonl`);
        const writeStream = fs.createWriteStream(jsonlFilePath);
        const stringify = jsonlines.stringify();

        const readStream = readline.createInterface({
          input: readableStream,
          output: process.stdout,
          terminal: false
        });

        stringify.pipe(process.stdout);
        stringify.pipe(writeStream);

        readStream.on('line', (line) => {
          if (line !== '') {
            // Convert the line to a JSON object
            stringify.write({ prompt: `${line}\\n\\n###\\n\\n`, completion: ` ${title} END` });
          }
        });

        readStream.on('close', () => {
          // Signal the end of the stringify stream
          stringify.end();
        });

        writeStream.on('finish', () => {
          console.log('Done converting buffer to .jsonl');

          fs.readFile(jsonlFilePath, 'utf8', (err, data) => {
            resolve(jsonlFilePath);
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Delete file from OpenAI storage
   *
   * @param fileId
   */
  async deleteFile(fileId: string) {
    return await this.openai.deleteFile(fileId);
  }

  /**
   * Single model prperties
   *
   * @param modelId
   */
  async getModel(modelId: string) {
    return await this.openai.retrieveModel(modelId);
  }
}
