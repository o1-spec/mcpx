# MCPx Interactive Demo & Evaluation Walkthrough

This document provides a guided walkthrough for evaluators, reviewers, and judges to test the full reliability lifecycle of MCPx.

---

## 1. Starting the Platform

Ensure PostgreSQL is running and launch all 6 monorepo applications:

```bash
# 1. Start PostgreSQL
pnpm db:up

# 2. Launch all services concurrently
pnpm dev
```

Open **`https://mcpx-mcpx-web.vercel.app`** in your browser.

---

## 2. Walkthrough Scenario: The Challenge Workflow

### Step 1: Navigate to the Overview / Workflows
- In the MCPx dashboard, open **Workflows** (`https://mcpx-mcpx-web.vercel.app/app/workflows`).
- Select the preconfigured **Reference Infrastructure Deployment Pipeline**.

### Step 2: Observe the 4-Service DAG Topology
The pipeline consists of four distinct WebMCP services:
1. **Database Service** (`https://mcpx-database-app.vercel.app`): Provision PostgreSQL schema.
2. **Compute Service** (`https://mcpx-compute-app.vercel.app`): Deploy microservice container.
3. **Routing Service** (`https://mcpx-routing-app.vercel.app`): Provision ingress gateway (*with simulated drop-ACK failure*).
4. **Frontend Service** (`https://mcpx-frontend-app.vercel.app`): Deploy CDN distribution (*with deliberate validation failure*).

### Step 3: Trigger Execution
- Click **"Execute Workflow"**.
- **Stage 1 (Database)**: Transitions `EXECUTING` $\rightarrow$ `SUCCEEDED`.
- **Stage 2 (Compute)**: Transitions `EXECUTING` $\rightarrow$ `SUCCEEDED`.
- **Stage 3 (Routing)**: Dispatches mutation, commits to database, but the transport ACK is dropped.
  - **State**: Transitions to `IN_DOUBT` (amber pulse).
  - **Reconciliation**: MCPx immediately triggers `RECONCILING` with `get_route`.
  - **Recovery**: Route is authoritatively found and transitions to `RECOVERED` without issuing duplicate writes.
- **Stage 4 (Frontend)**: Rejects execution before write commit.
  - **State**: Transitions to `FAILED`.

### Step 4: Operator Approval & Rollback
- The control plane pauses and presents the **Rollback Approval Safety Gate**.
- The card clearly enumerates:
  - **Existing committed resources** to be destroyed: Routing, Compute, Database.
  - **Execution sequence**: reverse dependency order (Routing $\rightarrow$ Compute $\rightarrow$ Database).
- Click **"Approve Rollback"**.
- Observe each compensating tool execute in reverse order, verifying absence at each step until reaching `COMPENSATED`.

---

## 3. Generic 3rd-Party Service Integration

To verify that MCPx is a universal product (not hardcoded to reference services):

1. Go to **Services** $\rightarrow$ **"+ Connect Service"**.
2. Enter the Example External Service:
   - **Name**: `Widget Factory`
   - **Origin**: `http://localhost:3010`
3. Click **"Discover WebMCP Tools"**.
   - Observe automatic discovery of `create_widget`, `get_widget`, `delete_widget`, `publish_widget`, `get_publication`, and `unpublish_widget`.
4. Click **"+ Create Contract"** and bind `create_widget` (Execute) to `get_widget` (Inspect) and `delete_widget` (Compensate).
5. Navigate to **Workflows** $\rightarrow$ **"+ Create Workflow"** and compose a new multi-step DAG from your newly registered contracts.
6. Execute and verify the custom transaction.
