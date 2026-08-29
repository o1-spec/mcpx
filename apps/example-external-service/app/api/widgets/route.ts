import { NextRequest, NextResponse } from "next/server";
import {
  createWidget,
  getWidget,
  deleteWidget,
  getExampleStoreCounts,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationKey = searchParams.get("operationKey");

  if (!operationKey) {
    const counts = await getExampleStoreCounts();
    return NextResponse.json({
      exists: false,
      counts,
    });
  }

  const result = await getWidget(operationKey);
  if (result.exists && result.widget) {
    return NextResponse.json({
      exists: true,
      widget: result.widget,
      resourceId: result.widget.id,
      name: result.widget.name,
      operationKey: result.widget.operationKey,
      createdAt: result.widget.createdAt,
    });
  }

  return NextResponse.json({
    exists: false,
    operationKey,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, operationKey } = body;

    if (!operationKey) {
      return NextResponse.json(
        { error: "Missing required field 'operationKey'" },
        { status: 400 }
      );
    }

    const result = await createWidget(name || "Widget", operationKey);

    return NextResponse.json(
      {
        resourceId: result.widget.id,
        name: result.widget.name,
        operationKey: result.widget.operationKey,
        created: true,
        status: result.status,
      },
      { status: result.status === "created" ? 201 : 200 }
    );
  } catch (err: unknown) {
    console.error("[example-external-service] POST /api/widgets error:", err);
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
      { error: "Missing required parameter 'operationKey'" },
      { status: 400 }
    );
  }

  try {
    const result = await deleteWidget(operationKey);
    return NextResponse.json({
      deleted: result.deleted,
      operationKey,
    });
  } catch (err: unknown) {
    console.error("[example-external-service] DELETE /api/widgets error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
