/**
 * Author: Lehcode
 * Copyright: (C)Lehcode.com 2023
 */
import serverConfig from '../configs';
import SoakpServer from './__mocks__/SoakpServer';
import * as dotenv from 'dotenv';

dotenv.config();

describe('SoakpServer', () => {
  const server = new SoakpServer(serverConfig);

  beforeEach(() => {
    // Mock the console.error and console.log methods
    console.error = jest.fn();
    console.log = jest.fn();

    process.env.AUTH_USER = 'valid_user1';
    process.env.AUTH_PASS = 'valid_pass12345';
  });

  afterEach(() => {
    jest.clearAllMocks();

    delete process.env.AUTH_USER;
    delete process.env.AUTH_PASS;
  });

  describe('basicAuthCredentialsValidated', () => {
    it('should return true if the credentials are valid', () => {
      expect(server.basicAuthCredentialsValid()).toBe(true);
    });

    it('should throw an error if AUTH_USER environment variable is missing', () => {
      delete process.env.AUTH_USER;

      expect(() => server.basicAuthCredentialsValid())
        .toThrowError(
          'Missing required environment variables AUTH_USER and/or AUTH_PASS'
        );
    });

    it('should throw an error if AUTH_PASS environment variable is missing', () => {
      delete process.env.AUTH_PASS;

      expect(() => server.basicAuthCredentialsValid())
        .toThrowError(
          'Missing required environment variables AUTH_USER and/or AUTH_PASS'
        );
    });

    it('should throw an error if the username has an invalid format', () => {
      process.env.AUTH_USER = 'in.valid-usernamein.valid-usernamein.valid-usernamein.valid-username';

      expect(() => server.basicAuthCredentialsValid()).toThrowError('Invalid username format');
    });

    it('should throw an error if the password has an invalid format', () => {
      process.env.AUTH_PASS = 'invalid.passwordinvalid.passwordinvalid.passwordinvalid.password';

      expect(() => server.basicAuthCredentialsValid()).toThrowError('Invalid password format');
    });
  });
});
