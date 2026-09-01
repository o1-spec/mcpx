export interface ReliabilityAssertions {
  executeIdempotent: boolean;
  inspectAuthoritative: boolean;
  compensationRetrySafe: boolean;
}

export interface ReliabilityContract {
  id: string;
  name: string;
  serviceId: string;
  serviceName?: string;
  executeToolName: string;
  inspectToolName: string;
  compensateToolName?: string | null;
  operationKeyField: string;
  status: "READY" | "DRAFT" | "DEPRECATED";
  assertions: ReliabilityAssertions;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContractInput {
  name: string;
  serviceId: string;
  executeToolName: string;
  inspectToolName: string;
  compensateToolName?: string | null;
  operationKeyField?: string;
  assertions?: Partial<ReliabilityAssertions>;
}
