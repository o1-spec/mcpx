export interface DatabaseRecord {
  id: string;
  name: string;
  operationKey: string;
  createdAt: string;
}

const globalForDatabases = globalThis as unknown as {
  __databaseStore?: Map<string, DatabaseRecord>;
};

export const databaseStore: Map<string, DatabaseRecord> =
  globalForDatabases.__databaseStore ?? new Map<string, DatabaseRecord>();

if (process.env.NODE_ENV !== "production") {
  globalForDatabases.__databaseStore = databaseStore;
}
