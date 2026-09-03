# MCPx

> **WebMCP makes structured agent actions possible. MCPx makes those actions reliable.**

[![CI](https://github.com/o1-spec/mcpx/actions/workflows/ci.yml/badge.svg)](https://github.com/o1-spec/mcpx/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@mcpxx/sdk.svg)](https://www.npmjs.com/package/@mcpxx/sdk)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)

A reliability and orchestration runtime for consequential multi-step WebMCP (Web Model Context Protocol) workflows.

## Links

- **MCPx Live App**: [https://mcpx-mcpx-web.vercel.app/app](https://mcpx-mcpx-web.vercel.app/app)
- **FileFlow Operator**: [https://file-flow-test.vercel.app/operator](https://file-flow-test.vercel.app/operator)
- **MCPx SDK (`@mcpxx/sdk`)**: [https://www.npmjs.com/package/@mcpxx/sdk](https://www.npmjs.com/package/@mcpxx/sdk)
- **Source Code**: [https://github.com/o1-spec/mcpx](https://github.com/o1-spec/mcpx)

---

```text
EXECUTING  ──(Lost Transport ACK)──>  IN_DOUBT  ──(Authoritative Inspection)──>  RECOVERED
```

---

## What is MCPx?

When AI agents execute consequential multi-step operations across browser-connected web applications (such as provisioning databases, deploying containers, configuring network routes, or allocating cloud infrastructure), they face a fundamental reality of distributed browser runtimes:

> **A network timeout or lost acknowledgement does NOT prove a remote write failed.**

- **The Problem**: An agent triggers a write on an external service. The service commits the change, but the HTTP response or browser transport acknowledgement is dropped due to network instability or browser tab throttling.
- **Why Naive Retries Fail**: If the agent assumes failure and blindly re-executes the tool, it risks duplicate charges, redundant database schemas, and data corruption. If it assumes success without verification, the workflow state becomes inconsistent.
- **The MCPx Solution**: MCPx coordinates multi-step WebMCP workflows using deterministic **Reliability Contracts**. When an acknowledgement is lost, MCPx marks the operation **`IN_DOUBT`**, runs authoritative state inspection against the target application, and transitions to **`RECOVERED`** without blindly reissuing the mutation. If downstream steps fail, MCPx pauses for operator confirmation and unrolls prior steps via verified reverse compensation (Saga).

---

## Short Problem Example

Consider an agent executing a 4-tier deployment workflow:

```text
Database ──> Compute ──> Routing ──> Frontend
```

1. The agent dispatches `create_route` to the Ingress Routing service.
2. The Routing service writes the new route to its backend database.
3. The browser transport drops the acknowledgement before it reaches the coordinator.
4. **Naive Agent Behavior**: Retries `create_route` $\rightarrow$ creates duplicate conflicting routes, or aborts $\rightarrow$ leaves orphaned Database and Compute resources running.
5. **MCPx Behavior**:
   - Transitions `routing:create` to **`IN_DOUBT`**.
   - Invokes the service's authoritative inspection tool (`get_route`) using the exact same `operationKey`.
   - Verifies the route exists in the store $\rightarrow$ transitions to **`RECOVERED`**.
   - Proceeds to `deploy_frontend`.
   - When the Frontend step encounters an upstream validation rejection, MCPx halts in **`AWAITING_COMPENSATION_APPROVAL`**.
   - Upon human approval, MCPx compensates previous steps in reverse dependency order (`delete_route` $\rightarrow$ `delete_backend` $\rightarrow$ `delete_database`), verifying each resource is absent before declaring **`COMPENSATED`**.

---

## How MCPx Uses WebMCP

MCPx is built natively on the WebMCP browser standard (`document.modelContext`):

1. **Tool Registration**: Microservices declare their capabilities in iframes (`allow="tools"`) using `document.modelContext.registerTool(...)`:
   ```ts
   // Example from apps/routing-app/lib/tools.ts
   document.modelContext.registerTool({
     name: "create_route",
     description: "Provision ingress proxy route",
     inputSchema: {
       type: "object",
       properties: {
         projectName: { type: "string" },
         targetUrl: { type: "string" },
         operationKey: { type: "string" }
       },
       required: ["projectName", "targetUrl", "operationKey"]
     }
   });
   ```
2. **Browser Runner Tool Discovery**: The MCPx Browser Runner discovers tools across all active iframes using `document.modelContext.getTools()`.
3. **Native Tool Dispatch**: Actions are dispatched via `document.modelContext.executeTool(tool, JSON.stringify(args))`.
4. **Service Autonomy**: Microservices remain the authoritative source of truth for their own data. MCPx does **not** mutate services directly through coordinator REST calls; all execution flows through native WebMCP tools.
5. **Cross-Origin Security**: Cross-frame communication respects iframe isolation policies with `allow="tools"` and `exposedTo`.

---

## Reliability Semantics

MCPx defines a state machine that distinguishes between confirmed failure and uncertain transport outcomes:

```text
               ┌───────────────────────┐
               │        PENDING        │
               └──────────┬────────────┘
                          │ (executeTool)
                          ▼
               ┌───────────────────────┐
               │       EXECUTING       │
               └────┬───────────────┬───┘
                    │               │ (Simulated / Real ACK Loss)
  (Confirmed Reject)│               ▼
                    │    ┌────────────────────┐
                    │    │      IN_DOUBT      │
                    │    └──────────┬─────────┘
                    │               │ (inspectTool)
                    │               ▼
                    │    ┌────────────────────┐
                    │    │    RECONCILING     │
                    │    └────┬──────────┬────┘
                    │         │          │ (Resource Verified Present)
                    │         │          ▼
                    ▼         │ ┌───────────────────┐
             ┌────────────┐   │ │     RECOVERED     │
             │   FAILED   │◄──┘ └───────────────────┘
             └─────┬──────┘               │
                   │ (DAG Failure)        ▼
                   ▼            ┌───────────────────┐
     ┌────────────────────────┐ │     SUCCEEDED     │
     │ AWAITING_COMPENSATION  │ └───────────────────┘
     │        APPROVAL        │
     └─────────────┬──────────┘
                   │ (Human Operator Approves)
                   ▼
     ┌────────────────────────┐
     │      COMPENSATING      │ ──(deleteTool + inspectTool)──> COMPENSATED
     └────────────────────────┘
```

- **`IN_DOUBT`**: A mutation was dispatched, but acknowledgement was lost or transport failed. MCPx pauses forward progress for this node without reissuing the write.
- **`RECONCILING`**: MCPx invokes the node's registered `inspectTool` (`get_*`) using the stable `operationKey` to determine actual backend state.
- **`RECOVERED`**: The resource was authoritatively confirmed in the remote service. Execution safely continues.
- **`AWAITING_COMPENSATION_APPROVAL`**: Downstream failure occurred. Destructive compensation halts until an operator confirms rollback.
- **`COMPENSATING`**: Unrolls successful nodes in strict reverse topological order.
- **`COMPENSATED`**: All resources have been rolled back and authoritatively verified absent.

---

## Human + Agent Experience

MCPx enforces a clear separation of responsibility between human intent, AI planning, and reliable runtime execution:

```text
User / Operator
      │
      ▼
FileFlow AI Operator (Agent)
      │
      ▼ (SDK: @mcpxx/sdk)
MCPx Coordinator (Control Plane & Durable WAL)
      │
      ▼ (HTTP Claim Loop)
Browser Runner (Active Tab)
      │
      ▼ (document.modelContext.executeTool)
Native WebMCP Layer (iframes with allow="tools")
  ├── Database Service (create_database / get_database / delete_database)
  ├── Compute Service  (deploy_backend / get_backend / delete_backend)
  ├── Routing Service  (create_route / get_route / delete_route)
  └── Frontend Service (deploy_frontend / get_frontend / delete_frontend)
```

1. **AI Agent Plans**: The AI agent (e.g. FileFlow Operator) translates high-level natural language intent into a structured multi-service DAG.
2. **Human Confirms Action**: The operator reviews the proposed infrastructure plan and clicks **Confirm & Provision**.
3. **MCPx Orchestrates**: MCPx drives the multi-step transaction over WebMCP, logging monotonic sequenced events to PostgreSQL.
4. **Human Approves Compensation**: If an unrecoverable failure occurs downstream, destructive deletion requires explicit human approval.
5. **Shared Durable Visibility**: Both human and agent observe the identical live state stream via Server-Sent Events (SSE) and deep-linked transaction URLs.

---

## Reference Demo Scenario

The reference challenge scenario coordinates 4 independent microservices with deliberate fault injection:

| Step | Service | WebMCP Tool | Behavior in Flagship Demo | Outcome |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Database** | `create_database` | Creates isolated PostgreSQL tenant schema. | `SUCCEEDED` |
| **2** | **Compute** | `deploy_backend` | Deploys container workload connected to database schema. | `SUCCEEDED` |
| **3** | **Routing** | `create_route` | Commits ingress route. **Intentionally injects transport ACK drop**. | `IN_DOUBT` $\rightarrow$ `RECOVERED` via `get_route` |
| **4** | **Frontend** | `deploy_frontend` | **Intentionally injects pre-commit validation rejection**. | `FAILED` |
| **Gate** | **Operator** | *Approval Modal* | Operator reviews failure and clicks **Approve Rollback**. | `AWAITING_APPROVAL` |
| **Rollback** | **All 3** | `delete_*` | Compensates in reverse order: Routing $\rightarrow$ Compute $\rightarrow$ Database. | `COMPENSATED` |

---

## Real-World Integration: FileFlow

MCPx is also integrated with **FileFlow**, a distributed file-processing platform extended during the WebMCP Challenge with an AI Operations Agent.

The agent monitors the processing pipeline and uses [`@mcpxx/sdk`](https://www.npmjs.com/package/@mcpxx/sdk) to delegate consequential multi-service workflows to MCPx, where execution, reconciliation, and human-approved compensation are handled reliably.

- **Live FileFlow Operator**: [https://file-flow-test.vercel.app/operator](https://file-flow-test.vercel.app/operator)
- **Live MCPx Control Plane**: [https://mcpx-mcpx-web.vercel.app/app](https://mcpx-mcpx-web.vercel.app/app)

> [!NOTE]
> FileFlow existed before the challenge and was meaningfully extended during the WebMCP Challenge with the AI Operations Agent and `@mcpxx/sdk` workflow integration. MCPx itself is 100% newly created for the challenge.

---

## WebMCP Challenge Work

- **MCPx (New Project Built for Challenge)**:
  - Complete control plane and DAG execution engine (`apps/mcpx-web`)
  - WebMCP Browser Runner executing native `document.modelContext` tools
  - PostgreSQL-backed durable WAL and sequenced event stream
  - Published TypeScript SDK: [`@mcpxx/sdk`](https://www.npmjs.com/package/@mcpxx/sdk)
  - 4 reference WebMCP services with isolated tenant schemas and workloads (`database-app`, `compute-app`, `routing-app`, `frontend-app`)
- **FileFlow (Existing Project Used as Reference Consumer)**:
  - Pre-existing distributed file processing platform.
  - **Extended for WebMCP Challenge with**:
    - Natural language AI Operations Agent
    - `@mcpxx/sdk` workflow integration
    - Human confirmation dialog before consequential operations
    - Live SSE transaction streaming and uncertainty status indicators
    - One-click rollback approval UI
    - Transaction deep-links directly into the MCPx control plane

---

## Live Demo & Evaluator Guide

- **MCPx Control Plane**: [https://mcpx-mcpx-web.vercel.app/app](https://mcpx-mcpx-web.vercel.app/app)
- **FileFlow AI Operator**: [https://file-flow-test.vercel.app/operator](https://file-flow-test.vercel.app/operator)

### Quick Evaluation Steps:
1. Open Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled (or ChatGPT WebMCP-capable browser).
2. Open the MCPx Dashboard at [https://mcpx-mcpx-web.vercel.app/app](https://mcpx-mcpx-web.vercel.app/app) and confirm the **WebMCP Runner** shows green **ACTIVE**.
3. Open FileFlow Operator at [https://file-flow-test.vercel.app/operator](https://file-flow-test.vercel.app/operator) and paste:
   ```text
   Provision a production processing workspace called invoices-prod with four workers.
   ```
4. Click **Confirm & Provision**.
5. Observe the Routing step transition through `IN_DOUBT` $\rightarrow$ `RECOVERED`.
6. Click **Approve Rollback** after Frontend rejection to see verified reverse Saga compensation.
7. Click **View in MCPx** to inspect the full transaction ledger in PostgreSQL.

See [`docs/judge-testing.md`](./docs/judge-testing.md) for full evaluator details.

---

## Local Setup & Quickstart

### Prerequisites
- **Node.js**: v20.x or later
- **pnpm**: v10.23.0
- **Docker**: For local PostgreSQL container
- **Browser**: Chrome Canary with `#enable-webmcp-testing` enabled

### 1. Clone & Bootstrap
```bash
git clone https://github.com/o1-spec/mcpx.git
cd mcpx

# One-command bootstrap (copies .env, starts PostgreSQL, installs dependencies)
pnpm bootstrap
```

### 2. Start Development Servers
```bash
# Starts all 6 services and coordinator concurrently
pnpm dev
```

Visit **`http://localhost:3000`** in your browser.

---

## Environment Variables

| Variable | Service | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `mcpx-web`, reference apps | PostgreSQL connection string | `postgresql://mcpx:mcpx@localhost:5435/mcpx_control` |
| `NEXT_PUBLIC_MCPX_ORIGIN` | `mcpx-web` | Public origin of coordinator | `http://localhost:3000` |
| `NEXT_PUBLIC_ROUTING_ORIGIN` | `mcpx-web` | Routing reference service origin | `http://localhost:3001` |
| `NEXT_PUBLIC_DATABASE_ORIGIN` | `mcpx-web` | Database reference service origin | `http://localhost:3002` |
| `NEXT_PUBLIC_COMPUTE_ORIGIN` | `mcpx-web` | Compute reference service origin | `http://localhost:3003` |
| `NEXT_PUBLIC_FRONTEND_ORIGIN` | `mcpx-web` | Frontend reference service origin | `http://localhost:3004` |

---

## TypeScript SDK (`@mcpxx/sdk`)

MCPx provides `@mcpxx/sdk` for external applications and AI agents that want to delegate consequential workflows to the MCPx reliability runtime.

- **npm package**: [https://www.npmjs.com/package/@mcpxx/sdk](https://www.npmjs.com/package/@mcpxx/sdk)

```bash
npm install @mcpxx/sdk@beta
```

```ts
import { MCPx } from "@mcpxx/sdk";

const mcpx = new MCPx({
  endpoint: process.env.MCPX_BASE_URL || "http://localhost:3000",
});

// Trigger a multi-service workflow
const run = await mcpx.workflows.run("deploy-infrastructure", {
  workspaceName: "invoices-prod",
  workerCount: 4,
});

console.log(`Transaction ID: ${run.id}`);
console.log(`Console URL:    ${run.consoleUrl}`);

// Subscribe to live Server-Sent Events (SSE)
for await (const event of run.events()) {
  console.log(`[${event.nodeLabel || "tx"}] -> ${event.type}`);
}

// Await completion or operator approval requirement
const result = await run.wait();
console.log(`Status: ${result.status}`);
```

---

## Automated Verification & Tests

```bash
# Run SDK unit & contract tests
pnpm test:sdk

# Run workspace typecheck
pnpm typecheck

# Run linter across all packages
pnpm lint

# Production build test
pnpm -r build
```

---

## Limitations

- **Browser Runner Requirement**: Live browser tool execution currently requires an active compatible browser tab with WebMCP enabled.
- **Reliability Mapping**: Microservices must expose an authoritative inspection tool (query by `operationKey`) to support automated `IN_DOUBT` recovery.
- **Compensation Support**: Sagas can only compensate actions where the underlying application exposes a safe reverse deletion/cancellation tool.

---

## License

This project is licensed under the [Apache-2.0 License](./LICENSE).
