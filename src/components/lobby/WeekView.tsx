"use client";

import { useMemo } from "react";

/**
 * GUARDIA CALENDAR — Week View
 *
 * Hourly timeline showing 7 days × hours (6 AM–10 PM).
 * Posts placed in their scheduled time slots.
 * Click empty cells to create slots.
 * Desert Mirage design tokens.
 */

interface CalendarPost {
  id: number;
  caption: string;
  scheduled_for: string;
  posted_at: string | null;
  status: "draft" | "pending_approval" | "scheduled" | "posted" | "failed";
  platform: string;
  thumbnail_url?: string;
  preview_url?: string;
  asset_id?: number | null;
  predicted_score?: number;
}

interface WeekViewProps {
  weekStart: Date;
  posts: CalendarPost[];
  onSlotClick: (day: number, month: number, year: number, hour: number) => void;
  onPostClick: (post: CalendarPost) => void;
}

const HOURS_START = 6;
const HOURS_END = 22; // 10 PM
const HOUR_LABELS: string[] = [];
for (let h = HOURS_START; h <= HOURS_END; h++) {
  if (h === 0) HOUR_LABELS.push("12 AM");
  else if (h < 12) HOUR_LABELS.push(`${h} AM`);
  else if (h === 12) HOUR_LABELS.push("12 PM");
  else HOUR_LABELS.push(`${h - 12} PM`);
}

const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDateShort(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function isPast(d: Date, hour: number): boolean {
  const now = new Date();
  const check = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour);
  return check < now;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  posted: { bg: "rgba(217,119,6,0.15)", border: "rgba(217,119,6,0.3)", text: "#d97706" },
  scheduled: { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.3)", text: "#22c55e" },
  draft: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", text: "#f59e0b" },
  pending_approval: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", text: "#f59e0b" },
  failed: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", text: "#ef4444" },
};

export default function WeekView({ weekStart, posts, onSlotClick, onPostClick }: WeekViewProps) {
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // Build a map: "YYYY-MM-DD-HH" → CalendarPost[]
  const postMap = useMemo(() => {
    const map = new Map<string, CalendarPost[]>();
    for (const post of posts) {
      const dateStr = post.scheduled_for || post.posted_at;
      if (!dateStr) continue;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
      const arr = map.get(key) || [];
      arr.push(post);
      map.set(key, arr);
    }
    return map;
  }, [posts]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)]">
      {/* Day headers */}
      <div className="flex border-b border-[var(--border)] bg-[var(--bg-surface)] sticky top-0 z-10">
        {/* Hour column spacer */}
        <div className="w-14 flex-shrink-0" />
        {/* Day columns */}
        {weekDays.map((day, i) => {
          const today = isToday(day);
          return (
            <div
              key={i}
              className="flex-1 min-w-0 text-center py-2 border-l border-[var(--border)]"
              style={today ? { background: "rgba(232,160,96,0.06)" } : undefined}
            >
              <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                {DAY_NAMES_SHORT[day.getDay()]}
              </div>
              <div
                className="text-sm font-semibold mt-0.5"
                style={{ color: today ? "var(--accent)" : "var(--text-primary)" }}
              >
                {day.getDate()}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">{formatDateShort(day)}</div>
            </div>
          );
        })}
      </div>

      {/* Hour grid — scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {HOUR_LABELS.map((label, hi) => {
          const hour = HOURS_START + hi;
          return (
            <div key={hour} className="flex border-b border-[var(--border)]/50" style={{ minHeight: 56 }}>
              {/* Hour label */}
              <div className="w-14 flex-shrink-0 pr-2 pt-1 text-right">
                <span className="text-[10px] font-medium text-[var(--text-muted)]">{label}</span>
              </div>

              {/* Day cells */}
              {weekDays.map((day, di) => {
                const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${hour}`;
                const cellPosts = postMap.get(key) || [];
                const today = isToday(day);
                const past = isPast(day, hour);

                return (
                  <div
                    key={di}
                    className={`flex-1 min-w-0 border-l border-[var(--border)]/50 p-0.5 transition-colors ${
                      cellPosts.length === 0 && !past ? "cursor-pointer hover:bg-[var(--accent-muted)]/30" : ""
                    }`}
                    style={today ? { background: "rgba(232,160,96,0.03)" } : undefined}
                    onClick={() => {
                      if (cellPosts.length === 0 && !past) {
                        onSlotClick(day.getDate(), day.getMonth(), day.getFullYear(), hour);
                      }
                    }}
                  >
                    {cellPosts.map((post) => {
                      const colors = STATUS_COLORS[post.status] || STATUS_COLORS.draft;
                      const isSlot = post.status === "draft" && !post.asset_id;
                      const time = new Date(post.scheduled_for || post.posted_at || "");
                      const mins = time.getMinutes();

                      return (
                        <button
                          key={post.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPostClick(post);
                          }}
                          className="w-full rounded-lg p-1.5 text-left transition-all hover:brightness-110 mb-0.5"
                          style={{
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {/* Thumbnail */}
                            {(post.thumbnail_url || post.preview_url) && !isSlot ? (
                              <img
                                src={post.thumbnail_url || post.preview_url}
                                alt=""
                                className="w-7 h-7 rounded object-cover flex-shrink-0"
                              />
                            ) : isSlot ? (
                              <div
                                className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                                style={{ border: "1.5px dashed var(--accent)", background: "var(--accent-muted)" }}
                              >
                                <svg
                                  width={12}
                                  height={12}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="var(--accent)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                >
                                  <circle cx="12" cy="12" r="9" />
                                  <path d="M12 7v5l3 3" />
                                </svg>
                              </div>
                            ) : null}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium" style={{ color: colors.text }}>
                                  {mins > 0 ? `${hour > 12 ? hour - 12 : hour}:${String(mins).padStart(2, "0")}` : label}
                                </span>
                                <span className="text-[9px] text-[var(--text-muted)] uppercase">
                                  {post.platform?.slice(0, 2)}
                                </span>
                              </div>
                              {post.caption && !isSlot && (
                                <p className="text-[10px] text-[var(--text-secondary)] truncate leading-tight mt-0.5">
                                  {post.caption.slice(0, 40)}
                                </p>
                              )}
                              {isSlot && (
                                <p className="text-[10px] text-[var(--accent)] leading-tight mt-0.5">Empty slot</p>
                              )}
                            </div>

                            {/* Score badge */}
                            {post.predicted_score && post.predicted_score > 0 && post.status !== "posted" && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{
                                  background:
                                    post.predicted_score >= 70
                                      ? "rgba(34,197,94,0.2)"
                                      : post.predicted_score >= 40
                                      ? "rgba(245,158,11,0.2)"
                                      : "rgba(239,68,68,0.2)",
                                  color:
                                    post.predicted_score >= 70 ? "#22c55e" : post.predicted_score >= 40 ? "#f59e0b" : "#ef4444",
                                }}
                              >
                                {post.predicted_score}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
