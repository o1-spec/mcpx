import type { ToolDefinition } from "@/types/webmcp";

export const deployFrontendTool: ToolDefinition = {
  name: "deploy_frontend",
  description: "Deploy a frontend preview application bound to a backend compute instance",
  inputSchema: {
    type: "object",
    properties: {
      projectName: {
        type: "string",
        description: "The name of the project",
      },
      backendResourceId: {
        type: "string",
        description: "Resource ID of the bound backend compute instance",
      },
      operationKey: {
        type: "string",
        description: "Unique idempotency operation key",
      },
      failureMode: {
        type: "string",
        description: "Simulated failure mode",
        enum: ["none", "reject-before-commit"],
      },
    },
    required: ["projectName", "operationKey"],
  },
  execute: async (input: unknown) => {
    const args =
      typeof input === "string" ? JSON.parse(input) : (input as Record<string, unknown>);

    // Clean confirmed failure before commit
    if (args?.failureMode === "reject-before-commit") {
      console.warn(
        `[frontend-app] [chaos:reject-before-commit] Explicitly rejecting before commit (operationKey: ${args?.operationKey}). Frontend preview will NOT be created.`
      );
      throw new Error(
        `REJECTED_BEFORE_COMMIT: Simulated CDN preview domain validation failure before commit (operationKey: ${args?.operationKey})`
      );
    }

    console.log("[frontend-app] deploy_frontend input =", args);

    const res = await fetch("/api/frontends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectName: args?.projectName || args?.workspaceName || args?.name || "invoices-prod",
        backendResourceId: args?.backendResourceId,
        operationKey: args?.operationKey,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to deploy frontend: HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log("[frontend-app] deploy_frontend result =", data);

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

export const getFrontendTool: ToolDefinition = {
  name: "get_frontend",
  description: "Inspect a frontend deployment by its unique operationKey",
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

      console.log("[frontend-app] get_frontend input operationKey =", opKey);

      const res = await fetch(`/api/frontends?operationKey=${encodeURIComponent(opKey)}`);
      const data = await res.json();

      console.log("[frontend-app] get_frontend API result =", data);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
      console.error("[frontend-app] get_frontend failed:", err);
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

export const deleteFrontendTool: ToolDefinition = {
  name: "delete_frontend",
  description: "Idempotently delete a frontend deployment by its operationKey",
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

      console.log("[frontend-app] delete_frontend input operationKey =", opKey);

      const res = await fetch(`/api/frontends?operationKey=${encodeURIComponent(opKey)}`, {
        method: "DELETE",
      });
      const data = await res.json();

      console.log("[frontend-app] delete_frontend API result =", data);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
      console.error("[frontend-app] delete_frontend failed:", err);
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
