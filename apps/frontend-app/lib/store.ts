export interface FrontendRecord {
  id: string;
  projectName: string;
  backendResourceId: string;
  previewUrl: string;
  operationKey: string;
  createdAt: string;
}

const globalForFrontends = globalThis as unknown as {
  __frontendStore?: Map<string, FrontendRecord>;
};

export const frontendStore: Map<string, FrontendRecord> =
  globalForFrontends.__frontendStore ?? new Map<string, FrontendRecord>();

if (process.env.NODE_ENV !== "production") {
  globalForFrontends.__frontendStore = frontendStore;
}
