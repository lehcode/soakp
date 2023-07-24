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

          new Promise(async () => {
            await fs.promises.readFile(jsonlFilePath, 'utf8');
            resolve(jsonlFilePath);
          });
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /**
   * Parse JSON file to JSON object
   *
   * @param jsonl
   */
  async parseJSONL(jsonl: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        // const jsonlParser = jsonlines.parse();
        const dataObj: any[] = [];

        // Split the jsonl string into lines
        const lines = jsonl.split('\n');

        lines.forEach(line => {
          // Parse each line to a JavaScript object and add it to the dataObj array
          try {
            const data = JSON.parse(line);
            dataObj.push(data);
          } catch (err) {
            console.log('Invalid JSON line:', line);
          }
        });

        resolve(dataObj);
      } catch (err) {
        console.log(`Error parsing JSONL: ${err}`);
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
   * Get single model information by ID
   *
   * @param modelId
   */
  async getModel(modelId: string) {
    return await this.openai.retrieveModel(modelId);
  }

  /**
   * Get single file information by ID
   *
   * @param fileId
   */
  async getFileInfo(fileId: string) {
    return await this.openai.retrieveFile(fileId);
  }

  /**
   * Download file by it's ID from OpenAI storage
   *
   * @param fileId
   */
  async getFileData(fileId: string) {
    return await this.openai.downloadFile(fileId);
  }

  /**
   * Create model fine-tune job
   *
   * @param fileId
   */
  async createFineTune(fileId: string) {
    return await this.openai.createFineTune({
      /**
       * The ID of an uploaded file that contains training data.
       *
       * @type {string}
       */
      training_file: fileId,
      /**
       * The name of the base model to fine-tune.
       * You can select one of "ada", "babbage","curie", "davinci",
       * or a fine-tuned model created after 2022-04-21.
       *
       * @type {string}
       */
      model: 'davinci'
    });
  }

  /**
   * List your organization's fine-tuning jobs
   */
  async listFineTunes() {
    return await this.openai.listFineTunes();
  }

  /**
   * Retrieve fine-tune. Gets full info about the fine-tune job by its ID.
   *
   * @param fineTuneJobId
   */
  async getFineTuneJob(fineTuneJobId: string) {
    return await this.openai.retrieveFineTune(fineTuneJobId);
  }

  /**
   * List fine-tune events. Get fine-grained status updates for a fine-tune job.
   *
   * @param jobId
   */
  async getFineTuneJobEvents(jobId: string) {
    return await this.openai.listFineTuneEvents(jobId);
  }

  /**
   * Delete fine-tune model. Delete a fine-tuned model. You must have the Owner role in your organization.
   *
   * @param modelId
   */
  async deleteFineTuneModel(modelId: string) {
    return await this.openai.deleteModel(modelId);
  }

  /**
   * Cancel fine-tune. Immediately cancel a fine-tune job.
   *
   * @param jobId
   */
  async cancelFineTuneJob(jobId: string) {
    return await this.openai.cancelFineTune(jobId);
  }
}
