"use client";

import { useState } from "react";
import {
  X,
  Clock,
  Newspaper,
  Users,
  Calendar,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { useLibra } from "@/hooks/useLibra";
import type {
  ScoutFinding,
  HiveSession,
  CalendarEvent,
  ScheduleBlock,
} from "@/hooks/useLibra";

type Tab = "schedule" | "scout" | "hive" | "calendar";

const TABS: { key: Tab; label: string; icon: typeof Clock }[] = [
  { key: "schedule", label: "Schedule", icon: Clock },
  { key: "scout", label: "Scout", icon: Newspaper },
  { key: "hive", label: "Hive", icon: Users },
  { key: "calendar", label: "Calendar", icon: Calendar },
];

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatHour(h: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}${ampm}`;
}

const SOURCE_COLORS: Record<string, string> = {
  hackernews: "bg-orange-500/20 text-orange-400",
  reddit_localllama: "bg-red-500/20 text-red-400",
  reddit_machinelearning: "bg-red-500/20 text-red-400",
  github_trending: "bg-purple-500/20 text-purple-400",
};

// ════════════════════════════════════════════════════════════════════
// SCHEDULE TAB
// ════════════════════════════════════════════════════════════════════

function ScheduleTab({
  focus,
  blocks,
}: {
  focus: ReturnType<typeof useLibra>["focus"];
  blocks: ScheduleBlock[];
}) {
  return (
    <div className="space-y-2">
      {/* Current block */}
      {focus && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border-l-2 border-green-500">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-green-400 font-medium mb-0.5">
              NOW
            </div>
            <div className="text-sm text-[#ccc]">{focus.focus}</div>
            <div className="text-xs text-[#666] mt-0.5">
              {focus.project} &middot;{" "}
              {focus.time_remaining_hours > 0
                ? `${Math.round(focus.time_remaining_hours * 60)}m remaining`
                : "wrapping up"}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming blocks */}
      {blocks.map((block, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-lg bg-[#111] border-l-2 border-[#333]"
        >
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[#666] mb-0.5">
              {formatHour(block.start_hour)} - {formatHour(block.end_hour)}
            </div>
            <div className="text-sm text-[#ccc]">{block.focus}</div>
            <div className="text-xs text-[#555] mt-0.5">{block.project}</div>
          </div>
          {block.starts_in_hours !== undefined && (
            <span className="text-xs text-[#555] shrink-0">
              in {block.starts_in_hours}h
            </span>
          )}
        </div>
      ))}

      {!focus && blocks.length === 0 && (
        <div className="text-center py-6 text-[#555] text-sm">
          No blocks scheduled
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SCOUT TAB
// ════════════════════════════════════════════════════════════════════

function ScoutTab({
  findings,
  onMarkRead,
}: {
  findings: ScoutFinding[];
  onMarkRead: () => void;
}) {
  return (
    <div className="space-y-2">
      {findings.length > 0 && (
        <button
          onClick={onMarkRead}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition mb-2"
        >
          <CheckCircle className="w-3 h-3" />
          Mark all as read
        </button>
      )}
      {findings.map((f) => (
        <div key={f.id} className="p-3 rounded-lg bg-[#111]">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#ccc] leading-snug">{f.title}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${SOURCE_COLORS[f.source_name] || "bg-[#222] text-[#888]"}`}
                >
                  {f.source_name}
                </span>
                {f.score > 0 && (
                  <span className="text-[10px] text-[#666]">
                    score: {f.score}
                  </span>
                )}
                <span className="text-[10px] text-[#555]">
                  {relativeTime(f.found_at)}
                </span>
              </div>
            </div>
            {f.url && (
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#555] hover:text-[#888] transition shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      ))}
      {findings.length === 0 && (
        <div className="text-center py-6 text-[#555] text-sm">
          All caught up
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// HIVE TAB
// ════════════════════════════════════════════════════════════════════

const SESSION_COLORS: Record<string, string> = {
  claude_code: "bg-orange-500/20 text-orange-400",
  web: "bg-violet-500/20 text-violet-400",
  shadow_forge: "bg-orange-500/20 text-orange-400",
  shadow_glass: "bg-violet-500/20 text-violet-400",
  shadow_kage: "bg-slate-500/20 text-slate-400",
  shadow_pulse: "bg-cyan-500/20 text-cyan-400",
  shadow_paradise: "bg-emerald-500/20 text-emerald-400",
  shadow_magii: "bg-amber-500/20 text-amber-400",
};

function HiveTab({ sessions }: { sessions: HiveSession[] }) {
  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div key={s.id} className="p-3 rounded-lg bg-[#111]">
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className={`w-2 h-2 rounded-full ${s.ended_at ? "bg-gray-500" : "bg-green-500"}`}
            />
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${SESSION_COLORS[s.session_type] || "bg-[#222] text-[#888]"}`}
            >
              {s.session_type}
            </span>
            {s.project && (
              <span className="text-xs text-[#666]">{s.project}</span>
            )}
          </div>
          {s.summary && (
            <div className="text-xs text-[#999] line-clamp-2">{s.summary}</div>
          )}
          <div className="text-[10px] text-[#555] mt-1.5">
            Active {relativeTime(s.last_active_at)}
          </div>
        </div>
      ))}
      {sessions.length === 0 && (
        <div className="text-center py-6 text-[#555] text-sm">
          No active sessions
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// CALENDAR TAB
// ════════════════════════════════════════════════════════════════════

function CalendarTab({ events }: { events: CalendarEvent[] }) {
  return (
    <div className="space-y-2">
      {events.map((e, i) => {
        const start = new Date(e.start);
        const end = new Date(e.end);
        const now = new Date();
        const isActive = now >= start && now <= end;

        return (
          <div
            key={i}
            className={`p-3 rounded-lg ${isActive ? "bg-blue-500/5 border-l-2 border-blue-500" : "bg-[#111] border-l-2 border-[#333]"}`}
          >
            <div className="text-xs text-[#666] mb-0.5">
              {start.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              -{" "}
              {end.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
            <div className="text-sm text-[#ccc]">{e.summary}</div>
            {e.location && (
              <div className="text-xs text-[#555] mt-0.5">{e.location}</div>
            )}
          </div>
        );
      })}
      {events.length === 0 && (
        <div className="text-center py-6 text-[#555] text-sm">
          Clear schedule today
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN PANEL
// ════════════════════════════════════════════════════════════════════

export default function LibraPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("schedule");
  const libra = useLibra({ enabled: true, pollInterval: 30000 });

  return (
    <div className="bg-[#0f0f0f] border-t border-[#1a1a1f] max-h-[400px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1f] shrink-0">
        <div className="flex items-center gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition ${
                tab === key
                  ? "bg-[#1a1a1f] text-[#ccc]"
                  : "text-[#555] hover:text-[#888]"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
              {key === "scout" && libra.scoutCount > 0 && (
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-1 rounded">
                  {libra.scoutCount}
                </span>
              )}
              {key === "hive" && libra.hiveSessions.length > 0 && (
                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1 rounded">
                  {libra.hiveSessions.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="text-[#555] hover:text-[#888] transition p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "schedule" && (
          <ScheduleTab
            focus={libra.focus}
            blocks={libra.upcomingBlocks}
          />
        )}
        {tab === "scout" && (
          <ScoutTab
            findings={libra.scoutFindings}
            onMarkRead={libra.markScoutRead}
          />
        )}
        {tab === "hive" && <HiveTab sessions={libra.hiveSessions} />}
        {tab === "calendar" && (
          <CalendarTab events={libra.calendarEvents} />
        )}
      </div>
    </div>
  );
}
