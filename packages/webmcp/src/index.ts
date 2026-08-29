/**
 * WebMCP & MCPx Core Protocol Types & Presentation Helpers
 */

export type TransactionNodeState =
  | "PENDING"
  | "EXECUTING"
  | "SUCCEEDED"
  | "IN_DOUBT"
  | "RECONCILING"
  | "RECOVERED"
  | "FAILED"
  | "COMPENSATING"
  | "COMPENSATED";

export type OverallTransactionState =
  | "PENDING"
  | "ACTIVE"
  | "COMMITTED"
  | "AWAITING_COMPENSATION_APPROVAL"
  | "COMPENSATING"
  | "COMPENSATED"
  | "FAILED";

export interface WebMCPTool {
  name: string;
  description?: string;
  inputSchema?: {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface WebMCPToolResult {
  content?: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export interface ReliabilityContractAssertions {
  executeIdempotent?: boolean;
  inspectAuthoritative?: boolean;
  compensateRetrySafe?: boolean;
}

export interface TransactionStatusPresentation {
  label: string;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
  description: string;
}

export function getStatusPresentation(state: TransactionNodeState): TransactionStatusPresentation {
  switch (state) {
    case "SUCCEEDED":
      return {
        label: "SUCCEEDED",
        tone: "success",
        description: "Mutation completed and acknowledged by origin.",
      };
    case "RECOVERED":
      return {
        label: "RECOVERED",
        tone: "success",
        description: "Resource confirmed via authoritative inspection after acknowledgement loss.",
      };
    case "EXECUTING":
      return {
        label: "EXECUTING",
        tone: "info",
        description: "WebMCP postMessage RPC dispatched to origin.",
      };
    case "IN_DOUBT":
      return {
        label: "IN_DOUBT",
        tone: "warning",
        description: "RPC timed out or acknowledgement lost. State is indeterminate.",
      };
    case "RECONCILING":
      return {
        label: "RECONCILING",
        tone: "info",
        description: "Querying inspect tool for authoritative ground truth.",
      };
    case "FAILED":
      return {
        label: "FAILED",
        tone: "danger",
        description: "Definitive mutation failure confirmed before commit.",
      };
    case "COMPENSATING":
      return {
        label: "COMPENSATING",
        tone: "info",
        description: "Executing compensating rollback tool in reverse topological order.",
      };
    case "COMPENSATED":
      return {
        label: "COMPENSATED",
        tone: "neutral",
        description: "Resource successfully rolled back and verified.",
      };
    case "PENDING":
    default:
      return {
        label: "PENDING",
        tone: "neutral",
        description: "Waiting for dependency steps to complete.",
      };
  }
}
