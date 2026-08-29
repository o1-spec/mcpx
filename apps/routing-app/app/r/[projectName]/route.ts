import { NextRequest, NextResponse } from "next/server";
import { getRoutingResourceByProjectName } from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectName: string }> }
) {
  const { projectName } = await context.params;

  console.log("[routing-app] GET /r/[projectName] projectName =", projectName);

  const res = await getRoutingResourceByProjectName(projectName);

  if (!res.exists || !res.route) {
    return NextResponse.json(
      {
        status: "not_found",
        error: `Route for project '${projectName}' not found in routing gateway or has been compensated.`,
      },
      {
        status: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  const route = res.route;

  // Gateway Proxy: fetch target URL (e.g. compute backend runtime health)
  try {
    const targetRes = await fetch(route.targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "MCPx-Routing-Gateway/1.0",
      },
      cache: "no-store",
    });

    const targetData = await targetRes.json().catch(() => ({ status: "opaque_response" }));

    return NextResponse.json(
      {
        gateway: "mcpx-routing-gateway",
        projectName: route.projectName,
        routeId: route.id,
        targetUrl: route.targetUrl,
        targetStatus: targetRes.status,
        backendResponse: targetData,
      },
      {
        status: targetRes.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "X-MCPx-Route-Id": route.id,
        },
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        gateway: "mcpx-routing-gateway",
        projectName: route.projectName,
        routeId: route.id,
        targetUrl: route.targetUrl,
        error: `Failed to proxy upstream target: ${errorMsg}`,
      },
      {
        status: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
