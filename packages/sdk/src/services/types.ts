export interface ServiceToolSummary {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface ServiceDefinition {
  id: string;
  name: string;
  origin: string;
  tools: ServiceToolSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface ConnectServiceInput {
  name?: string;
  origin: string;
  tools?: ServiceToolSummary[];
}
