import { TransactionRun } from "../transactions/transaction-run.js";

/**
 * A WorkflowRun represents an active or completed execution of a DAG workflow.
 * It provides full transaction observation, live event streaming, compensation controls, and terminal completion waiting.
 */
export class WorkflowRun extends TransactionRun {
  /**
   * The workflow definition ID associated with this run.
   */
  get workflowDefinitionId(): string | null | undefined {
    return this.workflowId;
  }
}
