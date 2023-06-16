/**
 * Author: Lehcode
 * Copyright: (C)Lehcode.com 2023
 */
// import { SoakpServer } from '../SoakpServer';
import { serverConfig } from './server';
import SoakpServer from './__mocks__/SoakpServer';

// const serverMock = jest.mock('../SoakpServer');
// jest.mock('../SoakpServer');
const server = new SoakpServer(serverConfig);

describe('SoakpServer', () => {
  beforeEach(() => {
    // Mock the console.error and console.log methods
    console.error = jest.fn();
    console.log = jest.fn();

    process.env.AUTH_USER = 'valid_user';
    process.env.AUTH_PASS = 'valid_pass';
  });

  afterEach(() => {
    jest.clearAllMocks();

    delete process.env.AUTH_USER;
    delete process.env.AUTH_PASS;
  });

  describe('basicAuthCredentialsValidated', () => {
    it('should return true if the environment variables are valid', () => {
      expect(server.basicAuthCredentialsValidated()).toBe(true);
    });

    it('should throw an error if AUTH_USER environment variable is missing', () => {
      delete process.env.AUTH_USER;

      expect(() => server.basicAuthCredentialsValidated())
        .toThrowError(
          'Missing required environment variables AUTH_USER and/or AUTH_PASS'
        );
    });

    it('should throw an error if AUTH_PASS environment variable is missing', () => {
      delete process.env.AUTH_PASS;

      expect(() => server.basicAuthCredentialsValidated())
        .toThrowError(
          'Missing required environment variables AUTH_USER and/or AUTH_PASS'
        );
    });

    it('should throw an error if the username has an invalid format', () => {
      process.env.AUTH_USER = 'in.valid-username';
      process.env.AUTH_PASS = 'valid_password';

      expect(() => server.basicAuthCredentialsValidated()).toThrowError('Invalid username format');
    });
  });
});
