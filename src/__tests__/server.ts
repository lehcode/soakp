import { SoakpServer } from '../SoakpServer';
import serverConfig from '../configs';
import { createServer } from 'net';
// import { KeyStorage } from '../KeyStorage';

// jest.mock('../KeyStorage');

function wait(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

describe('SoakpServer', () => {
  let server: SoakpServer;
  // let keyStorage: KeyStorage;

  beforeEach(() => {
    // Mock the console.error and console.log methods
    console.error = jest.fn();
    console.log = jest.fn();

    server = new SoakpServer(serverConfig);
    // keyStorage = new KeyStorage(serverConfig.storage);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

    waitForPort(serverConfig.httpPort)
      .then(async () => {
        console.log(`Port ${serverConfig.httpPort} is now available.`);
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
      })
      .catch((error) => {
        console.error('Error occurred:', error);
      });
  });
});

export async function waitForPort(port: number, timeout = 50, retryDelay = 10): Promise<void> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    function checkPort() {
      const server = createServer();

      // @ts-ignore
      server.once('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          // Port is busy, check if timeout has been reached
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime >= timeout) {
            // Global timeout reached, reject the promise
            server.close();
            reject(new Error(`Timeout reached while waiting for port ${port} to become available`));
          } else {
            // Retry after the specified delay
            server.close();
            wait(retryDelay).then(checkPort);
          }
        } else {
          // Other error occurred, reject the promise
          server.close();
          reject(error);
        }
      });

      server.once('listening', () => {
        // Port is available, resolve the promise
        server.close();
        resolve();
      });

      // server.listen(port, '127.0.0.1');
    }

    checkPort();
  });
}

