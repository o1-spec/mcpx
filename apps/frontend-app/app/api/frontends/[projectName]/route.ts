import { NextRequest, NextResponse } from "next/server";
import { getFrontendResourceByProjectName } from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectName: string }> }
) {
  const { projectName } = await context.params;

  if (!projectName) {
    return NextResponse.json(
      { error: "Missing required parameter: projectName" },
      { status: 400 }
    );
  }

  const result = await getFrontendResourceByProjectName(projectName);
  if (result.exists && result.frontend) {
    return NextResponse.json({
      exists: true,
      frontend: result.frontend,
    });
  }

  return NextResponse.json(
    {
      exists: false,
      error: `No active frontend deployment found for project '${projectName}'`,
    },
    { status: 404 }
  );
}
