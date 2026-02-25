"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, Check, AlertTriangle, Clock } from "lucide-react";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface DaemonRoomStatus {
  room_id: number;
  status: "active" | "completed" | "escalated" | "timeout";
  timestamp: string;
  metadata?: {
    project?: string;
    room_type?: string;
    reason?: string;
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const API_BASE = "https://api.guardiacontent.com";

const STATUS_COLORS = {
  active: { bg: "bg-blue-500/20", border: "border-blue-500/50", text: "text-blue-400", dot: "bg-blue-500" },
  completed: { bg: "bg-green-500/20", border: "border-green-500/50", text: "text-green-400", dot: "bg-green-500" },
  escalated: { bg: "bg-yellow-500/20", border: "border-yellow-500/50", text: "text-yellow-400", dot: "bg-yellow-500" },
  timeout: { bg: "bg-red-500/20", border: "border-red-500/50", text: "text-red-400", dot: "bg-red-500" },
};

const STATUS_ICON_COMPONENTS: Record<string, React.ComponentType<any>> = {
  active: Zap,
  completed: Check,
  escalated: AlertTriangle,
  timeout: Clock,
};

export default function DaemonRoomsIndicator() {
  const [rooms, setRooms] = useState<Map<number, DaemonRoomStatus>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE stream
    const connectToStream = () => {
      const eventSource = new EventSource(`${API_BASE}/luna/daemon-rooms/stream`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE connection established");
        setIsConnected(true);
      };

      eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        setIsConnected(false);
        eventSource.close();

        // Reconnect after 5 seconds
        setTimeout(() => {
          console.log("Attempting to reconnect...");
          connectToStream();
        }, 5000);
      };

      // Listen for daemon room events
      eventSource.addEventListener("daemon_room_activated", (event: MessageEvent) => {
        handleEvent(event, "active");
      });

      eventSource.addEventListener("daemon_room_completed", (event: MessageEvent) => {
        handleEvent(event, "completed");
      });

      eventSource.addEventListener("daemon_room_escalated", (event: MessageEvent) => {
        handleEvent(event, "escalated");
      });

      eventSource.addEventListener("daemon_room_timeout", (event: MessageEvent) => {
        handleEvent(event, "timeout");
      });
    };

    const handleEvent = (event: MessageEvent, status: "active" | "completed" | "escalated" | "timeout") => {
      try {
        const data = JSON.parse(event.data);
        const roomStatus: DaemonRoomStatus = {
          room_id: data.room_id,
          status,
          timestamp: data.timestamp || new Date().toISOString(),
          metadata: data.metadata,
        };

        setRooms((prev) => {
          const updated = new Map(prev);
          updated.set(data.room_id, roomStatus);
          return updated;
        });

        setLastEventTime(new Date());

        // Auto-remove completed/timeout rooms after 10 seconds
        if (status === "completed" || status === "timeout") {
          setTimeout(() => {
            setRooms((prev) => {
              const updated = new Map(prev);
              updated.delete(data.room_id);
              return updated;
            });
          }, 10000);
        }
      } catch (error) {
        console.error("Error parsing event data:", error);
      }
    };

    connectToStream();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const activeRooms = Array.from(rooms.values()).filter((r) => r.status === "active");
  const recentEvents = Array.from(rooms.values())
    .filter((r) => r.status !== "active")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

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

  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#ccc]">Daemon Rooms</span>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full transition-all ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-[#666]">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
        {lastEventTime && (
          <span className="text-xs text-[#555]">Last: {formatTimestamp(lastEventTime.toISOString())}</span>
        )}
      </div>

      {/* Active Rooms */}
      {activeRooms.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-[#888] uppercase tracking-wider mb-2">Active ({activeRooms.length})</div>
          <div className="space-y-1.5">
            {activeRooms.map((room) => {
              const colors = STATUS_COLORS[room.status];
              return (
                <div
                  key={room.room_id}
                  className={`p-2.5 rounded-lg border ${colors.bg} ${colors.border} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    {(() => { const Icon = STATUS_ICON_COMPONENTS[room.status] || Zap; return <Icon size={16} />; })()}
                    <div>
                      <div className={`text-sm font-medium ${colors.text}`}>Room #{room.room_id}</div>
                      {room.metadata?.project && (
                        <div className="text-xs text-[#666]">{room.metadata.project}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
                    <span className="text-xs text-[#666]">{formatTimestamp(room.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Events */}
      {recentEvents.length > 0 && (
        <div>
          <div className="text-xs text-[#888] uppercase tracking-wider mb-2">Recent Events</div>
          <div className="space-y-1.5">
            {recentEvents.map((room) => {
              const colors = STATUS_COLORS[room.status];
              return (
                <div
                  key={`${room.room_id}-${room.timestamp}`}
                  className={`p-2 rounded-lg border ${colors.bg} ${colors.border} flex items-center justify-between opacity-70`}
                >
                  <div className="flex items-center gap-2">
                    {(() => { const Icon = STATUS_ICON_COMPONENTS[room.status] || Zap; return <Icon size={14} />; })()}
                    <div>
                      <div className={`text-xs font-medium ${colors.text}`}>
                        Room #{room.room_id} • {room.status}
                      </div>
                      {room.metadata?.reason && (
                        <div className="text-xs text-[#555]">{room.metadata.reason}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-[#555]">{formatTimestamp(room.timestamp)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeRooms.length === 0 && recentEvents.length === 0 && (
        <div className="text-center py-6 text-[#555] text-sm">
          {isConnected ? "No daemon room activity yet" : "Waiting for connection..."}
        </div>
      )}
    </div>
  );
}
