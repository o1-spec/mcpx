import { NextRequest, NextResponse } from "next/server";
import { databaseStore, DatabaseRecord } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationKey = searchParams.get("operationKey");

  if (!operationKey) {
    return NextResponse.json({
      exists: false,
      databases: Array.from(databaseStore.values()),
    });
  }

  const existing = databaseStore.get(operationKey);
  if (existing) {
    return NextResponse.json({
      exists: true,
      database: existing,
    });
  }

  return NextResponse.json({
    exists: false,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, operationKey } = body;

    if (!name || !operationKey) {
      return NextResponse.json(
        { error: "Missing required fields: name, operationKey" },
        { status: 400 }
      );
    }

    const existing = databaseStore.get(operationKey);
    if (existing) {
      return NextResponse.json({
        status: "already_exists",
        database: existing,
      });
    }

    const newDb: DatabaseRecord = {
      id: crypto.randomUUID(),
      name,
      operationKey,
      createdAt: new Date().toISOString(),
    };

    databaseStore.set(operationKey, newDb);

    return NextResponse.json(
      {
        status: "created",
        database: newDb,
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

  if (databaseStore.has(operationKey)) {
    databaseStore.delete(operationKey);
    return NextResponse.json({
      status: "deleted",
    });
  }

  return NextResponse.json({
    status: "already_absent",
  });
}
