import config from '../../config';

export const mockBasicAuthCredentialsValidated = jest.fn(() => {
  if (!process.env.AUTH_USER || !process.env.AUTH_PASS) {
    throw new Error('Missing required environment variables AUTH_USER and/or AUTH_PASS');
  }

  // Check username
  const usernameRegex = config.usernameRegex;
  if (!usernameRegex.test(process.env.AUTH_USER as string)) {
    throw new Error('Invalid username format');
  }

  // Check password
  const passwordRegex = config.passwordRegex;
  if (!passwordRegex.test(process.env.AUTH_PASS as string)) {
    throw new Error('Invalid password format');
  }

  return true;
});

const mock = jest.fn().mockImplementation(() => {
  const originalModule = jest.requireActual('../../SoakpServer');

  return {
    __esModule: true,
    ...originalModule,
    basicAuthCredentialsValidated: mockBasicAuthCredentialsValidated
  };
});

export default mock;
