import { NextRequest, NextResponse } from "next/server";
import { backendStore } from "@/lib/store";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await context.params;

  console.log("[compute-app] GET /runtime/[resourceId]/health resourceId =", resourceId);

  const backend = Array.from(backendStore.values()).find((b) => b.id === resourceId);

  if (!backend) {
    return NextResponse.json(
      {
        status: "not_found",
        error: `Backend resource '${resourceId}' does not exist or has been compensated.`,
      },
      {
        status: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  return NextResponse.json(
    {
      status: "healthy",
      service: "mcpx-demo-backend",
      resourceId: backend.id,
      projectName: backend.projectName,
      databaseResourceId: backend.databaseResourceId,
      operationKey: backend.operationKey,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
