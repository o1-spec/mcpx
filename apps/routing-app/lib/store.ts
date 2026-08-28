export interface RouteRecord {
  id: string;
  projectName: string;
  targetUrl: string;
  operationKey: string;
  createdAt: string;
}

const globalForRoutes = globalThis as unknown as {
  __routeStore?: Map<string, RouteRecord>;
};

export const routeStore: Map<string, RouteRecord> =
  globalForRoutes.__routeStore ?? new Map<string, RouteRecord>();

if (process.env.NODE_ENV !== "production") {
  globalForRoutes.__routeStore = routeStore;
}
