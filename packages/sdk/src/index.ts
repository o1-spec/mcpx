export { MCPx, SDK_VERSION, type ServerInfo, type HealthStatus } from "./client.js";
export { type MCPxConfig, type Logger } from "./config.js";

// Workflows
export { WorkflowsClient } from "./workflows/workflows.client.js";
export { WorkflowRun } from "./workflows/workflow-run.js";
export type {
  WorkflowDefinition,
  WorkflowSummary,
  WorkflowNodeDefinition,
  CreateWorkflowInput,
  RunWorkflowOptions,
} from "./workflows/types.js";

// Transactions
export { TransactionsClient } from "./transactions/transactions.client.js";
export { TransactionRun } from "./transactions/transaction-run.js";
export type {
  TransactionState,
  NodeState,
  TransactionSnapshot,
  TransactionNodeSnapshot,
  TransactionEvent,
  TransactionListFilter,
  CompensationDecisionOptions,
  WaitOptions,
  WorkflowRunResult,
  CommittedWorkflowResult,
  CompensatedWorkflowResult,
  FailedWorkflowResult,
} from "./transactions/types.js";

// Services
export { ServicesClient } from "./services/services.client.js";
export type {
  ServiceDefinition,
  ServiceToolSummary,
  ConnectServiceInput,
} from "./services/types.js";

// Contracts
export { ContractsClient } from "./contracts/contracts.client.js";
export type {
  ReliabilityContract,
  ReliabilityAssertions,
  CreateContractInput,
} from "./contracts/types.js";

// Approvals
export { ApprovalsClient } from "./approvals/approvals.client.js";
export type {
  PendingCompensationApproval,
  ApprovalDecisionInput,
  ApprovalDecisionResult,
} from "./approvals/types.js";

// Errors
export * from "./errors/index.js";

// Utilities
export { buildConsoleUrl, buildUrl } from "./utils/url.js";
