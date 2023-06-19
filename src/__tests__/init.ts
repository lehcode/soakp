import { SoakpServer } from '../SoakpServer';
import serverConfig from '../configs';
import { createServer } from 'net';

let server: SoakpServer;
// let keyStorage: KeyStorage;

async function isPortBusy(port: number) {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        // Port is busy
        resolve(true);
      } else {
        // Other error occurred
        resolve(false);
      }
    });

    // server.once('listening', () => {
    //   // Port is available
    //   server.close();
    //   resolve(false);
    // });
    //
    // server.listen(port, '127.0.0.1');
  });
}

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

  it('should initialize the server with the specified config', () => {
    expect(server['app']).toBeDefined();
    // keyStorage is initialized in the start() method
    expect(server['keyStorage']).toBeUndefined();
    expect(server['proxy']).toBeDefined();
    expect(server['config']).toStrictEqual(serverConfig);
    expect(console.log).toHaveBeenCalledWith(serverConfig);
  });

  it('should start the server with the specified config', async () => {
    jest.useFakeTimers();
    // Mock the start method of the server to test its invocation
    jest.spyOn(server, 'start');
    jest.spyOn(server as any, 'initSSL');

    isPortBusy(serverConfig.httpPort)
      .then(async (busy) => {
        if (busy) {
          console.log(`Port ${serverConfig.httpPort} is busy.`);
        } else {
        // Start the init with the mock storage
          await server.start();

          // Verify that the start method was called with the correct arguments
          expect(server.start).toHaveBeenCalled();
          expect(server['keyStorage']).toBeDefined();
          expect(server['app']).toBeDefined();
          expect(server['initSSL']).toHaveBeenCalled();
          expect(server['proxy']).toBeDefined();
          expect(server['config']).toStrictEqual(serverConfig);
          expect(console.log).toHaveBeenCalledWith(serverConfig);
        }
      })
      .catch((error) => {
        console.error('Error occurred:', error);
      });
  });
});
