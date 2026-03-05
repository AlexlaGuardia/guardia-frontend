"use client";

import { useState, useEffect, useCallback } from "react";
import { ScreenProps } from "./types";
import CalendarTab from "../lobby/CalendarTab";

const API_BASE = "https://api.guardiacontent.com";

interface MonthStats {
  posts: number;
  likes: number;
  comments: number;
  shares: number;
}

interface CalendarScreenProps extends ScreenProps {
  onCreatePost?: (date: string) => void;
  onNewPost?: () => void;
}

export default function CalendarScreen({ client, jwt, onMessage, onCreatePost, onNewPost }: CalendarScreenProps) {
  const [stats, setStats] = useState<MonthStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!jwt || !client) { setStatsLoading(false); return; }
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/engagement/analytics/${client.id}?period=30d`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          posts: data.kpi?.posts_count?.current ?? 0,
          likes: data.kpi?.likes?.current ?? 0,
          comments: data.kpi?.comments?.current ?? 0,
          shares: data.kpi?.shares?.current ?? 0,
        });
      }
    } catch {
      // silent — stats are non-critical
    }
    setStatsLoading(false);
  }, [jwt, client]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const fmt = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-base)] relative">
      {/* Calendar Grid */}
      <CalendarTab
        client={client as any}
        jwt={jwt}
        onMessage={onMessage || (() => {})}
        onCreatePost={onCreatePost}
      />

      {/* Month Stats */}
      {statsLoading && (
        <div className="border-t border-[var(--border-subtle)]">
          <div className="px-4 py-4 max-w-3xl mx-auto">
            <div className="h-3 w-24 bg-[var(--bg-elevated)] rounded animate-pulse mb-3" />
            <div className="grid grid-cols-4 gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="rounded-xl p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  <div className="h-5 w-8 mx-auto bg-[var(--bg-surface)] rounded animate-pulse mb-1" />
                  <div className="h-2 w-12 mx-auto bg-[var(--bg-surface)] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {!statsLoading && stats && (stats.posts > 0 || stats.likes > 0) && (
        <div className="border-t border-[var(--border-subtle)]">
          <div className="px-4 py-4 max-w-3xl mx-auto">
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Last 30 Days
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Posted", value: fmt(stats.posts), color: "var(--accent)" },
                { label: "Likes", value: fmt(stats.likes), color: "#E4405F" },
                { label: "Comments", value: fmt(stats.comments), color: "#1877F2" },
                { label: "Shares", value: fmt(stats.shares), color: "#22c55e" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                >
                  <p className="text-lg font-semibold" style={{ color }}>{value}</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Post FAB */}
      {onNewPost && (
        <button
          onClick={onNewPost}
          className="fixed bottom-24 right-5 md:absolute md:bottom-6 md:right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 z-10"
          style={{ background: "linear-gradient(135deg, #C9A227, #D4AF37)", boxShadow: "0 4px 20px rgba(201,162,39,0.4)" }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
}
