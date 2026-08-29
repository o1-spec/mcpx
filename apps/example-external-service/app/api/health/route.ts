import { NextResponse } from "next/server";
import { pool, getExampleStoreCounts } from "@/lib/db";

export async function GET() {
  let dbStatus = "healthy";
  let counts = { activeWidgets: 0, activePublications: 0 };

  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();

    counts = await getExampleStoreCounts();
  } catch {
    dbStatus = "unreachable";
  }

  return NextResponse.json({
    status: dbStatus === "healthy" ? "healthy" : "degraded",
    service: "example-external-service",
    role: "External 5th WebMCP Service Provider",
    database: dbStatus,
    activeWidgets: counts.activeWidgets,
    activePublications: counts.activePublications,
    timestamp: new Date().toISOString(),
  });
}
