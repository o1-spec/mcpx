import type { ToolDefinition } from "@/types/webmcp";

export const deployBackendTool: ToolDefinition = {
  name: "deploy_backend",
  description: "Deploy a backend compute instance with database binding and idempotent operationKey",
  inputSchema: {
    type: "object",
    properties: {
      projectName: {
        type: "string",
        description: "The name of the project",
      },
      databaseResourceId: {
        type: "string",
        description: "Resource ID of the bound database dependency",
      },
      operationKey: {
        type: "string",
        description: "Unique idempotency operation key",
      },
    },
    required: ["projectName", "operationKey"],
  },
  execute: async (input: unknown) => {
    try {
      const args =
        typeof input === "string" ? JSON.parse(input) : (input as Record<string, unknown>);

      console.log("[compute-app] deploy_backend operationKey =", args?.operationKey);
      console.log("[compute-app] deploy_backend input =", args);

      const res = await fetch("/api/backends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: args?.projectName,
          databaseResourceId: args?.databaseResourceId,
          operationKey: args?.operationKey,
        }),
      });

      const data = await res.json();
      console.log("[compute-app] deploy_backend result =", data);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
      console.error("[compute-app] deploy_backend failed:", err);
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

export const getBackendTool: ToolDefinition = {
  name: "get_backend",
  description: "Inspect a backend deployment by its unique operationKey",
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

      console.log("[compute-app] get_backend operationKey =", opKey);

      const res = await fetch(`/api/backends?operationKey=${encodeURIComponent(opKey)}`);
      const data = await res.json();

      console.log("[compute-app] get_backend API result =", data);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
      console.error("[compute-app] get_backend failed:", err);
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

export const deleteBackendTool: ToolDefinition = {
  name: "delete_backend",
  description: "Idempotently delete a backend deployment by its operationKey",
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

      console.log("[compute-app] delete_backend operationKey =", opKey);

      const res = await fetch(`/api/backends?operationKey=${encodeURIComponent(opKey)}`, {
        method: "DELETE",
      });
      const data = await res.json();

      console.log("[compute-app] delete_backend API result =", data);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
      console.error("[compute-app] delete_backend failed:", err);
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
