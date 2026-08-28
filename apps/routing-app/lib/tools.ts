import type { ToolDefinition } from "@/types/webmcp";

export const createRouteTool: ToolDefinition = {
  name: "create_route",
  description:
    "Create a new routing entry with idempotent operationKey semantics and optional failure injection",
  inputSchema: {
    type: "object",
    properties: {
      projectName: {
        type: "string",
        description: "The name of the project to route to",
      },
      targetUrl: {
        type: "string",
        description: "The target destination URL",
      },
      operationKey: {
        type: "string",
        description: "Unique idempotency operation key",
      },
      failureMode: {
        type: "string",
        description: "Simulated chaos failure mode",
        enum: ["none", "drop-ack-after-commit"],
      },
    },
    required: ["projectName", "targetUrl", "operationKey"],
  },
  execute: async (input: unknown) => {
    const args =
      typeof input === "string" ? JSON.parse(input) : (input as Record<string, unknown>);

    const opKey = String(args?.projectName ? args?.operationKey : "");

    // 1. Commit route to own API
    const res = await fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectName: args?.projectName,
        targetUrl: args?.targetUrl,
        operationKey: args?.operationKey,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to commit route: HTTP ${res.status}`);
    }

    const data = await res.json();

    // 2. Deterministic failure injection: verify commitment before dropping ACK
    if (args?.failureMode === "drop-ack-after-commit") {
      // Confirm the resource was indeed persisted in the store
      const verifyRes = await fetch(
        `/api/routes?operationKey=${encodeURIComponent(String(args?.operationKey))}`
      );
      const verifyData = await verifyRes.json();

      if (!verifyData || verifyData.exists !== true) {
        console.error(
          "[routing-app] CHAOS_PRECONDITION_FAILED: Resource was not found in store after POST",
          verifyData
        );
        throw new Error(
          "CHAOS_PRECONDITION_FAILED: Resource was not present before acknowledgement drop."
        );
      }

      console.log("[routing-app] COMMIT_CONFIRMED_BEFORE_ACK_DROP", {
        operationKey: args?.operationKey,
        resourceId: data.route?.id ?? verifyData.route?.id,
      });

      throw new DOMException(
        `ERR_CONNECTION_RESET: Simulated transport acknowledgement loss after commit (operationKey: ${args?.operationKey})`,
        "NetworkError"
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data),
        },
      ],
    };
  },
};

export const getRouteTool: ToolDefinition = {
  name: "get_route",
  description: "Inspect a route by its unique operationKey",
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

      console.log("[routing-app] get_route input operationKey =", opKey);

      const res = await fetch(`/api/routes?operationKey=${encodeURIComponent(opKey)}`);
      const data = await res.json();

      console.log("[routing-app] get_route API result =", data);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
      console.error("[routing-app] get_route execution failed:", err);
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

export const deleteRouteTool: ToolDefinition = {
  name: "delete_route",
  description: "Idempotently delete a route by its operationKey",
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

      console.log("[routing-app] delete_route input operationKey =", opKey);

      const res = await fetch(`/api/routes?operationKey=${encodeURIComponent(opKey)}`, {
        method: "DELETE",
      });
      const data = await res.json();

      console.log("[routing-app] delete_route API result =", data);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
      console.error("[routing-app] delete_route execution failed:", err);
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
