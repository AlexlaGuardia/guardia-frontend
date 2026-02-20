"use client";

import { useState, useEffect, useRef } from "react";
import { Moon, Hammer, Sparkles, Radio, Check, AlertTriangle } from "lucide-react";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

type ShadowName = "kage" | "forge" | "glass" | "pulse";

type ShadowStatus = "idle" | "working" | "completed" | "escalated";

interface ShadowState {
  name: ShadowName;
  status: ShadowStatus;
  current_task?: string;
  iteration_count?: number;
  time_elapsed?: number;
  last_update?: string;
  recent_completions?: Array<{
    task: string;
    timestamp: string;
    result: "completed" | "escalated";
  }>;
}

interface ShadowEvent {
  type: "shadow_started" | "shadow_completed" | "shadow_escalated" | "shadow_idle";
  shadow: ShadowName;
  timestamp: string;
  task?: string;
  iteration_count?: number;
  time_elapsed?: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════════════════════════════════

const API_BASE = "https://api.guardiacontent.com";

const SHADOW_CONFIG = {
  kage: {
    label: "Kage",
    icon: Moon,
    description: "Server orchestration",
    color: {
      bg: "bg-slate-500/20",
      border: "border-slate-500/50",
      text: "text-slate-400",
      dot: "bg-slate-500",
    },
  },
  forge: {
    label: "Forge",
    icon: Hammer,
    description: "Backend architecture",
    color: {
      bg: "bg-orange-500/20",
      border: "border-orange-500/50",
      text: "text-orange-400",
      dot: "bg-orange-500",
    },
  },
  glass: {
    label: "Glass",
    icon: Sparkles,
    description: "Frontend execution",
    color: {
      bg: "bg-violet-500/20",
      border: "border-violet-500/50",
      text: "text-violet-400",
      dot: "bg-violet-500",
    },
  },
  pulse: {
    label: "Pulse",
    icon: Radio,
    description: "Integration & APIs",
    color: {
      bg: "bg-cyan-500/20",
      border: "border-cyan-500/50",
      text: "text-cyan-400",
      dot: "bg-cyan-500",
    },
  },
};

const STATUS_COLORS = {
  idle: { bg: "bg-[#2a2a2f]", border: "border-[#3a3a3f]", text: "text-[#888]", dot: "bg-gray-500" },
  working: { bg: "bg-blue-500/20", border: "border-blue-500/50", text: "text-blue-400", dot: "bg-blue-500" },
  completed: { bg: "bg-green-500/20", border: "border-green-500/50", text: "text-green-400", dot: "bg-green-500" },
  escalated: { bg: "bg-yellow-500/20", border: "border-yellow-500/50", text: "text-yellow-400", dot: "bg-yellow-500" },
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export function ShadowStatusDashboard() {
  const [shadows, setShadows] = useState<Map<ShadowName, ShadowState>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [useSSE, setUseSSE] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time elapsed
  const formatTime = (seconds?: number) => {
    if (!seconds) return "";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  // Format relative time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  // Fetch shadow status via polling
  const fetchShadowStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/luna/shadows/status`);
      if (!response.ok) throw new Error("Failed to fetch shadow status");

      const data = await response.json();

      // Assuming response format: { shadows: ShadowState[] } or { kage: {...}, forge: {...}, etc }
      const shadowMap = new Map<ShadowName, ShadowState>();

      if (Array.isArray(data.shadows)) {
        data.shadows.forEach((shadow: ShadowState) => {
          shadowMap.set(shadow.name, shadow);
        });
      } else {
        // Handle object format
        Object.entries(data).forEach(([name, state]) => {
          if (["kage", "forge", "glass", "pulse"].includes(name)) {
            shadowMap.set(name as ShadowName, state as ShadowState);
          }
        });
      }

      setShadows(shadowMap);
      setIsConnected(true);
    } catch (error) {
      console.error("Error fetching shadow status:", error);
      setIsConnected(false);
    }
  };

  // Connect to SSE stream
  const connectToSSE = () => {
    const eventSource = new EventSource(`${API_BASE}/luna/shadow-events`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("Shadow SSE connection established");
      setIsConnected(true);
    };

    eventSource.onerror = (error) => {
      console.error("Shadow SSE connection error:", error);
      setIsConnected(false);
      eventSource.close();

      // Fallback to polling after SSE failure
      console.log("Falling back to polling mode");
      setUseSSE(false);
    };

    // Listen for shadow events
    eventSource.addEventListener("shadow_started", (event: MessageEvent) => {
      handleShadowEvent(event, "working");
    });

    eventSource.addEventListener("shadow_completed", (event: MessageEvent) => {
      handleShadowEvent(event, "completed");
    });

    eventSource.addEventListener("shadow_escalated", (event: MessageEvent) => {
      handleShadowEvent(event, "escalated");
    });

    eventSource.addEventListener("shadow_idle", (event: MessageEvent) => {
      handleShadowEvent(event, "idle");
    });
  };

  // Handle SSE events
  const handleShadowEvent = (event: MessageEvent, status: ShadowStatus) => {
    try {
      const data: ShadowEvent = JSON.parse(event.data);

      setShadows((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(data.shadow) || {
          name: data.shadow,
          status: "idle",
          recent_completions: [],
        };

        // Update shadow state
        const newState: ShadowState = {
          ...existing,
          status,
          current_task: status === "working" ? data.task : undefined,
          iteration_count: data.iteration_count,
          time_elapsed: data.time_elapsed,
          last_update: data.timestamp,
        };

        // Add to recent completions if completed or escalated
        if ((status === "completed" || status === "escalated") && data.task) {
          newState.recent_completions = [
            {
              task: data.task,
              timestamp: data.timestamp,
              result: status,
            },
            ...(existing.recent_completions || []).slice(0, 4),
          ];
        }

        updated.set(data.shadow, newState);
        return updated;
      });
    } catch (error) {
      console.error("Error parsing shadow event:", error);
    }
  };

  // Initialize connection
  useEffect(() => {
    if (useSSE) {
      connectToSSE();
    } else {
      // Use polling as fallback
      fetchShadowStatus();
      pollingIntervalRef.current = setInterval(fetchShadowStatus, 5000);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [useSSE]);

  const shadowArray: ShadowName[] = ["kage", "forge", "glass", "pulse"];

  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#ccc]">Shadow Status</span>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full transition-all ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-[#666]">
              {isConnected ? (useSSE ? "Live" : "Polling") : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Shadow Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {shadowArray.map((shadowName) => {
          const shadowState = shadows.get(shadowName);
          const config = SHADOW_CONFIG[shadowName];
          const status = shadowState?.status || "idle";
          const statusColor = STATUS_COLORS[status];

          return (
            <div
              key={shadowName}
              className={`p-3 rounded-lg border ${statusColor.border} ${statusColor.bg} transition-all`}
            >
              {/* Shadow Header */}
              <div className="flex items-center gap-2 mb-2">
                <config.icon size={20} className={config.color.text} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${config.color.text}`}>{config.label}</div>
                  <div className="text-xs text-[#666] truncate">{config.description}</div>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${statusColor.dot} ${
                    status === "working" ? "animate-pulse" : ""
                  }`}
                />
              </div>

              {/* Status Badge */}
              <div className={`text-xs ${statusColor.text} uppercase tracking-wider mb-2`}>
                {status}
              </div>

              {/* Current Task */}
              {shadowState?.current_task && status === "working" && (
                <div className="mb-2">
                  <div className="text-xs text-[#888] mb-1">Task:</div>
                  <div className="text-xs text-[#ccc] truncate" title={shadowState.current_task}>
                    {shadowState.current_task}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#666]">
                    {shadowState.iteration_count && (
                      <span>Iter: {shadowState.iteration_count}</span>
                    )}
                    {shadowState.time_elapsed && (
                      <span>{formatTime(shadowState.time_elapsed)}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Completions */}
              {shadowState?.recent_completions && shadowState.recent_completions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#2a2a2f]">
                  <div className="text-xs text-[#888] mb-1">Recent:</div>
                  <div className="space-y-1">
                    {shadowState.recent_completions.slice(0, 2).map((completion, idx) => (
                      <div key={idx} className="text-xs text-[#666] truncate flex items-center gap-1">
                        <span className="flex-shrink-0">
                          {completion.result === "completed" ? <Check size={10} className="text-green-400" /> : <AlertTriangle size={10} className="text-yellow-400" />}
                        </span>
                        <span className="truncate flex-1" title={completion.task}>
                          {completion.task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Update */}
              {shadowState?.last_update && (
                <div className="text-xs text-[#555] mt-2">
                  {formatTimestamp(shadowState.last_update)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {shadows.size === 0 && (
        <div className="text-center py-8 text-[#555] text-sm">
          {isConnected ? "Waiting for shadow activity..." : "Connecting..."}
        </div>
      )}
    </div>
  );
}

export default ShadowStatusDashboard;
