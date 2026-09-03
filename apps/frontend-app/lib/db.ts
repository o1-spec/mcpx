import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || "postgresql://mcpx:mcpx@localhost:5435/mcpx_control";

const globalForDb = globalThis as unknown as {
  __mcpxFrontendDbPool?: Pool;
};

const isProduction = process.env.NODE_ENV === "production";

export const pool =
  globalForDb.__mcpxFrontendDbPool ??
  new Pool({
    connectionString,
    max: isProduction ? 1 : 10,
    idleTimeoutMillis: isProduction ? 1000 : 30000,
    connectionTimeoutMillis: 5000,
  });

globalForDb.__mcpxFrontendDbPool = pool;

export interface FrontendRecord {
  id: string;
  projectName: string;
  backendResourceId: string;
  previewUrl: string;
  operationKey: string;
  createdAt: string;
  deletedAt?: string | null;
}

let isInitialized = false;

export async function initFrontendAppDb(): Promise<void> {
  if (isInitialized) return;

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS frontend_resources (
        id VARCHAR(255) PRIMARY KEY,
        operation_key VARCHAR(255) UNIQUE NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        backend_resource_id VARCHAR(255),
        preview_url TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `);
    isInitialized = true;
  } finally {
    client.release();
  }
}

export async function createFrontendResource(
  projectName: string,
  backendResourceId: string | undefined,
  operationKey: string,
  frontendOrigin: string
): Promise<{
  status: "created" | "already_exists";
  frontend: FrontendRecord;
}> {
  await initFrontendAppDb();
  const client = await pool.connect();

  try {
    const existing = await client.query(
      `SELECT id, project_name, backend_resource_id, preview_url, operation_key, created_at, deleted_at
       FROM frontend_resources
       WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const record: FrontendRecord = {
        id: row.id,
        projectName: row.project_name,
        backendResourceId: row.backend_resource_id || "none",
        previewUrl: row.preview_url,
        operationKey: row.operation_key,
        createdAt: row.created_at.toISOString(),
      };
      return {
        status: "already_exists",
        frontend: record,
      };
    }

    const id = crypto.randomUUID();
    const previewUrl = `${frontendOrigin}/preview/${projectName}`;
    const now = new Date();

    await client.query(
      `INSERT INTO frontend_resources (id, operation_key, project_name, backend_resource_id, preview_url, created_at, deleted_at)
       VALUES ($1, $2, $3, $4, $5, $6, NULL)
       ON CONFLICT (operation_key) DO UPDATE
       SET project_name = EXCLUDED.project_name,
           backend_resource_id = EXCLUDED.backend_resource_id,
           preview_url = EXCLUDED.preview_url,
           created_at = EXCLUDED.created_at,
           deleted_at = NULL`,
      [id, operationKey, projectName, backendResourceId || "none", previewUrl, now]
    );

    const newRecord: FrontendRecord = {
      id,
      projectName,
      backendResourceId: backendResourceId || "none",
      previewUrl,
      operationKey,
      createdAt: now.toISOString(),
    };

    return {
      status: "created",
      frontend: newRecord,
    };
  } finally {
    client.release();
  }
}

export async function getFrontendResource(operationKey: string): Promise<{
  exists: boolean;
  frontend?: FrontendRecord;
}> {
  await initFrontendAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `SELECT id, project_name, backend_resource_id, preview_url, operation_key, created_at, deleted_at
       FROM frontend_resources
       WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    if (res.rows.length === 0) {
      return { exists: false };
    }

    const row = res.rows[0];
    return {
      exists: true,
      frontend: {
        id: row.id,
        projectName: row.project_name,
        backendResourceId: row.backend_resource_id || "none",
        previewUrl: row.preview_url,
        operationKey: row.operation_key,
        createdAt: row.created_at.toISOString(),
      },
    };
  } finally {
    client.release();
  }
}

export async function getFrontendResourceByProjectName(projectName: string): Promise<{
  exists: boolean;
  frontend?: FrontendRecord;
}> {
  await initFrontendAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `SELECT id, project_name, backend_resource_id, preview_url, operation_key, created_at, deleted_at
       FROM frontend_resources
       WHERE project_name = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [projectName]
    );

    if (res.rows.length === 0) {
      return { exists: false };
    }

    const row = res.rows[0];
    return {
      exists: true,
      frontend: {
        id: row.id,
        projectName: row.project_name,
        backendResourceId: row.backend_resource_id || "none",
        previewUrl: row.preview_url,
        operationKey: row.operation_key,
        createdAt: row.created_at.toISOString(),
      },
    };
  } finally {
    client.release();
  }
}

export async function deleteFrontendResource(operationKey: string): Promise<{
  status: "deleted" | "already_absent";
  operationKey: string;
  resourceId?: string;
}> {
  await initFrontendAppDb();
  const client = await pool.connect();

  try {
    const existing = await client.query(
      `SELECT id FROM frontend_resources WHERE operation_key = $1 AND deleted_at IS NULL`,
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
      `UPDATE frontend_resources SET deleted_at = NOW() WHERE operation_key = $1`,
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

export async function getAllActiveFrontendResources(): Promise<FrontendRecord[]> {
  await initFrontendAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `SELECT id, project_name, backend_resource_id, preview_url, operation_key, created_at
       FROM frontend_resources
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`
    );

    return res.rows.map((row) => ({
      id: row.id,
      projectName: row.project_name,
      backendResourceId: row.backend_resource_id || "none",
      previewUrl: row.preview_url,
      operationKey: row.operation_key,
      createdAt: row.created_at.toISOString(),
    }));
  } finally {
    client.release();
  }
}
