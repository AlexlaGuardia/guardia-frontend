"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Share2, FileText, TrendingUp, TrendingDown, Clock, Sparkles, ExternalLink, Hash, Zap, AlignLeft, Info, AlertTriangle } from "lucide-react";
import { ClientContext } from "./LobbyShell";
import AddonGate from "@/components/ui/AddonGate";

/**
 * GUARDIA ANALYTICS — Full Dashboard
 *
 * Period selector, KPI cards with deltas, SVG engagement chart,
 * platform breakdown, top posts, content insights, smart empty state.
 */

const API_BASE = "https://api.guardiacontent.com";

// ============================================================================
// TYPES
// ============================================================================

interface KPIMetric {
  current: number;
  previous: number;
  delta_pct: number | null;
}

interface TimeseriesPoint {
  date: string;
  likes: number;
  comments: number;
  shares: number;
}

interface TopPost {
  id: number;
  caption: string | null;
  image_url: string | null;
  platform: string;
  post_url: string | null;
  posted_at: string;
  likes: number;
  comments: number;
  shares: number;
  engagement_score: number;
}

interface PlatformData {
  posts: number;
  likes: number;
  comments: number;
  shares: number;
}

interface ContentInsights {
  content_pillars: string[];
  best_days: string[];
  best_times: string[];
  posting_frequency: string | null;
  top_performing_themes: string[];
  observations: string | null;
  recommendations: string | null;
}

interface AnalyticsData {
  period: string;
  kpi: {
    likes: KPIMetric;
    comments: KPIMetric;
    shares: KPIMetric;
    posts_count: KPIMetric;
  };
  timeseries: TimeseriesPoint[];
  platform_breakdown: Record<string, PlatformData>;
  top_posts: TopPost[];
  content_insights: ContentInsights | null;
  last_synced: string | null;
  scheduled_count: number;
}

type Period = "7d" | "30d" | "all";

