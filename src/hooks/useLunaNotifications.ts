import { useEffect, useRef, useCallback, useState } from "react";

export interface LunaNotification {
  type: "luna_message";
  text: string;
  timestamp: string;
  speaker?: string;
  room_id?: number;
  emoji?: string;
  color?: string;
  audio_url?: string;
  audio_duration_ms?: number;
}

interface UseLunaNotificationsOptions {
  enabled?: boolean;
  onMessage?: (notification: LunaNotification) => void;
  onError?: (error: Event) => void;
  onConnectionChange?: (connected: boolean) => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

/**
 * Hook for subscribing to Luna's proactive notifications via SSE
 * Features:
 * - Auto-reconnect on connection loss
 * - Exponential backoff for reconnection
 * - Connection status tracking
 * - Automatic cleanup
 */
export function useLunaNotifications({
  enabled = true,
  onMessage,
  onError,
  onConnectionChange,
  reconnectDelay = 1000,
  maxReconnectAttempts = 10,
}: UseLunaNotificationsOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<LunaNotification | null>(null);

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource("https://api.guardiacontent.com/luna/notifications/stream");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("[Luna SSE] Connected to notification stream");
        setIsConnected(true);
        onConnectionChange?.(true);
        reconnectAttemptsRef.current = 0; // Reset on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          const data: LunaNotification = JSON.parse(event.data);

          if (data.type === "luna_message") {
            console.log("[Luna SSE] Received notification:", data);
            setLastNotification(data);
            onMessage?.(data);
          }
        } catch (error) {
          console.error("[Luna SSE] Failed to parse notification:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("[Luna SSE] Connection error:", error);
        setIsConnected(false);
        onConnectionChange?.(false);
        onError?.(error);

        // Close current connection
        eventSource.close();
        eventSourceRef.current = null;

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          console.log(`[Luna SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          console.error("[Luna SSE] Max reconnection attempts reached");
        }
      };
    } catch (error) {
      console.error("[Luna SSE] Failed to establish connection:", error);
      setIsConnected(false);
      onConnectionChange?.(false);
    }
  }, [enabled, onMessage, onError, onConnectionChange, reconnectDelay, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      console.log("[Luna SSE] Disconnecting from notification stream");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      onConnectionChange?.(false);
    }

    reconnectAttemptsRef.current = 0;
  }, [onConnectionChange]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    lastNotification,
    reconnect: () => {
      disconnect();
      connect();
    },
  };
}
