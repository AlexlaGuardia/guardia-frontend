"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = "https://api.guardiacontent.com";
const REFRESH_INTERVAL = 30_000;

// ── Types ──

interface Pulse {
  daemon_heartbeat: string | null;
  current_frame: string;
  services_online: number;
  services_total: number;
  signals_24h: number;
  pipeline: { posts: { posted: number; scheduled: number; failed: number; cancelled: number }; uploads: Record<string, unknown> };
}

interface AlertItem {
  id: number;
  from: string;
  type: string;
  content: string;
  time: string;
}

interface SignalItem {
  id: number;
  from: string;
  to: string | null;
  type: string;
  content: string;
  ack: boolean;
  time: string;
}

interface FocusItem {
  id: number;
  p: number;
  task: string;
  owner: string | null;
  details: string | null;
  status: string;
  created_at: string;
}

interface SessionItem {
  interface: string;
  booted_at: string;
}

interface DashboardData {
  pulse: Pulse;
  alerts: AlertItem[];
  signals: SignalItem[];
  focus: FocusItem[];
  sessions: SessionItem[];
}

// ── Helpers ──

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "never";
  const now = Date.now();
  const then = new Date(dateStr.includes("T") ? dateStr : dateStr + "Z").getTime();
  const diffS = Math.floor((now - then) / 1000);
  if (diffS < 0) return "just now";
  if (diffS < 60) return `${diffS}s ago`;
  const diffM = Math.floor(diffS / 60);
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

function heartbeatColor(dateStr: string | null): string {
  if (!dateStr) return "#ef4444";
  const diffS = (Date.now() - new Date(dateStr.includes("T") ? dateStr : dateStr + "Z").getTime()) / 1000;
  if (diffS < 120) return "#10b981"; // green — healthy
  if (diffS < 300) return "#f59e0b"; // amber — slow
  return "#ef4444"; // red — stale
}

function serviceColor(online: number, total: number): string {
  if (total === 0) return "#555";
  if (online >= total) return "#10b981";
  if (online >= total * 0.7) return "#f59e0b";
  return "#ef4444";
}

const SIGNAL_TYPE_COLORS: Record<string, string> = {
  observation: "#6b7280",
  alert_critical: "#ef4444",
  alert_warning: "#f59e0b",
  handoff: "#3b82f6",
  session_summary: "#8b5cf6",
};

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  observation: "OBS",
  alert_critical: "CRIT",
  alert_warning: "WARN",
  handoff: "HAND",
  session_summary: "SESS",
};

const FILTER_OPTIONS = ["all", "alert", "observation", "handoff", "session_summary"] as const;
type SignalFilter = typeof FILTER_OPTIONS[number];

const PRIORITY_CONFIG = [
  { p: 1, label: "P1 CRITICAL", color: "#ef4444" },
  { p: 2, label: "P2 IMPORTANT", color: "#f59e0b" },
  { p: 3, label: "P3 TODO", color: "#6b7280" },
  { p: 99, label: "BACKLOG", color: "#8b5cf6" },
];

// ── Auth hook (shared HQ pattern) ──

function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    setIsAuthenticated(localStorage.getItem("hq_auth") === "true");
    setChecking(false);
  }, []);
  return { isAuthenticated, checking };
}

// ── Components ──

