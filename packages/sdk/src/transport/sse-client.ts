import type { ResolvedMCPxConfig } from "../config.js";
import { buildUrl } from "../utils/url.js";
import { MCPxConnectionError } from "../errors/index.js";
import type { StreamEvent, StreamOptions } from "./types.js";

export class EventStreamClient {
  constructor(private readonly config: ResolvedMCPxConfig) {}

  /**
   * Opens an SSE (Server-Sent Events) stream or async generator to stream structured events.
   */
  async *streamEvents(options: StreamOptions): AsyncGenerator<StreamEvent, void, unknown> {
    const url = buildUrl(this.config.endpoint, options.path, options.query);
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
      ...this.config.headers,
    };

    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
      headers["X-MCPx-API-Key"] = this.config.apiKey;
    }

    if (options.lastEventId) {
      headers["Last-Event-ID"] = options.lastEventId;
    }

    this.config.logger?.debug?.(`[MCPx-SDK] Opening SSE stream: ${url}`);

    let response: Response;
    try {
      response = await this.config.fetch(url, {
        method: "GET",
        headers,
        signal: options.signal,
      });
    } catch (err: unknown) {
      if (options.signal?.aborted) return;
      throw new MCPxConnectionError(`Failed to connect to event stream at ${url}: ${(err as Error).message}`, {
        url,
        cause: err,
      });
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new MCPxConnectionError(`Event stream failed with HTTP ${response.status}: ${text}`, {
        url,
        statusCode: response.status,
      });
    }

    if (!response.body) {
      throw new MCPxConnectionError("Response body is not readable for SSE streaming", { url });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        if (options.signal?.aborted) break;

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r\n|\r|\n/);
        buffer = lines.pop() ?? "";

        let currentEvent: Partial<StreamEvent> = { event: "message", data: "" };

        for (const line of lines) {
          if (line.trim() === "") {
            if (currentEvent.data !== undefined && currentEvent.data !== "") {
              yield {
                id: currentEvent.id,
                event: currentEvent.event ?? "message",
                data: currentEvent.data.trim(),
              };
              currentEvent = { event: "message", data: "" };
            }
            continue;
          }

          if (line.startsWith(":")) {
            // Comment / heartbeat
            continue;
          }

          if (line.startsWith("id:")) {
            currentEvent.id = line.slice(3).trim();
          } else if (line.startsWith("event:")) {
            currentEvent.event = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            const dataPiece = line.slice(5).trim();
            currentEvent.data = currentEvent.data ? `${currentEvent.data}\n${dataPiece}` : dataPiece;
          }
        }
      }

      if (buffer.trim() !== "") {
        yield {
          event: "message",
          data: buffer.trim(),
        };
      }
    } finally {
      try {
        await reader.cancel();
      } catch {
        // ignore
      }
    }
  }
}
