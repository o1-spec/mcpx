# Judge & Evaluator Testing Guide

This guide allows an evaluator to test the complete MCPx WebMCP reliability workflow in under 3 minutes.

---

## 1. Browser Setup (Important)

MCPx uses the standard browser WebMCP APIs and is designed for WebMCP-capable browsers. Chrome with the WebMCP testing flag (`chrome://flags/#enable-webmcp-testing`) is currently verified; ChatGPT in-app browser compatibility should be verified against the deployed application.

### Chrome / Chrome Canary Setup:
1. Open Chrome (or Chrome Canary).
2. Navigate to: `chrome://flags/#enable-webmcp-testing`
3. Set the flag to **Enabled** and relaunch Chrome.

---

## 2. Live Public Deployment URLs

- **MCPx Control Plane & Coordinator**: `https://mcpx-mcpx-web.vercel.app` (or `https://mcpx-mcpx-web.vercel.app` for local evaluation)
- **FileFlow AI Operator**: `<FILEFLOW_PUBLIC_URL>` (or `https://file-flow-test.vercel.app` for local evaluation)

---

## 3. Step-by-Step Testing Walkthrough

### Step 1: Verify the WebMCP Browser Runner
1. Open the MCPx Dashboard at `https://mcpx-mcpx-web.vercel.app/app` (or `https://mcpx-mcpx-web.vercel.app/app`).
2. Look at the bottom-left sidebar status indicator:
   - Verify `WebMCP Runner: runner_...` has a **green ACTIVE** dot.
   - This indicates your browser tab is registered as an active WebMCP execution runner.

---

### Step 2: Run the Flagship Workflow from FileFlow
1. Open the FileFlow Operator at `https://file-flow-test.vercel.app/operator` (or `<FILEFLOW_PUBLIC_URL>/operator`).
2. In the AI prompt input box at the bottom, paste:
   ```text
   Provision a production processing workspace called invoices-prod with four workers.
   ```
3. Press **Enter** or click **Send**.
4. The AI Operator will formulate the infrastructure plan and present a **Confirmation Card**.
5. Click **Confirm & Provision**.

---

### Step 3: Observe Real-Time Execution & Recovery
Watch the live DAG visualization in FileFlow:
1. **Database** (`create_database`): Turns **Green** (`SUCCEEDED`) — real PostgreSQL schema created.
2. **Compute** (`deploy_backend`): Turns **Green** (`SUCCEEDED`) — container compute provisioned.
3. **Routing** (`create_route`):
   - Ingress route is committed.
   - MCPx intentionally simulates a transport ACK loss.
   - Node turns **Amber** (`IN_DOUBT`).
   - MCPx automatically invokes `get_route` (Authoritative Inspection).
   - Resource is verified present $\rightarrow$ Node turns **Green** (`RECOVERED`).
4. **Frontend** (`deploy_frontend`):
   - Fails with an intentional rejection fault $\rightarrow$ Node turns **Red** (`FAILED`).

---

### Step 4: Approve Reverse Rollback (Saga Compensation)
1. After the Frontend failure, a banner appears: **Rollback Required (Action Needed)**.
2. Click **Approve Rollback**.
3. Watch the reverse DAG unroll:
   - Routing service compensated via `delete_route`.
   - Compute service compensated via `delete_backend`.
   - Database service compensated via `delete_database`.
   - After each deletion, MCPx authoritatively inspects the service to verify the resource is absent.
4. Final status displays: **COMPENSATED (All resources cleanly rolled back)**.

---

### Step 5: Inspect the Durable Transaction in MCPx
1. Click the **View in MCPx** button in FileFlow (or open `https://mcpx-mcpx-web.vercel.app/app/transactions`).
2. Observe the full immutable transaction ledger, including:
   - Monotonic event sequence numbers (`#1` to `#16`)
   - Explicit `IN_DOUBT` and `RECONCILING` transition audit logs
   - Final `COMPENSATED` status backed by durable PostgreSQL.

---

## 4. Troubleshooting

- **Browser Runner shows "WAITING" or "OFFLINE"**:
  - Make sure `https://mcpx-mcpx-web.vercel.app/app` is open in an active browser tab with `#enable-webmcp-testing` enabled.
  - The Browser Runner claims work from the coordinator and dispatches native `document.modelContext.executeTool()` calls in that tab.
- **Database Connection**:
  - For local runs, ensure Docker is running with `docker compose up -d postgres`.