interface AnalyticsTabProps {
  client: ClientContext | null;
  jwt: string | null;
  selectedPostId?: number | null;
  activeAddons?: Set<string>;
  onNavigateToStore?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AnalyticsTab({ client, jwt, selectedPostId, activeAddons, onNavigateToStore }: AnalyticsTabProps) {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!client?.id) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_BASE}/engagement/analytics/${client.id}?period=${period}`,
          { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} }
        );
        if (res.ok) {
          setData(await res.json());
        } else {
          setError("Failed to load analytics");
        }
      } catch {
        setError("Connection error");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [client?.id, jwt, period]);

  const hasData = data && data.kpi.posts_count.current > 0;

  return (
    <AddonGate addonSlug="analytics_pro" addonName="Analytics Pro" activeAddons={activeAddons} onNavigateToStore={onNavigateToStore}>
    <div className="h-full overflow-y-auto bg-[var(--bg-base)]">
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">

        {/* Header + Period Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Analytics</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Track your content performance</p>
          </div>
          <PeriodSelector period={period} onChange={setPeriod} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-[var(--text-muted)]">{error}</p>
          </div>
        ) : !hasData ? (
          <SmartEmptyState scheduledCount={data?.scheduled_count || 0} />
        ) : data ? (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard label="Likes" metric={data.kpi.likes} icon={<Heart className="w-4 h-4" />} accent="var(--accent)" />
              <KPICard label="Comments" metric={data.kpi.comments} icon={<MessageCircle className="w-4 h-4" />} accent="#6366f1" />
              <KPICard label="Shares" metric={data.kpi.shares} icon={<Share2 className="w-4 h-4" />} accent="#22c55e" />
              <KPICard label="Posts" metric={data.kpi.posts_count} icon={<FileText className="w-4 h-4" />} accent="#8b5cf6" />
            </div>

            {/* Engagement Chart */}
            <EngagementChart timeseries={data.timeseries} />

            {/* Platform Breakdown */}
            {Object.keys(data.platform_breakdown).length > 0 && (
              <PlatformBreakdown breakdown={data.platform_breakdown} />
            )}

            {/* Top Posts */}
            {data.top_posts.length > 0 && (
              <TopPosts posts={data.top_posts} selectedPostId={selectedPostId} />
            )}

            {/* Content Intelligence — suggestions from voice_learner */}
            {client?.id && (
              <ContentIntelligencePanel clientId={client.id} jwt={jwt} />
            )}

            {/* Content Insights */}
            <ContentInsightsSection insights={data.content_insights} />

            {/* Last Synced */}
            {data.last_synced && (
              <p className="text-[10px] text-[var(--text-muted)] text-center">
                Engagement data last synced {new Date(data.last_synced).toLocaleString()}
              </p>
            )}
          </>
        ) : null}

        <div className="h-4" />
      </div>
    </div>
    </AddonGate>
  );
}

// ============================================================================
// PERIOD SELECTOR
// ============================================================================

function PeriodSelector({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  const options: { value: Period; label: string }[] = [
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
    { value: "all", label: "All" },
  ];

  return (
    <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-surface)" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            period === opt.value
              ? "text-[var(--bg-base)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
          style={period === opt.value ? { background: "var(--accent)" } : {}}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// KPI CARD
// ============================================================================

function KPICard({ label, metric, icon, accent }: {
  label: string;
  metric: KPIMetric;
  icon: React.ReactNode;
  accent: string;
}) {
  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}18`, color: accent }}>
          {icon}
        </div>
        <DeltaBadge delta={metric.delta_pct} />
      </div>
      <p className="text-2xl font-semibold text-[var(--text-primary)]">{formatNum(metric.current)}</p>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-[10px] text-[var(--text-muted)]">—</span>;
  }

  const isPositive = delta >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-medium ${
      isPositive ? "text-emerald-600" : "text-red-500"
    }`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? "+" : ""}{delta}%
    </span>
  );
}

// ============================================================================
// ENGAGEMENT CHART (Custom SVG)
// ============================================================================

function EngagementChart({ timeseries }: { timeseries: TimeseriesPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Chart dimensions
  const W = 800, H = 300;
  const PAD = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Find data points with actual values
  const hasActivity = timeseries.some(p => p.likes + p.comments + p.shares > 0);
  const dataPoints = timeseries.filter(p => p.likes + p.comments + p.shares > 0);

  // Calculate max for y-axis
  const allValues = timeseries.flatMap(p => [p.likes, p.comments, p.shares]);
  const maxVal = Math.max(...allValues, 1);
  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  // Position helpers
  const xPos = (i: number) => PAD.left + (timeseries.length > 1 ? (i / (timeseries.length - 1)) * chartW : chartW / 2);
  const yPos = (v: number) => PAD.top + chartH - (v / maxVal) * chartH;

  // Line path builder
  const buildPath = (key: "likes" | "comments" | "shares") => {
    if (dataPoints.length < 2) return "";
    // Use all points for line continuity
    return timeseries.map((p, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(p[key])}`).join(" ");
  };

  // Date label formatting
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Show ~5-7 x-axis labels
  const labelInterval = Math.max(1, Math.floor(timeseries.length / 6));

  const lines: { key: "likes" | "comments" | "shares"; color: string; label: string }[] = [
    { key: "likes", color: "var(--accent)", label: "Likes" },
    { key: "comments", color: "#6366f1", label: "Comments" },
    { key: "shares", color: "#22c55e", label: "Shares" },
  ];

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Engagement Trend</h3>
        <div className="flex items-center gap-4">
          {lines.map(l => (
            <div key={l.key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
              <span className="text-[10px] text-[var(--text-muted)]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {!hasActivity ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" className="mb-3">
            <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 16l4-4 4 2 5-6" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Engagement data will appear here as your posts gain traction</p>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Horizontal gridlines */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={PAD.left} y1={yPos(tick)} x2={W - PAD.right} y2={yPos(tick)}
                  stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray={tick > 0 ? "4 4" : "0"}
                />
                <text x={PAD.left - 8} y={yPos(tick) + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
                  {tick}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {timeseries.map((p, i) => (
              i % labelInterval === 0 || i === timeseries.length - 1 ? (
                <text
                  key={i} x={xPos(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--text-muted)"
                >
                  {formatDateLabel(p.date)}
                </text>
              ) : null
            ))}

            {/* Lines (only if enough data points) */}
            {dataPoints.length >= 2 && lines.map(l => (
              <path
                key={l.key}
                d={buildPath(l.key)}
                fill="none"
                stroke={l.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
            ))}

            {/* Data points */}
            {timeseries.map((p, i) => {
              const total = p.likes + p.comments + p.shares;
              if (total === 0 && hoveredIdx !== i) return null;
              return lines.map(l => {
                if (p[l.key] === 0 && hoveredIdx !== i) return null;
                return (
                  <circle
                    key={`${l.key}-${i}`}
                    cx={xPos(i)} cy={yPos(p[l.key])}
                    r={hoveredIdx === i ? 5 : 3.5}
                    fill={l.color}
                    stroke="var(--bg-elevated)"
                    strokeWidth="2"
                    style={{ transition: "r 0.15s ease" }}
                  />
                );
              });
            })}

            {/* Hover zones */}
            {timeseries.map((_, i) => (
              <rect
                key={i}
                x={xPos(i) - chartW / timeseries.length / 2}
                y={PAD.top}
                width={chartW / timeseries.length}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)}
              />
            ))}

            {/* Hover line */}
            {hoveredIdx !== null && (
              <line
                x1={xPos(hoveredIdx)} y1={PAD.top} x2={xPos(hoveredIdx)} y2={PAD.top + chartH}
                stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3"
              />
            )}
          </svg>

          {/* Tooltip */}
          {hoveredIdx !== null && timeseries[hoveredIdx] && (
            <div
              className="absolute top-2 z-10 px-3 py-2 rounded-xl text-xs shadow-lg pointer-events-none max-w-[200px]"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                left: `clamp(8%, ${(hoveredIdx / (timeseries.length - 1)) * 100}%, 92%)`,
                transform: "translateX(-50%)",
              }}
            >
              <p className="font-medium text-[var(--text-primary)] mb-1">
                {formatDateLabel(timeseries[hoveredIdx].date)}
              </p>
              {lines.map(l => (
                <div key={l.key} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                  <span className="text-[var(--text-muted)]">{l.label}:</span>
                  <span className="text-[var(--text-primary)] font-medium">{timeseries[hoveredIdx][l.key]}</span>
                </div>
              ))}
            </div>
          )}

          {/* Sparse data message */}
          {dataPoints.length > 0 && dataPoints.length < 3 && (
            <p className="text-[10px] text-[var(--text-muted)] text-center mt-2">
              More posts will form a trend line
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PLATFORM BREAKDOWN
// ============================================================================

function PlatformBreakdown({ breakdown }: { breakdown: Record<string, PlatformData> }) {
  const platforms = Object.entries(breakdown);
  const maxScore = Math.max(...platforms.map(([, d]) => d.likes + d.comments * 2 + d.shares * 3), 1);

  const platformMeta: Record<string, { label: string; color: string }> = {
    facebook: { label: "Facebook", color: "#1877F2" },
    instagram: { label: "Instagram", color: "#E4405F" },
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">Platform Performance</h3>
      <div className="space-y-4">
        {platforms.map(([platform, data]) => {
          const score = data.likes + data.comments * 2 + data.shares * 3;
          const pct = (score / maxScore) * 100;
          const meta = platformMeta[platform] || { label: platform, color: "var(--accent)" };

          return (
            <div key={platform}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-[var(--text-primary)]">{meta.label}</span>
                <span className="text-xs text-[var(--text-muted)]">{data.posts} post{data.posts !== 1 ? "s" : ""}</span>
              </div>
              <div className="h-6 rounded-lg overflow-hidden" style={{ background: "var(--bg-surface)" }}>
                <div
                  className="h-full rounded-lg transition-all duration-500"
                  style={{ width: `${Math.max(pct, 4)}%`, background: meta.color, opacity: 0.85 }}
                />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-[var(--text-muted)]">
                <span>{data.likes} like{data.likes !== 1 ? "s" : ""}</span>
                <span>{data.comments} comment{data.comments !== 1 ? "s" : ""}</span>
                <span>{data.shares} share{data.shares !== 1 ? "s" : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// TOP POSTS
// ============================================================================

function TopPosts({ posts, selectedPostId }: { posts: TopPost[]; selectedPostId?: number | null }) {
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPostId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedPostId]);

  const rankColors = ["var(--accent)", "#94a3b8", "#c2956b"];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">Top Performing</h3>
      <div className="space-y-3">
        {posts.map((post, i) => (
          <div
            key={post.id}
            ref={post.id === selectedPostId ? selectedRef : undefined}
            className={`flex flex-wrap items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[var(--bg-surface)] ${post.id === selectedPostId ? "ring-2 ring-[var(--accent)] bg-[var(--bg-surface)]" : ""}`}
          >
            {/* Rank */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: `${rankColors[i]}20`, color: rankColors[i] }}
            >
              {i + 1}
            </div>

            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--bg-surface)] shrink-0" style={{ border: "1px solid var(--border)" }}>
              {post.image_url ? (
                <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--border)]">
                  <FileText className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)] line-clamp-1">
                {post.caption || "No caption"}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--text-muted)]">
                <span className="capitalize">{post.platform}</span>
                <span>·</span>
                <span>{formatDate(post.posted_at)}</span>
              </div>
            </div>

            {/* Link */}
            {post.post_url && (
              <a
                href={post.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Metrics — wrap to new line on mobile */}
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] w-full sm:w-auto sm:shrink-0 pl-10 sm:pl-0 -mt-1 sm:mt-0">
              <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{post.likes}</span>
              <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{post.comments}</span>
              <span className="flex items-center gap-0.5"><Share2 className="w-3 h-3" />{post.shares}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CONTENT INTELLIGENCE PANEL
// ============================================================================

interface Suggestion {
  type: string;
  title: string;
  detail: string;
  priority: number;
}

function ContentIntelligencePanel({ clientId, jwt }: { clientId: string; jwt: string | null }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_intel = async () => {
      try {
        const res = await fetch(`${API_BASE}/clients/${clientId}/content-intelligence`, {
          headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    fetch_intel();
  }, [clientId, jwt]);

  if (loading) return null;
  if (suggestions.length === 0) return null;

  const iconMap: Record<string, React.ReactNode> = {
    hashtags: <Hash className="w-4 h-4" />,
    hashtags_avoid: <AlertTriangle className="w-4 h-4" />,
    length: <AlignLeft className="w-4 h-4" />,
    hooks: <Zap className="w-4 h-4" />,
    trend: <TrendingUp className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
  };

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    hashtags: { bg: "rgba(34,197,94,0.08)", text: "#22c55e", border: "rgba(34,197,94,0.2)" },
    hashtags_avoid: { bg: "rgba(245,158,11,0.08)", text: "#f59e0b", border: "rgba(245,158,11,0.2)" },
    length: { bg: "rgba(99,102,241,0.08)", text: "#6366f1", border: "rgba(99,102,241,0.2)" },
    hooks: { bg: "rgba(232,160,96,0.08)", text: "#e8a060", border: "rgba(232,160,96,0.2)" },
    trend: { bg: "rgba(34,197,94,0.08)", text: "#22c55e", border: "rgba(34,197,94,0.2)" },
    info: { bg: "var(--bg-surface)", text: "var(--text-muted)", border: "var(--border)" },
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
        <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Content Intelligence</h3>
      </div>

      <div className="space-y-3">
        {suggestions.map((s, i) => {
          const colors = colorMap[s.type] || colorMap.info;
          const icon = iconMap[s.type] || iconMap.info;

          return (
            <div
              key={i}
              className="rounded-xl p-4 transition-all"
              style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${colors.text}18`, color: colors.text }}
                >
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{s.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{s.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// CONTENT INSIGHTS
// ============================================================================

function ContentInsightsSection({ insights }: { insights: ContentInsights | null }) {
  if (!insights) {
    return (
      <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Content Insights</h3>
        <div className="flex items-center gap-3 py-4">
          <Sparkles className="w-5 h-5 text-[var(--border)]" />
          <p className="text-sm text-[var(--text-muted)]">Content intelligence will appear as we learn your audience</p>
        </div>
      </div>
    );
  }

  const formatTime = (t: string) => {
    const [h] = t.split(":");
    const hour = parseInt(h, 10);
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">Content Insights</h3>

      <div className="space-y-4">
        {/* Best Times */}
        {insights.best_times.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">Best posting times</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {insights.best_times.map((t, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>
                  {formatTime(t)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content Pillars */}
        {insights.content_pillars.length > 0 && (
          <div>
            <span className="text-xs text-[var(--text-muted)] block mb-2">Content pillars</span>
            <div className="flex flex-wrap gap-2">
              {insights.content_pillars.map((p, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  {p.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Observations */}
        {insights.observations && (
          <div className="p-3 rounded-xl" style={{ background: "var(--bg-surface)" }}>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{insights.observations}</p>
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================================================
// SMART EMPTY STATE
// ============================================================================

function SmartEmptyState({ scheduledCount }: { scheduledCount: number }) {
  return (
    <div className="rounded-2xl p-8 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      {/* Chart illustration */}
      <svg width={80} height={60} viewBox="0 0 80 60" className="mx-auto mb-5">
        <rect x="8" y="30" width="10" height="25" rx="3" fill="var(--border)" opacity="0.3" />
        <rect x="24" y="18" width="10" height="37" rx="3" fill="var(--border)" opacity="0.4" />
        <rect x="40" y="24" width="10" height="31" rx="3" fill="var(--border)" opacity="0.35" />
        <rect x="56" y="10" width="10" height="45" rx="3" fill="var(--accent)" opacity="0.3" />
        <line x1="4" y1="57" x2="74" y2="57" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Your analytics dashboard</h3>
      <p className="text-sm text-[var(--text-muted)] mb-5 max-w-sm mx-auto">
        Once your posts go live, you&apos;ll see:
      </p>

      <div className="inline-flex flex-col items-start gap-2 text-left text-sm text-[var(--text-secondary)] mb-6">
        <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[var(--accent)]" /> Engagement trends over time</span>
        <span className="flex items-center gap-2"><Share2 className="w-4 h-4 text-[var(--accent)]" /> Platform performance comparison</span>
        <span className="flex items-center gap-2"><Heart className="w-4 h-4 text-[var(--accent)]" /> Your top-performing content</span>
        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-[var(--accent)]" /> AI-powered content insights</span>
      </div>

      {scheduledCount > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          You have <span className="text-[var(--accent)] font-medium">{scheduledCount} post{scheduledCount !== 1 ? "s" : ""}</span> scheduled — data is on the way!
        </p>
      )}
    </div>
  );
}
