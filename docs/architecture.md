# MCPx Architecture Specification

This document details the architectural topology, communication primitives, and state coordination model of MCPx.

---

## 1. System Overview

MCPx is a transactional reliability runtime for browser-orchestrated agents operating over WebMCP (Web Model Context Protocol).

```text
                                 ┌─────────────────────────────────────┐
                                 │         MCPx Control Plane          │
                                 │       (Coordinator / mcpx-web)      │
                                 └─────────────────────────────────────┘
                                            │               ▲
                        browser WebMCP exec │               │ Durable Events & State
                     (document.modelContext)│               │ (PostgreSQL WAL)
                                            ▼               ▼
                              ┌───────────────────┐   ┌────────────────────┐
                              │ WebMCP Iframe Hub │   │ PostgreSQL DB      │
                              │ (allow="tools")   │   │ (Port 5435)        │
                              └───────────────────┘   └────────────────────┘
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          │                            │                            │
          ▼                            ▼                            ▼
┌───────────────────┐        ┌───────────────────┐        ┌───────────────────┐
│ Database Service  │        │ Compute Service   │        │ Routing Service   │
│ (Port 3002)       │        │ (Port 3003)       │        │ (Port 3001)       │
└───────────────────┘        └───────────────────┘        └───────────────────┘
```

---

## 2. Core Subsystems

### 2.1 WebMCP Discovery & Transport
- **Transport Mechanism**: Native browser WebMCP standard `document.modelContext`.
- **Protocol Object**: `document.modelContext` exposing `getTools({ fromOrigins })` and `executeTool(tool, args)`.
- **Sandbox Isolation**: Each target service runs within a sandboxed `<iframe>` with `allow="tools"` and `exposedTo` restricting unauthorized DOM mutation while granting authorized WebMCP tool execution.

### 2.2 DAG Workflow Scheduler
- **Topological Sorting**: Multi-step workflows declare step dependencies forming a Directed Acyclic Graph (DAG).
- **Execution Order**: Independent root steps execute concurrently; dependent steps execute only when parent steps reach `SUCCEEDED` or `RECOVERED` state.
- **Correlation Propagation**: Output resource identifiers from parent nodes are automatically bound to child step inputs.

### 2.3 Uncertainty Detection & Authoritative Ground Truth
- **Timeout & ACK Loss Handling**: When an execution frame yields a network disconnection or response timeout after mutation dispatch, the node enters `IN_DOUBT`.
- **Authoritative Reconciliation**: Rather than issuing a blind re-execution (which risks duplicate external side-effects), MCPx invokes the service's contract `inspect` tool using the correlated `operationKey`.
- **Ground Truth Resolution**:
  - If the remote resource exists: transition to `RECOVERED` without redundant writes.
  - If the remote resource does not exist: transition to `FAILED`.

### 2.4 Compensation & Rollback Engine
- **LIFO Compensation**: When a downstream step suffers a confirmed terminal failure, completed upstream steps are compensated in reverse topological order.
- **Safety Gate**: Destructive rollbacks require operator approval before executing compensating mutations.
- **Absence Verification**: After invoking the `compensate` tool, MCPx queries the `inspect` tool to authoritatively prove that the remote resource was destroyed.

### 2.5 PostgreSQL Persistence & State Machine
- **Atomic State Transitions**: Transitions are guarded by row-level locks (`SELECT ... FOR UPDATE`) in PostgreSQL.
- **Monotonic Event Sequencing**: Every transition is assigned a strictly increasing integer sequence number, guaranteeing reproducible crash replay and auditable event logs.

---

## 3. Service Topology

| Service | Port | Responsibility | Reference Contract |
| :--- | :---: | :--- | :--- |
| **mcpx-web** | `3000` | Control plane, DAG engine, UI | Coordinator |
| **routing-app** | `3001` | Ingress routing & proxy gateway | `create_route` / `get_route` / `delete_route` |
| **database-app** | `3002` | Schema & database provisioning | `create_database` / `get_database` / `delete_database` |
| **compute-app** | `3003` | Backend container workload deployment | `deploy_backend` / `get_backend` / `delete_backend` |
| **frontend-app** | `3004` | Frontend client & UI hosting | `deploy_frontend` / `get_frontend` / `delete_frontend` |
| **example-external** | `3010` | 3rd-party widget & registry provider | `create_widget` / `get_widget` / `delete_widget` |
| **PostgreSQL** | `5435` | Durable audit log & transaction state | `mcpx_control` |
