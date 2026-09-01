import { NextResponse } from "next/server";
import { pool, initCoordinatorDb } from "@/lib/db";

export async function GET() {
  await initCoordinatorDb();
  let activeRunners = 0;

  try {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT COUNT(*)::int as count FROM runner_workers WHERE last_heartbeat_at > NOW() - INTERVAL '20 seconds'`
      );
      activeRunners = res.rows[0]?.count ?? 0;
    } finally {
      client.release();
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    name: "MCPx Runtime Coordinator",
    version: "0.1.0",
    apiVersion: "v1",
    capabilities: {
      durableTransactions: true,
      eventStreaming: true,
      compensationApproval: true,
      workflowManagement: true,
      serviceRegistration: true,
      browserExecutionRequired: true,
      activeRunners,
    },
    runnerStatus: activeRunners > 0 ? "ONLINE" : "WAITING_FOR_RUNNER",
  });
}
