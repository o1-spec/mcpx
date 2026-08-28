import { NextRequest, NextResponse } from "next/server";
import {
  createRealDatabase,
  getRealDatabase,
  deleteRealDatabase,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationKey = searchParams.get("operationKey");

  if (!operationKey) {
    return NextResponse.json({
      exists: false,
      error: "Missing required parameter: operationKey",
    });
  }

  try {
    const result = await getRealDatabase(operationKey);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { exists: false, error: msg },
      { status: 500 }
    );
  }
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

    const result = await createRealDatabase(name, operationKey);

    return NextResponse.json(
      result,
      { status: result.status === "created" ? 201 : 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[database-app] POST /api/databases failed:", err);
    return NextResponse.json(
      { error: `Database creation failed: ${msg}` },
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
    const result = await deleteRealDatabase(operationKey);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[database-app] DELETE /api/databases failed:", err);
    return NextResponse.json(
      { error: `Database compensation failed: ${msg}` },
      { status: 500 }
    );
  }
}
