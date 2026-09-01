import { pool } from "../apps/mcpx-web/lib/db";

async function main() {
  const client = await pool.connect();
  try {
    const srv = await client.query("SELECT id, name, origin FROM connected_services WHERE origin = 'http://localhost:3010'");
    console.log("Active Service:", srv.rows);
    if (srv.rows.length > 0) {
      const srvId = srv.rows[0].id;
      const ctr = await client.query("SELECT id, name, status, execute_tool_name, inspect_tool_name, compensate_tool_name FROM reliability_contracts WHERE service_id = $1", [srvId]);
      console.log("Contracts:", ctr.rows);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
