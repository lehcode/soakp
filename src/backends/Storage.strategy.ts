import sqlite3 from 'sqlite3';
import * as fileDb from 'node-persist';
import * as Datastore from 'nedb';
import { ResponseInterface } from '../interfaces/Response.interface';

abstract class StorageStrategy {
  abstract db: sqlite3.Database | fileDb | Datastore;

  abstract insert(column: string, value: string): Promise<ResponseInterface>;

  abstract update(where: string[], values: string[]): Promise<ResponseInterface>;

  abstract find(
    string = 'token',
    where: string[] | null,
    sort: 'ASC' | 'DESC' = 'ASC',
    limit?: number
  ): Promise<ResponseInterface>;

  abstract select(query: string): Promise<ResponseInterface[]>;

  abstract archive(what: string): Promise<ResponseInterface>;

  abstract custom(query: string): Promise<Record<string, string | number>[]>;
}

export { StorageStrategy };
