import { NextRequest, NextResponse } from "next/server";
import { pool, initCoordinatorDb } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id: transactionId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const afterSeq = parseInt(searchParams.get("afterSequence") || "0", 10);
    const acceptHeader = request.headers.get("accept") || "";

    // If client requested SSE streaming
    if (acceptHeader.includes("text/event-stream")) {
      const responseStream = new TransformStream();
      const writer = responseStream.writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        let currentSeq = afterSeq;
        let isTerminal = false;

        try {
          while (!isTerminal) {
            if (request.signal.aborted) break;

            const client = await pool.connect();
            let newEvents: Array<{
              id: string;
              sequence: number;
              node_id: string | null;
              event_type: string;
              payload: unknown;
              occurred_at: Date;
            }> = [];
            let txState = "ACTIVE";

            try {
              const txRes = await client.query(
                `SELECT state FROM transactions WHERE id = $1`,
                [transactionId]
              );
              if (txRes.rows.length > 0) {
                txState = txRes.rows[0].state;
              }

              const res = await client.query(
                `SELECT id, sequence, node_id, event_type, payload, occurred_at 
                 FROM transaction_events 
                 WHERE transaction_id = $1 AND sequence > $2 
                 ORDER BY sequence ASC`,
                [transactionId, currentSeq]
              );

              newEvents = res.rows;
            } finally {
              client.release();
            }

            for (const row of newEvents) {
              const eventPayload = {
                id: row.id,
                sequence: row.sequence,
                transactionId,
                nodeId: row.node_id,
                type: row.event_type,
                details: typeof row.payload === "string" ? JSON.parse(row.payload) : (row.payload as Record<string, unknown> || {}),
                timestamp: row.occurred_at.toISOString(),
              };

              const sseMessage = `id: ${row.sequence}\nevent: message\ndata: ${JSON.stringify(eventPayload)}\n\n`;
              await writer.write(encoder.encode(sseMessage));
              currentSeq = Math.max(currentSeq, row.sequence);
            }

            if (
              txState === "COMMITTED" ||
              txState === "COMPENSATED" ||
              txState === "FAILED" ||
              txState === "ABORTED"
            ) {
              isTerminal = true;
              break;
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch {
          // Client disconnected or error
        } finally {
          try {
            await writer.close();
          } catch {
            // ignore
          }
        }
      })();

      return new Response(responseStream.readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Standard JSON response
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT id, sequence, node_id, event_type, payload, occurred_at 
         FROM transaction_events 
         WHERE transaction_id = $1 AND sequence > $2 
         ORDER BY sequence ASC`,
        [transactionId, afterSeq]
      );

      const events = res.rows.map((row) => ({
        id: row.id,
        sequence: row.sequence,
        transactionId,
        nodeId: row.node_id,
        type: row.event_type,
        details: typeof row.payload === "string" ? JSON.parse(row.payload) : (row.payload as Record<string, unknown> || {}),
        timestamp: row.occurred_at.toISOString(),
      }));

      return NextResponse.json({ events });
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] GET /api/v1/transactions/:id/events failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
