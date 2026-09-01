import { NextResponse } from "next/server";

export async function GET() {
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
    },
  });
}
