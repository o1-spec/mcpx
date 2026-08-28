import type { ToolDefinition } from "@/types/webmcp";

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
    },
    required: ["name", "operationKey"],
  },
  execute: async (args: unknown) => {
    const params = (args || {}) as { name?: string; operationKey?: string };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            resourceId: "wdg_123",
            name: params.name || "Widget",
            operationKey: params.operationKey,
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
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            exists: true,
            operationKey: params.operationKey,
            resourceId: "wdg_123",
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
    },
    required: ["operationKey"],
  },
  execute: async (args: unknown) => {
    const params = (args || {}) as { widgetId?: string; operationKey?: string };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            resourceId: "pub_456",
            published: true,
            widgetId: params.widgetId,
            operationKey: params.operationKey,
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
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            exists: true,
            operationKey: params.operationKey,
            resourceId: "pub_456",
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
