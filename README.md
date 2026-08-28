# MCPx

**Reliable transactions for WebMCP workflows.**

MCPx is a browser-native reliability runtime for multi-step WebMCP workflows.

WebMCP gives applications a structured way to expose actions to agents and browser orchestrators. MCPx adds the reliability layer needed when those actions span multiple applications and something goes wrong: a response disappears, the outcome of a write becomes uncertain, a downstream step fails, or previously completed work needs to be rolled back.

MCPx models consequential operations as:

```text
execute
   ↓
inspect
   ↓
compensate
```

and combines them into durable dependency-aware transactions.

The result is a workflow runtime that can explicitly represent uncertainty, reconcile against authoritative application state, recover without blindly repeating writes, and perform human-approved reverse Saga compensation when a transaction cannot complete.

---

## Why MCPx?

Consider a browser agent performing a multi-step deployment:

```text
Database
   ↓
Backend
  /     \
Routing  Frontend
```

1. The database is created successfully.
2. The backend is deployed successfully.
3. The routing action is sent and the route is created — but the browser loses the acknowledgement.

What should the runtime do?

* It cannot safely assume the action failed.
* Retrying immediately could create a duplicate resource.
* Marking the transaction failed could also be incorrect because the route may already exist.

MCPx represents this explicitly:

```text
EXECUTING
    ↓
IN_DOUBT
    ↓
RECONCILING
    ↓
RECOVERED
```

Instead of guessing, MCPx calls the application's authoritative inspection tool using the same operation identity.

If the resource exists, MCPx recovers the node without repeating the mutation.

---

## Why `IN_DOUBT` Exists

A timeout does not necessarily mean a write failed. There are at least two fundamentally different failure cases:

### Confirmed Failure

The application rejects the operation before committing any state:

```text
execute
   ↓
REJECTED_BEFORE_COMMIT
   ↓
FAILED
```

MCPx knows the resource was not created.

### Uncertain Outcome

The operation may have committed, but the caller never received the acknowledgement:

```text
execute
   ↓
side effect commits
   ↓
response disappears
   ↓
IN_DOUBT
```

In this case MCPx does **not** blindly retry the mutation. It asks the application that owns the resource:

```text
inspect(operationKey)
```

and uses that authoritative result to decide what actually happened:

```text
Resource exists
    ↓
RECOVERED

Resource explicitly absent
    ↓
retry/manual policy may apply

Inspection unavailable
    ↓
remain uncertain
```

This distinction is one of the main reliability guarantees MCPx is designed around.

---

# Architecture

MCPx currently runs as five web applications plus PostgreSQL.

```text
                         ┌─────────────────────┐
                         │      mcpx-web       │
                         │     Coordinator     │
                         │       :3000         │
                         └──────────┬──────────┘
                                    │
                         Browser-native WebMCP
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼

     ┌──────────────┐      ┌──────────────┐       ┌──────────────┐
     │ Database App │      │ Compute App  │       │ Routing App  │
     │    :3002     │      │    :3003     │       │    :3001     │
     └──────────────┘      └──────────────┘       └──────────────┘
             │                      │                      │
             │                      │                      │
             │                      └──────────┐           │
             │                                 │           │
             │                                 ▼           │
             │                         ┌──────────────┐     │
             │                         │ Frontend App │     │
             │                         │    :3004     │     │
             │                         └──────────────┘     │
             │
             ▼
     ┌─────────────────┐
     │   PostgreSQL    │
     │ Docker :5435    │
     └─────────────────┘
```

### `mcpx-web` (Coordinator)

Responsible for:
* Discovering WebMCP tools exposed by participating applications;
* Managing the connected service registry and reliability contracts;
* Compiling workflows into dependency-aware transaction nodes;
* Executing DAG transactions browser-side via `document.modelContext`;
* Tracking node and transaction state transitions;
* Reconciling uncertain outcomes (`IN_DOUBT` → `RECONCILING` → `RECOVERED`);
* Calculating reverse compensation order in topological sequence;
* Requesting human approval before destructive rollback;
* Persisting durable transaction and event state to PostgreSQL;
* Recovering transactions seamlessly across browser reloads.

