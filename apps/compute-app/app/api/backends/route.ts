import { NextRequest, NextResponse } from "next/server";
import {
  createComputeResource,
  getComputeResource,
  deleteComputeResource,
  getAllActiveComputeResources,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operationKey = searchParams.get("operationKey");

    if (!operationKey) {
      const backends = await getAllActiveComputeResources();
      return NextResponse.json({
        exists: false,
        backends,
      });
    }

    const result = await getComputeResource(operationKey);
    if (result.exists && result.backend) {
      return NextResponse.json({
        exists: true,
        backend: result.backend,
        healthUrl: result.backend.healthUrl,
      });
    }

    return NextResponse.json({
      exists: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { exists: false, backends: [], error: message },
      { status: 200 }
    );
  }
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

    const computeOrigin = process.env.NEXT_PUBLIC_COMPUTE_ORIGIN || "http://localhost:3003";
    const result = await createComputeResource(
      projectName,
      databaseResourceId,
      operationKey,
      computeOrigin
    );

    return NextResponse.json(
      {
        status: result.status,
        backend: result.backend,
        healthUrl: result.healthUrl,
      },
      { status: result.status === "created" ? 201 : 200 }
    );
  } catch (err: unknown) {
    console.error("[compute-app] POST error:", err);
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

  console.log("[compute-app] DELETE operationKey =", operationKey);

  if (!operationKey) {
    return NextResponse.json(
      { error: "Missing required parameter: operationKey" },
      { status: 400 }
    );
  }

  try {
    const result = await deleteComputeResource(operationKey);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[compute-app] DELETE error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
