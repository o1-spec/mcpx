import { NextResponse } from "next/server";
import { pool, getAllActiveRoutingResources } from "@/lib/db";

export async function GET() {
  let dbStatus = "healthy";
  let activeCount = 0;

  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();

    const active = await getAllActiveRoutingResources();
    activeCount = active.length;
  } catch {
    dbStatus = "unreachable";
  }

  return NextResponse.json({
    status: dbStatus === "healthy" ? "healthy" : "degraded",
    service: "routing-app",
    role: "Routing Gateway",
    database: dbStatus,
    activeRoutes: activeCount,
    timestamp: new Date().toISOString(),
  });
}