The MCPx backend persists control-plane state only. Remote application mutations remain browser-side WebMCP operations.

---

### `database-app` (:3002)

Reference WebMCP database provider exposing:
```text
create_database
get_database
delete_database
```
* Provisions isolated PostgreSQL schemas: `mcpx_<resource-id>`.
* `get_database` verifies schema presence directly against PostgreSQL's catalog.
* `delete_database` performs `DROP SCHEMA ... CASCADE` and verifies absence before compensation completes.

---

### `compute-app` (:3003)

Reference compute provider exposing:
```text
deploy_backend
get_backend
delete_backend
```
* Successful backend resources expose live health endpoints: `/runtime/<resourceId>/health`.
* Returns `HTTP 200` while active; returns `HTTP 404` after compensation.

---

### `routing-app` (:3001)

Reference routing provider exposing:
```text
create_route
get_route
delete_route
```
* Created routes are reachable at `/r/<projectName>`, proxying traffic to the backend runtime.
* Route unbinding is verified absent upon compensation.

---

### `frontend-app` (:3004)

Reference frontend provider exposing:
```text
deploy_frontend
get_frontend
delete_frontend
```
* Produces live frontend preview deployments at `/preview/<projectName>`.

---

# The Reliability Contract

MCPx models each consequential operation as a **Reliability Contract**:

```text
Service: Routing

Execute
create_route

Inspect
get_route

Compensate
delete_route

Operation identity
operationKey
```

### Execute
Performs the mutation idempotently for the configured operation identity:
```typescript
create_route({
  projectName,
  targetUrl,
  operationKey
})
```

### Inspect
Returns authoritative application state for the operation:
```typescript
get_route({
  operationKey
})
```
Inspection answers what actually exists in the application owning the resource.

### Compensate
Reverses a previously completed operation:
```typescript
delete_route({
  operationKey
})
```
MCPx verifies authoritative absence after compensation before considering the rollback complete:
$$\text{delete\_route} \longrightarrow \text{get\_route} \longrightarrow \text{exists: false} \longrightarrow \text{COMPENSATED}$$

### Operation Identity
Every transaction node receives a deterministic operation identity (e.g. `tx:82d2...:routing:create`). This identity links `execute`, `inspect`, and `compensate` to the same logical resource.

---

# Transaction States

MCPx defines explicit transaction and node states:

### Node States
* `PENDING`: Awaiting runnable upstream dependencies.
* `EXECUTING`: Dispatched to WebMCP.
* `SUCCEEDED`: Mutation confirmed created.
* `IN_DOUBT`: Transport ACK lost / outcome uncertain.
* `RECONCILING`: Querying authoritative inspection tool.
* `RECOVERED`: Resource confirmed present without repeating mutation.
* `FAILED`: Confirmed rejected before commit.
* `COMPENSATING`: Executing reverse compensation.
* `COMPENSATED`: Resource confirmed absent via authoritative inspection.

### Transaction States
* `EXECUTING`: DAG actively progressing.
* `AWAITING_COMPENSATION_APPROVAL`: Safety intervention gate triggered.
* `COMPENSATING`: Executing reverse rollback.
* `COMMITTED`: All nodes successfully completed.
* `COMPENSATED`: All created resources safely rolled back.

---

# Reverse Saga Compensation

When downstream execution fails:

```text
Database  ✓
   ↓
Backend   ✓
  / \
 ↓   ↓
Routing   Frontend
RECOVERED FAILED
```

1. 3 resources exist (`Database`, `Backend`, `Routing`); `Frontend` never committed.
2. MCPx triggers `AWAITING_COMPENSATION_APPROVAL`.
3. Operator inspects the proposed rollback and approves.
4. MCPx executes compensation in strict reverse dependency order:
   $$\text{Routing} \longrightarrow \text{Backend} \longrightarrow \text{Database}$$
5. Each node verifies absence before moving to `COMPENSATED`.

---

# Connecting an External WebMCP Service

MCPx allows connecting arbitrary WebMCP applications:

