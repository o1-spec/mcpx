# Devpost Submission: MCPx — Reliability Runtime for WebMCP

## Tagline
WebMCP makes structured agent actions possible. MCPx makes those actions reliable.

---

## 1. Why is this a strong fit for WebMCP?

WebMCP allows browser-orchestrated agents to interact with web applications through structured tools exposed via `document.modelContext`. When agents execute multi-step consequential workflows across disparate services (provisioning databases, deploying containers, configuring ingress routing, assigning domain records), they encounter the fundamental reality of distributed computing in browser runtimes:

> **A network timeout, browser tab throttle, or lost acknowledgement does NOT prove a remote write failed.**

If an agent naively retries after a lost ACK, it risks duplicate database schemas, duplicate billing charges, or corrupted routing rules. If it naively aborts, it leaves orphaned resources across previous steps.

WebMCP is uniquely suited to solve this because services expose not just mutative tools, but read/inspection and compensation tools through the same standard `document.modelContext` interface. MCPx leverages WebMCP's native browser tool registration model to inspect authoritative application state and orchestrate clean Sagas without taking ownership of the microservices' internal databases.

---

## 2. How does it create a better user experience?

1. **Eliminates Ghost Failures and Blind Duplicates**: Instead of crashing when an acknowledgement drops, MCPx automatically marks the step `IN_DOUBT`, invokes the service's native authoritative inspection tool (`get_route`), and seamlessly transitions to `RECOVERED` when the resource exists.
2. **Predictable Human-in-the-Loop Safeguards**: AI agents propose actions, but humans confirm execution and approve destructive compensations. If a downstream step fails, the system safely halts in `AWAITING_COMPENSATION_APPROVAL` so an operator can review exactly what was created before rolling back.
3. **End-to-End Real-Time Observability**: Developers and operators can monitor every step, state transition, and sequenced event live through Server-Sent Events (SSE) and an interactive control plane dashboard.

---

## 3. What can people and agents now do together that was difficult before?

Before MCPx, agents executing multi-step browser actions were brittle: any transient network drop or middlebox disconnect broke the chain, forcing humans to manually inspect database consoles, cloud dashboards, and DNS records to clean up half-provisioned infrastructure.

With MCPx and WebMCP:
- **Collaborative Safe Operations**: An agent (like the FileFlow AI Operator) interprets human intent and orchestrates complex infrastructure pipelines across separate web apps.
- **Uncertainty-Aware Execution**: The agent and coordinator handle transport faults gracefully without re-submitting mutations or corrupting state.
- **Verified Reverse Compensation**: If a downstream service rejects a deployment, the human approves rollback with one click, and MCPx unrolls prior steps in strict reverse topological DAG order, verifying each resource is absent before completing.

---

## 4. How did we implement WebMCP?

MCPx implements the native WebMCP browser standard throughout:
- **Tool Registration**: Reference services register their capabilities inside iframes using `document.modelContext.registerTool(...)` with input schemas, descriptions, and `allow="tools"`.
- **Browser Runner Discovery**: The coordinator discovers live tools via `document.modelContext.getTools()` and queries fresh native `RegisteredTool` instances.
- **Native Browser Dispatch**: Dispatches mutations and inspections directly via `document.modelContext.executeTool(tool, serializedArguments)`.
- **Decoupled Architecture**: Reference microservices own their own persistence and business logic; MCPx coordinates execution solely through WebMCP tools.

---

## Architecture

```text
User / Operator
      │
      ▼
FileFlow AI Operator (Agent)
      │
      ▼ (SDK: @mcpxx/sdk)
MCPx Coordinator (Control Plane & SSE Event Stream)
      │                                   │
      ▼ (HTTP Claim / Event Stream)        ▼ (Durable WAL & Sequenced Log)
Browser Runner                     PostgreSQL Database
      │ (document.modelContext)
      ▼
Native WebMCP Layer (iframes with allow="tools")
  ├── Database Service (create_database / get_database / delete_database)
  ├── Compute Service  (deploy_backend / get_backend / delete_backend)
  ├── Routing Service  (create_route / get_route / delete_route)
  └── Frontend Service (deploy_frontend / get_frontend / delete_frontend)
```

---

## Demo Scenario: The 4-Service Resilience Challenge

1. **Database Service**: Executes `create_database` $\rightarrow$ `SUCCEEDED` (PostgreSQL schema created).
2. **Compute Service**: Executes `deploy_backend` $\rightarrow$ `SUCCEEDED` (Workload container deployed).
3. **Routing Service (Deliberate Transport ACK Loss)**:
   - `create_route` commits the ingress route.
   - MCPx intentionally injects a simulated transport drop before acknowledgement.
   - MCPx marks the step **`IN_DOUBT`**.
   - MCPx invokes `get_route` (Authoritative Inspection) with the same `operationKey`.
   - Route exists $\rightarrow$ MCPx transitions the step to **`RECOVERED`**.
4. **Frontend Service (Deliberate Rejection)**:
   - `deploy_frontend` fails with pre-commit validation rejection $\rightarrow$ **`FAILED`**.
5. **Human Approval Gate**:
   - Transaction pauses in **`AWAITING_COMPENSATION_APPROVAL`**.
   - Operator clicks **Approve Rollback**.
6. **Verified Reverse Compensation**:
   - MCPx unrolls in reverse dependency order: Routing (`delete_route`) $\rightarrow$ Compute (`delete_backend`) $\rightarrow$ Database (`delete_database`).
   - After each deletion, MCPx authoritatively inspects the service to verify the resource is completely absent.
   - Final transaction state: **`COMPENSATED`**.

---

## WebMCP Challenge Work & Prior Work Disclosure

- **MCPx (New Project)**: Built from scratch for the WebMCP Challenge, including the TypeScript SDK ([`@mcpxx/sdk`](https://www.npmjs.com/package/@mcpxx/sdk)), PostgreSQL-backed coordinator, WebMCP Browser Runner, Reliability Contract engine, and 4 reference microservices.
- **FileFlow (Existing Project)**: An existing distributed file processing platform used as the external AI-agent reference consumer. Extended during the challenge with:
  - Natural language AI Operations Agent
  - `@mcpxx/sdk` workflow integration
  - Human confirmation UI before consequential provisioning
  - Real-time SSE transaction visualization
  - One-click rollback approval UI
  - Direct deep link to the durable MCPx control plane

---

## Testing Instructions

See [`docs/judge-testing.md`](./judge-testing.md) for complete step-by-step evaluator instructions.
