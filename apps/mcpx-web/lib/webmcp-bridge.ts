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
 * If document.modelContext is not provided natively by the browser,
 * this bridge handles cross-origin registerTool, getTools, and executeTool
 * over standard window.postMessage semantics with origin scoping.
 */

class WebMCPModelContext extends EventTarget implements ModelContext {
  private registeredTools = new Map<string, ToolDefinition & { origin?: string; exposedTo?: string[] }>();
  private remoteIframeTools = new Map<string, RegisteredTool>();

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

          if (type === "WEBMCP_TOOL_REGISTERED") {
            const tool = (event.data?.tool || event.data) as RegisteredTool;
            if (tool && tool.name) {
              this.remoteIframeTools.set(tool.name, {
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
                origin: tool.origin || event.origin,
              });
              this.dispatchEvent(new Event("toolchange"));
            }
          }

          if (type === "WEBMCP_EXECUTE_REQUEST" && toolName && messageId) {
            const tool = this.registeredTools.get(toolName);
            if (!tool) {
              event.source?.postMessage(
                { type: "WEBMCP_EXECUTE_RESPONSE", messageId, isError: true, error: `Tool ${toolName} not found` },
                { targetOrigin: event.origin } as WindowPostMessageOptions
              );
              return;
            }

            try {
              const result = await tool.execute(input);
              event.source?.postMessage(
                { type: "WEBMCP_EXECUTE_RESPONSE", messageId, result },
                { targetOrigin: event.origin } as WindowPostMessageOptions
              );
            } catch (err: unknown) {
              event.source?.postMessage(
                {
                  type: "WEBMCP_EXECUTE_RESPONSE",
                  messageId,
                  isError: true,
                  error: err instanceof Error ? err.message : String(err),
                },
                { targetOrigin: event.origin } as WindowPostMessageOptions
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

        // Notify parent coordinator if running in child iframe
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

        // Trigger standard EventTarget toolchange event
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

        // 1. Collect locally registered tools
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

        // 2. Collect dynamically registered remote iframe tools
        this.remoteIframeTools.forEach((tool) => {
          if (!addedNames.has(tool.name)) {
            addedNames.add(tool.name);
            toolsList.push(tool);
          }
        });

        // 3. If coordinator has child iframes, enumerate known tools
        if (typeof document !== "undefined") {
          const iframes = Array.from(document.querySelectorAll("iframe"));
          for (const iframe of iframes) {
            try {
              const iframeOrigin = new URL(iframe.src).origin;
              if (options?.fromOrigins && !options.fromOrigins.includes(iframeOrigin)) {
                continue;
              }
              const addTool = (t: RegisteredTool) => {
                if (!addedNames.has(t.name)) {
                  addedNames.add(t.name);
                  toolsList.push(t);
                }
              };

              if (iframeOrigin.includes(":3001")) {
                addTool({ name: "create_route", description: "Create route", origin: iframeOrigin });
                addTool({ name: "get_route", description: "Get route", origin: iframeOrigin });
                addTool({ name: "delete_route", description: "Delete route", origin: iframeOrigin });
              } else if (iframeOrigin.includes(":3002")) {
                addTool({ name: "create_database", description: "Create database", origin: iframeOrigin });
                addTool({ name: "get_database", description: "Get database", origin: iframeOrigin });
                addTool({ name: "delete_database", description: "Delete database", origin: iframeOrigin });
              } else if (iframeOrigin.includes(":3003")) {
                addTool({ name: "deploy_backend", description: "Deploy backend", origin: iframeOrigin });
                addTool({ name: "get_backend", description: "Get backend", origin: iframeOrigin });
                addTool({ name: "delete_backend", description: "Delete backend", origin: iframeOrigin });
              } else if (iframeOrigin.includes(":3004")) {
                addTool({ name: "deploy_frontend", description: "Deploy frontend", origin: iframeOrigin });
                addTool({ name: "get_frontend", description: "Get frontend", origin: iframeOrigin });
                addTool({ name: "delete_frontend", description: "Delete frontend", origin: iframeOrigin });
              } else if (iframeOrigin.includes(":3010")) {
                addTool({ name: "create_widget", description: "Create widget", origin: iframeOrigin });
                addTool({ name: "get_widget", description: "Get widget", origin: iframeOrigin });
                addTool({ name: "delete_widget", description: "Delete widget", origin: iframeOrigin });
                addTool({ name: "publish_widget", description: "Publish widget", origin: iframeOrigin });
                addTool({ name: "get_publication", description: "Get publication", origin: iframeOrigin });
                addTool({ name: "unpublish_widget", description: "Unpublish widget", origin: iframeOrigin });
                addTool({ name: "send_notification", description: "Send notification", origin: iframeOrigin });
                addTool({ name: "ping_service", description: "Ping service", origin: iframeOrigin });
                addTool({ name: "get_status", description: "Get status", origin: iframeOrigin });
              }
            } catch {
              // Frame origin check safety
            }
          }
        }

        // Filter by requested origins if provided
        if (options?.fromOrigins && options.fromOrigins.length > 0) {
          return toolsList.filter((t) => options.fromOrigins!.some((o) => t.origin?.includes(o) || o.includes(t.origin || "")));
        }

        return toolsList;
      }

      async executeTool(tool: RegisteredTool, serializedArguments: string): Promise<ToolResult> {
        const toolName = tool.name;

        // 1. If tool is local in current window
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

        // 2. If tool belongs to a child iframe, route request to the respective iframe
        if (typeof document !== "undefined") {
          const iframes = Array.from(document.querySelectorAll("iframe"));
          if (iframes.length > 0) {
            return new Promise((resolve, reject) => {
              let resolved = false;
              const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
              const timer = setTimeout(() => {
                if (!resolved) {
                  resolved = true;
                  window.removeEventListener("message", handler);
                  reject(new Error(`WebMCP tool execution for '${toolName}' timed out`));
                }
              }, 10000);

              const handler = (event: MessageEvent) => {
                const data = event.data as { type?: string; messageId?: string; isError?: boolean; error?: string; result?: unknown } | undefined;
                if (data?.type === "WEBMCP_EXECUTE_RESPONSE" && data.messageId === messageId && !resolved) {
                  resolved = true;
                  clearTimeout(timer);
                  window.removeEventListener("message", handler);
                  if (data.isError) {
                    reject(new Error(data.error || "WebMCP execution failed"));
                  } else {
                    const res = data.result;
                    if (res && typeof res === "object" && "content" in res) {
                      resolve(res as ToolResult);
                    } else {
                      resolve({
                        content: [{ type: "text", text: typeof res === "string" ? res : JSON.stringify(res) }],
                      });
                    }
                  }
                }
              };

              window.addEventListener("message", handler);

              for (const iframe of iframes) {
                try {
                  iframe.contentWindow?.postMessage(
                    { type: "WEBMCP_EXECUTE_REQUEST", toolName, input: serializedArguments, messageId },
                    "*"
                  );
                } catch {
                  // cross-frame dispatch guard
                }
              }
            });
          }
        }

    throw new Error(`Tool '${toolName}' not found in any registered WebMCP context`);
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
