import { pool } from "../apps/mcpx-web/lib/db";

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, name, origin FROM connected_services ORDER BY created_at DESC");
    console.log("Services in DB:", res.rows);

    // Delete temporary test services with '-test-' in the origin
    const delRes = await client.query("DELETE FROM connected_services WHERE origin LIKE '%-test-%' RETURNING id, origin");
    console.log("Deleted test services:", delRes.rows);

    // Clean up contracts belonging to deleted services
    await client.query("DELETE FROM reliability_contracts WHERE service_id NOT IN (SELECT id FROM connected_services)");
    console.log("Cleaned up orphaned contracts.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
