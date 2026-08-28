import { NextRequest, NextResponse } from "next/server";
import { frontendStore, FrontendRecord } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationKey = searchParams.get("operationKey");

  if (!operationKey) {
    return NextResponse.json({
      exists: false,
      frontends: Array.from(frontendStore.values()),
    });
  }

  const existing = frontendStore.get(operationKey);
  if (existing) {
    return NextResponse.json({
      exists: true,
      frontend: existing,
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

    const existing = frontendStore.get(operationKey);
    if (existing) {
      return NextResponse.json({
        status: "already_exists",
        frontend: existing,
      });
    }

    const frontendOrigin = process.env.NEXT_PUBLIC_FRONTEND_ORIGIN || "http://localhost:3004";
    const newFrontend: FrontendRecord = {
      id: crypto.randomUUID(),
      projectName,
      backendResourceId: backendResourceId || "none",
      operationKey,
      previewUrl: `${frontendOrigin}/preview/${projectName}`,
      createdAt: new Date().toISOString(),
    };

    frontendStore.set(operationKey, newFrontend);

    return NextResponse.json(
      {
        status: "created",
        frontend: newFrontend,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 }
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

  if (frontendStore.has(operationKey)) {
    frontendStore.delete(operationKey);
    return NextResponse.json({
      status: "deleted",
    });
  }

  return NextResponse.json({
    status: "already_absent",
  });
}
