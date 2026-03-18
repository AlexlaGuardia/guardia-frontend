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

interface Country {
  country: string;
  visits: number;
}

interface PreviousPeriod {
  views: number;
  clicks: number;
  emails: number;
}

interface FaroAnalyticsData {
  summary: FaroSummary;
  top_links: TopLink[];
  referrers: Referrer[];
  countries: Country[];
  previous: PreviousPeriod;
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
            <KPICard label="Views" value={data.summary.views} prev={data.previous?.views} color="#8B5CF6" icon="eye" />
            <KPICard label="Clicks" value={data.summary.clicks} prev={data.previous?.clicks} color="#3B82F6" icon="pointer" />
            <KPICard label="Emails" value={data.summary.emails} prev={data.previous?.emails} color="#22C55E" icon="mail" />
            <KPICard label="CTR" value={data.summary.ctr} color="var(--accent)" icon="percent" suffix="%" />
          </div>

          {/* Trend chart */}
          <TrendChart daily={data.summary.daily} period={period} />

          {/* Top links */}
          {data.top_links.length > 0 && <TopLinksSection links={data.top_links} totalViews={data.summary.views} />}

          {/* Referrers */}
          {data.referrers.length > 0 && <ReferrersSection referrers={data.referrers} />}

          {/* Countries */}
          {data.countries && data.countries.length > 0 && <CountriesSection countries={data.countries} />}
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
function KPICard({ label, value, prev, color, icon, suffix }: {
  label: string;
  value: number;
  prev?: number;
  color: string;
  icon: string;
  suffix?: string;
}) {
  const formatNum = (n: number) => {
    if (suffix === "%") return n.toFixed(1);
    if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const trend = prev !== undefined && prev > 0
    ? Math.round(((value - prev) / prev) * 100)
    : null;

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
        {trend !== null && trend !== 0 && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
            trend > 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
          }`}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold text-[var(--text-primary)]">
        {formatNum(value)}{suffix || ""}
      </p>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
    </div>
  );
}

// ── Trend chart (SVG line chart, full period) ──
function TrendChart({ daily, period }: { daily: Record<string, { views: number; clicks: number; emails: number }>; period: number }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Fill all days in the period (including zero-activity days)
  const entries: [string, { views: number; clicks: number; emails: number }][] = [];
  const now = new Date();
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    entries.push([key, daily[key] || { views: 0, clicks: 0, emails: 0 }]);
  }

  const hasData = entries.some(([, d]) => d.views > 0 || d.clicks > 0);

  if (!hasData) {
    return (
      <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Trend</h3>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-[var(--text-muted)]">No activity yet in this period</p>
        </div>
      </div>
    );
  }

  const W = 800, H = 220;
  const PAD = { top: 15, right: 15, bottom: 28, left: 42 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...entries.map(([, d]) => Math.max(d.views, d.clicks)), 1);
  // Round up to a nice number for y-axis
  const niceMax = maxVal <= 5 ? 5 : Math.ceil(maxVal / Math.pow(10, Math.floor(Math.log10(maxVal)))) * Math.pow(10, Math.floor(Math.log10(maxVal)));

  const xStep = entries.length > 1 ? chartW / (entries.length - 1) : 0;
  const getX = (i: number) => PAD.left + i * xStep;
  const getY = (val: number) => PAD.top + chartH - (val / niceMax) * chartH;

  // Build polyline points
  const viewsPoints = entries.map(([, d], i) => `${getX(i)},${getY(d.views)}`).join(" ");
  const clicksPoints = entries.map(([, d], i) => `${getX(i)},${getY(d.clicks)}`).join(" ");

  // Area fill paths
  const baseline = PAD.top + chartH;
  const viewsArea = `M${getX(0)},${baseline} ${entries.map(([, d], i) => `L${getX(i)},${getY(d.views)}`).join(" ")} L${getX(entries.length - 1)},${baseline}Z`;
  const clicksArea = `M${getX(0)},${baseline} ${entries.map(([, d], i) => `L${getX(i)},${getY(d.clicks)}`).join(" ")} L${getX(entries.length - 1)},${baseline}Z`;

  // Y-axis labels (0, mid, max)
  const yLabels = [0, Math.round(niceMax / 2), niceMax];

  // X-axis: ~5 labels spread evenly
  const labelCount = Math.min(5, entries.length);
  const xLabelStep = entries.length > 1 ? Math.max(1, Math.floor((entries.length - 1) / (labelCount - 1))) : 1;

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatNum = (n: number) => n >= 10_000 ? `${(n / 1_000).toFixed(1)}K` : n.toLocaleString();

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Trend</h3>
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" />Views</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Clicks</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Gridlines */}
        {yLabels.map((v) => (
          <line key={v} x1={PAD.left} y1={getY(v)} x2={W - PAD.right} y2={getY(v)}
            stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="4 4" />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((v) => (
          <text key={v} x={PAD.left - 8} y={getY(v)} textAnchor="end" dominantBaseline="middle"
            fill="var(--text-muted)" fontSize="10">{formatNum(v)}</text>
        ))}

        {/* Area fills */}
        <path d={viewsArea} fill="rgba(139, 92, 246, 0.1)" />
        <path d={clicksArea} fill="rgba(59, 130, 246, 0.08)" />

        {/* Lines */}
        <polyline points={viewsPoints} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={clicksPoints} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Hover regions */}
        {entries.map(([day, d], i) => {
          const regionW = i === 0 || i === entries.length - 1 ? xStep / 2 + 1 : xStep;
          const regionX = i === 0 ? getX(0) : getX(i) - xStep / 2;
          return (
            <g key={day} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
              <rect x={regionX} y={PAD.top} width={Math.max(regionW, 4)} height={chartH} fill="transparent" />
              {hoveredIdx === i && (
                <>
                  <line x1={getX(i)} y1={PAD.top} x2={getX(i)} y2={baseline} stroke="var(--border)" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx={getX(i)} cy={getY(d.views)} r="4" fill="#8B5CF6" />
                  <circle cx={getX(i)} cy={getY(d.clicks)} r="4" fill="#3B82F6" />
                </>
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {entries.map(([day], i) => {
          if (i !== 0 && i !== entries.length - 1 && i % xLabelStep !== 0) return null;
          return (
            <text key={day} x={getX(i)} y={H - 5} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
              {formatDay(day)}
            </text>
          );
        })}
      </svg>

      {/* Hover tooltip (rendered outside SVG for better styling) */}
      {hoveredIdx !== null && (
        <div className="mt-2 flex items-center gap-4 text-[11px] px-1 transition-opacity duration-150">
          <span className="text-[var(--text-muted)] font-medium">{formatDay(entries[hoveredIdx][0])}</span>
          <span className="text-violet-400">{entries[hoveredIdx][1].views} views</span>
          <span className="text-blue-400">{entries[hoveredIdx][1].clicks} clicks</span>
          {entries[hoveredIdx][1].emails > 0 && (
            <span className="text-emerald-400">{entries[hoveredIdx][1].emails} emails</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Top links (with per-link CTR) ──
function TopLinksSection({ links, totalViews }: { links: TopLink[]; totalViews: number }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Top Links</h3>
      <div className="space-y-2.5">
        {links.map((link, i) => {
          const maxClicks = links[0]?.clicks || 1;
          const pct = (link.clicks / maxClicks) * 100;
          const ctr = totalViews > 0 ? ((link.clicks / totalViews) * 100).toFixed(1) : "0.0";
          return (
            <div key={link.block_id || i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[var(--text-primary)] truncate flex-1 min-w-0 mr-3">
                  {link.title || link.url || "Untitled link"}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    {link.clicks} click{link.clicks !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400">
                    {ctr}% CTR
                  </span>
                </div>
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

// ── Referrers (with visual bars) ──
function ReferrersSection({ referrers }: { referrers: Referrer[] }) {
  const total = referrers.reduce((sum, r) => sum + r.visits, 0);
  const maxVisits = referrers[0]?.visits || 1;

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
      <div className="space-y-2.5">
        {referrers.map((r, i) => {
          const pct = total > 0 ? Math.round((r.visits / total) * 100) : 0;
          const barPct = (r.visits / maxVisits) * 100;
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[var(--text-primary)] flex-1 min-w-0 truncate mr-3">
                  {formatSource(r.source)}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-[var(--text-muted)]">{r.visits}</span>
                  <span className="text-[10px] text-[var(--text-muted)] w-8 text-right">{pct}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-surface)" }}>
                <div
                  className="h-full rounded-full bg-emerald-500/60 transition-all duration-500"
                  style={{ width: `${Math.max(barPct, 3)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Countries ──
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  DE: "Germany", FR: "France", IN: "India", BR: "Brazil", JP: "Japan",
  MX: "Mexico", ES: "Spain", IT: "Italy", NL: "Netherlands", SE: "Sweden",
  KR: "South Korea", AR: "Argentina", CO: "Colombia", PH: "Philippines",
  NG: "Nigeria", ZA: "South Africa", HN: "Honduras", PR: "Puerto Rico",
};

function CountriesSection({ countries }: { countries: Country[] }) {
  const total = countries.reduce((sum, c) => sum + c.visits, 0);

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Visitors by Country</h3>
      <div className="space-y-2">
        {countries.map((c, i) => {
          const pct = total > 0 ? Math.round((c.visits / total) * 100) : 0;
          const name = COUNTRY_NAMES[c.country] || c.country;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-primary)] flex-1 min-w-0 truncate">{name}</span>
              <span className="text-xs text-[var(--text-muted)] flex-shrink-0">{c.visits}</span>
              <span className="text-[10px] text-[var(--text-muted)] w-8 text-right flex-shrink-0">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
