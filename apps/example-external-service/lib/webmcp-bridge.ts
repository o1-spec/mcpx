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
  private nativeContext?: ModelContext;

  constructor(nativeContext?: ModelContext) {
    super();
    this.nativeContext = nativeContext;
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

    if (this.nativeContext?.registerTool) {
      try {
        await this.nativeContext.registerTool(toolDef, options);
      } catch {
        // native fallback
      }
    }

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
    const addedNames = new Set<string>();

    if (this.nativeContext?.getTools) {
      try {
        const nativeTools = await this.nativeContext.getTools(options);
        if (Array.isArray(nativeTools)) {
          for (const nt of nativeTools) {
            if (nt && nt.name && !addedNames.has(nt.name)) {
              addedNames.add(nt.name);
              toolsList.push({
                name: nt.name,
                description: nt.description,
                inputSchema: nt.inputSchema,
                origin: (nt as RegisteredTool).origin || window.location.origin,
              });
            }
          }
        }
      } catch {
        // Native getTools fallback
      }
    }

    this.registeredTools.forEach((tool) => {
      if (!addedNames.has(tool.name)) {
        addedNames.add(tool.name);
        toolsList.push({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          origin: tool.origin || window.location.origin,
        });
      }
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

    if (this.nativeContext?.executeTool) {
      try {
        const nativeResult = await this.nativeContext.executeTool(tool, serializedArguments);
        if (nativeResult) return nativeResult;
      } catch {
        // fallback
      }
    }

    throw new Error(`Tool '${toolName}' not found in registered WebMCP context`);
  }
}

export function ensureWebMCPBridge(): ModelContext | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  if ((document as unknown as { __mcpx_bridge_installed?: boolean }).__mcpx_bridge_installed) {
    return document.modelContext;
  }
  const existing = document.modelContext;
  const bridge = new WebMCPModelContext(existing);
  document.modelContext = bridge;
  (document as unknown as { __mcpx_bridge_installed?: boolean }).__mcpx_bridge_installed = true;
  return bridge;
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  ensureWebMCPBridge();
}
