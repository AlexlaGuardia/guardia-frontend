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
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
  pollInterval?: number;
}

const API_BASE = "https://api.guardiacontent.com";

/**
 * Hook for subscribing to Luna's proactive notifications via polling.
 * Polls /luna/notifications for undelivered messages and marks them delivered.
 * Cloudflare-friendly — no long-lived connections.
 */
export function useLunaNotifications({
  enabled = true,
  onMessage,
  onError,
  onConnectionChange,
  pollInterval = 5000,
}: UseLunaNotificationsOptions = {}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<LunaNotification | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/luna/notifications?undelivered_only=true&limit=10`
      );

      if (!res.ok) {
        if (isConnected) {
          setIsConnected(false);
          onConnectionChange?.(false);
        }
        return;
      }

      if (!isConnected) {
        setIsConnected(true);
        onConnectionChange?.(true);
      }

      const data = await res.json();
      const notifications = data.notifications || [];

      // Process new notifications (oldest first)
      const deliveredIds: number[] = [];
      for (const notif of notifications.reverse()) {
        if (seenIdsRef.current.has(notif.id)) continue;
        seenIdsRef.current.add(notif.id);
        deliveredIds.push(notif.id);

        const parsed: LunaNotification = {
          type: "luna_message",
          text: notif.message || "",
          timestamp: notif.created_at || "",
          speaker: notif.shadow || "luna",
          room_id: notif.room_id,
          audio_url: notif.audio_url,
          audio_duration_ms: notif.audio_duration_ms,
        };

        setLastNotification(parsed);
        onMessage?.(parsed);
      }

      // Mark delivered
      for (const id of deliveredIds) {
        fetch(`${API_BASE}/luna/notifications/${id}/delivered`, {
          method: "POST",
        }).catch(() => {});
      }

      // Cap seen set size
      if (seenIdsRef.current.size > 500) {
        const arr = Array.from(seenIdsRef.current);
        seenIdsRef.current = new Set(arr.slice(-200));
      }
    } catch (err) {
      if (isConnected) {
        setIsConnected(false);
        onConnectionChange?.(false);
      }
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [enabled, onMessage, onError, onConnectionChange, isConnected]);

  useEffect(() => {
    if (!enabled) return;

    // Initial poll immediately
    poll();

    // Then poll on interval
    intervalRef.current = setInterval(poll, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, poll, pollInterval]);

  return {
    isConnected,
    lastNotification,
    reconnect: () => {
      seenIdsRef.current.clear();
      poll();
    },
  };
}
