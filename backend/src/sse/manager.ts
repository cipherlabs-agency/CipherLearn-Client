import { Response } from "express";
import logger from "../utils/logger";

export interface SseClient {
  res: Response;
  userId: number;
  connectedAt: number;
}

export type SseEventType = "notification" | "unread_count" | "ping";

interface SsePayload {
  notification: {
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    link: string | null;
    createdAt: string;
  };
  unread_count: { count: number };
  ping: Record<string, never>;
}

class SseManager {
  /** Map of userId → set of active SSE response objects */
  private clients = new Map<number, Set<Response>>();

  /** Subscribe a client to their notification stream */
  subscribe(userId: number, res: Response): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(res);
    logger.info(`[SSE] client connected userId=${userId} total=${this.totalConnections()}`);
  }

  /** Remove a client (called on res.on("close")) */
  unsubscribe(userId: number, res: Response): void {
    const set = this.clients.get(userId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) this.clients.delete(userId);
    logger.info(`[SSE] client disconnected userId=${userId} total=${this.totalConnections()}`);
  }

  /** Emit an event to all connections for a specific user */
  emit<E extends SseEventType>(userId: number, event: E, data: SsePayload[E]): void {
    const set = this.clients.get(userId);
    if (!set || set.size === 0) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const res of set) {
      try {
        res.write(payload);
        // Flush if compression middleware is in play
        if (typeof (res as Response & { flush?: () => void }).flush === "function") {
          (res as Response & { flush: () => void }).flush();
        }
      } catch (err) {
        logger.warn(`[SSE] write failed userId=${userId}:`, err);
        set.delete(res);
      }
    }
  }

  /** Emit to multiple users at once (createMany flow) */
  emitToMany<E extends SseEventType>(userIds: number[], event: E, data: SsePayload[E]): void {
    for (const userId of userIds) {
      this.emit(userId, event, data);
    }
  }

  /** Heartbeat — prevents proxies/load-balancers from killing idle connections */
  startHeartbeat(intervalMs = 25_000): NodeJS.Timeout {
    return setInterval(() => {
      let pruned = 0;
      for (const [userId, set] of this.clients) {
        for (const res of set) {
          try {
            res.write(": ping\n\n");
          } catch {
            set.delete(res);
            pruned++;
          }
        }
        if (set.size === 0) this.clients.delete(userId);
      }
      if (pruned > 0) {
        logger.info(`[SSE] heartbeat pruned ${pruned} stale connection(s)`);
      }
    }, intervalMs);
  }

  totalConnections(): number {
    let total = 0;
    for (const set of this.clients.values()) total += set.size;
    return total;
  }

  connectedUsers(): number {
    return this.clients.size;
  }
}

export const sseManager = new SseManager();
