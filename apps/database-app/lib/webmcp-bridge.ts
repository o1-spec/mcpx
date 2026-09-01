"use client";

import type {
  ModelContext,
  ToolDefinition,
  RegisteredTool,
  RegisterToolOptions,
  GetToolsOptions,
  ToolResult,
} from "@/types/webmcp";

/**
 * WebMCP Client-Side Standard Bridge & Polyfill
 */

class WebMCPModelContext extends EventTarget implements ModelContext {
  private registeredTools = new Map<string, ToolDefinition & { origin?: string; exposedTo?: string[] }>();

  constructor() {
    super();
    this.initCrossFrameListener();
  }

  private initCrossFrameListener() {
    window.addEventListener("message", async (event) => {
      const { type, toolName, input, messageId } = (event.data || {}) as {
        type?: string;
        toolName?: string;
        input?: unknown;
        messageId?: string;
      };

      if (type === "WEBMCP_EXECUTE_REQUEST" && toolName && messageId) {
        const tool = this.registeredTools.get(toolName);
        if (!tool) {
          (event.source as Window)?.postMessage(
            { type: "WEBMCP_EXECUTE_RESPONSE", messageId, isError: true, error: `Tool ${toolName} not found` },
            "*"
          );
          return;
        }

        try {
          const result = await tool.execute(input);
          (event.source as Window)?.postMessage(
            { type: "WEBMCP_EXECUTE_RESPONSE", messageId, result },
            "*"
          );
        } catch (err: unknown) {
          (event.source as Window)?.postMessage(
            {
              type: "WEBMCP_EXECUTE_RESPONSE",
              messageId,
              isError: true,
              error: err instanceof Error ? err.message : String(err),
            },
            "*"
          );
        }
      }
    });
  }

  async registerTool(toolDef: ToolDefinition, options?: RegisterToolOptions): Promise<RegisteredTool | void> {
    if (!toolDef || !toolDef.name) throw new Error("Invalid tool definition");
    this.registeredTools.set(toolDef.name, {
      ...toolDef,
      origin: window.location.origin,
      exposedTo: options?.exposedTo,
    });

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "WEBMCP_TOOL_REGISTERED",
          tool: {
            name: toolDef.name,
            description: toolDef.description,
            inputSchema: toolDef.inputSchema,
            origin: window.location.origin,
          },
        },
        "*"
      );
    }

    this.dispatchEvent(new Event("toolchange"));

    return {
      name: toolDef.name,
      description: toolDef.description,
      inputSchema: toolDef.inputSchema,
      origin: window.location.origin,
    };
  }

  async getTools(options?: GetToolsOptions): Promise<RegisteredTool[]> {
    const toolsList: RegisteredTool[] = [];
    this.registeredTools.forEach((tool) => {
      toolsList.push({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        origin: tool.origin || window.location.origin,
      });
    });

    if (options?.fromOrigins && options.fromOrigins.length > 0) {
      return toolsList.filter((t) => options.fromOrigins!.some((o) => t.origin?.includes(o) || o.includes(t.origin || "")));
    }

    return toolsList;
  }

  async executeTool(tool: RegisteredTool, serializedArguments: string): Promise<ToolResult> {
    const toolName = tool.name;
    if (this.registeredTools.has(toolName)) {
      const localTool = this.registeredTools.get(toolName);
      if (localTool) {
        const rawResult = await localTool.execute(serializedArguments);
        if (rawResult && typeof rawResult === "object" && "content" in rawResult) {
          return rawResult as ToolResult;
        }
        return {
          content: [{ type: "text", text: typeof rawResult === "string" ? rawResult : JSON.stringify(rawResult) }],
        };
      }
    }
    throw new Error(`Tool '${toolName}' not found in registered WebMCP context`);
  }
}

export function ensureWebMCPBridge(): ModelContext | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  if (!document.modelContext) {
    document.modelContext = new WebMCPModelContext();
  }
  return document.modelContext;
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  ensureWebMCPBridge();
}
