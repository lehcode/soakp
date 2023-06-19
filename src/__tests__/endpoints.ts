/**
 * Author: Lehcode
 * Copyright: (C)Lehcode.com 2023
 */
import { SoakpServer, ServerConfigInterface } from '../SoakpServer';
import { KeyStorage, StorageConfigInterface } from '../KeyStorage';
import config from '../configs';

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

  beforeEach(() => {
    // Mock the console.error and console.log methods
    console.error = jest.fn();
    console.log = jest.fn();

    storageConfig = {
      tableName: 'tokens_testing',
      lifetime: 60,
      dbName: 'testing.sqlite',
      dataFileDir: '/tmp/soakp'
    };
    keyStorage = new KeyStorage(storageConfig);

    serverConfig = {
      storage: storageConfig,
      httpPort: config.httpPort,
      sslPort: config.sslPort,
      httpAuthUser: 'test_user',
      httpAuthPass: 'test_pass123'
    };

    server = new SoakpServer(serverConfig);
  });

  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
    // Clear the mocks after each test
    jest.clearAllMocks();
  });

  it.skip('should initialize the endpoints correctly', () => {
    // const appUseMock = server.spyOn(server['app'], 'use');
    // const appPostMock = server.spyOn(server['app'], 'post');
    //
    // server['basicAuthCredentialsValid'] = true;
    // server['initializeExpressApp']();
    // server['initializeEndpoints']();
    //
    // expect(appUseMock).toHaveBeenCalledTimes(3);
    // expect(appPostMock).toHaveBeenCalledTimes(3);
    // expect(appPostMock).toHaveBeenCalledWith('/get-jwt', expect.any(Function));
    // expect(appPostMock).toHaveBeenCalledWith('/openai/completions', expect.any(Function));
    // expect(appPostMock).toHaveBeenCalledWith('/openai/models', expect.any(Function));
  });

  // Test for handleGetJwt method
  it('should handle the get-jwt request', async () => {
    expect(console.log).toHaveBeenCalledWith(serverConfig);

    // Mock dependencies and data
    const req = { body: { key: validOpenAiKey }};
    const res = { send: jest.fn() };

    // Mock the private methods
    jest.spyOn(server as any, 'isValidOpenAIKey').mockReturnValue(true);
    jest.spyOn(server as any, 'generateAndSaveToken').mockReturnValue(validToken);
    jest.spyOn(keyStorage, 'getActiveTokens').mockResolvedValue([]);

    setInterval(async () => {
      await server.start();

      // Call the private method to test
      await server['handleGetJwt'](req as any, res as any);

      // Assertions
      expect(server['isValidOpenAIKey']).toHaveBeenCalledWith(validOpenAiKey);
      expect(server['generateAndSaveToken']).toHaveBeenCalledWith(validOpenAiKey);
      expect(res.send).toHaveBeenCalledWith(validToken);
    }, 1000);
  });

  // Test for handleOpenAIQuery method
  // it('should handle POST `/openai/query` request', async () => {
  //   const req = { body: { messages: 'test message', engineId: 'test_engine', model: 'test_model', temperature: 0.7, maxTokens: 100 }};
  //   const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  //   await server.handleOpenAIQuery(req, res);
  //   expect(res.json).toHaveBeenCalled();
  // });
});
