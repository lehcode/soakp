/**
 * Author: Lehcode
 * Copyright: (C)Lehcode.com 2023
 */
import { SoakpServer } from '../SoakpServer';
import { KeyStorage } from '../KeyStorage';
import { storageConfig, serverConfig } from '../configs';
import { AxiosHeaders, AxiosResponseHeaders } from 'axios';
import { waitForPort } from './server';
import { CreateChatCompletionRequest } from 'openai';
import { ChatRole } from '../enums/ChatRole.enum';

jest.mock('../SoakpProxy');
jest.mock('../lib/Responses');
jest.mock('../KeyStorage');

describe('SoakpServer', () => {
  let server: SoakpServer;
  let keyStorage: KeyStorage;
  const validOpenAiKey = 'sk-cGDjv8fdvyl4wT3BlbkFJAFhkldyJs0Olc9YvaeDA';
  const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXkiOiJzay1IV0dvc0diYWltcmlYZDJFc2xXd1QzQmxia0ZKRnNnV2hsbFMzUGl3TWx0Nk9hbTEiLCJpYXQiOjE2ODY5NDQ5ODgsImV4cCI6MTY4NzAzMTM4OH0.heqkk7zXGQb_tcsamzxY4QvOug-VyX7A7ti2E_6zC90';
  const queryParams: CreateChatCompletionRequest = {
    messages: [
      { 'role': ChatRole.SYSTEM, 'content': 'You are a helpful application tester.' },
      { 'role': ChatRole.USER, 'content': 'Test hello!' }
    ],
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 100
  };

  beforeEach(() => {
    // Mock the console.error and console.log methods
    console.error = jest.fn();
    console.log = jest.fn();

    keyStorage = new KeyStorage(storageConfig);
    server = new SoakpServer(serverConfig, keyStorage);
  });

  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
    // Clear the mocks after each test
    jest.clearAllMocks();
  });

  // Test for handleGetJwt method
  it('should handle the /get-jwt request', async () => {
    expect(console.log).toHaveBeenCalledWith(serverConfig);

    // Mock dependencies and data
    const req = { body: { key: validOpenAiKey }};
    const res = { send: jest.fn() };

    // Mock the private methods
    // @ts-ignore
    jest.spyOn(server as any, 'isValidOpenAIKey').mockReturnValue(true);
    // @ts-ignore
    jest.spyOn(keyStorage as any, 'generateSignedJWT').mockReturnValue(validToken);
    jest.spyOn(keyStorage, 'getActiveTokens').mockResolvedValue([]);

    waitForPort(serverConfig.httpPort)
      .then(async () => {
        // Start the init with the mock storage
        await server.start();

        // Call the private method to test
        // @ts-ignore
        await server['handleGetJwt'](req as any, res as any);

        // Assertions
        expect(server['isValidOpenAIKey']).toHaveBeenCalledWith(validOpenAiKey);
        expect(keyStorage['generateSignedJWT']).toHaveBeenCalledWith(validOpenAiKey);
        expect(res.send).toHaveBeenCalledWith(validToken);
      })
      .catch((error) => {
        console.error('Error occurred:', error);
      });
  });

  describe('handleOpenAIQueries', () => {
    it('should handle the openai/query request', async () => {
      // Mock dependencies and data
      const req = { body: { messages: 'Hello', engineId: 'engine-001' }};
      const res = { send: jest.fn() };
      const headers: AxiosResponseHeaders = new AxiosHeaders();

      expect(server['keyStorageService']).not.toBeUndefined();

      waitForPort(serverConfig.httpPort, 1000, 100)
        .then(async () => {
          // Start the init with the mock storage
          await server.start();

          // Mock the private methods
          jest.spyOn(server['keyStorageService'], 'getRecentToken').mockResolvedValue(validToken);
          jest.spyOn(server['keyStorageService'], 'saveToken').mockResolvedValue(200);
          jest.spyOn(server['keyStorageService'], 'updateToken').mockResolvedValue(200);
          jest.spyOn(server['proxy'], 'chatRequest').mockResolvedValue({
            status: 200,
            data: 'response-data',
            config: { data: 'response-config', headers: headers }
          } as any);
          jest.spyOn(server['proxy'], 'initOpenai').mockImplementation();

          // Call the private method to test
          // @ts-ignore
          await server['handleOpenAIQuery'](req as any, res as any);

          // Assertions
          expect(server['keyStorageService'].getRecentToken).toHaveBeenCalled();
          expect(server['keyStorageService'].saveToken).not.toHaveBeenCalled();
          expect(server['keyStorageService'].updateToken).not.toHaveBeenCalled();
          expect(server['proxy'].initOpenai).toHaveBeenCalledWith(queryParams);
          expect(server['proxy'].chatRequest(queryParams)).toHaveBeenCalled();
          expect(res.send).toHaveBeenCalledWith({
            response: 'response-data',
            responseConfig: 'response-config'
          });
        })
        .catch((error) => {
          console.error('Error occurred:', error);
        });
    });
  });
});
