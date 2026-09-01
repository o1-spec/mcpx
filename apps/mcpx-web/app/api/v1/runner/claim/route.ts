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

    const specificTxId = body.transactionId;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Check for transactions in COMPENSATING state first (reverse compensation work)
      const compTxRes = await client.query(
        specificTxId
          ? `SELECT id FROM transactions WHERE state = 'COMPENSATING' AND id = $1`
          : `SELECT id FROM transactions WHERE state = 'COMPENSATING' ORDER BY updated_at DESC LIMIT 10`,
        specificTxId ? [specificTxId] : []
      );

      for (const compTxRow of compTxRes.rows) {
        const txId = compTxRow.id;
        const nodesRes = await client.query(
          `SELECT id, service, label, origin, execute_tool, inspect_tool, compensate_tool,
                  state, operation_key, resource_id, dependencies, execute_args, claimed_by, lease_expires_at
           FROM transaction_nodes
           WHERE transaction_id = $1
           ORDER BY created_at ASC`,
          [txId]
        );

        const nodes = nodesRes.rows.map((row) => ({
          id: row.id,
          service: row.service,
          label: row.label,
          origin: row.origin,
          executeTool: row.execute_tool,
          inspectTool: row.inspect_tool,
          compensateTool: row.compensate_tool,
          state: row.state,
          operationKey: row.operation_key,
          resourceId: row.resource_id,
          dependencies: Array.isArray(row.dependencies) ? row.dependencies : JSON.parse(row.dependencies || "[]"),
          executeArgs: typeof row.execute_args === "object" ? row.execute_args : JSON.parse(row.execute_args || "{}"),
          claimedBy: row.claimed_by,
          leaseExpiresAt: row.lease_expires_at,
        }));

        // Find candidate for compensation: deepest dependent among SUCCEEDED / RECOVERED nodes
        const compensable = nodes
          .filter((n) => (n.state === "SUCCEEDED" || n.state === "RECOVERED") && n.compensateTool)
          .filter((n) => !n.leaseExpiresAt || new Date(n.leaseExpiresAt).getTime() < Date.now() || n.claimedBy === runnerId);

        if (compensable.length > 0) {
          // Deepest dependent first (reverse topological order)
          const targetNode = compensable[compensable.length - 1];

          await client.query(
            `UPDATE transaction_nodes
             SET claimed_by = $1, lease_expires_at = NOW() + INTERVAL '30 seconds', updated_at = NOW()
             WHERE transaction_id = $2 AND id = $3`,
            [runnerId, txId, targetNode.id]
          );

          await client.query("COMMIT");

          return NextResponse.json({
            work: {
              transactionId: txId,
              action: "COMPENSATE",
              node: targetNode,
            },
          });
        }
      }

      // 2. Check for transactions in ACTIVE state (forward DAG execution)
      const activeTxRes = await client.query(
        specificTxId
          ? `SELECT id FROM transactions WHERE state = 'ACTIVE' AND id = $1`
          : `SELECT id FROM transactions WHERE state = 'ACTIVE' ORDER BY updated_at DESC, created_at DESC LIMIT 10`,
        specificTxId ? [specificTxId] : []
      );

      for (const txRow of activeTxRes.rows) {
        const txId = txRow.id;
        const nodesRes = await client.query(
          `SELECT id, service, label, origin, execute_tool, inspect_tool, compensate_tool,
                  state, operation_key, resource_id, dependencies, execute_args, claimed_by, lease_expires_at
           FROM transaction_nodes
           WHERE transaction_id = $1
           ORDER BY created_at ASC`,
          [txId]
        );

        const nodes = nodesRes.rows.map((row) => ({
          id: row.id,
          service: row.service,
          label: row.label,
          origin: row.origin,
          executeTool: row.execute_tool,
          inspectTool: row.inspect_tool,
          compensateTool: row.compensate_tool,
          state: row.state,
          operationKey: row.operation_key,
          resourceId: row.resource_id,
          dependencies: Array.isArray(row.dependencies) ? row.dependencies : JSON.parse(row.dependencies || "[]"),
          executeArgs: typeof row.execute_args === "object" ? row.execute_args : JSON.parse(row.execute_args || "{}"),
          claimedBy: row.claimed_by,
          leaseExpiresAt: row.lease_expires_at,
        }));

        const completedNodeIds = new Set(
          nodes.filter((n) => n.state === "SUCCEEDED" || n.state === "RECOVERED").map((n) => n.id)
        );

        // Find runnable node whose dependencies are all satisfied and not currently claimed (or expired lease)
        const runnableNode = nodes.find(
          (n) =>
            (n.state === "PENDING" || (n.state === "EXECUTING" && n.leaseExpiresAt && new Date(n.leaseExpiresAt).getTime() < Date.now())) &&
            n.dependencies.every((dep: string) => completedNodeIds.has(dep)) &&
            (!n.leaseExpiresAt || new Date(n.leaseExpiresAt).getTime() < Date.now() || n.claimedBy === runnerId)
        );

        if (runnableNode) {
          const updateRes = await client.query(
            `UPDATE transaction_nodes
             SET claimed_by = $1, lease_expires_at = NOW() + INTERVAL '30 seconds', updated_at = NOW()
             WHERE transaction_id = $2 AND id = $3 AND (lease_expires_at IS NULL OR lease_expires_at < NOW() OR claimed_by = $1)`,
            [runnerId, txId, runnableNode.id]
          );

          if (updateRes.rowCount === 1) {
            // Collect upstream dependency outputs
            const upstreamOutputs: Record<string, { resourceId?: string; [key: string]: unknown }> = {};
            for (const depId of runnableNode.dependencies) {
              const depNode = nodes.find((n) => n.id === depId);
              if (depNode?.resourceId) {
                upstreamOutputs[depId] = { resourceId: depNode.resourceId };
              }
            }

            await client.query("COMMIT");

            return NextResponse.json({
              work: {
                transactionId: txId,
                action: "EXECUTE",
                node: runnableNode,
                upstreamOutputs,
              },
            });
          }
        }
      }

      await client.query("COMMIT");
      return NextResponse.json({ work: null });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-runner] POST /api/v1/runner/claim failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
