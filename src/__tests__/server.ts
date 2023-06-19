import { SoakpServer } from '../SoakpServer';
import serverConfig from '../configs';

let server: SoakpServer;
// let keyStorage: KeyStorage;

describe('SoakpServer', () => {
  beforeEach(() => {
    // Mock the console.error and console.log methods
    console.error = jest.fn();
    console.log = jest.fn();

    server = new SoakpServer(serverConfig);
    //keyStorage = new KeyStorage(serverConfig.storage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize server with specified config', () => {
    expect(server['app']).toBeDefined();
    // keyStorage is initialized in the start() method
    expect(server['keyStorage']).toBeUndefined();
    expect(server['proxy']).toBeDefined();
    expect(server['config']).toStrictEqual(serverConfig);
    expect(console.log).toHaveBeenCalledWith(serverConfig);
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
    expect(server['config']).toStrictEqual(serverConfig);
    expect(console.log).toHaveBeenCalledWith(serverConfig);
  });
});
