/**
 * Recursively/iteratively normalizes a WebMCP ToolResult by unwrapping nested JSON strings and content[0].text
 */
export function normalizeWebMCPResult(raw: unknown): unknown {
  let current = raw;

  for (let pass = 0; pass < 4; pass++) {
    if (typeof current === "string") {
      try {
        const parsed = JSON.parse(current);
        current = parsed;
        continue;
      } catch {
        // Not a JSON string
        break;
      }
    }

    if (current && typeof current === "object") {
      const obj = current as Record<string, unknown>;
      if (Array.isArray(obj.content) && obj.content.length > 0) {
        const first = obj.content[0] as { type?: string; text?: unknown };
        if (first && typeof first.text === "string") {
          try {
            const parsed = JSON.parse(first.text);
            current = parsed;
            continue;
          } catch {
            current = first.text;
            continue;
          }
        } else if (first && first.text !== undefined) {
          current = first.text;
          continue;
        }
      }
    }

    // No further unwrapping needed
    break;
  }

  console.log("[mcpx-web] raw executeTool result", raw);
  console.log("[mcpx-web] normalized result", current);

  return current;
}
