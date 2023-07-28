/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai';
import fs, { promises } from 'fs';
import path from 'path';
import { serverConfig } from './configs';
import { StatusMessage } from './enums/StatusMessage.enum';
import Stream, { Readable } from 'stream';
import jsonlines from 'jsonlines';
import readline from 'readline';
import { LineParser } from './lib/LineParser';
import { mergeMap, toArray } from 'rxjs/operators';
import { from, Observable, bindNodeCallback } from 'rxjs';

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
    try {
      return await this.openai.createFile(file, purpose);
    } catch (err: any) {
      console.log(err);
      if (err instanceof TypeError) {
        throw new Error(err.message);
      }
    }

  }

  /**
   *
   * @param txtFile
   * @param completion
   */
  async txt2Jsonlines(txtFile: Record<string, any>, completion: string): Promise<Record<string, string>> {
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
        let lineNumber = 0;

        readStream.on('line', (line) => {
          lineNumber++;
          if (line !== '') {
            const cleanLine = line.replace(/^\s+/, '');

            // Convert the line to a JSON object
            stringify.write({ prompt: `${cleanLine}\\n\\n###\\n\\n`, completion: ` ${completion} END` }, (err) => {
              if (err) {
                reject(err);
              }
            });
          }
        });

        readStream.on('close', () => {
          // Signal the end of the stringify stream
          stringify.end();
        });

        writeStream.on('finish', () => {
          console.log('Done converting buffer to .jsonl');

          new Promise(async () => {
            const jsonlData = await fs.promises.readFile(jsonlFilePath, 'utf8');
            resolve({
              file: jsonlFilePath,
              data: jsonlData
            });
          });
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /**
   * Concatenate array of files into single JSONL file suitable for OpenAI mdodel fine-tuning
   *
   * @param txtFiles
   * @param completions
   * @param concatBaseName?
   */
  async concatTxt2Jsonlines(
    txtFiles: Express.Multer.File[] | { [p: string]: Express.Multer.File[] },
    completions: string[],
    concatBaseName?: string
  ) {
    return new Promise<Express.Multer.File>((resolve, reject) => {
      try {
        const jsonlFileName = concatBaseName || `concatenated-${Date.now()}.jsonl`;
        const jsonlFilePath = path.resolve(
          `${serverConfig.dataDir}/jsonl/${jsonlFileName}.jsonl`
        );
        const writeStream = fs.createWriteStream(jsonlFilePath);
        const stringify = jsonlines.stringify();

        stringify.pipe(writeStream);

        const txtFilesArray = Array.isArray(txtFiles) ? txtFiles : Object.values(txtFiles);

        from(txtFilesArray).pipe(
          // @ts-ignore
          mergeMap((txtFile: Express.Multer.File, index: number) => {
            const buffer = Buffer.from(txtFile.buffer);
            const readableStream = new Readable();
            readableStream.push(buffer);
            readableStream.push(null);

            return this.readableStreamToObservable(readableStream).pipe(
              mergeMap((lineBuffer: Buffer) => {
                const line = lineBuffer.toString('utf8');
                if (line.trim() !== '') {
                  const cleanedLine = LineParser.cleanup(line);
                  return bindNodeCallback(stringify.write.bind(stringify))({
                    prompt: `${cleanedLine}\n\n###\n\n`,
                    completion: ` ${completions[index]} END`
                  });
                }
              })
            );
          })
        )
          .subscribe({
            complete: () => {
              stringify.end();
            },
            error: (err) => {
              console.log(err);
              reject(err);
            }
          });

        writeStream.on('finish', async () => {
          console.log(`Done concatenating files to ${jsonlFileName}`);

          try {
            const jsonlData = await fs.promises.readFile(jsonlFilePath);
            // @ts-ignore
            const concatenatedFile: Express.Multer.File = {
              ...txtFilesArray[0],
              mimetype: 'application/json',
              originalname: jsonlFileName,
              buffer: jsonlData,
              path: jsonlFilePath
            };
            resolve(concatenatedFile);
          } catch (err) {
            reject(err);
          }
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /**
   *
   * @param readStream
   */
  readableStreamToObservable(readStream: NodeJS.ReadableStream): Observable<Buffer> {
    return from(readStream).pipe(
      mergeMap((chunk: Buffer | string | null) => {
        if (chunk === null) {
          // Signal the end of the stream
          return;
        } else if (Buffer.isBuffer(chunk)) {
          return [chunk];
        } else if (typeof chunk === 'string') {
          return [Buffer.from(chunk, 'utf8')];
        } else {
          throw new Error('Unsupported chunk type.');
        }
      })
    );
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

        lines.forEach((line) => {
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
