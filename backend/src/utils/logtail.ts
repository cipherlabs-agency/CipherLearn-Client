import { Logtail } from "@logtail/node";

// ── Logtail (Better Stack) cloud logger ──────────────────────────────────────
// Only "error" and "warn" levels are shipped — keeps noise low & costs down.
// Every call is wrapped in try/catch so logging NEVER crashes a request.

const token = process.env.LOGTAIL_SOURCE_TOKEN || "";
const logtail = token ? new Logtail(token) : null;

const instanceId = process.env.INSTANCE_ID || "cipherlearn-local";
const instanceName = process.env.INSTANCE_NAME || "CipherLearn Local";

/**
 * Ship a structured log to Better Stack.
 *
 * @param level   - "error" | "warn"
 * @param message - Human‑readable description of the event
 * @param meta    - Any additional context (userId, err.message, …)
 */
export function log(
  level: "error" | "warn",
  message: string,
  meta: Record<string, unknown> = {},
): void {
  try {
    if (!logtail) return; // token not set — silently skip
    const payload = { ...meta, instanceId, instanceName };
    if (level === "error") {
      logtail.error(message, payload);
    } else {
      logtail.warn(message, payload);
    }
  } catch {
    // Swallow — logging must never fail the request
  }
}

// ── Graceful‑shutdown flush ──────────────────────────────────────────────────
const flush = async () => {
  try {
    await logtail?.flush();
  } catch {
    // best‑effort
  }
};
process.on("SIGTERM", flush);
process.on("SIGINT", flush);
