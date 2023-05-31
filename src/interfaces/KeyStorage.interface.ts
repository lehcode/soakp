import { Database } from 'sqlite3';
import * as fileDb from 'node-persist';
import Nedb from 'nedb';

export interface KeyStorageInterface {
  readonly backend: Database | fileDb | Nedb;

  saveKey(openAIKey: string): Promise<boolean>;

  fetchKey(openAIKey: string): Promise<string>;

  keyExists(key: string): Promise<boolean>;

  saveJWT(jwtToken: string, openAIKey: string): Promise<void>;

  fetchJWT(where: string): Promise<string>;

  jwtExists(value: string): Promise<boolean>;

  archive(what: string): Promise<void>;
}
