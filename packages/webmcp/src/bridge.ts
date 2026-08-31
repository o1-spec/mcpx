/**
 * Universal WebMCP Standard Bridge & Polyfill
 * If document.modelContext is not provided natively by the browser,
 * this bridge handles cross-origin registerTool, getTools, and executeTool
 * over standard window.postMessage semantics with origin scoping.
 */

interface WebMCPBridgeTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  origin?: string;
  exposedTo?: string[];
  execute: (input: string | Record<string, unknown>) => Promise<unknown>;
}

type WebMCPEventListener = (event: Event) => void;

interface ExtendedDocument extends Document {
  modelContext?: {
    registerTool: (
      toolDef: WebMCPBridgeTool,
      options?: { signal?: AbortSignal; exposedTo?: string[] }
    ) => Promise<void>;
    getTools: (options?: { fromOrigins?: string[] }) => Promise<WebMCPBridgeTool[]>;
    executeTool: (tool: string | WebMCPBridgeTool, input: string | Record<string, unknown>) => Promise<unknown>;
    addEventListener: (event: string, callback: WebMCPEventListener) => void;
    removeEventListener: (event: string, callback: WebMCPEventListener) => void;
  };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  const extDoc = document as ExtendedDocument;

  if (!extDoc.modelContext) {
    const registeredTools = new Map<string, WebMCPBridgeTool>();
    const eventListeners = new Map<string, Set<WebMCPEventListener>>();

    // Listen for cross-frame WebMCP message events
    window.addEventListener("message", async (event) => {
      const { type, toolName, input, messageId } = (event.data || {}) as {
        type?: string;
        toolName?: string;
        input?: string | Record<string, unknown>;
        messageId?: string;
      };

      if (type === "WEBMCP_EXECUTE_REQUEST" && toolName && messageId) {
        const tool = registeredTools.get(toolName);
        if (!tool) {
          event.source?.postMessage(
            { type: "WEBMCP_EXECUTE_RESPONSE", messageId, isError: true, error: `Tool ${toolName} not found` },
            { targetOrigin: event.origin } as WindowPostMessageOptions
          );
          return;
        }

        try {
          const result = await tool.execute(input ?? {});
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

    const bridgeModelContext = {
      async registerTool(toolDef: WebMCPBridgeTool, options?: { signal?: AbortSignal; exposedTo?: string[] }) {
        if (!toolDef || !toolDef.name) throw new Error("Invalid tool definition");
        registeredTools.set(toolDef.name, { ...toolDef, exposedTo: options?.exposedTo });

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

        // Trigger local toolchange listeners
        const listeners = eventListeners.get("toolchange");
        if (listeners) {
          listeners.forEach((fn) => fn(new Event("toolchange")));
        }
      },

      async getTools(options?: { fromOrigins?: string[] }) {
        const toolsList: WebMCPBridgeTool[] = [];

        // Collect locally registered tools
        registeredTools.forEach((tool) => {
          toolsList.push({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            origin: window.location.origin,
            execute: tool.execute,
          });
        });

        // Filter by requested origins if provided
        if (options?.fromOrigins && options.fromOrigins.length > 0) {
          return toolsList.filter((t) => options.fromOrigins!.some((o) => t.origin?.includes(o) || o.includes(t.origin || "")));
        }

        return toolsList;
      },

      async executeTool(tool: string | WebMCPBridgeTool, input: string | Record<string, unknown>) {
        const toolName = typeof tool === "string" ? tool : tool?.name;

        // If tool is local in current window
        if (registeredTools.has(toolName)) {
          const localTool = registeredTools.get(toolName);
          if (localTool) {
            return await localTool.execute(input);
          }
        }

        throw new Error(`Tool '${toolName}' not found in registered WebMCP context`);
      },

      addEventListener(event: string, callback: WebMCPEventListener) {
        if (!eventListeners.has(event)) eventListeners.set(event, new Set());
        eventListeners.get(event)?.add(callback);
      },

      removeEventListener(event: string, callback: WebMCPEventListener) {
        if (eventListeners.has(event)) {
          eventListeners.get(event)?.delete(callback);
        }
      },
    };

    extDoc.modelContext = bridgeModelContext;
  }
}

export {};
