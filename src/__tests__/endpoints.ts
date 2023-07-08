/**
 * Author: Lehcode
 * Copyright: (C)Lehcode.com 2023
 */
import { SoakpServer, ServerConfigInterface } from '../SoakpServer';
import { KeyStorage, StorageConfigInterface } from '../KeyStorage';
import config from '../configs';
import { AxiosHeaders, AxiosResponseHeaders } from 'axios';
import { OpenAIRequestInterface } from '../interfaces/OpenAI/OpenAIRequest.interface';
import { waitForPort } from './server';

jest.mock('../SoakpProxy');
jest.mock('../http/Responses');
jest.mock('../KeyStorage');

describe('SoakpServer', () => {
  let server: SoakpServer;
  let keyStorage: KeyStorage;
  let serverConfig: ServerConfigInterface;
  let storageConfig: StorageConfigInterface;
  const validOpenAiKey = 'sk-cGDjv8fdvyl4wT3BlbkFJAFhkldyJs0Olc9YvaeDA';
  const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXkiOiJzay1IV0dvc0diYWltcmlYZDJFc2xXd1QzQmxia0ZKRnNnV2hsbFMzUGl3TWx0Nk9hbTEiLCJpYXQiOjE2ODY5NDQ5ODgsImV4cCI6MTY4NzAzMTM4OH0.heqkk7zXGQb_tcsamzxY4QvOug-VyX7A7ti2E_6zC90';
  const query: OpenAIRequestInterface = {
    apiKey: 'sample-key',
    apiOrgKey: 'sample-org-key',
    prompt: 'Hello',
    engineId: 'engine-001',
    model: 'text-davinci-003',
    temperature: 0.7,
    max_tokens: 100
  };

  beforeEach(() => {
    // Mock the console.error and console.log methods
    console.error = jest.fn();
    console.log = jest.fn();

    storageConfig = {
      tableName: config.storage.tableName,
      lifetime: config.storage.lifetime,
      dbName: config.storage.dbName,
      dataFileDir: '/tmp/soakp'
    };
    keyStorage = new KeyStorage(storageConfig);

    serverConfig = {
      storage: storageConfig,
      httpPort: config.httpPort,
      sslPort: config.sslPort,
      httpAuthUser: config.httpAuthUser,
      httpAuthPass: config.httpAuthPass
    };

    server = new SoakpServer(serverConfig);
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
    jest.spyOn(server as any, 'generateAndSaveToken').mockReturnValue(validToken);
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
        expect(server['generateAndSaveToken']).toHaveBeenCalledWith(validOpenAiKey);
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

      expect(server['keyStorage']).toBeUndefined();

      waitForPort(serverConfig.httpPort, 1000, 100)
        .then(async () => {
          // Start the init with the mock storage
          await server.start();

          // Mock the private methods
          jest.spyOn(server['keyStorage'], 'getRecentToken').mockResolvedValue(validToken);
          jest.spyOn(server['keyStorage'], 'saveToken').mockResolvedValue(200);
          jest.spyOn(server['keyStorage'], 'updateToken').mockResolvedValue(200);
          jest.spyOn(server['proxy'], 'makeRequest').mockResolvedValue({
            status: 200,
            data: 'response-data',
            config: { data: 'response-config', headers: headers }
          } as any);
          jest.spyOn(server['proxy'], 'initAI').mockImplementation();

          // Call the private method to test
          // @ts-ignore
          await server['handleOpenAIQuery'](req as any, res as any);

          // Assertions
          expect(server['keyStorage'].getRecentToken).toHaveBeenCalled();
          expect(server['keyStorage'].saveToken).not.toHaveBeenCalled();
          expect(server['keyStorage'].updateToken).not.toHaveBeenCalled();
          expect(server['proxy'].initAI).toHaveBeenCalledWith(query);
          expect(server['proxy'].makeRequest).toHaveBeenCalled();
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
