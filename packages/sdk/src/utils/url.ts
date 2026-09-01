/**
 * Builds a fully qualified URL from a base URL, path, and optional query parameters.
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>
): string {
  const base = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

/**
 * Builds a link to the MCPx Console for a given transaction.
 */
export function buildConsoleUrl(consoleBaseUrl: string, transactionId: string): string {
  return `${consoleBaseUrl.replace(/\/+$/, "")}/app/transactions/${encodeURIComponent(transactionId)}`;
}
