import { SoakpServer } from '../SoakpServer';
import serverConfig from '../configs';

let init: SoakpServer;
// let keyStorage: KeyStorage;

describe('SoakpServer', () => {
  beforeEach(() => {
    // Mock the console.error and console.log methods
    console.error = jest.fn();
    console.log = jest.fn();

    init = new SoakpServer(serverConfig);
    //keyStorage = new KeyStorage(serverConfig.storage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize init with specified config', () => {
    expect(init['app']).toBeDefined();
    // keyStorage is initialized in the start() method
    expect(init['keyStorage']).toBeUndefined();
    expect(init['proxy']).toBeDefined();
    expect(init['config']).toStrictEqual(serverConfig);
    expect(console.log).toHaveBeenCalledWith(serverConfig);
  });

  it('should start the init with specified config', async () => {
    // Mock the start method of the init to test its invocation
    jest.spyOn(init, 'start');

    // Start the init with the mock storage
    await init.start();

    // Verify that the start method was called with the correct arguments
    expect(init.start).toHaveBeenCalled();
    // expect(init['initSSL']).toHaveBeenCalled();
    expect(init['keyStorage']).toBeDefined();
    expect(init['app']).toBeDefined();
    expect(init['proxy']).toBeDefined();
    expect(init['config']).toStrictEqual(serverConfig);
    expect(console.log).toHaveBeenCalledWith(serverConfig);
  });
});
