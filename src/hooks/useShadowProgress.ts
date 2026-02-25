import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "https://api.guardiacontent.com";

export type ShadowName = "forge" | "glass" | "kage" | "pulse" | "paradise" | "magii";

export interface ShadowTask {
  task_id: string;
  shadow: ShadowName;
  name: string;
  status: "pending" | "blocked" | "running" | "verifying" | "done" | "failed" | "stuck";
  iterations: number;
  max_iterations: number;
  started_at?: string;
  completed_at?: string;
  compacted_summary?: string;
  verification_output?: string;
  error_log?: string;
}

export interface ShadowRoomState {
  name: ShadowName;
  status: "idle" | "working" | "completed" | "escalated";
  currentTask?: ShadowTask;
  recentResults: ShadowTask[];
}

interface UseShadowProgressOptions {
  pollInterval?: number;
  enabled?: boolean;
}

const ALL_SHADOWS: ShadowName[] = ["forge", "glass", "kage", "pulse", "paradise", "magii"];

export function useShadowProgress({
  pollInterval = 5000,
  enabled = true,
}: UseShadowProgressOptions = {}) {
  const [shadows, setShadows] = useState<Map<ShadowName, ShadowRoomState>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const poll = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch(`${API_BASE}/luna/shadows/status`);
      if (!res.ok) {
        setIsConnected(false);
        return;
      }
      setIsConnected(true);
      setLastPoll(new Date());

      const data = await res.json();
      const tasks: ShadowTask[] = data.tasks || [];

      const roomMap = new Map<ShadowName, ShadowRoomState>();

      // Initialize all rooms as idle
      for (const name of ALL_SHADOWS) {
        roomMap.set(name, { name, status: "idle", recentResults: [] });
      }

      // Map tasks to rooms
      for (const task of tasks) {
        const shadow = task.shadow as ShadowName;
        if (!ALL_SHADOWS.includes(shadow)) continue;

        const room = roomMap.get(shadow)!;

        if (task.status === "running" || task.status === "verifying") {
          room.status = "working";
          room.currentTask = task;
        } else if (task.status === "stuck" || task.status === "failed") {
          room.status = "escalated";
          room.currentTask = task;
        } else if (task.status === "done") {
          room.recentResults = [...room.recentResults, task]
            .sort((a, b) => new Date(b.completed_at || "").getTime() - new Date(a.completed_at || "").getTime())
            .slice(0, 5);
          // If room still idle and has a recent completion, mark completed briefly
          if (room.status === "idle" && task.completed_at) {
            const completedAt = new Date(task.completed_at).getTime();
            const now = Date.now();
            if (now - completedAt < 30000) {
              room.status = "completed";
            }
          }
        }
      }

      if (mountedRef.current) {
        setShadows(roomMap);
      }
    } catch {
      if (mountedRef.current) {
        setIsConnected(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    // Defer initial poll to avoid synchronous setState in effect
    const timeout = setTimeout(poll, 0);
    const interval = setInterval(poll, pollInterval);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [enabled, poll, pollInterval]);

  // Flatten all recent results across rooms, sorted newest first
  const allRecentResults = Array.from(shadows.values())
    .flatMap(r => r.recentResults)
    .sort((a, b) => new Date(b.completed_at || "").getTime() - new Date(a.completed_at || "").getTime())
    .slice(0, 10);

  const activeShadows = Array.from(shadows.values()).filter(
    s => s.status === "working" || s.status === "escalated"
  );

  return {
    shadows,
    isConnected,
    lastPoll,
    allRecentResults,
    activeShadows,
    refresh: poll,
  };
}
