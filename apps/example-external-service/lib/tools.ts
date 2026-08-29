import type { ToolDefinition } from "@/types/webmcp";

const getBaseUrl = () =>
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_EXAMPLE_SERVICE_ORIGIN || "http://localhost:3010";

export const pingServiceTool: ToolDefinition = {
  name: "ping_service",
  description: "Ping the service to check responsiveness and availability",
  inputSchema: {
    type: "object",
    properties: {
      timestamp: {
        type: "string",
        description: "Client dispatch timestamp",
      },
    },
    required: [],
  },
  execute: async () => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "ok",
            pong: true,
            serverTime: new Date().toISOString(),
          }),
        },
      ],
    };
  },
};

export const getStatusTool: ToolDefinition = {
  name: "get_status",
  description: "Retrieve current external service runtime status",
  inputSchema: {
    type: "object",
    properties: {},
  },
  execute: async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/health`);
      const data = await res.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              service: "example-external-service",
              version: "1.0.0",
              health: data.status || "healthy",
              uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 120),
              storedWidgets: data.activeWidgets || 0,
              storedPublications: data.activePublications || 0,
            }),
          },
        ],
      };
    } catch {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              service: "example-external-service",
              version: "1.0.0",
              health: "healthy",
            }),
          },
        ],
      };
    }
  },
};

export const createWidgetTool: ToolDefinition = {
  name: "create_widget",
  description: "Create a new widget with idempotent operation key",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Widget name",
      },
      operationKey: {
        type: "string",
        description: "Deterministic operation key",
      },
      failureMode: {
        type: "string",
        enum: ["none", "reject-before-commit", "drop-ack-after-commit"],
        description: "Test failure mode simulation",
      },
    },
    required: ["name", "operationKey"],
  },
  execute: async (args: unknown) => {
    const params = (args || {}) as {
      name?: string;
      operationKey?: string;
      failureMode?: string;
    };

    if (!params.operationKey) {
      throw new Error("Missing required field 'operationKey'");
    }

    if (params.failureMode === "reject-before-commit") {
      throw new Error("Operation rejected by validation before commit");
    }

    const res = await fetch(`${getBaseUrl()}/api/widgets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: params.name,
        operationKey: params.operationKey,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(errData.error || `Failed to create widget: HTTP ${res.status}`);
    }

    const data = await res.json();

    if (params.failureMode === "drop-ack-after-commit") {
      throw new Error("Transport ACK lost after write committed (simulated network failure)");
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

export const getWidgetTool: ToolDefinition = {
  name: "get_widget",
  description: "Authoritative inspection of widget by operation key",
  inputSchema: {
    type: "object",
    properties: {
      operationKey: {
        type: "string",
        description: "Deterministic operation key",
      },
    },
    required: ["operationKey"],
  },
  execute: async (args: unknown) => {
    try {
      const params = (args || {}) as { operationKey?: string };
      if (!params.operationKey) {
        throw new Error("Missing required field 'operationKey'");
      }

      const res = await fetch(`${getBaseUrl()}/api/widgets?operationKey=${encodeURIComponent(params.operationKey)}`);
      const data = await res.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
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

export const deleteWidgetTool: ToolDefinition = {
  name: "delete_widget",
  description: "Idempotent compensation of widget by operation key",
  inputSchema: {
    type: "object",
    properties: {
      operationKey: {
        type: "string",
        description: "Deterministic operation key",
      },
    },
    required: ["operationKey"],
  },
  execute: async (args: unknown) => {
    try {
      const params = (args || {}) as { operationKey?: string };
      if (!params.operationKey) {
        throw new Error("Missing required field 'operationKey'");
      }

      const res = await fetch(`${getBaseUrl()}/api/widgets?operationKey=${encodeURIComponent(params.operationKey)}`, {
        method: "DELETE",
      });
      const data = await res.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
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

export const publishWidgetTool: ToolDefinition = {
  name: "publish_widget",
  description: "Publish a widget to public registry",
  inputSchema: {
    type: "object",
    properties: {
      widgetId: {
        type: "string",
        description: "Widget resource ID",
      },
      operationKey: {
        type: "string",
        description: "Deterministic operation key",
      },
      failureMode: {
        type: "string",
        enum: ["none", "reject-before-commit", "drop-ack-after-commit"],
        description: "Test failure mode simulation",
      },
    },
    required: ["operationKey"],
  },
  execute: async (args: unknown) => {
    const params = (args || {}) as {
      widgetId?: string;
      operationKey?: string;
      failureMode?: string;
    };

    if (!params.operationKey) {
      throw new Error("Missing required field 'operationKey'");
    }

    if (params.failureMode === "reject-before-commit") {
      throw new Error("Publishing rejected by upstream service error");
    }

    const res = await fetch(`${getBaseUrl()}/api/publications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        widgetId: params.widgetId,
        operationKey: params.operationKey,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(errData.error || `Failed to publish widget: HTTP ${res.status}`);
    }

    const data = await res.json();

    if (params.failureMode === "drop-ack-after-commit") {
      throw new Error("Transport ACK lost after publication committed");
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

export const getPublicationTool: ToolDefinition = {
  name: "get_publication",
  description: "Authoritative inspection of publication by operation key",
  inputSchema: {
    type: "object",
    properties: {
      operationKey: {
        type: "string",
        description: "Deterministic operation key",
      },
    },
    required: ["operationKey"],
  },
  execute: async (args: unknown) => {
    try {
      const params = (args || {}) as { operationKey?: string };
      if (!params.operationKey) {
        throw new Error("Missing required field 'operationKey'");
      }

      const res = await fetch(`${getBaseUrl()}/api/publications?operationKey=${encodeURIComponent(params.operationKey)}`);
      const data = await res.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
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

export const unpublishWidgetTool: ToolDefinition = {
  name: "unpublish_widget",
  description: "Idempotent compensation of publication by operation key",
  inputSchema: {
    type: "object",
    properties: {
      operationKey: {
        type: "string",
        description: "Deterministic operation key",
      },
    },
    required: ["operationKey"],
  },
  execute: async (args: unknown) => {
    try {
      const params = (args || {}) as { operationKey?: string };
      if (!params.operationKey) {
        throw new Error("Missing required field 'operationKey'");
      }

      const res = await fetch(`${getBaseUrl()}/api/publications?operationKey=${encodeURIComponent(params.operationKey)}`, {
        method: "DELETE",
      });
      const data = await res.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (err: unknown) {
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

export const sendNotificationTool: ToolDefinition = {
  name: "send_notification",
  description: "Send notification (mutation without authoritative inspection)",
  inputSchema: {
    type: "object",
    properties: {
      recipient: {
        type: "string",
        description: "Notification recipient email or address",
      },
      message: {
        type: "string",
        description: "Notification text content",
      },
    },
    required: ["recipient", "message"],
  },
  execute: async (args: unknown) => {
    const params = (args || {}) as { recipient?: string; message?: string };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            sent: true,
            recipient: params.recipient,
          }),
        },
      ],
    };
  },
};
