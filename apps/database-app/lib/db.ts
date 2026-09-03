import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || "postgresql://mcpx:mcpx@localhost:5435/mcpx_control";

const globalForDb = globalThis as unknown as {
  __mcpxDbPool?: Pool;
};

const isProduction = process.env.NODE_ENV === "production";
const needsSsl = connectionString.includes("sslmode=require") || isProduction;

export const pool =
  globalForDb.__mcpxDbPool ??
  new Pool({
    connectionString,
    max: isProduction ? 3 : 10,
    idleTimeoutMillis: isProduction ? 2000 : 30000,
    connectionTimeoutMillis: 5000,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });

globalForDb.__mcpxDbPool = pool;

export interface DatabaseMetadataRecord {
  id: string;
  operationKey: string;
  schemaName: string;
  name: string;
  createdAt: string;
  deletedAt: string | null;
}

let isInitialized = false;

/**
 * Initializes the database_resources control table in Postgres
 */
export async function initDatabaseAppDb(): Promise<void> {
  if (isInitialized) return;

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS database_resources (
        id VARCHAR(255) PRIMARY KEY,
        operation_key VARCHAR(255) UNIQUE NOT NULL,
        schema_name VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `);
    isInitialized = true;
  } finally {
    client.release();
  }
}

/**
 * Generates and validates a safe Postgres schema identifier
 */
export function generateSafeSchemaName(resourceId: string): string {
  const sanitized = resourceId.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const schemaName = `mcpx_${sanitized}`;
  if (!/^mcpx_[a-z0-9_]{1,60}$/.test(schemaName)) {
    throw new Error(`Invalid generated schema name: ${schemaName}`);
  }
  return schemaName;
}

/**
 * Checks Postgres information_schema to verify whether a schema genuinely exists
 */
export async function verifySchemaInPostgres(schemaName: string): Promise<boolean> {
  if (!/^mcpx_[a-z0-9_]{1,60}$/.test(schemaName)) {
    return false;
  }

  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT 1 FROM information_schema.schemata WHERE schema_name = $1`,
      [schemaName]
    );
    return res.rows.length > 0;
  } finally {
    client.release();
  }
}

/**
 * Creates a real Postgres schema and registers metadata in ONE ATOMIC PostgreSQL TRANSACTION.
 * If metadata insertion fails, schema creation is automatically rolled back with 0 orphan schemas.
 */
export async function createRealDatabase(
  name: string,
  operationKey: string
): Promise<{
  status: "created" | "already_exists";
  database: {
    id: string;
    schemaName: string;
    name: string;
    operationKey: string;
    createdAt: string;
  };
}> {
  await initDatabaseAppDb();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT id, operation_key, schema_name, name, created_at, deleted_at 
       FROM database_resources 
       WHERE operation_key = $1 AND deleted_at IS NULL FOR UPDATE`,
      [operationKey]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const schemaExists = await verifySchemaInPostgres(row.schema_name);

      if (schemaExists) {
        await client.query("COMMIT");
        return {
          status: "already_exists",
          database: {
            id: row.id,
            schemaName: row.schema_name,
            name: row.name,
            operationKey: row.operation_key,
            createdAt: row.created_at.toISOString(),
          },
        };
      }
    }

    const resourceId = crypto.randomUUID();
    const schemaName = generateSafeSchemaName(resourceId);

    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    const now = new Date();
    await client.query(
      `INSERT INTO database_resources (id, operation_key, schema_name, name, created_at, deleted_at)
       VALUES ($1, $2, $3, $4, $5, NULL)
       ON CONFLICT (operation_key) DO UPDATE 
       SET schema_name = EXCLUDED.schema_name,
           name = EXCLUDED.name,
           created_at = EXCLUDED.created_at,
           deleted_at = NULL`,
      [resourceId, operationKey, schemaName, name, now]
    );

    await client.query("COMMIT");

    return {
      status: "created",
      database: {
        id: resourceId,
        schemaName,
        name,
        operationKey,
        createdAt: now.toISOString(),
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Authoritatively inspects a database resource and verifies Postgres schema existence
 */
export async function getRealDatabase(operationKey: string): Promise<{
  exists: boolean;
  metadataExists?: boolean;
  inconsistency?: string;
  database?: {
    id: string;
    schemaName: string;
    name: string;
    operationKey: string;
    createdAt: string;
  };
}> {
  await initDatabaseAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `SELECT id, operation_key, schema_name, name, created_at, deleted_at 
       FROM database_resources 
       WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    if (res.rows.length === 0) {
      return { exists: false };
    }

    const row = res.rows[0];
    const schemaExists = await verifySchemaInPostgres(row.schema_name);

    if (!schemaExists) {
      return {
        exists: false,
        metadataExists: true,
        inconsistency: "SCHEMA_MISSING",
      };
    }

    return {
      exists: true,
      database: {
        id: row.id,
        schemaName: row.schema_name,
        name: row.name,
        operationKey: row.operation_key,
        createdAt: row.created_at.toISOString(),
      },
    };
  } finally {
    client.release();
  }
}

/**
 * Idempotently drops the Postgres schema and marks metadata as deleted in ONE ATOMIC TRANSACTION.
 */
export async function deleteRealDatabase(operationKey: string): Promise<{
  status: "deleted" | "already_absent";
  operationKey: string;
  schemaName?: string;
}> {
  await initDatabaseAppDb();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const res = await client.query(
      `SELECT id, operation_key, schema_name, name, created_at, deleted_at 
       FROM database_resources 
       WHERE operation_key = $1 AND deleted_at IS NULL FOR UPDATE`,
      [operationKey]
    );

    if (res.rows.length === 0) {
      await client.query("COMMIT");
      return {
        status: "already_absent",
        operationKey,
      };
    }

    const row = res.rows[0];
    const schemaName = row.schema_name;

    // Drop real Postgres schema inside transaction
    await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);

    // Mark deleted in metadata inside same transaction
    await client.query(
      `UPDATE database_resources SET deleted_at = NOW() WHERE operation_key = $1`,
      [operationKey]
    );

    await client.query("COMMIT");

    return {
      status: "deleted",
      operationKey,
      schemaName,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
