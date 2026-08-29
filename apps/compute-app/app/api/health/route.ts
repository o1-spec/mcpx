import { NextResponse } from "next/server";
import { pool, getAllActiveComputeResources } from "@/lib/db";

export async function GET() {
  let dbStatus = "healthy";
  let activeCount = 0;

  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();

    const active = await getAllActiveComputeResources();
    activeCount = active.length;
  } catch {
    dbStatus = "unreachable";
  }

  return NextResponse.json({
    status: dbStatus === "healthy" ? "healthy" : "degraded",
    service: "compute-app",
    role: "Compute Runtime",
    database: dbStatus,
    activeBackends: activeCount,
    timestamp: new Date().toISOString(),
  });
}
