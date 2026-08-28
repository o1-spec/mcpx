import type { ToolDefinition } from "@/types/webmcp";

export const createDatabaseTool: ToolDefinition = {
  name: "create_database",
  description: "Create a new database entry with idempotent operationKey semantics",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The name of the database",
      },
      operationKey: {
        type: "string",
        description: "Unique idempotency operation key",
      },
    },
    required: ["name", "operationKey"],
  },
  execute: async (input: unknown) => {
    try {
      const args =
        typeof input === "string" ? JSON.parse(input) : (input as Record<string, unknown>);

      console.log("[database-app] create_database input =", args);

      const res = await fetch("/api/databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: args?.name,
          operationKey: args?.operationKey,
        }),
      });

      const data = await res.json();
      console.log("[database-app] create_database result =", data);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
      console.error("[database-app] create_database failed:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: errorMsg }),
          },
        ],
      };
    }
  },
};

export const getDatabaseTool: ToolDefinition = {
  name: "get_database",
  description: "Inspect a database by its unique operationKey",
  inputSchema: {
    type: "object",
    properties: {
      operationKey: {
        type: "string",
        description: "Unique idempotency operation key",
      },
    },
    required: ["operationKey"],
  },
  execute: async (input: unknown) => {
    try {
      const args =
        typeof input === "string" ? JSON.parse(input) : (input as Record<string, unknown>);
      const opKey = String(args?.operationKey ?? "");

      console.log("[database-app] get_database input operationKey =", opKey);

      const res = await fetch(`/api/databases?operationKey=${encodeURIComponent(opKey)}`);
      const data = await res.json();

      console.log("[database-app] get_database API result =", data);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
      console.error("[database-app] get_database failed:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: errorMsg }),
          },
        ],
      };
    }
  },
};

export const deleteDatabaseTool: ToolDefinition = {
  name: "delete_database",
  description: "Idempotently delete a database by its operationKey",
  inputSchema: {
    type: "object",
    properties: {
      operationKey: {
        type: "string",
        description: "Unique idempotency operation key",
      },
    },
    required: ["operationKey"],
  },
  execute: async (input: unknown) => {
    try {
      const args =
        typeof input === "string" ? JSON.parse(input) : (input as Record<string, unknown>);
      const opKey = String(args?.operationKey ?? "");

      console.log("[database-app] delete_database input operationKey =", opKey);

      const res = await fetch(`/api/databases?operationKey=${encodeURIComponent(opKey)}`, {
        method: "DELETE",
      });
      const data = await res.json();

      console.log("[database-app] delete_database API result =", data);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
      console.error("[database-app] delete_database failed:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: errorMsg }),
          },
        ],
      };
    }
  },
};
