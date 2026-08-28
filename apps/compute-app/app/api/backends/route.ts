import { NextRequest, NextResponse } from "next/server";
import { backendStore, BackendRecord } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationKey = searchParams.get("operationKey");

  if (!operationKey) {
    return NextResponse.json({
      exists: false,
      backends: Array.from(backendStore.values()),
    });
  }

  const existing = backendStore.get(operationKey);
  if (existing) {
    return NextResponse.json({
      exists: true,
      backend: existing,
    });
  }

  return NextResponse.json({
    exists: false,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectName, databaseResourceId, operationKey } = body;

    if (!projectName || !operationKey) {
      return NextResponse.json(
        { error: "Missing required fields: projectName, operationKey" },
        { status: 400 }
      );
    }

    const existing = backendStore.get(operationKey);
    if (existing) {
      return NextResponse.json({
        status: "already_exists",
        backend: existing,
      });
    }

    const newBackend: BackendRecord = {
      id: crypto.randomUUID(),
      projectName,
      databaseResourceId: databaseResourceId || "none",
      operationKey,
      healthUrl: `http://localhost:3003/health/${projectName}`,
      createdAt: new Date().toISOString(),
    };

    backendStore.set(operationKey, newBackend);

    return NextResponse.json(
      {
        status: "created",
        backend: newBackend,
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

  if (backendStore.has(operationKey)) {
    backendStore.delete(operationKey);
    return NextResponse.json({
      status: "deleted",
    });
  }

  return NextResponse.json({
    status: "already_absent",
  });
}
