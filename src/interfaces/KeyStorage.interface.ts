import { Database } from 'sqlite3';
import { StatusCode } from '../enums/StatusCode.enum';
import { DbSchemaInterface } from './DbSchema.interface';

export interface KeyStorageInterface {
  readonly backend: Database;
  readonly tableName: string;

  saveJWT(jwtToken: string, openAIKey: string): Promise<StatusCode>;

  fetchJWT(jwtToken: string): Promise<string>;

  jwtExists(value: string): Promise<string | boolean>;

  archive(what: string): Promise<void>;

  getActiveTokens(): Promise<DbSchemaInterface[]>;
}
