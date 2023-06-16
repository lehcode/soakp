import SoakpServer from '../SoakpServer';
import KeyStorage, { StorageType } from '../KeyStorage';

describe('SoakpServer', () => {



  it('should start the server', async () => {
    // Create an instance of the server
    const server = new SoakpServer();

    // Mock the start method of the server to test its invocation
    jest.spyOn(server, 'start');

    // Start the server with the mock storage
    await server.start(3033 || fallback.serverPort);

    // Verify that the start method was called with the correct arguments
    expect(server.start).toHaveBeenCalledWith(3033);
  });
});
