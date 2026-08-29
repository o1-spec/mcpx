import { NextRequest, NextResponse } from "next/server";
import {
  createFrontendResource,
  getFrontendResource,
  deleteFrontendResource,
  getAllActiveFrontendResources,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationKey = searchParams.get("operationKey");

  if (!operationKey) {
    const frontends = await getAllActiveFrontendResources();
    return NextResponse.json({
      exists: false,
      frontends,
    });
  }

  const result = await getFrontendResource(operationKey);
  if (result.exists && result.frontend) {
    return NextResponse.json({
      exists: true,
      frontend: result.frontend,
    });
  }

  return NextResponse.json({
    exists: false,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectName, backendResourceId, operationKey } = body;

    if (!projectName || !operationKey) {
      return NextResponse.json(
        { error: "Missing required fields: projectName, operationKey" },
        { status: 400 }
      );
    }

    const frontendOrigin = process.env.NEXT_PUBLIC_FRONTEND_ORIGIN || "http://localhost:3004";
    const result = await createFrontendResource(
      projectName,
      backendResourceId,
      operationKey,
      frontendOrigin
    );

    return NextResponse.json(
      {
        status: result.status,
        frontend: result.frontend,
      },
      { status: result.status === "created" ? 201 : 200 }
    );
  } catch (err: unknown) {
    console.error("[frontend-app] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let operationKey = searchParams.get("operationKey");

  if (!operationKey) {
    try {
      const body = await request.json();
      operationKey = body.operationKey;
    } catch {
      // Body may not be present
    }
  }

  if (!operationKey) {
    return NextResponse.json(
      { error: "Missing required parameter: operationKey" },
      { status: 400 }
    );
  }

  try {
    const result = await deleteFrontendResource(operationKey);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[frontend-app] DELETE error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
