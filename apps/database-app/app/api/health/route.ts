import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  let dbStatus = "healthy";
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
  } catch {
    dbStatus = "unreachable";
  }

  return NextResponse.json({
    status: dbStatus === "healthy" ? "healthy" : "degraded",
    service: "database-app",
    role: "PostgreSQL Resource Plane",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
