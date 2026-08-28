import { NextRequest, NextResponse } from "next/server";
import { backendStore, BackendRecord } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationKey = searchParams.get("operationKey");

  console.log("[compute-app] GET operationKey =", operationKey);

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

    console.log("[compute-app] POST operationKey =", operationKey);

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

  console.log("[compute-app] DELETE operationKey =", operationKey);

  if (!operationKey) {
    return NextResponse.json(
      { error: "Missing required parameter: operationKey" },
      { status: 400 }
    );
  }

  console.log("[compute-app] store before delete", [...backendStore.values()]);

  if (backendStore.has(operationKey)) {
    const existing = backendStore.get(operationKey);
    const resourceId = existing?.id;
    backendStore.delete(operationKey);

    // Local authoritative post-deletion assertion
    if (backendStore.has(operationKey)) {
      throw new Error("BACKEND_COMPENSATION_PRECONDITION_FAILED: resource still in store after delete");
    }

    console.log("[compute-app] store after delete", [...backendStore.values()]);

    return NextResponse.json({
      status: "deleted",
      operationKey,
      resourceId,
    });
  }

  console.log("[compute-app] store after delete (already absent)", [...backendStore.values()]);

  return NextResponse.json({
    status: "already_absent",
    operationKey,
  });
}
