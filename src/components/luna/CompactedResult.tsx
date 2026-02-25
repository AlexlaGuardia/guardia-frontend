"use client";

import { useState } from "react";
import { Check, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import type { ShadowTask, ShadowName } from "@/hooks/useShadowProgress";

const SHADOW_COLORS: Record<ShadowName, string> = {
  forge: "text-orange-400",
  glass: "text-violet-400",
  kage: "text-slate-400",
  pulse: "text-cyan-400",
  paradise: "text-amber-400",
  magii: "text-purple-400",
};

function formatDuration(startedAt?: string, completedAt?: string): string {
  if (!startedAt || !completedAt) return "";
  const diff = Math.floor((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  return `${m}m ${diff % 60}s`;
}

function formatAgo(completedAt?: string): string {
  if (!completedAt) return "";
  const diff = Math.floor((Date.now() - new Date(completedAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function CompactedResult({ task }: { task: ShadowTask }) {
  const [expanded, setExpanded] = useState(false);
  const isFailed = task.status === "failed" || task.status === "stuck";
  const colorClass = SHADOW_COLORS[task.shadow] || "text-[#888]";

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left rounded-lg border border-[#1a1a1f] bg-[#0f0f10] p-2.5 hover:border-[#2a2a2f] transition-colors"
    >
      <div className="flex items-start gap-2">
        {isFailed ? (
          <AlertTriangle size={12} className="text-yellow-400 mt-0.5 flex-shrink-0" />
        ) : (
          <Check size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#ccc] truncate">{task.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
            <span className={colorClass}>{task.shadow}</span>
            {task.started_at && task.completed_at && (
              <>
                <span className="text-[#333]">·</span>
                <span className="text-[#555]">{formatDuration(task.started_at, task.completed_at)}</span>
              </>
            )}
            {task.completed_at && (
              <>
                <span className="text-[#333]">·</span>
                <span className="text-[#555]">{formatAgo(task.completed_at)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 mt-0.5">
          {expanded ? (
            <ChevronDown size={12} className="text-[#555]" />
          ) : (
            <ChevronRight size={12} className="text-[#555]" />
          )}
        </div>
      </div>
      {expanded && task.compacted_summary && (
        <div className="mt-2 pt-2 border-t border-[#1a1a1f] text-[11px] text-[#888] leading-relaxed whitespace-pre-wrap">
          {task.compacted_summary}
        </div>
      )}
    </button>
  );
}
