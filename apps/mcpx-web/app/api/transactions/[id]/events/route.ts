import { NextRequest, NextResponse } from "next/server";
import { pool, initCoordinatorDb } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id: transactionId } = await params;
    const body = await request.json();
    const { type, nodeId, details = {} } = body;

    if (!type) {
      return NextResponse.json({ error: "Missing event type" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Row-level lock on transactions table to allocate sequence atomically
      const lockRes = await client.query(
        `SELECT next_event_sequence FROM transactions WHERE id = $1 FOR UPDATE`,
        [transactionId]
      );

      if (lockRes.rows.length === 0) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      const assignedSeq = lockRes.rows[0].next_event_sequence;

      // Increment sequence in transactions
      await client.query(
        `UPDATE transactions SET next_event_sequence = next_event_sequence + 1, updated_at = NOW() WHERE id = $1`,
        [transactionId]
      );

      const eventId = crypto.randomUUID();
      const insertRes = await client.query(
        `INSERT INTO transaction_events (id, transaction_id, sequence, node_id, event_type, payload, occurred_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id, sequence, node_id, event_type, payload, occurred_at`,
        [eventId, transactionId, assignedSeq, nodeId || null, type, JSON.stringify(details)]
      );

      await client.query("COMMIT");

      const row = insertRes.rows[0];
      return NextResponse.json(
        {
          success: true,
          event: {
            id: row.id,
            sequence: row.sequence,
            nodeId: row.node_id,
            type: row.event_type,
            details: typeof row.payload === "object" ? row.payload : JSON.parse(row.payload || "{}"),
            timestamp: row.occurred_at.toISOString(),
          },
        },
        { status: 201 }
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-web] POST /api/transactions/:id/events failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id: transactionId } = await params;

    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT id, sequence, node_id, event_type, payload, occurred_at 
         FROM transaction_events 
         WHERE transaction_id = $1 
         ORDER BY sequence ASC, occurred_at ASC`,
        [transactionId]
      );

      const events = res.rows.map((row) => ({
        id: row.id,
        sequence: row.sequence,
        nodeId: row.node_id,
        type: row.event_type,
        details: typeof row.payload === "object" ? row.payload : JSON.parse(row.payload || "{}"),
        timestamp: row.occurred_at.toISOString(),
      }));

      return NextResponse.json({ events });
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-web] GET /api/transactions/:id/events failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
