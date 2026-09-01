import { MCPx } from "@mcpx/sdk";

async function main() {
  const endpoint = process.env.MCPX_URL || "http://localhost:3000";
  const apiKey = process.env.MCPX_API_KEY;

  console.log("==================================================");
  console.log("MCPx SDK PRODUCTION INTEGRATION DEMO");
  console.log("==================================================");
  console.log(`Connecting to MCPx Coordinator: ${endpoint}\n`);

  const mcpx = new MCPx({
    endpoint,
    apiKey,
    timeoutMs: 30_000,
  });

  // 1. Health & System Info
  try {
    const info = await mcpx.getServerInfo();
    console.log(`[Runtime] ${info.name} v${info.version} (API ${info.apiVersion})`);
    console.log(`[Capabilities] Durable Transactions: ${info.capabilities.durableTransactions}, Event Streaming: ${info.capabilities.eventStreaming}\n`);
  } catch {
    console.log("[Runtime] Connected to MCPx coordinator.\n");
  }

  // 2. Discover Workflows
  const workflows = await mcpx.workflows.list();
  console.log(`Found ${workflows.length} configured workflow(s) in registry:`);
  for (const wf of workflows) {
    console.log(` - ${wf.name} (${wf.nodeCount} steps) [ID: ${wf.id}]`);
  }

  if (workflows.length === 0) {
    console.log("\nNo workflows found in registry. Please create a workflow in the Console or run reference fixtures.");
    return;
  }

  const selectedWorkflow = workflows[0]!;
  console.log(`\n▶ Starting workflow: "${selectedWorkflow.name}"...`);

  // 3. Start Workflow Run via SDK
  const run = await mcpx.workflows.run(selectedWorkflow.id, {
    projectName: "storefront-production",
    requestedBy: "ai-deploy-agent",
  });

  console.log(`\n[MCPx] Transaction initialized: ${run.id}`);
  console.log(`[MCPx] Initial state: ${run.status}`);
  console.log(`[MCPx] Console URL: ${run.consoleUrl}\n`);
  console.log("---------------- Live Event Stream ----------------");

  // 4. Stream Live State Transitions & Handle Approval Policies
  (async () => {
    try {
      for await (const event of run.events()) {
        const nodeStr = event.nodeLabel ? `[${event.nodeLabel}]` : "[Transaction]";
        const typeStr = event.type.replace(/^NODE_|^TRANSACTION_/, "");
        const detailsStr = event.details && Object.keys(event.details).length > 0
          ? `(${JSON.stringify(event.details)})`
          : "";
        console.log(` #${event.sequence} ${nodeStr.padEnd(24)} ${typeStr.padEnd(16)} ${detailsStr}`);

        // Handle programmatic approval gate
        if (event.type === "TRANSACTION_AWAITING_APPROVAL") {
          console.log("\n⚠️  [Policy Gate] Downstream step failed. Transaction requires compensation approval.");
          console.log("▶ [Policy Agent] Approving reverse compensation rollback programmatically...\n");
          await new Promise((r) => setTimeout(r, 600));
          await run.approveCompensation({
            reason: "Auto-approved by policy agent for test demo",
            decidedBy: "policy-bot@company.internal",
          });
        }
      }
    } catch {
      // Event stream finished
    }
  })();

  // 5. Wait for Terminal Completion
  const result = await run.wait({ timeoutMs: 45_000 });

  console.log("\n---------------- Terminal Outcome -----------------");
  console.log(`Final Status:    ${result.status}`);
  console.log(`Transaction ID:  ${result.transactionId}`);
  console.log(`Execution Time:  ${result.durationMs}ms`);
  console.log(`Console Link:    ${result.consoleUrl}`);

  if (result.status === "COMMITTED") {
    console.log("\nOutputs Established:");
    for (const [nodeId, out] of Object.entries(result.outputs)) {
      console.log(` - ${nodeId}: ${JSON.stringify(out)}`);
    }
  } else if (result.status === "COMPENSATED") {
    console.log(`\nCompensated Steps: ${result.compensatedNodes.join(", ")}`);
    if (result.reason) console.log(`Reason: ${result.reason}`);
  } else {
    console.log(`\nError: ${result.error}`);
  }

  console.log("==================================================\n");
}

main().catch((err) => {
  console.error("\n[Error] SDK Demo encountered an error:", err);
  process.exit(1);
});
