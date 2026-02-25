"use client";

import { Activity } from "lucide-react";
import { useShadowProgress, type ShadowName } from "@/hooks/useShadowProgress";
import ShadowRoomCard from "./ShadowRoomCard";
import CompactedResult from "./CompactedResult";

const ROOM_ORDER: ShadowName[] = ["forge", "glass", "kage", "pulse", "paradise", "magii"];

export default function ShadowActivityPanel() {
  const { shadows, isConnected, allRecentResults, activeShadows } = useShadowProgress();

  // Sort: active rooms first, then by defined order
  const sortedRooms = ROOM_ORDER.map(name => shadows.get(name)).filter(Boolean);
  const activeRooms = sortedRooms.filter(r => r!.status !== "idle");
  const idleRooms = sortedRooms.filter(r => r!.status === "idle");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1f] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[#888]" />
          <span className="text-xs font-medium text-[#ccc]">Shadow Activity</span>
          {activeShadows.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
              {activeShadows.length} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500/60" : "bg-red-500/40"}`} />
          <span className="text-[10px] text-[#555]">{isConnected ? "live" : "offline"}</span>
        </div>
      </div>

      {/* Room cards */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {/* Active rooms first */}
        {activeRooms.map(room => (
          <ShadowRoomCard key={room!.name} room={room!} />
        ))}

        {/* Idle rooms, collapsed */}
        {idleRooms.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {idleRooms.map(room => (
              <ShadowRoomCard key={room!.name} room={room!} />
            ))}
          </div>
        )}

        {/* No rooms loaded yet */}
        {shadows.size === 0 && (
          <div className="text-center py-8 text-[#555] text-xs">
            {isConnected ? "All shadows idle" : "Connecting..."}
          </div>
        )}
      </div>

      {/* Recent Results */}
      {allRecentResults.length > 0 && (
        <div className="border-t border-[#1a1a1f] px-3 py-2 flex-shrink-0">
          <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Recent</div>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
            {allRecentResults.slice(0, 5).map(task => (
              <CompactedResult key={task.task_id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
