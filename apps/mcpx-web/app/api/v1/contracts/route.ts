import { NextRequest, NextResponse } from "next/server";
import { pool, createReliabilityContract, initCoordinatorDb } from "@/lib/db";

export async function GET() {
  try {
    await initCoordinatorDb();
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT c.id, c.service_id, s.name as service_name, c.name, c.execute_tool_name, 
                c.inspect_tool_name, c.compensate_tool_name, c.operation_key_field, 
                c.assertions, c.status, c.created_at, c.updated_at
         FROM reliability_contracts c
         LEFT JOIN connected_services s ON c.service_id = s.id
         ORDER BY c.created_at DESC`
      );

      const contracts = res.rows.map((row) => ({
        id: row.id,
        serviceId: row.service_id,
        serviceName: row.service_name,
        name: row.name,
        executeToolName: row.execute_tool_name,
        inspectToolName: row.inspect_tool_name,
        compensateToolName: row.compensate_tool_name,
        operationKeyField: row.operation_key_field,
        assertions: typeof row.assertions === "string" ? JSON.parse(row.assertions) : row.assertions || {},
        status: row.status,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      }));

      return NextResponse.json({ contracts });
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] GET /api/v1/contracts failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initCoordinatorDb();
    const body = await request.json();
    const {
      serviceId,
      name,
      executeToolName,
      inspectToolName,
      compensateToolName,
      operationKeyField = "operationKey",
      assertions = {},
    } = body;

    if (!serviceId || !name || !executeToolName || !inspectToolName) {
      return NextResponse.json(
        { error: "Missing required fields: serviceId, name, executeToolName, inspectToolName" },
        { status: 400 }
      );
    }

    const contract = await createReliabilityContract({
      serviceId,
      name,
      executeToolName,
      inspectToolName,
      compensateToolName,
      operationKeyField,
      assertions: {
        executeIdempotent: Boolean(assertions.executeIdempotent ?? true),
        inspectAuthoritative: Boolean(assertions.inspectAuthoritative ?? true),
        compensateRetrySafe: Boolean(assertions.compensateRetrySafe ?? true),
      },
      status: "READY",
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] POST /api/v1/contracts failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
