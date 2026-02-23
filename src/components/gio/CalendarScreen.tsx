"use client";

import { useState, useEffect, useCallback } from "react";
import { ScreenProps } from "./types";
import CalendarTab from "../lobby/CalendarTab";

const API_BASE = "https://api.guardiacontent.com";

interface UpcomingPost {
  id: number;
  caption: string;
  scheduled_for: string;
  status: string;
  platform: string;
  thumbnail_url?: string;
  preview_url?: string;
}

/**
 * CalendarScreen — Gio App
 *
 * Composes the existing CalendarTab (month grid + slot management)
 * with an Upcoming section below showing scheduled posts.
 */
export default function CalendarScreen({ client, jwt, onMessage, onPostSelect }: ScreenProps) {
  const [upcoming, setUpcoming] = useState<UpcomingPost[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

  const loadUpcoming = useCallback(async () => {
    if (!jwt) return;
    try {
      const res = await fetch(`${API_BASE}/client/calendar`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const posts: UpcomingPost[] = await res.json();
        const now = new Date();
        const futureScheduled = posts
          .filter(p => p.status === "scheduled" && new Date(p.scheduled_for) > now)
          .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
          .slice(0, 8);
        setUpcoming(futureScheduled);
      }
    } catch (err) {
      console.error("Failed to load upcoming:", err);
    }
    setUpcomingLoading(false);
  }, [jwt]);

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === now.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-base)]">
      {/* Calendar Grid */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <CalendarTab client={client as any} jwt={jwt} onMessage={onMessage || (() => {})} />

      {/* Upcoming Section */}
      <div className="border-t border-[var(--border-subtle)]">
      <div className="px-4 py-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3 mt-2">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Upcoming
          </h3>
          {upcoming.length > 0 && (
            <span className="text-xs text-[var(--text-muted)]">
              {upcoming.length} scheduled
            </span>
          )}
        </div>

        {upcomingLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        ) : upcoming.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm text-[var(--text-muted)]">No upcoming posts scheduled</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((post) => (
              <button
                key={post.id}
                onClick={() => onPostSelect?.(post.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[var(--bg-surface)] text-left"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
              >
                {/* Thumbnail */}
                <div
                  className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--bg-surface)] flex-shrink-0"
                  style={{ border: "1px solid var(--border)" }}
                >
                  {post.thumbnail_url || post.preview_url ? (
                    <img
                      src={post.thumbnail_url || post.preview_url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        width={20}
                        height={20}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--text-muted)"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] line-clamp-1">
                    {post.caption || "No caption"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[var(--accent)] font-medium">
                      {formatDate(post.scheduled_for)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatTime(post.scheduled_for)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] uppercase">
                      {post.platform}
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="flex-shrink-0"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
