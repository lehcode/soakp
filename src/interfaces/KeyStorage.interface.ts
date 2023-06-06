import { Database } from 'sqlite3';
import { StatusCode } from '../enums/StatusCode.enum';
import { DbSchemaInterface } from './DbSchema.interface';

export interface KeyStorageInterface {
  readonly backend: Database;
  readonly tableName: string;

  saveToken(jwtToken: string, openAIKey: string): Promise<StatusCode>;

  updateToken(oldToken: string, newToken: string): Promise<StatusCode>;

  fetchToken(jwtToken: string): Promise<string>;

  jwtExists(value: string): Promise<string | boolean>;

  archive(what: string): Promise<void>;

  getActiveTokens(): Promise<DbSchemaInterface[]>;
}
