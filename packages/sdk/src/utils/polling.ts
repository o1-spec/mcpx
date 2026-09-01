import { MCPxTimeoutError } from "../errors/timeout-error.js";

export interface PollUntilOptions {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Polls an async condition until it returns truthy, a timeout expires, or the abort signal triggers.
 */
export async function pollUntil<T>(
  fn: () => Promise<T | null | undefined | false>,
  options: PollUntilOptions = {}
): Promise<T> {
  const intervalMs = options.intervalMs ?? 1000;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const startTime = Date.now();

  while (true) {
    if (options.signal?.aborted) {
      throw options.signal.reason ?? new Error("Polling aborted by caller");
    }

    if (Date.now() - startTime >= timeoutMs) {
      throw new MCPxTimeoutError(`Operation timed out after ${timeoutMs}ms`, timeoutMs);
    }

    const result = await fn();
    if (result) {
      return result;
    }

    const remaining = timeoutMs - (Date.now() - startTime);
    const waitTime = Math.min(intervalMs, Math.max(0, remaining));

    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
}
