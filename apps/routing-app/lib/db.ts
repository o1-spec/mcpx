import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || "postgresql://mcpx:mcpx@localhost:5435/mcpx_control";

const globalForDb = globalThis as unknown as {
  __mcpxRoutingDbPool?: Pool;
};

const isProduction = process.env.NODE_ENV === "production";
const needsSsl = connectionString.includes("sslmode=require") || isProduction;

export const pool =
  globalForDb.__mcpxRoutingDbPool ??
  new Pool({
    connectionString,
    max: isProduction ? 3 : 10,
    idleTimeoutMillis: isProduction ? 2000 : 30000,
    connectionTimeoutMillis: 5000,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });

globalForDb.__mcpxRoutingDbPool = pool;

export interface RouteRecord {
  id: string;
  projectName: string;
  targetUrl: string;
  routeUrl: string;
  operationKey: string;
  createdAt: string;
  deletedAt?: string | null;
}

let isInitialized = false;

export async function initRoutingAppDb(): Promise<void> {
  if (isInitialized) return;

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS routing_resources (
        id VARCHAR(255) PRIMARY KEY,
        operation_key VARCHAR(255) UNIQUE NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        target_url TEXT NOT NULL,
        route_url TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `);
    isInitialized = true;
  } finally {
    client.release();
  }
}

export async function createRoutingResource(
  projectName: string,
  targetUrl: string,
  operationKey: string,
  routingOrigin: string
): Promise<{
  status: "created" | "already_exists";
  route: RouteRecord;
  routeUrl: string;
}> {
  await initRoutingAppDb();
  const client = await pool.connect();

  try {
    const existing = await client.query(
      `SELECT id, project_name, target_url, route_url, operation_key, created_at, deleted_at
       FROM routing_resources
       WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const record: RouteRecord = {
        id: row.id,
        projectName: row.project_name,
        targetUrl: row.target_url,
        routeUrl: row.route_url,
        operationKey: row.operation_key,
        createdAt: row.created_at.toISOString(),
      };
      return {
        status: "already_exists",
        route: record,
        routeUrl: record.routeUrl,
      };
    }

    const id = crypto.randomUUID();
    const routeUrl = `${routingOrigin}/r/${projectName}`;
    const now = new Date();

    await client.query(
      `INSERT INTO routing_resources (id, operation_key, project_name, target_url, route_url, created_at, deleted_at)
       VALUES ($1, $2, $3, $4, $5, $6, NULL)
       ON CONFLICT (operation_key) DO UPDATE
       SET project_name = EXCLUDED.project_name,
           target_url = EXCLUDED.target_url,
           route_url = EXCLUDED.route_url,
           created_at = EXCLUDED.created_at,
           deleted_at = NULL`,
      [id, operationKey, projectName, targetUrl, routeUrl, now]
    );

    const newRecord: RouteRecord = {
      id,
      projectName,
      targetUrl,
      routeUrl,
      operationKey,
      createdAt: now.toISOString(),
    };

    return {
      status: "created",
      route: newRecord,
      routeUrl,
    };
  } finally {
    client.release();
  }
}

export async function getRoutingResource(operationKey: string): Promise<{
  exists: boolean;
  route?: RouteRecord;
  routeUrl?: string;
}> {
  await initRoutingAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `SELECT id, project_name, target_url, route_url, operation_key, created_at, deleted_at
       FROM routing_resources
       WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    if (res.rows.length === 0) {
      return { exists: false };
    }

    const row = res.rows[0];
    const record: RouteRecord = {
      id: row.id,
      projectName: row.project_name,
      targetUrl: row.target_url,
      routeUrl: row.route_url,
      operationKey: row.operation_key,
      createdAt: row.created_at.toISOString(),
    };

    return {
      exists: true,
      route: record,
      routeUrl: record.routeUrl,
    };
  } finally {
    client.release();
  }
}

export async function getRoutingResourceByProjectName(projectName: string): Promise<{
  exists: boolean;
  route?: RouteRecord;
}> {
  await initRoutingAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `SELECT id, project_name, target_url, route_url, operation_key, created_at, deleted_at
       FROM routing_resources
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
      route: {
        id: row.id,
        projectName: row.project_name,
        targetUrl: row.target_url,
        routeUrl: row.route_url,
        operationKey: row.operation_key,
        createdAt: row.created_at.toISOString(),
      },
    };
  } finally {
    client.release();
  }
}

export async function deleteRoutingResource(operationKey: string): Promise<{
  status: "deleted" | "already_absent";
  operationKey: string;
  resourceId?: string;
}> {
  await initRoutingAppDb();
  const client = await pool.connect();

  try {
    const existing = await client.query(
      `SELECT id FROM routing_resources WHERE operation_key = $1 AND deleted_at IS NULL`,
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
      `UPDATE routing_resources SET deleted_at = NOW() WHERE operation_key = $1`,
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

export async function getAllActiveRoutingResources(): Promise<RouteRecord[]> {
  await initRoutingAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `SELECT id, project_name, target_url, route_url, operation_key, created_at
       FROM routing_resources
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`
    );

    return res.rows.map((row) => ({
      id: row.id,
      projectName: row.project_name,
      targetUrl: row.target_url,
      routeUrl: row.route_url,
      operationKey: row.operation_key,
      createdAt: row.created_at.toISOString(),
    }));
  } finally {
    client.release();
  }
}
