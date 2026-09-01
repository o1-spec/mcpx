# @mcpx/sdk

Official TypeScript SDK for the **MCPx** reliable workflow orchestration runtime.

MCPx orchestrates multi-service WebMCP workflows across distributed web applications, ensuring ACID durability in PostgreSQL, authoritative state reconciliation on in-doubt writes, and reverse topological compensation when downstream steps fail.

---

## Installation

```bash
npm install @mcpx/sdk
# or
pnpm add @mcpx/sdk
# or
yarn add @mcpx/sdk
```

---

## Quick Start

```ts
import { MCPx } from "@mcpx/sdk";

// 1. Initialize the MCPx client
const mcpx = new MCPx({
  endpoint: process.env.MCPX_URL || "http://localhost:3000",
  apiKey: process.env.MCPX_API_KEY,
});

// 2. Start a workflow run
const run = await mcpx.workflows.run("deploy-application", {
  projectName: "storefront",
  environment: "production",
});

console.log(`Transaction ID: ${run.id}`);
console.log(`Console Link:   ${run.consoleUrl}`);

// 3. Stream real-time state transitions
for await (const event of run.events()) {
  console.log(`[${event.nodeLabel || "tx"}] -> ${event.type}`);
}

// 4. Wait for terminal outcome
const result = await run.wait();

if (result.status === "COMMITTED") {
  console.log("Deployment succeeded:", result.outputs);
} else if (result.status === "COMPENSATED") {
  console.log("Deployment rolled back safely:", result.compensatedNodes);
} else {
  console.error("Deployment failed:", result.error);
}
```

---

## Features & Architecture

- **Programmatic DAG Execution**: Trigger complex workflows across microservices by ID or slug.
- **Durable PostgreSQL Ledger**: Every transaction and state transition is committed with strictly monotonic event sequences.
- **Live Event Streaming**: Stream events via Server-Sent Events (SSE) or robust sequence-tracked async iteration.
- **Authoritative Reconciliation**: When network transport drops after a mutation, the runtime inspects remote ground truth to resolve `IN_DOUBT` states.
- **Reverse Topological Compensation**: Automatically or conditionally undoes completed steps in strict reverse dependency order.
- **Human-in-the-Loop Governance**: Programmatically list and approve transactions awaiting operator rollback decisions.
- **Deep Console Linking**: Every `WorkflowRun` and `TransactionRun` exposes `.consoleUrl` linking directly to the visual debugger.

---

## API Reference

### Client Configuration

```ts
const mcpx = new MCPx({
  endpoint: "http://localhost:3000", // Required: MCPx runtime URL
  apiKey: "mcpx_sec_...",           // Optional: API key
  consoleBaseUrl: "http://localhost:3000", // Optional: Custom Console UI URL
  timeoutMs: 30_000,                // Optional: Default request timeout
  pollingIntervalMs: 1_000,         // Optional: Event polling interval
  headers: { "X-Custom": "header" },// Optional: Default headers
});
```

### Workflows API (`mcpx.workflows`)

```ts
// List workflow definitions
const workflows = await mcpx.workflows.list();

// Get workflow by ID
const workflow = await mcpx.workflows.get("wf_123");

// Create workflow definition
const newWf = await mcpx.workflows.create({
  name: "Production Pipeline",
  description: "Build, provision, and deploy",
  nodes: [
    { id: "step_db", label: "Database", contractId: "ctr_db", dependencies: [] },
    { id: "step_app", label: "Backend", contractId: "ctr_app", dependencies: ["step_db"] },
  ],
});

// Run workflow
const run = await mcpx.workflows.run("Production Pipeline", { region: "us-east-1" });
```

### Transactions API (`mcpx.transactions`)

```ts
// List recent transactions
const transactions = await mcpx.transactions.list({ state: "ACTIVE" });

// Get existing transaction
const tx = await mcpx.transactions.get("tx_987");

// Approve compensation
await tx.approveCompensation({ reason: "Approved by SRE on-call" });

// Reject compensation (keep resources for debugging)
await tx.rejectCompensation({ reason: "Retain database for manual inspection" });

// Cancel transaction
await tx.cancel("Aborted by user");
```

### Programmatic Approvals API (`mcpx.approvals`)

```ts
// List transactions requiring human or policy rollback approval
const pending = await mcpx.approvals.listPending();

for (const item of pending) {
  console.log(`Approval required for transaction: ${item.transactionId}`);
  console.log(`Failed node: ${item.failedNodeLabel}`);
  console.log(`Compensable resources:`, item.compensableNodes);

  // Approve programmatically
  await mcpx.approvals.approve(item.transactionId, {
    reason: "Auto-approved by CI/CD safety policy",
  });
}
```

---

## Error Handling

The SDK throws strongly typed errors extending `MCPxError`:

```ts
import {
  MCPxError,
  MCPxApiError,
  MCPxValidationError,
  MCPxNotFoundError,
  MCPxConflictError,
  MCPxTimeoutError,
  MCPxConnectionError,
} from "@mcpx/sdk";

try {
  const run = await mcpx.workflows.run("non-existent-workflow");
  await run.wait({ timeoutMs: 10_000 });
} catch (err) {
  if (err instanceof MCPxNotFoundError) {
    console.error("Workflow not found:", err.message);
  } else if (err instanceof MCPxTimeoutError) {
    console.error(`Workflow timed out after ${err.timeoutMs}ms for ${err.transactionId}`);
  } else if (err instanceof MCPxValidationError) {
    console.error("Validation failed:", err.validationErrors);
  } else if (err instanceof MCPxConnectionError) {
    console.error("Network connection to MCPx runtime failed:", err.url);
  } else if (err instanceof MCPxApiError) {
    console.error(`HTTP ${err.status}:`, err.message);
  }
}
```

---

## WebMCP Execution Model & Limitations

- **Control Plane vs Worker Runtime**: The SDK communicates with the MCPx Control Plane API (`/api/v1/...`). 
- **WebMCP Tool Dispatch**: WebMCP tools exposed by web applications across browser iframe boundaries (`document.modelContext`) are executed by active WebMCP runners (the MCPx Console or headless runner frame).
- **ACID Durability**: Transactions initialized via the SDK are persisted in PostgreSQL and can be monitored simultaneously in both the terminal and the MCPx Console.

---

## License

Apache-2.0
