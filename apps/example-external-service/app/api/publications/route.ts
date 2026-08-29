import { NextRequest, NextResponse } from "next/server";
import {
  publishWidget,
  getPublication,
  unpublishWidget,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationKey = searchParams.get("operationKey");

  if (!operationKey) {
    return NextResponse.json({
      exists: false,
    });
  }

  const result = await getPublication(operationKey);
  if (result.exists && result.publication) {
    return NextResponse.json({
      exists: true,
      publication: result.publication,
      resourceId: result.publication.id,
      widgetId: result.publication.widgetId,
      operationKey: result.publication.operationKey,
      createdAt: result.publication.createdAt,
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
    const { widgetId, operationKey } = body;

    if (!operationKey) {
      return NextResponse.json(
        { error: "Missing required field 'operationKey'" },
        { status: 400 }
      );
    }

    const result = await publishWidget(widgetId || "unknown", operationKey);

    return NextResponse.json(
      {
        resourceId: result.publication.id,
        published: true,
        widgetId: result.publication.widgetId,
        operationKey: result.publication.operationKey,
        status: result.status,
      },
      { status: result.status === "created" ? 201 : 200 }
    );
  } catch (err: unknown) {
    console.error("[example-external-service] POST /api/publications error:", err);
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
    const result = await unpublishWidget(operationKey);
    return NextResponse.json({
      unpublished: result.deleted,
      operationKey,
    });
  } catch (err: unknown) {
    console.error("[example-external-service] DELETE /api/publications error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
