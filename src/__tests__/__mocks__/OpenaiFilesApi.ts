import { mockBasicAuthCredentialsValid, mockInitializeExpressApp } from './SoakpServer';

export const mockProxy = jest.fn(() => {
  return true;
});

const mock = jest.fn().mockImplementation(() => {
  const originalModule = jest.requireActual('../../openai/OpenaiFilesApi');

  return {
    __esModule: true,
    ...originalModule,
    proxy: mockProxy
  };
});

export default mock;
