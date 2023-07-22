/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai';
import * as readline from 'readline';
import fs from 'fs';
import path from 'path';
import * as jsonlines from 'jsonlines';
import { Stream } from 'stream';

export enum ChatRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  FUNCTION = 'function'
}

/**
 * @class SoakpProxy
 */
export class SoakpProxy {
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
  initAI(config: Configuration) {
    const configuration = new Configuration({
      apiKey: config.apiKey || '',
      organization: config.organization || null
    });
    this.openai = new OpenAIApi(configuration);

    console.log(`Initialized Soakp proxy with API key '${config.apiKey}'`);
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
  async uploadFile(file: File, purpose?: string) {
    return await this.openai.createFile(file, purpose);
  }

  async txt2jsonl(txtFile: any, title: string) {
    const buffer = Buffer.from(txtFile.buffer.data);
    const basename = path.basename(txtFile.originalname);
    const readableStream = new Stream.Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    const readStream = readline.createInterface({
      input: readableStream,
      output: process.stdout,
      terminal: false
    });
    const writeStream = fs.createWriteStream(`${basename}.jsonl`);
    const jsonlStringify = jsonlines.stringify();

    readStream.on('line', (line) => {
      // convert the line to a JSON object
      jsonlStringify.write({ prompt: `${line}\\n\\n###\\n\\n`, completion: ` ${title} END` });
    });

    readStream.on('close', () => {
      writeStream.end();
      console.log('Done converting buffer to .jsonl');
    });
  }

  /**
   * Retrieves a model instance, providing basic information about the model such as the owner and permissioning.
   *
   * @param {String} id
   */
  async getModel(id: string) {
    return await this.openai.retrieveModel(id);
  }
}