1. Navigate to **Services** (`/app/services`) $\rightarrow$ **Connect service** (`/app/services/new`).
2. Provide the application origin (e.g. `https://billing.example.com` or `http://localhost:3010`).
3. MCPx loads the application offscreen with `allow="tools"` and discovers its tools via WebMCP browser context (`document.modelContext`).
4. Connected services and tool metadata snapshots persist durably in PostgreSQL.

---

# Creating a Reliability Contract

1. Navigate to **Services** $\rightarrow$ select service $\rightarrow$ **Create reliability contract**.
2. Map **Execute Tool**, **Inspect Tool**, and optional **Compensate Tool**.
3. Specify the **Operation Identity Field** (e.g. `operationKey`).
4. Confirm developer assertions (Idempotency, Authoritative Inspection, Retry-safe Compensation).
5. MCPx validates the configuration without executing remote tools and marks the contract `READY`.

---

# Composing & Running Custom Workflows

1. Navigate to **Workflows** (`/app/workflows`) $\rightarrow$ **Create workflow** (`/app/workflows/new`).
2. Add steps, map them to `READY` reliability contracts, and select dependencies.
3. Live cycle detection ensures the graph is acyclic.
4. Click **Run workflow**:
   * Preflight checks confirm participating services are connected.
   * Compiles the workflow into the unified `TransactionNode[]` engine.
   * Injects deterministic operation identities (`tx:<txId>:<stepKey>`).
   * Executes the DAG with full `IN_DOUBT` reconciliation, Saga compensation, and durable PostgreSQL event logging.

---

# Running the Reference Demo

### Happy Path
Click **Run happy path** on `/app`.
* All 4 microservices deploy successfully.
* Transaction reaches `COMMITTED`.
* Live preview, health endpoint, and routing gateway links become active.

### Challenge Scenario
Click **Run challenge** on `/app`.
* **Routing**: Transport ACK dropped $\rightarrow$ `IN_DOUBT` $\rightarrow$ authoritative inspection reconciles ground truth $\rightarrow$ `RECOVERED` without repeating write.
* **Frontend**: Rejected before commit $\rightarrow$ `FAILED`.
* **Intervention Gate**: Prompts operator to approve rollback.
* **Saga Rollback**: Safely rolls back `Routing` $\rightarrow$ `Backend` $\rightarrow$ `Database` in reverse dependency order and verifies all resources absent $\rightarrow$ `COMPENSATED`.

---

# Running Locally

### 1. Prerequisites
* Node.js (v20+)
* `pnpm`
* Docker (for PostgreSQL)
* Chrome / Chromium browser

### 2. Install dependencies
```bash
pnpm install
```

### 3. Start PostgreSQL
```bash
docker compose up -d
```
PostgreSQL control plane runs on `localhost:5435`.

### 4. Start all applications
```bash
pnpm --filter mcpx-web dev -p 3000
pnpm --filter routing-app dev -p 3001
pnpm --filter database-app dev -p 3002
pnpm --filter compute-app dev -p 3003
pnpm --filter frontend-app dev -p 3004
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

# Ports Reference

| Service | Origin | Description |
| :--- | :--- | :--- |
| **MCPx Web / Coordinator** | `http://localhost:3000` | Platform homepage, dashboard, service registry, workflow engine |
| **Routing App** | `http://localhost:3001` | Gateway route microservice |
| **Database App** | `http://localhost:3002` | PostgreSQL schema isolation provider |
| **Compute App** | `http://localhost:3003` | Backend runtime & health microservice |
| **Frontend App** | `http://localhost:3004` | Static preview hosting microservice |
| **PostgreSQL** | `localhost:5435` | Durable transaction, event, and service store |

---

# Design Principles

1. **Unknown is not failure**: A dropped response after dispatch is `IN_DOUBT`, never assumed failed.
2. **Inspect before retrying**: Query authoritative state before attempting mutations.
3. **Compensation must be verified**: Confirm resource absence before marking rollback complete.
4. **Durable before presentation**: Persist state transitions to PostgreSQL atomically before updating the UI.
5. **Human control for destructive rollback**: Automatic reconciliation for safe recovery; operator approval required for deletion.
6. **Browser is the WebMCP plane**: The coordinator orchestrates through WebMCP browser context without bypassing browser security boundaries.
