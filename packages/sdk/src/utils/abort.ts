import { MCPxTimeoutError } from "../errors/timeout-error.js";

/**
 * Combines an optional user AbortSignal with a timeout in milliseconds.
 */
export function createTimeoutSignal(
  timeoutMs: number,
  userSignal?: AbortSignal
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort(new MCPxTimeoutError(`Request timed out after ${timeoutMs}ms`, timeoutMs));
  }, timeoutMs);

  let onUserAbort: (() => void) | undefined;
  if (userSignal) {
    if (userSignal.aborted) {
      clearTimeout(timer);
      controller.abort(userSignal.reason);
    } else {
      onUserAbort = () => {
        clearTimeout(timer);
        controller.abort(userSignal.reason);
      };
      userSignal.addEventListener("abort", onUserAbort, { once: true });
    }
  }

  const cleanup = () => {
    clearTimeout(timer);
    if (userSignal && onUserAbort) {
      userSignal.removeEventListener("abort", onUserAbort);
    }
  };

  return { signal: controller.signal, cleanup };
}
