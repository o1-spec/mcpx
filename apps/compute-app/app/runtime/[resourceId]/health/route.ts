import { NextRequest, NextResponse } from "next/server";
import { getComputeResourceById } from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await context.params;

  console.log("[compute-app] GET /runtime/[resourceId]/health resourceId =", resourceId);

  const res = await getComputeResourceById(resourceId);

  if (!res.exists || !res.backend) {
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

  const backend = res.backend;

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
