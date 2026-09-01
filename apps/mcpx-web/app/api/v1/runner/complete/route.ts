import { NextRequest, NextResponse } from "next/server";
import { pool, initCoordinatorDb, executeAtomicTransition } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await initCoordinatorDb();
    const body = await request.json().catch(() => ({}));
    const {
      transactionId,
      nodeId,
      outcome,
      resourceId,
      error,
      action = "EXECUTE",
    } = body;

    if (!transactionId || !nodeId || !outcome) {
      return NextResponse.json(
        { error: "Missing required fields: transactionId, nodeId, outcome" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Release claim lease on node
      await client.query(
        `UPDATE transaction_nodes
         SET claimed_by = NULL, lease_expires_at = NULL, updated_at = NOW()
         WHERE transaction_id = $1 AND id = $2`,
        [transactionId, nodeId]
      );
    } finally {
      client.release();
    }

    // 1. Forward Execution Outcomes
    if (action === "EXECUTE") {
      if (outcome === "SUCCEEDED") {
        await executeAtomicTransition({
          transactionId,
          nodeId,
          nodeState: "SUCCEEDED",
          resourceId,
          eventType: "NODE_SUCCEEDED",
          eventPayload: { nodeId, resourceId },
        });

        // Check if all nodes in this transaction have completed
        const client2 = await pool.connect();
        try {
          const res = await client2.query(
            `SELECT state FROM transaction_nodes WHERE transaction_id = $1`,
            [transactionId]
          );
          const allCompleted = res.rows.every(
            (r) => r.state === "SUCCEEDED" || r.state === "RECOVERED"
          );
          if (allCompleted) {
            await executeAtomicTransition({
              transactionId,
              txState: "COMMITTED",
              eventType: "TRANSACTION_COMMITTED",
              eventPayload: { transactionId },
            });
          }
        } finally {
          client2.release();
        }
      } else if (outcome === "IN_DOUBT") {
        await executeAtomicTransition({
          transactionId,
          nodeId,
          nodeState: "IN_DOUBT",
          lastError: error,
          eventType: "NODE_IN_DOUBT",
          eventPayload: { nodeId, error },
        });
      } else if (outcome === "RECONCILING") {
        await executeAtomicTransition({
          transactionId,
          nodeId,
          nodeState: "RECONCILING",
          eventType: "NODE_RECONCILING",
          eventPayload: { nodeId },
        });
      } else if (outcome === "RECOVERED") {
        await executeAtomicTransition({
          transactionId,
          nodeId,
          nodeState: "RECOVERED",
          resourceId,
          eventType: "NODE_RECOVERED",
          eventPayload: { nodeId, resourceId },
        });

        // Check if all nodes in this transaction have completed
        const client2 = await pool.connect();
        try {
          const res = await client2.query(
            `SELECT state FROM transaction_nodes WHERE transaction_id = $1`,
            [transactionId]
          );
          const allCompleted = res.rows.every(
            (r) => r.state === "SUCCEEDED" || r.state === "RECOVERED"
          );
          if (allCompleted) {
            await executeAtomicTransition({
              transactionId,
              txState: "COMMITTED",
              eventType: "TRANSACTION_COMMITTED",
              eventPayload: { transactionId },
            });
          }
        } finally {
          client2.release();
        }
      } else if (outcome === "FAILED") {
        await executeAtomicTransition({
          transactionId,
          nodeId,
          nodeState: "FAILED",
          lastError: error,
          txState: "AWAITING_COMPENSATION_APPROVAL",
          eventType: "NODE_FAILED",
          eventPayload: { nodeId, error },
        });
      }
    }

    // 2. Compensation Outcomes
    if (action === "COMPENSATE") {
      if (outcome === "COMPENSATED") {
        await executeAtomicTransition({
          transactionId,
          nodeId,
          nodeState: "COMPENSATED",
          eventType: "NODE_COMPENSATED",
          eventPayload: { nodeId },
        });

        // Check if all compensable nodes in this transaction have completed compensation
        const client2 = await pool.connect();
        try {
          const res = await client2.query(
            `SELECT state, compensate_tool FROM transaction_nodes WHERE transaction_id = $1`,
            [transactionId]
          );
          const remainingToCompensate = res.rows.filter(
            (r) => (r.state === "SUCCEEDED" || r.state === "RECOVERED") && r.compensate_tool
          );

          if (remainingToCompensate.length === 0) {
            await executeAtomicTransition({
              transactionId,
              txState: "COMPENSATED",
              eventType: "TRANSACTION_COMPENSATED",
              eventPayload: { transactionId },
            });
          }
        } finally {
          client2.release();
        }
      }
    }

    return NextResponse.json({ success: true, transactionId, nodeId, outcome });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-runner] POST /api/v1/runner/complete failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
