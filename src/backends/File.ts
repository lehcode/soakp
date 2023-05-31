import { StorageStrategy } from './Storage.strategy';
import * as fileDb from 'node-persist';

class FileStorage implements StorageStrategy {
  private db: fileDb;

  /**
   *
   * @param dataDir
   */
  constructor(dataDir: string) {
    this.db = fileDb.init({ dir: dataDir });
  }

  insert(tokenType: string, value: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  update(what: string, where: string, value: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  find(tokenType: 'openai' | 'jwt', token: string): Promise<string> {
    return Promise.resolve(undefined);
  }

  query(query: string, vars: string[]): Promise<Record<string, any>> {
    return Promise.resolve(undefined);
  }

  archive(what: string): Promise<void> {
    return Promise.resolve(undefined);
  }
}

export { FileStorage };
