export interface DbSchemaInterface extends Object {
  id: null | number;
  token: string | null;
  createdAt: number | string;
  updatedAt: number | string;
  lastAccess: number | string;
  archived: boolean | 0 | 1 | '0' | '1';
}
