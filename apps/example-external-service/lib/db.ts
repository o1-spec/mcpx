import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || "postgresql://mcpx:mcpx@localhost:5435/mcpx_control";

const globalForDb = globalThis as unknown as {
  __mcpxExternalDbPool?: Pool;
};

const isProduction = process.env.NODE_ENV === "production";

export const pool =
  globalForDb.__mcpxExternalDbPool ??
  new Pool({
    connectionString,
    max: isProduction ? 1 : 10,
    idleTimeoutMillis: isProduction ? 1000 : 30000,
    connectionTimeoutMillis: 5000,
  });

globalForDb.__mcpxExternalDbPool = pool;

export interface WidgetRecord {
  id: string;
  name: string;
  operationKey: string;
  createdAt: string;
  deletedAt?: string | null;
}

export interface PublicationRecord {
  id: string;
  widgetId: string;
  operationKey: string;
  createdAt: string;
  deletedAt?: string | null;
}

let isInitialized = false;

export async function initExampleAppDb(): Promise<void> {
  if (isInitialized) return;

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS example_widgets (
        id VARCHAR(255) PRIMARY KEY,
        operation_key VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS example_publications (
        id VARCHAR(255) PRIMARY KEY,
        operation_key VARCHAR(255) UNIQUE NOT NULL,
        widget_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `);
    isInitialized = true;
  } finally {
    client.release();
  }
}

export async function createWidget(
  name: string,
  operationKey: string
): Promise<{
  status: "created" | "already_exists";
  widget: WidgetRecord;
}> {
  await initExampleAppDb();
  const client = await pool.connect();

  try {
    const existing = await client.query(
      `SELECT id, name, operation_key, created_at, deleted_at
       FROM example_widgets
       WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      return {
        status: "already_exists",
        widget: {
          id: row.id,
          name: row.name,
          operationKey: row.operation_key,
          createdAt: row.created_at.toISOString(),
        },
      };
    }

    const id = `wdg_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date();

    await client.query(
      `INSERT INTO example_widgets (id, operation_key, name, created_at, deleted_at)
       VALUES ($1, $2, $3, $4, NULL)
       ON CONFLICT (operation_key) DO UPDATE
       SET name = EXCLUDED.name,
           created_at = EXCLUDED.created_at,
           deleted_at = NULL`,
      [id, operationKey, name, now]
    );

    return {
      status: "created",
      widget: {
        id,
        name,
        operationKey,
        createdAt: now.toISOString(),
      },
    };
  } finally {
    client.release();
  }
}

export async function getWidget(operationKey: string): Promise<{
  exists: boolean;
  widget?: WidgetRecord;
}> {
  await initExampleAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `SELECT id, name, operation_key, created_at, deleted_at
       FROM example_widgets
       WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    if (res.rows.length === 0) {
      return { exists: false };
    }

    const row = res.rows[0];
    return {
      exists: true,
      widget: {
        id: row.id,
        name: row.name,
        operationKey: row.operation_key,
        createdAt: row.created_at.toISOString(),
      },
    };
  } finally {
    client.release();
  }
}

export async function deleteWidget(operationKey: string): Promise<{
  deleted: boolean;
  operationKey: string;
}> {
  await initExampleAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `UPDATE example_widgets SET deleted_at = NOW()
       WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    return {
      deleted: (res.rowCount ?? 0) > 0,
      operationKey,
    };
  } finally {
    client.release();
  }
}

export async function publishWidget(
  widgetId: string,
  operationKey: string
): Promise<{
  status: "created" | "already_exists";
  publication: PublicationRecord;
}> {
  await initExampleAppDb();
  const client = await pool.connect();

  try {
    const existing = await client.query(
      `SELECT id, widget_id, operation_key, created_at, deleted_at
       FROM example_publications
       WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      return {
        status: "already_exists",
        publication: {
          id: row.id,
          widgetId: row.widget_id,
          operationKey: row.operation_key,
          createdAt: row.created_at.toISOString(),
        },
      };
    }

    const id = `pub_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date();

    await client.query(
      `INSERT INTO example_publications (id, operation_key, widget_id, created_at, deleted_at)
       VALUES ($1, $2, $3, $4, NULL)
       ON CONFLICT (operation_key) DO UPDATE
       SET widget_id = EXCLUDED.widget_id,
           created_at = EXCLUDED.created_at,
           deleted_at = NULL`,
      [id, operationKey, widgetId, now]
    );

    return {
      status: "created",
      publication: {
        id,
        widgetId,
        operationKey,
        createdAt: now.toISOString(),
      },
    };
  } finally {
    client.release();
  }
}

export async function getPublication(operationKey: string): Promise<{
  exists: boolean;
  publication?: PublicationRecord;
}> {
  await initExampleAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `SELECT id, widget_id, operation_key, created_at, deleted_at
       FROM example_publications
       WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    if (res.rows.length === 0) {
      return { exists: false };
    }

    const row = res.rows[0];
    return {
      exists: true,
      publication: {
        id: row.id,
        widgetId: row.widget_id,
        operationKey: row.operation_key,
        createdAt: row.created_at.toISOString(),
      },
    };
  } finally {
    client.release();
  }
}

export async function unpublishWidget(operationKey: string): Promise<{
  deleted: boolean;
  operationKey: string;
}> {
  await initExampleAppDb();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `UPDATE example_publications SET deleted_at = NOW()
       WHERE operation_key = $1 AND deleted_at IS NULL`,
      [operationKey]
    );

    return {
      deleted: (res.rowCount ?? 0) > 0,
      operationKey,
    };
  } finally {
    client.release();
  }
}

export async function getExampleStoreCounts(): Promise<{
  activeWidgets: number;
  activePublications: number;
}> {
  await initExampleAppDb();
  const client = await pool.connect();

  try {
    const wRes = await client.query(
      `SELECT COUNT(*) as count FROM example_widgets WHERE deleted_at IS NULL`
    );
    const pRes = await client.query(
      `SELECT COUNT(*) as count FROM example_publications WHERE deleted_at IS NULL`
    );

    return {
      activeWidgets: parseInt(wRes.rows[0]?.count || "0", 10),
      activePublications: parseInt(pRes.rows[0]?.count || "0", 10),
    };
  } finally {
    client.release();
  }
}
