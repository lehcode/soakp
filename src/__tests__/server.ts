import { ServerConfigInterface, SoakpServer } from '../SoakpServer';
import { KeyStorage } from '../KeyStorage';
import { fallback } from '../SoakpServer';

const serverConfig: ServerConfigInterface = {
  storage: {
    tableName:  'tokens',
    dbName: 'testing.sqlite',
    dataFileDir: '/tmp',
    lifetime: 60
  },
  httpPort: 3003,
  sslPort: 3033
};
const fallbackConfig = {
  storage: {
    tableName: fallback.tableName,
    dbName: fallback.dbName,
    dataFileDir: fallback.dataFileLocation,
    lifetime: 86400,
  },
  httpPort: 3030,
  sslPort: 3333
};
let server: SoakpServer;
let keyStorage: KeyStorage;

describe('SoakpServer', () => {
  beforeEach(() => {
    // Mock the console.error and console.log methods
    console.error = jest.fn();
    console.log = jest.fn();

    server = new SoakpServer(serverConfig);
    keyStorage = new KeyStorage(serverConfig.storage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize correctly with default values', () => {
    server = new SoakpServer(fallbackConfig);
    expect(server['app']).toBeDefined();
    // keyStorage is initialized in the start() method
    expect(server['keyStorage']).toBeUndefined();
    expect(server['proxy']).toBeDefined();
    expect(server['config']).toStrictEqual(fallbackConfig);
  });

  it('should initialize server with specified config', () => {
    expect(server['app']).toBeDefined();
    // keyStorage is initialized in the start() method
    expect(server['keyStorage']).toBeUndefined();
    expect(server['proxy']).toBeDefined();
    expect(server['config'])
      .toStrictEqual(serverConfig);
    expect(console.log)
      .toHaveBeenCalledWith(serverConfig);
  });

  it('should start the server with specified config', async () => {
    // Mock the start method of the server to test its invocation
    jest.spyOn(server, 'start');

    // Start the server with the mock storage
    await server.start();

    // Verify that the start method was called with the correct arguments
    expect(server.start).toHaveBeenCalled();
    // expect(server['initSSL']).toHaveBeenCalled();
    expect(server['keyStorage']).toBeDefined();
    expect(server['app']).toBeDefined();
    expect(server['proxy']).toBeDefined();
    expect(server['config'])
      .toStrictEqual(serverConfig);
    expect(console.log)
      .toHaveBeenCalledWith(serverConfig);
  });

  it('should throw an error if basic auth credentials are missing', () => {
    process.env.AUTH_USER = undefined;
    process.env.AUTH_PASS = undefined;

    expect(() => new SoakpServer(serverConfig)).toThrowError('Missing required environment variables AUTH_USER and/or AUTH_PASS');
  });
});
