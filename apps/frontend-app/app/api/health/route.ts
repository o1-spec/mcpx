import { NextResponse } from "next/server";
import { pool, getAllActiveFrontendResources } from "@/lib/db";

export async function GET() {
  let dbStatus = "healthy";
  let activeCount = 0;

  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();

    const active = await getAllActiveFrontendResources();
    activeCount = active.length;
  } catch {
    dbStatus = "unreachable";
  }

  return NextResponse.json({
    status: dbStatus === "healthy" ? "healthy" : "degraded",
    service: "frontend-app",
    role: "Frontend Host & Previews",
    database: dbStatus,
    activeFrontends: activeCount,
    timestamp: new Date().toISOString(),
  });
}
