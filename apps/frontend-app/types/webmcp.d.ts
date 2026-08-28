export interface ToolSchema {
  type: "object";
  properties?: Record<
    string,
    {
      type: string;
      description?: string;
      enum?: string[];
      [key: string]: unknown;
    }
  >;
  required?: string[];
  [key: string]: unknown;
}

export interface ToolContentItem {
  type: "text" | "image" | "resource";
  text?: string;
  [key: string]: unknown;
}

export interface ToolResult {
  content: ToolContentItem[];
  isError?: boolean;
  [key: string]: unknown;
}

export interface ToolDefinition {
  name: string;
  description?: string;
  inputSchema?: ToolSchema;
  execute: (input: unknown) => Promise<ToolResult> | ToolResult;
}

export interface RegisteredTool {
  name: string;
  origin?: string;
  description?: string;
  inputSchema?: ToolSchema;
  [key: string]: unknown;
}

export interface RegisterToolOptions {
  signal?: AbortSignal;
  exposedTo?: string[];
}

export interface GetToolsOptions {
  fromOrigins?: string[];
}

export interface ModelContext extends EventTarget {
  registerTool(
    tool: ToolDefinition,
    options?: RegisterToolOptions
  ): Promise<RegisteredTool | void> | RegisteredTool | void;
  getTools(options?: GetToolsOptions): Promise<RegisteredTool[]>;
  executeTool(
    tool: RegisteredTool,
    serializedArguments: string
  ): Promise<ToolResult>;
  addEventListener(
    type: "toolchange" | string,
    listener: EventListenerOrEventListenerObject | ((event: Event) => void),
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: "toolchange" | string,
    listener: EventListenerOrEventListenerObject | ((event: Event) => void),
    options?: boolean | EventListenerOptions
  ): void;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}
