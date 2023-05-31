import * as Datastore from 'nedb';
import { StorageStrategy } from './Storage.strategy';

class MemoryStorage implements StorageStrategy {
  private db: Datastore;

  constructor() {
    this.db = new Datastore();
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

export { MemoryStorage };
