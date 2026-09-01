# MCPx

> **Reliable transactions for WebMCP workflows.**

[![CI](https://github.com/o1-spec/mcpx/actions/workflows/ci.yml/badge.svg)](https://github.com/o1-spec/mcpx/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)

A transactional reliability runtime for browser-orchestrated agents operating over WebMCP (Web Model Context Protocol).

[Try the Demo](http://localhost:3000) • [Architecture](./docs/architecture.md) • [Reliability Model](./docs/reliability-model.md) • [Service Contract Guide](./docs/service-contract.md) • [Interactive Walkthrough](./docs/demo.md)

```text
EXECUTING  ──(Lost Transport ACK)──>  IN_DOUBT  ──(Authoritative Inspect)──>  RECOVERED
```

---

## Why MCPx?

In distributed browser-orchestrated agents:

> **A network timeout or lost acknowledgement does NOT prove a write failed.**

```text
create_route() ──> [Remote Service Commits Write] ──x [ACK Lost in Transit]
                          │
                   Naive Retry: ⚠️ RISK OF DUPLICATE SIDE EFFECTS!
                          │
                   MCPx Runtime:
                     1. Enters IN_DOUBT
                     2. Dispatches Authoritative Inspection (get_route)
                     3. Resolves to RECOVERED without blindly reissuing the mutation
```

When an agent executes an external action, transport disruptions or browser tab throttling can drop responses after writes commit. A blind retry risks duplicate resources and data corruption. An uncoordinated abort leaves orphaned state.

MCPx reconciles uncertain outcomes by enforcing deterministic **Reliability Contracts**. For MCPx reference providers, stable operation keys make repeated calls idempotent for the same logical operation.

---

## The Reliability Contract

Every consequential action is defined as a triad:

| Action | WebMCP Tool | Semantic Role |
| :--- | :--- | :--- |
| **`01. EXECUTE`** | `create_route` | Consequential mutation correlating on `operationKey`. |
| **`02. INSPECT`** | `get_route` | Authoritative ground truth check querying backend storage. |
| **`03. COMPENSATE`** | `delete_route` | Idempotent rollback handler for safe reverse compensation. |

---

## Architecture

```text
                                 ┌─────────────────────────────────────┐
                                 │         MCPx Control Plane          │
                                 │       (Coordinator / mcpx-web)      │
                                 └─────────────────────────────────────┘
                                            │               ▲
                       browser WebMCP exec  │               │ Durable Audit Log
                                            ▼               ▼
                             ┌───────────────────┐    ┌────────────────────┐
                             │ WebMCP Iframe Hub │    │ PostgreSQL DB      │
                             │ (Origin Isolation)│    │ (Port 5435)        │
                             └───────────────────┘    └────────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
         ▼                            ▼                            ▼
┌───────────────────┐        ┌───────────────────┐        ┌───────────────────┐
│ Database Service  │        │ Compute Service   │        │ Routing Service   │
│ (Port 3002)       │        │ (Port 3003)       │        │ (Port 3001)       │
└───────────────────┘        └───────────────────┘        └───────────────────┘
```

For deeper technical details, see [Architecture Specification](./docs/architecture.md) and [Reliability Model](./docs/reliability-model.md).

---

## Reference Workflow Lifecycle

MCPx includes a 4-service reference scenario demonstrating the complete failure and recovery lifecycle:

```text
Database (Port 3002)
   ↓
Compute (Port 3003)
   ↓
Routing (Port 3001) ──> [Simulated ACK Loss] ──> IN_DOUBT ──> RECOVERED via get_route
   ↓
Frontend (Port 3004) ──> [Pre-Commit Rejection] ──> FAILED
   ↓
[Operator Approval Gate]
   ↓
Compensate in Reverse Dependency Order: Routing ──> Compute ──> Database (Verified Clean)
```

---

## Generic Extensible Product

MCPx is **not** hardcoded to reference services. You can connect compatible WebMCP applications whose tools can be mapped into MCPx reliability contracts:

1. **Connect Service**: Enter any target origin URL (e.g. `http://localhost:3010`).
2. **Discover Tools**: MCPx queries the origin's `document.modelContext` via browser WebMCP discovery.
3. **Define Contract**: Map execute, inspect, and compensation tools with correlation parameters.
4. **Compose DAG**: Build multi-step workflows with step dependency bindings.
5. **Run & Audit**: Execute with real-time state visualization and PostgreSQL persistence.

See [Service Contract Guide](./docs/service-contract.md) to integrate your own services.

---

## Local Development & Quickstart

### Prerequisites
- **Node.js**: v20.x or later
- **pnpm**: v10.x
- **Docker**: For PostgreSQL container persistence
- **Google Chrome**: With experimental WebMCP / Model Context enabled for browser RPC

### 1. Bootstrap the Environment
```bash
# Clone the repository
git clone https://github.com/your-org/mcpx.git
cd mcpx

# One-command bootstrap (copies .env, starts PostgreSQL, installs packages)
pnpm run bootstrap
```

### 2. Start All Monorepo Services
```bash
pnpm dev
```

Visit **`http://localhost:3000`** in your browser.

---

## TypeScript SDK (`@mcpxx/sdk`)

External applications and AI agents integrate with MCPx programmatically via the official [`@mcpxx/sdk`](./packages/sdk):

```bash
npm install @mcpxx/sdk@beta
```

```ts
import { MCPx } from "@mcpxx/sdk";

const mcpx = new MCPx({
  endpoint: "http://localhost:3000",
});

const run = await mcpx.workflows.run("deploy-application", {
  projectName: "storefront",
});

console.log(`Transaction ID: ${run.id}`);
console.log(`Console Link:   ${run.consoleUrl}`);

// Stream live state transitions
for await (const event of run.events()) {
  console.log(`[${event.nodeLabel || "tx"}] -> ${event.type}`);
}

// Await terminal outcome
const result = await run.wait();
console.log(`Final status: ${result.status}`);
```

To run the live SDK integration demo:

```bash
pnpm demo:sdk
```

---

## Monorepo Service Ports

| Service | Port | Directory | Purpose |
| :--- | :---: | :--- | :--- |
| **`mcpx-web`** | `3000` | [`apps/mcpx-web`](./apps/mcpx-web) | Coordinator, DAG engine, dashboard & control plane |
| **`routing-app`** | `3001` | [`apps/routing-app`](./apps/routing-app) | Reference Routing service with ACK-loss fault injection |
| **`database-app`** | `3002` | [`apps/database-app`](./apps/database-app) | Reference PostgreSQL schema service |
| **`compute-app`** | `3003` | [`apps/compute-app`](./apps/compute-app) | Reference Compute container deployment service |
| **`frontend-app`** | `3004` | [`apps/frontend-app`](./apps/frontend-app) | Reference Frontend service with deliberate failure mode |
| **`example-external`** | `3010` | [`apps/example-external-service`](./apps/example-external-service) | Generic 3rd-party WebMCP service |
| **`PostgreSQL`** | `5435` | `docker-compose.yml` | Durable transaction state & audit event store |

---

## Environment Variables

See [`.env.example`](./.env.example) for canonical defaults. Key variables include:

- `DATABASE_URL`: Connection string for PostgreSQL control plane (default: `postgresql://mcpx:mcpx@localhost:5435/mcpx_control`).
- `MCPX_PG_PORT`: Exposed PostgreSQL container port (default: `5435`).
- `NEXT_PUBLIC_*_SERVICE_URL`: Base URLs for local reference services.

---

## Automated Verification & Tests

Run the complete 12-scenario behavioral reliability test suite:

```bash
# Run behavioral test suite
pnpm test

# Run monorepo typecheck
pnpm typecheck

# Run linter
pnpm lint

# Build all monorepo workspaces
pnpm -r build
```

---

## Repository Structure

```text
mcpx/
├── apps/
│   ├── mcpx-web/                 # Control plane, DAG engine & UI
│   ├── database-app/             # Database reference service
│   ├── compute-app/              # Compute reference service
│   ├── routing-app/              # Routing reference service
│   ├── frontend-app/             # Frontend reference service
│   └── example-external-service/ # Generic 3rd-party service
├── packages/
│   └── webmcp/                   # Shared WebMCP protocol definitions & status helpers
├── tests/
│   └── integration/              # 12-scenario reliability test suite
├── docs/
│   ├── architecture.md           # Deep architectural specification
│   ├── reliability-model.md      # State machine & reconciliation model
│   ├── service-contract.md       # 3rd-party integration guide
│   └── demo.md                   # Evaluator walkthrough guide
├── scripts/
│   └── dev-bootstrap.sh          # One-command development bootstrap
├── .github/
│   └── workflows/ci.yml          # GitHub Actions CI workflow
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

---

## Limitations

- **Browser WebMCP Dependency**: Live browser tool execution relies on experimental WebMCP / Model Context browser flags or sandboxed iframe postMessage fallback.
- **Scope**: MCPx provides application-level transaction orchestration and authoritative reconciliation; it does not replace database-level consensus protocols (e.g. Raft/Paxos) for internal database clusters.

---

## License

This project is licensed under the [Apache-2.0 License](./LICENSE).
