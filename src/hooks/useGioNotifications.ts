"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export interface GioNotification {
  type: "outcome" | "question";
  id: string;
  message: string;
  request_id?: number;
  request_type?: string;
  status?: string;
  question_id?: number;
  category?: string;
}

interface UseGioNotificationsOptions {
  jwt: string | null;
  enabled?: boolean;
  onNotification?: (notification: GioNotification) => void;
  onConnectionChange?: (connected: boolean) => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

const API_BASE = "https://api.guardiacontent.com";

/**
 * Hook for subscribing to Giovanni notifications via SSE.
 * Replaces 30s polling with persistent event stream.
 *
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Catch-up on reconnect (server sends undismissed notifications)
 * - Connection status tracking
 */
export function useGioNotifications({
  jwt,
  enabled = true,
  onNotification,
  onConnectionChange,
  reconnectDelay = 1000,
  maxReconnectAttempts = 10,
}: UseGioNotificationsOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  // Track IDs we've already dispatched to avoid duplicates on reconnect
  const seenIdsRef = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    if (!enabled || !jwt || eventSourceRef.current) return;

    try {
      const url = `${API_BASE}/client/notifications/stream?token=${encodeURIComponent(jwt)}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        onConnectionChange?.(true);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data: GioNotification = JSON.parse(event.data);
          // Deduplicate: skip if we already delivered this ID
          if (data.id && seenIdsRef.current.has(data.id)) return;
          if (data.id) seenIdsRef.current.add(data.id);
          onNotification?.(data);
        } catch {
          // Ignore parse errors (keepalive comments, etc.)
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        onConnectionChange?.(false);

        eventSource.close();
        eventSourceRef.current = null;

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay =
            reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };
    } catch {
      setIsConnected(false);
      onConnectionChange?.(false);
    }
  }, [enabled, jwt, onNotification, onConnectionChange, reconnectDelay, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      onConnectionChange?.(false);
    }
    reconnectAttemptsRef.current = 0;
  }, [onConnectionChange]);

  useEffect(() => {
    if (enabled && jwt) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [enabled, jwt, connect, disconnect]);

  return { isConnected };
}
