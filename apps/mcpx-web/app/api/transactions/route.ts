import { NextRequest, NextResponse } from "next/server";
import { pool, initCoordinatorDb } from "@/lib/db";
import type { TransactionNode } from "@/lib/transaction/types";

export async function POST(request: NextRequest) {
  try {
    await initCoordinatorDb();
    const body = await request.json();
    const { id, state = "CREATED", scenario, nodes = [] } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing transaction id" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert transaction with next_event_sequence = 2 (since SEQ 1 is TX_CREATED)
      const txRes = await client.query(
        `INSERT INTO transactions (id, state, scenario, next_event_sequence, created_at, updated_at)
         VALUES ($1, $2, $3, 2, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE 
         SET state = EXCLUDED.state, scenario = EXCLUDED.scenario, updated_at = NOW()
         RETURNING *`,
        [id, state, scenario]
      );

      // Insert nodes
      for (const node of nodes as TransactionNode[]) {
        await client.query(
          `INSERT INTO transaction_nodes (
            id, transaction_id, service, label, origin, execute_tool, inspect_tool,
            compensate_tool, state, operation_key, resource_id, dependencies, execute_args, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
          ON CONFLICT (transaction_id, id) DO UPDATE
          SET state = EXCLUDED.state,
              resource_id = EXCLUDED.resource_id,
              execute_args = EXCLUDED.execute_args,
              updated_at = NOW()`,
          [
            node.id,
            id,
            node.service,
            node.label,
            node.origin,
            node.executeTool,
            node.inspectTool,
            node.compensateTool,
            node.state,
            node.operationKey,
            node.resourceId || null,
            JSON.stringify(node.dependencies || []),
            JSON.stringify(node.executeArgs || {}),
          ]
        );
      }

      // Record initial event with sequence 1
      const eventId = crypto.randomUUID();
      await client.query(
        `INSERT INTO transaction_events (id, transaction_id, sequence, event_type, payload, occurred_at)
         VALUES ($1, $2, 1, 'TX_CREATED', $3, NOW())
         ON CONFLICT (transaction_id, sequence) DO NOTHING`,
        [eventId, id, JSON.stringify({ transactionId: id, scenario, totalNodes: nodes.length })]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          transaction: txRes.rows[0],
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
    console.error("[mcpx-web] POST /api/transactions failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
