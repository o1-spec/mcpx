import { NextRequest, NextResponse } from "next/server";
import { routeStore, RouteRecord } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationKey = searchParams.get("operationKey");

  if (!operationKey) {
    // Return all routes for administrative/debug UI purposes
    return NextResponse.json({
      exists: false,
      routes: Array.from(routeStore.values()),
    });
  }

  const existingRoute = routeStore.get(operationKey);
  if (existingRoute) {
    return NextResponse.json({
      exists: true,
      route: existingRoute,
      routeUrl: `http://localhost:3001/r/${existingRoute.projectName}`,
    });
  }

  return NextResponse.json({
    exists: false,
  });
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

    const existing = routeStore.get(operationKey);
    if (existing) {
      return NextResponse.json({
        status: "already_exists",
        route: existing,
        routeUrl: `http://localhost:3001/r/${existing.projectName}`,
      });
    }

    const newRoute: RouteRecord = {
      id: crypto.randomUUID(),
      projectName,
      targetUrl,
      operationKey,
      createdAt: new Date().toISOString(),
    };

    routeStore.set(operationKey, newRoute);

    return NextResponse.json(
      {
        status: "created",
        route: newRoute,
        routeUrl: `http://localhost:3001/r/${newRoute.projectName}`,
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

  if (routeStore.has(operationKey)) {
    routeStore.delete(operationKey);
    return NextResponse.json({
      status: "deleted",
      operationKey,
    });
  }

  return NextResponse.json({
    status: "already_absent",
    operationKey,
  });
}
