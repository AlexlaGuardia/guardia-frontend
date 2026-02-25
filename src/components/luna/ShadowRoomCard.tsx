"use client";

import { Moon, Hammer, Sparkles, Radio, Activity, Wand2, AlertTriangle, Check } from "lucide-react";
import type { ShadowName, ShadowRoomState } from "@/hooks/useShadowProgress";

const SHADOW_CONFIG: Record<ShadowName, { label: string; icon: React.ComponentType<any>; color: string; borderColor: string; dotColor: string }> = {
  forge:    { label: "Forge",    icon: Hammer,   color: "text-orange-400",  borderColor: "border-orange-500/30", dotColor: "bg-orange-500" },
  glass:    { label: "Glass",    icon: Sparkles, color: "text-violet-400",  borderColor: "border-violet-500/30", dotColor: "bg-violet-500" },
  kage:     { label: "Kage",     icon: Moon,     color: "text-slate-400",   borderColor: "border-slate-500/30",  dotColor: "bg-slate-500" },
  pulse:    { label: "Pulse",    icon: Radio,    color: "text-cyan-400",    borderColor: "border-cyan-500/30",   dotColor: "bg-cyan-500" },
  paradise: { label: "Paradise", icon: Activity, color: "text-amber-400",   borderColor: "border-amber-500/30",  dotColor: "bg-amber-500" },
  magii:    { label: "Magii",    icon: Wand2,    color: "text-purple-400",  borderColor: "border-purple-500/30", dotColor: "bg-purple-500" },
};

function formatElapsed(startedAt?: string): string {
  if (!startedAt) return "";
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ${diff % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function ShadowRoomCard({ room }: { room: ShadowRoomState }) {
  const config = SHADOW_CONFIG[room.name];
  const Icon = config.icon;
  const isWorking = room.status === "working";
  const isEscalated = room.status === "escalated";
  const isDone = room.status === "completed";

  const borderClass = isWorking
    ? "border-blue-500/40"
    : isEscalated
    ? "border-yellow-500/40"
    : isDone
    ? "border-green-500/30"
    : "border-[#1a1a1f]";

  const bgClass = isWorking
    ? "bg-blue-500/5"
    : isEscalated
    ? "bg-yellow-500/5"
    : isDone
    ? "bg-green-500/5"
    : "bg-[#0f0f10]";

  return (
    <div className={`rounded-lg border p-3 transition-all duration-300 ${borderClass} ${bgClass}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={config.color} />
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        <div className="flex-1" />
        {isWorking && (
          <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse`} />
        )}
        {isEscalated && <AlertTriangle size={12} className="text-yellow-400" />}
        {isDone && <Check size={12} className="text-green-400" />}
        {room.status === "idle" && (
          <span className="text-[10px] text-[#555]">idle</span>
        )}
      </div>

      {/* Active task */}
      {room.currentTask && (isWorking || isEscalated) && (
        <div className="mt-1.5">
          <div className="text-xs text-[#ccc] truncate" title={room.currentTask.name}>
            {room.currentTask.name}
          </div>
          {/* Progress bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-[#1a1a1f] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isEscalated ? "bg-yellow-500" : "bg-blue-500"
                }`}
                style={{
                  width: `${Math.min(100, (room.currentTask.iterations / room.currentTask.max_iterations) * 100)}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-[#666] tabular-nums whitespace-nowrap">
              {room.currentTask.iterations}/{room.currentTask.max_iterations}
            </span>
          </div>
          {/* Elapsed */}
          {room.currentTask.started_at && (
            <div className="mt-1 text-[10px] text-[#555]">
              {formatElapsed(room.currentTask.started_at)}
            </div>
          )}
        </div>
      )}

      {/* Last result preview (when idle) */}
      {room.status === "idle" && room.recentResults.length > 0 && (
        <div className="mt-1.5">
          <div className="text-[10px] text-[#555] truncate">
            Last: {room.recentResults[0].name}
          </div>
        </div>
      )}
    </div>
  );
}
