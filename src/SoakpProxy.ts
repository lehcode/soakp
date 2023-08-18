/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
import {
  Configuration,
  CreateChatCompletionRequest,
  CreateCompletionRequest,
  CreateFineTuneRequest,
  OpenAIApi
} from 'openai';
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
  async chatRequest(request: CreateChatCompletionRequest | CreateCompletionRequest, legacy= false) {
    try {
      if (request) {
        if (legacy) {
          return await this.openai.createCompletion(request as CreateCompletionRequest);
        } else {
          return await this.openai.createChatCompletion(request as CreateChatCompletionRequest);
        }
      }
    } catch (error: any) {
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
   * @param request
   */
  async createFineTune(request: CreateFineTuneRequest) {
    return await this.openai.createFineTune(request);
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
