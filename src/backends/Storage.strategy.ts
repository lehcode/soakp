import sqlite3 from 'sqlite3';
import * as fileDb from 'node-persist';
import * as Datastore from 'nedb';

abstract class StorageStrategy {
  abstract db: sqlite3.Database | fileDb | Datastore;

  abstract insert(column: string, value: string): Promise<Record<string, any>>;

  abstract update(where: string[], values: string[]): Promise<Record<string, any>>;

  abstract find(what: string, where: string[], limit: number): Promise<Record<string, any>>;

  abstract select(query: string): Promise<Record<string, any>[]>;

  abstract archive(what: string): Promise<Record<string, any>>;

  abstract custom(query: string): Promise<Record<string, string | number>[]>;
}

export { StorageStrategy };
