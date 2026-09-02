export const origins = {
  mcpx: process.env.NEXT_PUBLIC_MCPX_ORIGIN || "http://localhost:3000",
  routing: process.env.NEXT_PUBLIC_ROUTING_ORIGIN || "http://localhost:3001",
  database: process.env.NEXT_PUBLIC_DATABASE_ORIGIN || "http://localhost:3002",
  compute: process.env.NEXT_PUBLIC_COMPUTE_ORIGIN || "http://localhost:3003",
  frontend: process.env.NEXT_PUBLIC_FRONTEND_ORIGIN || "http://localhost:3004",
  exampleService: process.env.NEXT_PUBLIC_EXAMPLE_SERVICE_ORIGIN || "http://localhost:3010",
  fileflowOperator: process.env.NEXT_PUBLIC_FILEFLOW_OPERATOR_URL || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3005/operator"),
};

export interface ReferenceServiceConfig {
  name: string;
  role: string;
  origin: string;
  tools: string[];
}

export function getReferenceServices(): ReferenceServiceConfig[] {
  return [
    {
      name: "database-app",
      role: "Database Service",
      origin: origins.database,
      tools: ["create_database", "get_database", "delete_database"],
    },
    {
      name: "compute-app",
      role: "Compute Runtime",
      origin: origins.compute,
      tools: ["deploy_backend", "get_backend", "delete_backend"],
    },
    {
      name: "routing-app",
      role: "Routing Gateway",
      origin: origins.routing,
      tools: ["create_route", "get_route", "delete_route"],
    },
    {
      name: "frontend-app",
      role: "Frontend Host",
      origin: origins.frontend,
      tools: ["deploy_frontend", "get_frontend", "delete_frontend"],
    },
  ];
}
