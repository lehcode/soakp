import { Database } from 'sqlite3';
import * as fileDb from 'node-persist';
import Nedb from 'nedb';
import { StatusCode } from '../enums/StatusCode';

export interface KeyStorageInterface {
  readonly backend: Database | fileDb | Nedb;

  saveKey(openAIKey: string): Promise<boolean>;

  fetchKey(openAIKey: string): Promise<string>;

  keyExists(openAIKey: string, jwtSigned: string): Promise<string | boolean>;

  saveJWT(jwtToken: string, openAIKey: string): Promise<StatusCode>;

  fetchJWT(where: string): Promise<string>;

  jwtExists(value: string): Promise<boolean>;

  archive(what: string): Promise<void>;
}
