import { pool } from "../apps/mcpx-web/lib/db";

async function main() {
  const client = await pool.connect();
  try {
    // Delete test services (will cascade to contracts and workflow nodes)
    const delSrv = await client.query("DELETE FROM connected_services WHERE origin LIKE '%-test-%' RETURNING id, name, origin");
    console.log("Deleted test services:", delSrv.rows);

    // Delete existing workflows
    const delWf = await client.query("DELETE FROM workflows RETURNING id, name");
    console.log("Deleted old workflows:", delWf.rows);

    // Check remaining services
    const srv = await client.query("SELECT id, name, origin FROM connected_services");
    console.log("Remaining connected services:", srv.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
