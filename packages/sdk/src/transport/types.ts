export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
  idempotencyKey?: string;
}

export interface StreamOptions {
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  lastEventId?: string;
  onEvent?: (event: StreamEvent) => void;
  onError?: (error: Error) => void;
}

export interface StreamEvent {
  id?: string;
  event: string;
  data: string;
}
