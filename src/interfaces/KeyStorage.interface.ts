import { Database } from 'sqlite3';
import * as fileDb from 'node-persist';
import Nedb from 'nedb';
import { StatusCode } from '../enums/StatusCode.enum';

export interface KeyStorageInterface {
  readonly backend: Database | fileDb | Nedb;

  saveJWT(jwtToken: string, openAIKey: string): Promise<StatusCode>;

  fetchJWT(jwtToken: string): Promise<string>;

  jwtExists(value: string): Promise<string | boolean>;

  archive(what: string): Promise<void>;
}
