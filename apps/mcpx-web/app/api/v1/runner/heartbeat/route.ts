import { NextRequest, NextResponse } from "next/server";
import { pool, initCoordinatorDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await initCoordinatorDb();
    const body = await request.json().catch(() => ({}));
    const runnerId = body.runnerId;

    if (!runnerId || typeof runnerId !== "string") {
      return NextResponse.json({ error: "Missing required field: runnerId" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Clean up dead runners older than 20 seconds
      await client.query(
        `DELETE FROM runner_workers WHERE last_heartbeat_at < NOW() - INTERVAL '20 seconds'`
      );

      // Register / update this runner's heartbeat
      await client.query(
        `INSERT INTO runner_workers (id, last_heartbeat_at, metadata)
         VALUES ($1, NOW(), $2)
         ON CONFLICT (id) DO UPDATE SET
           last_heartbeat_at = NOW(),
           metadata = EXCLUDED.metadata`,
        [runnerId, JSON.stringify(body.metadata || {})]
      );

      const countRes = await client.query(`SELECT COUNT(*)::int as count FROM runner_workers`);
      const activeRunners = countRes.rows[0]?.count ?? 1;

      return NextResponse.json({
        success: true,
        activeRunners,
        runnerId,
      });
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-runner] POST /api/v1/runner/heartbeat failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
