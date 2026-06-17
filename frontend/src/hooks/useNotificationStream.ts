"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { api } from "@/redux/api/api";
import { notificationsApi } from "@/redux/slices/notifications/notificationsApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const MAX_RECONNECT_DELAY_MS = 30_000;

/**
 * Connects to the SSE notification stream for the logged-in user.
 *
 * On a `notification` event, invalidates the Notifications RTK Query cache
 * so the panel refetches immediately — replacing the previous 30s poll cycle.
 *
 * On an `unread_count` event, directly updates the unread count cache entry
 * for instant badge updates without a round-trip.
 *
 * Reconnects with exponential back-off (2s → 4s → … → 30s) on connection loss.
 */
export function useNotificationStream() {
  const token = useAppSelector((s) => s.auth?.token);
  const dispatch = useAppDispatch();

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(2_000);
  const isUnmountedRef = useRef(false);

  const handleNotificationEvent = useCallback(() => {
    // Invalidate the Notifications tag — RTK Query refetches in the background.
    // This triggers getNotifications to reload and show the new item immediately.
    dispatch(api.util.invalidateTags(["Notifications"]));
  }, [dispatch]);

  const handleUnreadCountEvent = useCallback((rawData: string) => {
    try {
      const parsed = JSON.parse(rawData) as { count: number };
      if (typeof parsed.count !== "number") return;
      // Upsert the unread-count cache entry directly — instant badge update, no network round-trip.
      dispatch(
        notificationsApi.util.upsertQueryData("getUnreadCount", undefined, parsed.count),
      );
    } catch {
      // malformed event — ignore
    }
  }, [dispatch]);

  const connect = useCallback(() => {
    if (!token || isUnmountedRef.current) return;

    const url = `${API_BASE}/dashboard/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("notification", () => {
      handleNotificationEvent();
    });

    es.addEventListener("unread_count", (e: MessageEvent<string>) => {
      handleUnreadCountEvent(e.data);
    });

    es.onopen = () => {
      reconnectDelayRef.current = 2_000; // reset back-off on successful connect
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      if (isUnmountedRef.current) return;

      // Exponential back-off: 2s → 4s → 8s → … → 30s cap
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);

      reconnectTimerRef.current = setTimeout(() => {
        if (!isUnmountedRef.current) connect();
      }, delay);
    };
  }, [token, handleNotificationEvent, handleUnreadCountEvent]);

  useEffect(() => {
    isUnmountedRef.current = false;
    if (!token) return;

    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [token, connect]);
}
