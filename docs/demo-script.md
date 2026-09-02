# MCPx Video Demo Script (2:45 Target)

**Video Goal**: Show a real, working product within the first 10 seconds, highlight the centerpiece `IN_DOUBT` recovery moment, demonstrate human approval rollback, and finish inside the MCPx durable control plane.

---

### Timing Breakdown

| Time | Visual on Screen | Spoken Narration / Action |
| :--- | :--- | :--- |
| **0:00 – 0:15** | Screen shows FileFlow Operator UI (`/operator`). User types prompt. | "When AI agents perform multi-step actions across web apps, a simple lost network acknowledgement can cause catastrophic duplicate writes or broken state. Here in FileFlow, our AI Operator wants to provision a 4-tier infrastructure workspace." |
| **0:15 – 0:35** | User enters: `Provision a production processing workspace called invoices-prod with four workers`. Confirmation modal appears. User clicks **Confirm & Provision**. | "The agent interprets user intent and plans the operation through the `@mcpxx/sdk`. The human confirms the action, and MCPx begins coordinating live WebMCP tools in the browser." |
| **0:35 – 1:05** | Live DAG step-by-step execution: Database turns green (`SUCCEEDED`), Compute turns green (`SUCCEEDED`). | "Database schema is created via WebMCP. Backend compute deploys next. Each step is durably sequenced in PostgreSQL and streamed to FileFlow over Server-Sent Events." |
| **1:05 – 1:40** | **The Centerpiece Moment**: Routing step turns Amber (`IN_DOUBT`). Banner indicates ACK lost in transit. | "Now watch the Routing step. The route commits, but the network acknowledgement is dropped. A naive agent would retry and create duplicate routes. Instead, MCPx enters **IN_DOUBT**, automatically runs authoritative inspection with `get_route`, finds the committed resource, and safely transitions to **RECOVERED** without re-issuing the write." |
| **1:40 – 2:05** | Frontend step fails (`FAILED`). An **Approve Rollback** banner appears in FileFlow. | "Next, the Frontend step encounters an upstream validation rejection. Rather than leaving orphaned databases and servers running, MCPx halts safely in `AWAITING_COMPENSATION_APPROVAL`." |
| **2:05 – 2:25** | User clicks **Approve Rollback**. DAG unrolls in reverse order: Routing $\rightarrow$ Compute $\rightarrow$ Database. | "The operator approves the rollback. MCPx executes the Saga in strict reverse dependency order: deleting the Route, tearing down Compute, and dropping the Database schema — authoritatively verifying each resource is gone." |
| **2:25 – 2:45** | User clicks **View in MCPx**. Screen switches to MCPx Control Plane (`https://mcpx-mcpx-web.vercel.app/app/transactions/tx:...`). Shows durable audit timeline, sequence numbers, and state. | "Clicking 'View in MCPx' takes us to the durable control plane, where every state transition, lock, and idempotency key is permanently recorded in PostgreSQL." |
| **2:45 – 2:50** | Final slide / MCPx Dashboard view. | "WebMCP makes structured agent actions possible. MCPx makes those actions reliable." |
