import type { ToolDefinition } from "@/types/webmcp";

export const widgetStore = new Map<
  string,
  { id: string; name: string; operationKey: string; createdAt: string }
>();

export const publicationStore = new Map<
  string,
  { id: string; widgetId: string; operationKey: string; createdAt: string }
>();

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
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            service: "example-external-service",
            version: "1.0.0",
            health: "healthy",
            uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 120),
            storedWidgets: widgetStore.size,
            storedPublications: publicationStore.size,
          }),
        },
      ],
    };
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

    // Idempotent check
    let record = widgetStore.get(params.operationKey);
    if (!record) {
      record = {
        id: `wdg_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
        name: params.name || "Widget",
        operationKey: params.operationKey,
        createdAt: new Date().toISOString(),
      };
      widgetStore.set(params.operationKey, record);
    }

    if (params.failureMode === "drop-ack-after-commit") {
      throw new Error("Transport ACK lost after write committed (simulated network failure)");
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            resourceId: record.id,
            name: record.name,
            operationKey: record.operationKey,
            created: true,
          }),
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
    const params = (args || {}) as { operationKey?: string };
    if (!params.operationKey) {
      throw new Error("Missing required field 'operationKey'");
    }

    const record = widgetStore.get(params.operationKey);
    if (!record) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              exists: false,
              operationKey: params.operationKey,
            }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            exists: true,
            operationKey: record.operationKey,
            resourceId: record.id,
            name: record.name,
            createdAt: record.createdAt,
          }),
        },
      ],
    };
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
    const params = (args || {}) as { operationKey?: string };
    if (!params.operationKey) {
      throw new Error("Missing required field 'operationKey'");
    }

    widgetStore.delete(params.operationKey);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            deleted: true,
            operationKey: params.operationKey,
          }),
        },
      ],
    };
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

    let record = publicationStore.get(params.operationKey);
    if (!record) {
      record = {
        id: `pub_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
        widgetId: params.widgetId || "unknown",
        operationKey: params.operationKey,
        createdAt: new Date().toISOString(),
      };
      publicationStore.set(params.operationKey, record);
    }

    if (params.failureMode === "drop-ack-after-commit") {
      throw new Error("Transport ACK lost after publication committed");
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            resourceId: record.id,
            published: true,
            widgetId: record.widgetId,
            operationKey: record.operationKey,
          }),
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
    const params = (args || {}) as { operationKey?: string };
    if (!params.operationKey) {
      throw new Error("Missing required field 'operationKey'");
    }

    const record = publicationStore.get(params.operationKey);
    if (!record) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              exists: false,
              operationKey: params.operationKey,
            }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            exists: true,
            operationKey: record.operationKey,
            resourceId: record.id,
            widgetId: record.widgetId,
            createdAt: record.createdAt,
          }),
        },
      ],
    };
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
    const params = (args || {}) as { operationKey?: string };
    if (!params.operationKey) {
      throw new Error("Missing required field 'operationKey'");
    }

    publicationStore.delete(params.operationKey);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            unpublished: true,
            operationKey: params.operationKey,
          }),
        },
      ],
    };
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
