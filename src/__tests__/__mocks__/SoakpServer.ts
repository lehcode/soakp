import { appConfig } from '../../config';

export const mockBasicAuthCredentialsValid = jest.fn(() => {
  if (!process.env.AUTH_USER || !process.env.AUTH_PASS) {
    throw new Error('Missing required environment variables AUTH_USER and/or AUTH_PASS');
  }

  // Check username
  if (!appConfig.usernameRegex.test(process.env.AUTH_USER as string)) {
    throw new Error('Invalid username format');
  }

  // Check password
  if (!appConfig.passwordRegex.test(process.env.AUTH_PASS as string)) {
    throw new Error('Invalid password format');
  }

  return true;
});

export const mockInitializeExpressApp = jest.fn(() => {
  console.log('mockInitializeExpressApp');
});

export const mockInitializeEndpoints = jest.fn(() => {
  console.log('mockInitializeEndpoints');
});

const mock = jest.fn().mockImplementation(() => {
  const originalModule = jest.requireActual('../../SoakpServer');

  return {
    __esModule: true,
    ...originalModule,
    basicAuthCredentialsValid: mockBasicAuthCredentialsValid,
    initializeExpressApp: mockInitializeExpressApp,
    initializeEndpoints: mockInitializeEndpoints
  };
});

export default mock;
