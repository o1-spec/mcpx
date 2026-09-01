# MCPx SDK Agent Demo

This example demonstrates how an external Node.js backend application or AI Agent integrates with **MCPx** using `@mcpxx/sdk`.

The SDK communicates with the MCPx Control Plane via HTTP and Server-Sent Events (SSE), enabling programmatic workflow dispatch, live execution monitoring, and automated compensation governance.

---

## How It Works

1. **Connects to MCPx Coordinator**: Connects to the central MCPx runtime control plane.
2. **Lists Available Workflows**: Discovers registered DAG workflow definitions.
3. **Triggers Workflow Run**: Starts a durable transaction with `await mcpx.workflows.run(...)`.
4. **Streams Real-Time State Transitions**: Consumes live Server-Sent Events (SSE) or sequence-tracked audit events.
5. **Observes Recovery & Compensation**: If a step enters `IN_DOUBT`, the runtime reconciles via authoritative inspection.
6. **Receives Structured Result**: Receives a typed `COMMITTED` or `COMPENSATED` outcome without handling internal network failures.

---

## Running the Demo

Ensure the MCPx coordinator and services are running:

```bash
# From repository root
pnpm demo:sdk
```

Or from this directory:

```bash
pnpm start
```