function PulseStat({ label, value, color, mono }: { label: string; value: string | number; color?: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-[#555] tracking-wider uppercase">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`} style={{ color: color || "#e8e4d9" }}>
        {value}
      </span>
    </div>
  );
}

function SystemPulse({ pulse, sessions }: { pulse: Pulse; sessions: SessionItem[] }) {
  const hbColor = heartbeatColor(pulse.daemon_heartbeat);
  const svcColor = serviceColor(pulse.services_online, pulse.services_total);
  const pipeOk = pulse.pipeline.posts.failed === 0;

  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg px-5 py-3 flex flex-wrap items-center gap-6">
      {/* Daemon heartbeat */}
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: hbColor,
            boxShadow: hbColor === "#10b981" ? `0 0 6px ${hbColor}60` : undefined,
            animation: hbColor === "#10b981" ? "pulse 2s infinite" : undefined,
          }}
        />
        <PulseStat label="daemon" value={relativeTime(pulse.daemon_heartbeat)} color={hbColor} mono />
      </div>

      {/* Frame */}
      <PulseStat label="frame" value={pulse.current_frame} color="#8b5cf6" />

      {/* Services */}
      <PulseStat
        label="services"
        value={`${pulse.services_online}/${pulse.services_total}`}
        color={svcColor}
        mono
      />

      {/* 24h signals */}
      <PulseStat label="signals/24h" value={pulse.signals_24h} color="#888" mono />

      {/* Pipeline */}
      <PulseStat
        label="pipeline"
        value={pipeOk ? `${pulse.pipeline.posts.posted} posted / ${pulse.pipeline.posts.scheduled} sched` : `${pulse.pipeline.posts.failed} failed`}
        color={pipeOk ? "#10b981" : "#ef4444"}
      />

      {/* Sessions — compact chips */}
      {sessions.length > 0 && (
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-[#555] tracking-wider">SESSIONS</span>
          {sessions.slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1a1a1f] text-[#888]"
            >
              {s.interface.replace("cc-end", "cc")} {relativeTime(s.booted_at)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertsInbox({
  alerts,
  onAck,
  onClearAll,
}: {
  alerts: AlertItem[];
  onAck: (id: number) => void;
  onClearAll: () => void;
}) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-xs font-semibold tracking-wider text-red-400">
            ALERTS ({alerts.length})
          </h2>
        </div>
        <button
          onClick={onClearAll}
          className="text-[10px] text-[#888] hover:text-[#ccc] px-2 py-1 rounded border border-[#1a1a1f] hover:border-[#2a2a2f] transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-1.5">
        {alerts.map((alert) => {
          const isCritical = alert.type === "alert_critical";
          const accentColor = isCritical ? "#ef4444" : "#f59e0b";
          return (
            <div
              key={alert.id}
              className="bg-[#0a0a0b] border rounded-lg px-4 py-3 flex items-start gap-3"
              style={{ borderColor: `${accentColor}30` }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded tracking-wider font-semibold"
                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                  >
                    {isCritical ? "CRITICAL" : "WARNING"}
                  </span>
                  <span className="text-[10px] font-mono text-[#555]">{alert.from}</span>
                  <span className="text-[10px] font-mono text-[#444]">{relativeTime(alert.time)}</span>
                </div>
                <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap">{alert.content}</p>
              </div>
              <button
                onClick={() => onAck(alert.id)}
                className="shrink-0 text-[10px] text-[#666] hover:text-[#ccc] px-2 py-1 rounded border border-[#1a1a1f] hover:border-[#2a2a2f] transition-colors mt-0.5"
              >
                Ack
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SignalFeed({ signals }: { signals: SignalItem[] }) {
  const [filter, setFilter] = useState<SignalFilter>("all");

  const filtered = filter === "all"
    ? signals
    : filter === "alert"
      ? signals.filter(s => s.type === "alert_critical" || s.type === "alert_warning")
      : signals.filter(s => s.type === filter);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-semibold tracking-wider text-[#888]">SIGNALS</h2>
        <div className="flex gap-1 ml-auto">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                filter === f
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                  : "text-[#555] hover:text-[#888] border border-transparent"
              }`}
            >
              {f === "all" ? "All" : f === "alert" ? "Alerts" : f === "observation" ? "Obs" : f === "session_summary" ? "Sessions" : "Handoffs"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto space-y-1 flex-1 min-h-0 max-h-[600px] pr-1">
        {filtered.length === 0 ? (
          <p className="text-[#333] text-xs text-center py-8">No signals match filter</p>
        ) : (
          filtered.map((sig) => {
            const typeColor = SIGNAL_TYPE_COLORS[sig.type] || "#555";
            const typeLabel = SIGNAL_TYPE_LABELS[sig.type] || sig.type.toUpperCase().slice(0, 4);
            return (
              <div
                key={sig.id}
                className="bg-[#0a0a0b] border border-[#1a1a1f] rounded px-3 py-2 hover:border-[#2a2a2f] transition-colors group"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-[9px] px-1 py-px rounded font-mono tracking-wider"
                    style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                  >
                    {typeLabel}
                  </span>
                  <span className="text-[10px] font-mono text-[#666]">{sig.from}</span>
                  {sig.to && <span className="text-[10px] text-[#444]">-&gt; {sig.to}</span>}
                  <span className="text-[10px] font-mono text-[#444] ml-auto">{relativeTime(sig.time)}</span>
                </div>
                <p className="text-[13px] text-[#aaa] leading-relaxed whitespace-pre-wrap group-hover:text-[#ccc] transition-colors">
                  {sig.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function FocusBoard({ focus, expandedId, onExpand }: {
  focus: FocusItem[];
  expandedId: number | null;
  onExpand: (id: number | null) => void;
}) {
  const grouped = PRIORITY_CONFIG.map((cfg) => ({
    cfg,
    items: focus.filter((f) => (cfg.p === 99 ? f.p > 3 : f.p === cfg.p)),
  }));

  return (
    <div className="flex flex-col">
      <h2 className="text-xs font-semibold tracking-wider text-[#888] mb-3">FOCUS</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {grouped.map(({ cfg, items }) => (
          <div key={cfg.p}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-[10px] font-semibold tracking-wider" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
              <span className="text-[10px] font-mono text-[#444]">{items.length}</span>
            </div>
            <div className="space-y-1">
              {items.length === 0 ? (
                <p className="text-[#333] text-[10px] py-2 pl-3">Empty</p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onExpand(expandedId === item.id ? null : item.id)}
                    className="bg-[#0d0d0e] border border-[#1a1a1f] rounded px-3 py-2 cursor-pointer hover:border-[#2a2a2f] transition-colors"
                    style={{ borderLeftColor: cfg.color, borderLeftWidth: 2 }}
                  >
                    <p className="text-[13px] text-[#ccc] leading-snug">{item.task}</p>
                    {item.owner && (
                      <span className="text-[10px] text-[#555] mt-1 inline-block">@{item.owner}</span>
                    )}
                    {expandedId === item.id && item.details && (
                      <div className="mt-2 pt-2 border-t border-[#1a1a1f]">
                        <p className="text-[11px] text-[#888] leading-relaxed">{item.details}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──

export default function CortexPage() {
  const { isAuthenticated, checking } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedFocus, setExpandedFocus] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/hq/cortex/dashboard`);
      if (res.ok) {
        setData(await res.json());
        setError(false);
        setLastRefresh(new Date());
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
  }, []);

  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Initial fetch + polling
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchData]);

  // Acknowledge single alert — optimistic remove
  const handleAck = useCallback(async (id: number) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, alerts: prev.alerts.filter((a) => a.id !== id) };
    });
    try {
      await fetch(`${API_BASE}/hq/cortex/signals/${id}/ack`, { method: "POST" });
    } catch {}
  }, []);

  // Clear all alerts — optimistic
  const handleClearAll = useCallback(async () => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, alerts: [] };
    });
    try {
      await fetch(`${API_BASE}/hq/cortex/signals/ack-alerts`, { method: "POST" });
    } catch {}
  }, []);

  // Auth gate
  if (checking) return <div className="min-h-screen bg-[#171513]" />;
  if (!isAuthenticated) {
    if (typeof window !== "undefined") window.location.href = "/hq";
    return null;
  }

  return (
    <div className="min-h-screen bg-[#171513] text-[#e8e4d9]">
      {/* Header */}
      <header className="border-b border-[#1a1a1f] bg-[#0a0a0b]/50 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <h1 className="text-violet-400 font-semibold text-sm tracking-wider">CORTEX</h1>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-[10px] text-[#444] font-mono">
                {relativeTime(lastRefresh.toISOString())}
              </span>
            )}
            <button
              onClick={manualRefresh}
              disabled={refreshing}
              className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                refreshing
                  ? "text-[#444] border-[#1a1a1f] cursor-not-allowed"
                  : "text-[#888] border-[#1a1a1f] hover:text-[#ccc] hover:border-[#2a2a2f]"
              }`}
            >
              {refreshing ? "..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-4">
        {!data && !error && (
          <div className="space-y-4">
            <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-14 animate-pulse" />
            <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-40 animate-pulse" />
            <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-60 animate-pulse" />
          </div>
        )}

        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-4 py-3 text-red-400 text-sm">
            Failed to reach Cortex. Retrying in {REFRESH_INTERVAL / 1000}s...
          </div>
        )}

        {data && (
          <>
            {/* System Pulse */}
            <SystemPulse pulse={data.pulse} sessions={data.sessions} />

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row gap-4 min-h-0">
              {/* Left column: Alerts + Signal Feed */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                <AlertsInbox
                  alerts={data.alerts}
                  onAck={handleAck}
                  onClearAll={handleClearAll}
                />
                <SignalFeed signals={data.signals} />
              </div>

              {/* Right column: Focus Board */}
              <div className="w-full lg:w-[420px] shrink-0">
                <FocusBoard
                  focus={data.focus}
                  expandedId={expandedFocus}
                  onExpand={setExpandedFocus}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
