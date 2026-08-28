import type { ServiceContract } from "./types";

export const SERVICE_CONTRACTS: Record<string, ServiceContract> = {
  database: {
    service: "database",
    origin: "http://localhost:3002",
    executeTool: "create_database",
    inspectTool: "get_database",
    compensateTool: "delete_database",
    extractResourceId: (data: unknown): string | undefined => {
      if (data && typeof data === "object") {
        const obj = data as {
          database?: { id?: string };
          id?: string;
        };
        return obj.database?.id ?? obj.id;
      }
      return undefined;
    },
  },
  routing: {
    service: "routing",
    origin: "http://localhost:3001",
    executeTool: "create_route",
    inspectTool: "get_route",
    compensateTool: "delete_route",
    extractResourceId: (data: unknown): string | undefined => {
      if (data && typeof data === "object") {
        const obj = data as {
          route?: { id?: string };
          id?: string;
        };
        return obj.route?.id ?? obj.id;
      }
      return undefined;
    },
  },
};

export function getServiceContract(serviceName: string): ServiceContract {
  const contract = SERVICE_CONTRACTS[serviceName];
  if (!contract) {
    throw new Error(`ServiceContract not registered for service: '${serviceName}'`);
  }
  return contract;
}
