async function seed() {
  const endpoint = "http://localhost:3000";
  console.log("Seeding reference WebMCP services and contracts to coordinator...");

  // 1. Database Service
  const dbSrv = await fetch(`${endpoint}/api/v1/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Database Service",
      origin: "http://localhost:3002",
      tools: [
        { name: "create_database", description: "Create database schema" },
        { name: "get_database", description: "Get database schema" },
        { name: "delete_database", description: "Delete database schema" },
      ],
    }),
  }).then((r) => r.json());
  console.log("Registered Database Service:", dbSrv.service?.id || dbSrv);

  const dbCtr = await fetch(`${endpoint}/api/v1/contracts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serviceId: dbSrv.service.id,
      name: "Database Schema Contract",
      executeToolName: "create_database",
      inspectToolName: "get_database",
      compensateToolName: "delete_database",
      operationKeyField: "operationKey",
    }),
  }).then((r) => r.json());

  // 2. Compute Service
  const computeSrv = await fetch(`${endpoint}/api/v1/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Compute Service",
      origin: "http://localhost:3003",
      tools: [
        { name: "deploy_backend", description: "Deploy backend workload" },
        { name: "get_backend", description: "Inspect backend workload" },
        { name: "delete_backend", description: "Delete backend workload" },
      ],
    }),
  }).then((r) => r.json());
  console.log("Registered Compute Service:", computeSrv.service?.id || computeSrv);

  const computeCtr = await fetch(`${endpoint}/api/v1/contracts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serviceId: computeSrv.service.id,
      name: "Backend Compute Contract",
      executeToolName: "deploy_backend",
      inspectToolName: "get_backend",
      compensateToolName: "delete_backend",
      operationKeyField: "operationKey",
    }),
  }).then((r) => r.json());

  // 3. Routing Service
  const routingSrv = await fetch(`${endpoint}/api/v1/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Routing Service",
      origin: "http://localhost:3001",
      tools: [
        { name: "create_route", description: "Provision ingress route" },
        { name: "get_route", description: "Inspect ingress route" },
        { name: "delete_route", description: "Delete ingress route" },
      ],
    }),
  }).then((r) => r.json());
  console.log("Registered Routing Service:", routingSrv.service?.id || routingSrv);

  const routingCtr = await fetch(`${endpoint}/api/v1/contracts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serviceId: routingSrv.service.id,
      name: "Ingress Routing Contract",
      executeToolName: "create_route",
      inspectToolName: "get_route",
      compensateToolName: "delete_route",
      operationKeyField: "operationKey",
    }),
  }).then((r) => r.json());

  // 4. Frontend Service
  const frontendSrv = await fetch(`${endpoint}/api/v1/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Frontend Service",
      origin: "http://localhost:3004",
      tools: [
        { name: "deploy_frontend", description: "Deploy frontend client" },
        { name: "get_frontend", description: "Inspect frontend client" },
        { name: "delete_frontend", description: "Delete frontend client" },
      ],
    }),
  }).then((r) => r.json());
  console.log("Registered Frontend Service:", frontendSrv.service?.id || frontendSrv);

  const frontendCtr = await fetch(`${endpoint}/api/v1/contracts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serviceId: frontendSrv.service.id,
      name: "Frontend Deployment Contract",
      executeToolName: "deploy_frontend",
      inspectToolName: "get_frontend",
      compensateToolName: "delete_frontend",
      operationKeyField: "operationKey",
    }),
  }).then((r) => r.json());

  // 5. Create the Reference 4-Service Challenge Workflow
  const wf = await fetch(`${endpoint}/api/v1/workflows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Reference 4-Service Challenge Workflow",
      description: "Database -> Compute -> Routing (ACK drop fault) -> Frontend (Reject fault)",
      nodes: [
        { stepKey: "database", label: "Database Service", contractId: dbCtr.contract.id, dependencies: [], position: 0 },
        { stepKey: "compute", label: "Compute Service", contractId: computeCtr.contract.id, dependencies: ["database"], position: 1 },
        { stepKey: "routing", label: "Routing Service", contractId: routingCtr.contract.id, dependencies: ["compute"], position: 2 },
        { stepKey: "frontend", label: "Frontend Service", contractId: frontendCtr.contract.id, dependencies: ["routing"], position: 3 },
      ],
    }),
  }).then((r) => r.json());

  console.log("\n✓ Seeded Reference 4-Service Challenge Workflow:", wf.workflow?.id || wf);
}

seed().catch(console.error);
