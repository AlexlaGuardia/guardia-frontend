"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * FaroAnalyticsSection — Faro bio page analytics
 *
 * Shows page views, link clicks, email captures, CTR, daily breakdown,
 * top links, and referrer sources. Wires to:
 *   GET /faro/analytics?days=N
 *
 * Designed as a section that lives inside StatsScreen, below the
 * existing social media analytics (AnalyticsTab).
 */

const API_BASE = "https://api.guardiacontent.com";

type Period = 7 | 30 | 90;

interface FaroSummary {
  period_days: number;
  views: number;
  clicks: number;
  emails: number;
  ctr: number;
  daily: Record<string, { views: number; clicks: number; emails: number }>;
}

interface TopLink {
  block_id: string;
  title: string | null;
  url: string | null;
  clicks: number;
}

interface Referrer {
  source: string;
  visits: number;
}

interface FaroAnalyticsData {
  summary: FaroSummary;
  top_links: TopLink[];
  referrers: Referrer[];
}

interface FaroAnalyticsSectionProps {
  jwt: string | null;
  faroSlug?: string | null;
}

export default function FaroAnalyticsSection({ jwt, faroSlug }: FaroAnalyticsSectionProps) {
  const [period, setPeriod] = useState<Period>(30);
  const [data, setData] = useState<FaroAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noPage, setNoPage] = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!jwt) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/faro/analytics?days=${period}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (res.status === 404) {
        setNoPage(true);
        setData(null);
      } else if (res.ok) {
        setData(await res.json());
        setNoPage(false);
      } else {
        setError("Failed to load Faro analytics");
      }
    } catch {
      setError("Connection error");
    }

    setLoading(false);
  }, [jwt, period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // ── No Faro page ──
  if (noPage) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Faro Page Analytics</h3>
        <p className="text-xs text-[var(--text-muted)]">
          Create your Faro bio page to start tracking views, clicks, and email captures.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header + period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Faro Page</h3>
          {faroSlug && (
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">guardiacontent.com/f/{faroSlug}</p>
          )}
        </div>
        <PeriodPicker period={period} onChange={setPeriod} />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[var(--border)] border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
        </div>
      ) : data ? (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard label="Views" value={data.summary.views} color="#8B5CF6" icon="eye" />
            <KPICard label="Clicks" value={data.summary.clicks} color="#3B82F6" icon="pointer" />
            <KPICard label="Emails" value={data.summary.emails} color="#22C55E" icon="mail" />
            <KPICard label="CTR" value={data.summary.ctr} color="var(--accent)" icon="percent" suffix="%" />
          </div>

          {/* Daily chart */}
          <DailyChart daily={data.summary.daily} />

          {/* Top links */}
          {data.top_links.length > 0 && <TopLinksSection links={data.top_links} />}

          {/* Referrers */}
          {data.referrers.length > 0 && <ReferrersSection referrers={data.referrers} />}
        </>
      ) : null}
    </div>
  );
}

// ── Period picker ──
function PeriodPicker({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  const opts: { value: Period; label: string }[] = [
    { value: 7, label: "7d" },
    { value: 30, label: "30d" },
    { value: 90, label: "90d" },
  ];
  return (
    <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-surface)" }}>
      {opts.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            period === o.value
              ? "text-[var(--bg-base)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
          style={period === o.value ? { background: "#8B5CF6" } : {}}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── KPI card ──
function KPICard({ label, value, color, icon, suffix }: {
  label: string;
  value: number;
  color: string;
  icon: string;
  suffix?: string;
}) {
  const formatNum = (n: number) => {
    if (suffix === "%") return n.toFixed(1);
    if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const iconPaths: Record<string, string> = {
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    pointer: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122",
    mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    percent: "M9 7a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM5 19L19 5",
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, color }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPaths[icon] || iconPaths.eye} />
          </svg>
        </div>
      </div>
      <p className="text-2xl font-semibold text-[var(--text-primary)]">
        {formatNum(value)}{suffix || ""}
      </p>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
    </div>
  );
}

// ── Daily chart (simple bar chart) ──
function DailyChart({ daily }: { daily: Record<string, { views: number; clicks: number; emails: number }> }) {
  const entries = Object.entries(daily).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Daily Activity</h3>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-[var(--text-muted)]">No activity yet in this period</p>
        </div>
      </div>
    );
  }

  const maxViews = Math.max(...entries.map(([, d]) => d.views), 1);

  // Show last 14 bars max for readability
  const visible = entries.slice(-14);

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Daily Activity</h3>
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" />Views</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Clicks</span>
        </div>
      </div>

      <div className="flex items-end gap-1 h-32">
        {visible.map(([day, d]) => {
          const viewH = (d.views / maxViews) * 100;
          const clickH = maxViews > 0 ? (d.clicks / maxViews) * 100 : 0;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 px-2 py-1 rounded-lg text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
                <p className="font-medium text-[var(--text-primary)]">{formatDay(day)}</p>
                <p className="text-[var(--text-muted)]">{d.views} views, {d.clicks} clicks</p>
              </div>
              {/* Bars */}
              <div className="w-full flex items-end gap-px" style={{ height: "100%" }}>
                <div
                  className="flex-1 rounded-t-sm bg-violet-500/70 transition-all duration-300"
                  style={{ height: `${Math.max(viewH, 2)}%` }}
                />
                <div
                  className="flex-1 rounded-t-sm bg-blue-500/70 transition-all duration-300"
                  style={{ height: `${Math.max(clickH, 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels (first, middle, last) */}
      {visible.length >= 3 && (
        <div className="flex justify-between mt-2 text-[9px] text-[var(--text-muted)]">
          <span>{formatDay(visible[0][0])}</span>
          <span>{formatDay(visible[Math.floor(visible.length / 2)][0])}</span>
          <span>{formatDay(visible[visible.length - 1][0])}</span>
        </div>
      )}
    </div>
  );
}

// ── Top links ──
function TopLinksSection({ links }: { links: TopLink[] }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Top Links</h3>
      <div className="space-y-2.5">
        {links.map((link, i) => {
          const maxClicks = links[0]?.clicks || 1;
          const pct = (link.clicks / maxClicks) * 100;
          return (
            <div key={link.block_id || i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[var(--text-primary)] truncate flex-1 min-w-0 mr-3">
                  {link.title || link.url || "Untitled link"}
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)] flex-shrink-0">
                  {link.clicks} click{link.clicks !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-surface)" }}>
                <div
                  className="h-full rounded-full bg-blue-500/70 transition-all duration-500"
                  style={{ width: `${Math.max(pct, 3)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Referrers ──
function ReferrersSection({ referrers }: { referrers: Referrer[] }) {
  const total = referrers.reduce((sum, r) => sum + r.visits, 0);

  const formatSource = (s: string) => {
    if (s === "direct") return "Direct";
    try {
      return new URL(s).hostname.replace(/^www\./, "");
    } catch {
      return s.length > 40 ? s.slice(0, 40) + "..." : s;
    }
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Traffic Sources</h3>
      <div className="space-y-2">
        {referrers.map((r, i) => {
          const pct = total > 0 ? Math.round((r.visits / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-primary)] flex-1 min-w-0 truncate">
                {formatSource(r.source)}
              </span>
              <span className="text-xs text-[var(--text-muted)] flex-shrink-0">{r.visits}</span>
              <span className="text-[10px] text-[var(--text-muted)] w-8 text-right flex-shrink-0">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
