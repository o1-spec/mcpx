export interface BackendRecord {
  id: string;
  projectName: string;
  databaseResourceId: string;
  operationKey: string;
  healthUrl: string;
  createdAt: string;
}

const globalForBackends = globalThis as unknown as {
  __backendStore?: Map<string, BackendRecord>;
};

export const backendStore: Map<string, BackendRecord> =
  globalForBackends.__backendStore ?? new Map<string, BackendRecord>();

if (process.env.NODE_ENV !== "production") {
  globalForBackends.__backendStore = backendStore;
}
