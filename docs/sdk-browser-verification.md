# MCPx SDK & Browser WebMCP Verification Checklist

This document details the exact protocol for verifying that the MCPx SDK executes transactions through **native browser WebMCP** (`document.modelContext.executeTool`) and does **not** bypass the browser via ad-hoc HTTP/REST endpoints.

---

## 1. Prerequisites & Environment

- **Browser**: Google Chrome 128+ with Model Context / WebMCP flags enabled.
- **Flags**: `chrome://flags/#enable-model-context-api` or equivalent experimental WebMCP browser runtime.
- **Origins**:
  - Coordinator: `http://localhost:3000`
  - Routing Service: `http://localhost:3001`
  - Database Service: `http://localhost:3002`
  - Compute Service: `http://localhost:3003`
  - Frontend Service: `http://localhost:3004`
  - Example External Service: `http://localhost:3010`
- **Database**: PostgreSQL on `localhost:5435` (`mcpx_control`).

---

## 2. Test Scenarios

### Test Scenario 1: No Browser Runner (Server/DB Only)

1. Ensure all microservices and PostgreSQL are running (`pnpm dev`).
2. Close all browser windows/tabs visiting `http://localhost:3000`.
3. In terminal, run:
   ```bash
   pnpm demo:sdk
   ```
4. **Expected Behavior**:
   - SDK connects to MCPx coordinator.
   - Transaction is created in PostgreSQL with `ACTIVE` state.
   - Nodes are created with `PENDING` state.
   - Event `#2 RUNNER_WAITING` is emitted: `Waiting for active browser WebMCP runner...`.
   - **Crucial Invariant**: No child service resources are created or mutated. The transaction does NOT magically commit.

---

### Test Scenario 2: Real Chrome WebMCP Runner Execution

1. Open Chrome with WebMCP testing enabled.
2. Navigate to **`http://localhost:3000/app`**.
3. Verify that the sidebar indicates `WebMCP Runner: ONLINE (runner_...)`.
4. Verify embedded microservice iframes are loaded with `allow="tools"`.
5. Open Chrome DevTools Console on `http://localhost:3000/app`.
6. In terminal, execute:
   ```bash
   pnpm demo:sdk
   ```
7. **Expected Behavior**:
   - Browser runner claims the pending nodes via `POST /api/v1/runner/claim`.
   - Browser runner invokes `document.modelContext.getTools({ fromOrigins: [serviceOrigin] })`.
   - Live native `RegisteredTool` object is retrieved.
   - Browser runner invokes `document.modelContext.executeTool(nativeTool, payload)`.
   - Child iframe executes tool and returns result.
   - Browser runner reports outcome via `POST /api/v1/runner/complete`.
   - SDK live SSE stream outputs `#2 NODE_EXECUTING`, `#3 NODE_SUCCEEDED`, and `#6 TRANSACTION_COMMITTED`.

---

### Test Scenario 3: Real Chrome Challenge Scenario (In-Doubt Reconcile + Reverse Compensation)

1. With `http://localhost:3000/app` open in Chrome, initiate the challenge workflow (Routing drop-ACK + Frontend deliberate rejection).
2. **Execution Steps Observed**:
   - `create_database` $\rightarrow$ WebMCP `executeTool` succeeds.
   - `create_backend` $\rightarrow$ WebMCP `executeTool` succeeds.
   - `create_route` $\rightarrow$ Remote commit succeeds, simulated ACK loss triggers `IN_DOUBT`.
   - `get_route` $\rightarrow$ WebMCP `inspectTool` verifies route existence $\rightarrow$ transitions to `RECOVERED`.
   - `deploy_frontend` $\rightarrow$ Rejection triggers `FAILED` $\rightarrow$ transaction enters `AWAITING_COMPENSATION_APPROVAL`.
   - Operator or policy bot approves rollback via SDK/Console (`POST /api/v1/transactions/:id/compensation/approve`).
   - Browser runner executes `delete_backend` and `delete_database` in reverse order via WebMCP `executeTool(compensateNativeTool)`.
   - Post-compensation inspection confirms absence $\rightarrow$ transaction reaches `COMPENSATED`.

---

## 3. RegisteredTool Invariants

- [x] **No Deserialized Cloning**: The object passed into `document.modelContext.executeTool(tool, args)` is always a direct reference from `document.modelContext.getTools()`.
- [x] **No Stale Frame Caching**: If an iframe reloads, tools are dynamically queried afresh.
- [x] **Atomic Worker Leases**: When multiple browser tabs are open, `SELECT ... FOR UPDATE SKIP LOCKED` guarantees only one worker executes a given node at any time.
