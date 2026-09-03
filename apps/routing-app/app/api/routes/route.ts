import { NextRequest, NextResponse } from "next/server";
import {
  createRoutingResource,
  getRoutingResource,
  deleteRoutingResource,
  getAllActiveRoutingResources,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operationKey = searchParams.get("operationKey");

    if (!operationKey) {
      const routes = await getAllActiveRoutingResources();
      return NextResponse.json({
        exists: false,
        routes,
      });
    }

    const result = await getRoutingResource(operationKey);
    if (result.exists && result.route) {
      return NextResponse.json({
        exists: true,
        route: result.route,
        routeUrl: result.routeUrl,
      });
    }

    return NextResponse.json({
      exists: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { exists: false, routes: [], error: message },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectName, targetUrl, operationKey } = body;

    if (!projectName || !targetUrl || !operationKey) {
      return NextResponse.json(
        {
          error: "Missing required fields: projectName, targetUrl, operationKey",
        },
        { status: 400 }
      );
    }

    const routingOrigin = process.env.NEXT_PUBLIC_ROUTING_ORIGIN || "http://localhost:3001";
    const result = await createRoutingResource(
      projectName,
      targetUrl,
      operationKey,
      routingOrigin
    );

    return NextResponse.json(
      {
        status: result.status,
        route: result.route,
        routeUrl: result.routeUrl,
      },
      { status: result.status === "created" ? 201 : 200 }
    );
  } catch (err: unknown) {
    console.error("[routing-app] POST error:", err);
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
    const result = await deleteRoutingResource(operationKey);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[routing-app] DELETE error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
