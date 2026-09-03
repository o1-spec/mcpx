import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || "postgresql://mcpx:mcpx@localhost:5435/mcpx_control";

const globalForDb = globalThis as unknown as {
  __mcpxComputeDbPool?: Pool;
};

const isProduction = process.env.NODE_ENV === "production";
const needsSsl = connectionString.includes("sslmode=require") || isProduction;

export const pool =
  globalForDb.__mcpxComputeDbPool ??
  new Pool({
    connectionString,
    max: isProduction ? 3 : 10,
    idleTimeoutMillis: isProduction ? 2000 : 30000,
    connectionTimeoutMillis: 5000,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });

globalForDb.__mcpxComputeDbPool = pool;

export interface BackendRecord {
  id: string;
  projectName: string;
  databaseResourceId: string;
  operationKey: string;
  healthUrl: string;
  createdAt: string;
  deletedAt?: string | null;
}

let isInitialized = false;

export async function initComputeAppDb(): Promise<void> {
  if (isInitialized) return;

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS compute_resources (
        id VARCHAR(255) PRIMARY KEY,
        operation_key VARCHAR(255) UNIQUE NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        database_resource_id VARCHAR(255),
        health_url TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `);
    isInitialized = true;
  } finally {
    client.release();
  }
}

export async function createComputeResource(
  projectName: string,
  databaseResourceId: string | undefined,
  operationKey: string,
  computeOrigin: string
): Promise<{
  status: "created" | "already_exists";
  backend: BackendRecord;
  healthUrl: string;
}> {
  await initComputeAppDb();
  const client = await pool.connect();

  try {
    const existing = await client.query(
      `SELECT id, project_name, database_resource_id, operation_key, health_url, created_at, deleted_at
       FROM compute_resources
       WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const record: BackendRecord = {
        id: row.id,
        projectName: row.project_name,
        databaseResourceId: row.database_resource_id || "none",
        operationKey: row.operation_key,
        healthUrl: row.health_url,
        createdAt: row.created_at.toISOString(),
      };
      return {
        status: "already_exists",
        backend: record,
        healthUrl: record.healthUrl,
      };
    }

    const id = crypto.randomUUID();
    const healthUrl = `${computeOrigin}/runtime/${id}/health`;
    const now = new Date();

    await client.query(
      `INSERT INTO compute_resources (id, operation_key, project_name, database_resource_id, health_url, created_at, deleted_at)
       VALUES ($1, $2, $3, $4, $5, $6, NULL)
       ON CONFLICT (operation_key) DO UPDATE
       SET project_name = EXCLUDED.project_name,
           database_resource_id = EXCLUDED.database_resource_id,
           health_url = EXCLUDED.health_url,
           created_at = EXCLUDED.created_at,
           deleted_at = NULL`,
      [id, operationKey, projectName, databaseResourceId || "none", healthUrl, now]
    );

    const newRecord: BackendRecord = {
      id,
      projectName,
      databaseResourceId: databaseResourceId || "none",
      operationKey,
      healthUrl,
      createdAt: now.toISOString(),
    };

    return {
      status: "created",
      backend: newRecord,
      healthUrl: newRecord.healthUrl,
    };
  } finally {
    client.release();
  }
}

export async function getComputeResource(operationKey: string): Promise<{
  exists: boolean;
  backend?: BackendRecord;
}> {
  await initComputeAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `SELECT id, project_name, database_resource_id, operation_key, health_url, created_at, deleted_at
       FROM compute_resources
       WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    if (res.rows.length === 0) {
      return { exists: false };
    }

    const row = res.rows[0];
    return {
      exists: true,
      backend: {
        id: row.id,
        projectName: row.project_name,
        databaseResourceId: row.database_resource_id || "none",
        operationKey: row.operation_key,
        healthUrl: row.health_url,
        createdAt: row.created_at.toISOString(),
      },
    };
  } finally {
    client.release();
  }
}

export async function getComputeResourceById(id: string): Promise<{
  exists: boolean;
  backend?: BackendRecord;
}> {
  await initComputeAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `SELECT id, project_name, database_resource_id, operation_key, health_url, created_at, deleted_at
       FROM compute_resources
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (res.rows.length === 0) {
      return { exists: false };
    }

    const row = res.rows[0];
    return {
      exists: true,
      backend: {
        id: row.id,
        projectName: row.project_name,
        databaseResourceId: row.database_resource_id || "none",
        operationKey: row.operation_key,
        healthUrl: row.health_url,
        createdAt: row.created_at.toISOString(),
      },
    };
  } finally {
    client.release();
  }
}

export async function deleteComputeResource(operationKey: string): Promise<{
  status: "deleted" | "already_absent";
  operationKey: string;
  resourceId?: string;
}> {
  await initComputeAppDb();
  const client = await pool.connect();

  try {
    const existing = await client.query(
      `SELECT id FROM compute_resources WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    if (existing.rows.length === 0) {
      return {
        status: "already_absent",
        operationKey,
      };
    }

    const resourceId = existing.rows[0].id;
    await client.query(
      `UPDATE compute_resources SET deleted_at = NOW() WHERE operation_key = $1`,
      [operationKey]
    );

    return {
      status: "deleted",
      operationKey,
      resourceId,
    };
  } finally {
    client.release();
  }
}

export async function getAllActiveComputeResources(): Promise<BackendRecord[]> {
  await initComputeAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `SELECT id, project_name, database_resource_id, operation_key, health_url, created_at
       FROM compute_resources
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`
    );

    return res.rows.map((row) => ({
      id: row.id,
      projectName: row.project_name,
      databaseResourceId: row.database_resource_id || "none",
      operationKey: row.operation_key,
      healthUrl: row.health_url,
      createdAt: row.created_at.toISOString(),
    }));
  } finally {
    client.release();
  }
}
