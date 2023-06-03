export interface DbSchemaInterface extends Object {
  id: null | number;
  token: string | null;
  createdAt: number;
  updatedAt: number;
  lastAccess: number;
  archived: 0 | 1;
}
