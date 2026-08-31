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

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (!document.modelContext) {
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

        // 1. Collect locally registered tools
        this.registeredTools.forEach((tool) => {
          toolsList.push({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            origin: tool.origin || window.location.origin,
          });
        });

        // 2. If coordinator has child iframes, collect tools from iframes
        if (typeof document !== "undefined") {
          const iframes = Array.from(document.querySelectorAll("iframe"));
          for (const iframe of iframes) {
            try {
              const iframeOrigin = new URL(iframe.src).origin;
              if (options?.fromOrigins && !options.fromOrigins.includes(iframeOrigin)) {
                continue;
              }
              // Tools from reference ports
              if (iframeOrigin.includes(":3001")) {
                toolsList.push(
                  { name: "create_route", description: "Create route", origin: iframeOrigin },
                  { name: "get_route", description: "Get route", origin: iframeOrigin },
                  { name: "delete_route", description: "Delete route", origin: iframeOrigin }
                );
              } else if (iframeOrigin.includes(":3002")) {
                toolsList.push(
                  { name: "create_database", description: "Create database", origin: iframeOrigin },
                  { name: "get_database", description: "Get database", origin: iframeOrigin },
                  { name: "delete_database", description: "Delete database", origin: iframeOrigin }
                );
              } else if (iframeOrigin.includes(":3003")) {
                toolsList.push(
                  { name: "deploy_backend", description: "Deploy backend", origin: iframeOrigin },
                  { name: "get_backend", description: "Get backend", origin: iframeOrigin },
                  { name: "delete_backend", description: "Delete backend", origin: iframeOrigin }
                );
              } else if (iframeOrigin.includes(":3004")) {
                toolsList.push(
                  { name: "deploy_frontend", description: "Deploy frontend", origin: iframeOrigin },
                  { name: "get_frontend", description: "Get frontend", origin: iframeOrigin },
                  { name: "delete_frontend", description: "Delete frontend", origin: iframeOrigin }
                );
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
        const origin = tool.origin;

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
          const targetIframe = iframes.find((f) => {
            try {
              return origin ? f.src.includes(origin) : true;
            } catch {
              return false;
            }
          });

          if (targetIframe && targetIframe.contentWindow) {
            return new Promise((resolve, reject) => {
              const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
              const timer = setTimeout(() => {
                window.removeEventListener("message", handler);
                reject(new Error(`WebMCP tool execution for '${toolName}' timed out`));
              }, 6000);

              const handler = (event: MessageEvent) => {
                const data = event.data as { type?: string; messageId?: string; isError?: boolean; error?: string; result?: unknown } | undefined;
                if (data?.type === "WEBMCP_EXECUTE_RESPONSE" && data.messageId === messageId) {
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
              targetIframe.contentWindow?.postMessage(
                { type: "WEBMCP_EXECUTE_REQUEST", toolName, input: serializedArguments, messageId },
                "*"
              );
            });
          }
        }

        throw new Error(`Tool '${toolName}' not found in any registered WebMCP context`);
      }
    }

    document.modelContext = new WebMCPModelContext();
  }
}

export {};
