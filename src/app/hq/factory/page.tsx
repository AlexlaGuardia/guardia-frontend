"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE = "https://api.guardiacontent.com";
const REFRESH_INTERVAL = 30_000;

// ── Types ──

interface Funnel {
  uploads_pending: number;
  uploads_processing: number;
  assets_styling: number;
  assets_styled: number;
  posts_pending_review: number;
  posts_draft: number;
  posts_approved: number;
  posts_scheduled: number;
  posts_posted: number;
  posts_failed: number;
}

interface ClientPlatform {
  platform: string;
  token_status: string;
  enabled: boolean;
}

interface ClientData {
  id: string;
  name: string;
  tier: string;
  usage: { images_styled: number; posts_created: number; limit: number };
  platforms: ClientPlatform[];
  counts: { scheduled: number; posted: number; failed: number };
  last_posted: string | null;
}

interface AttentionItem {
  type: string;
  count?: number;
  client?: string;
  platform?: string;
  detail: string;
}

interface Post {
  id: number;
  client_id: string;
  client_name: string;
  platform: string;
  caption: string;
  status: string;
  scheduled_for: string | null;
  posted_at: string | null;
  error_message: string | null;
  mission_type: string | null;
  created_at: string;
}

interface DashboardData {
  funnel: Funnel;
  clients: ClientData[];
  attention: AttentionItem[];
  posts: Post[];
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

function formatDate(date: string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_COLORS: Record<string, string> = {
  pending_review: "#f59e0b",
  draft: "#6b7280",
  approved: "#3b82f6",
  scheduled: "#10b981",
  posted: "#888888",
  failed: "#ef4444",
  cancelled: "#555555",
  paused: "#6b7280",
};

const TOKEN_COLORS: Record<string, string> = {
  valid: "#10b981",
  refreshed: "#f59e0b",
  dead: "#ef4444",
  unknown: "#f59e0b",
};

const TIER_COLORS: Record<string, string> = {
  spark: "#f59e0b",
  pro: "#3b82f6",
  unleashed: "#8b5cf6",
};

const FILTER_OPTIONS = ["all", "pending_review", "scheduled", "posted", "failed"] as const;
type PostFilter = typeof FILTER_OPTIONS[number];

const FILTER_LABELS: Record<string, string> = {
  all: "All",
  pending_review: "Review",
  scheduled: "Scheduled",
  posted: "Posted",
  failed: "Failed",
};

// ── Auth hook ──

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

function PipelineFunnel({ funnel }: { funnel: Funnel }) {
  const stages = [
    { label: "Uploads", count: funnel.uploads_pending + funnel.uploads_processing, sub: funnel.uploads_processing > 0 ? `${funnel.uploads_processing} styling` : undefined },
    { label: "Styled", count: funnel.assets_styled },
    { label: "Review", count: funnel.posts_pending_review, alert: funnel.posts_pending_review > 0 },
    { label: "Scheduled", count: funnel.posts_scheduled + funnel.posts_approved },
    { label: "Posted", count: funnel.posts_posted },
  ];

  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-[#555] tracking-wider">PIPELINE</span>
        {funnel.posts_failed > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">
            {funnel.posts_failed} failed
          </span>
        )}
      </div>
      <div className="flex items-center gap-0">
        {stages.map((stage, i) => {
          const color = stage.alert ? "#f59e0b" : stage.count > 0 ? "#10b981" : "#333";
          return (
            <div key={stage.label} className="flex items-center">
              <div className="flex flex-col items-center min-w-[80px]">
                <span
                  className={`font-mono text-xl font-semibold ${stage.alert ? "animate-pulse" : ""}`}
                  style={{ color }}
                >
                  {stage.count}
                </span>
                <span className="text-[10px] tracking-wider mt-0.5" style={{ color: stage.alert ? "#f59e0b" : "#666" }}>
                  {stage.label.toUpperCase()}
                </span>
                {stage.sub && (
                  <span className="text-[9px] text-[#555] mt-0.5">{stage.sub}</span>
                )}
              </div>
              {i < stages.length - 1 && (
                <div className="text-[#2a2a2f] mx-1 text-lg select-none">&rarr;</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttentionPanel({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null;

  const iconForType = (type: string) => {
    if (type === "stuck_review") return "!";
    if (type === "failed_posts") return "x";
    if (type === "dead_token") return "~";
    if (type === "over_limit") return "^";
    return "!";
  };

  const colorForType = (type: string) => {
    if (type === "failed_posts") return "#ef4444";
    if (type === "dead_token") return "#ef4444";
    return "#f59e0b";
  };

  return (
    <div className="bg-[#0a0a0b] border border-[#f59e0b]/20 rounded-lg px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[10px] text-amber-400 tracking-wider font-semibold">NEEDS ATTENTION</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const color = colorForType(item.type);
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="text-[10px] w-4 h-4 rounded flex items-center justify-center font-mono font-bold"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {iconForType(item.type)}
              </span>
              <span className="text-[13px] text-[#aaa]">{item.detail}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClientHealth({ clients }: { clients: ClientData[] }) {
  return (
    <div className="flex flex-col">
      <h2 className="text-xs font-semibold tracking-wider text-[#888] mb-3">CLIENTS</h2>
      <div className="space-y-2">
        {clients.map((client) => {
          const tierColor = TIER_COLORS[client.tier] || "#888";
          const overLimit = client.usage.images_styled >= client.usage.limit;
          const usagePct = Math.min(100, (client.usage.images_styled / Math.max(1, client.usage.limit)) * 100);

          return (
            <div
              key={client.id}
              className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg px-3 py-2.5 hover:border-[#2a2a2f] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[13px] text-[#ccc] font-medium">{client.name}</span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded tracking-wider"
                  style={{ backgroundColor: `${tierColor}20`, color: tierColor }}
                >
                  {client.tier.toUpperCase()}
                </span>
              </div>

              {/* Usage bar */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-1 bg-[#1a1a1f] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${usagePct}%`,
                      backgroundColor: overLimit ? "#ef4444" : "#10b981",
                    }}
                  />
                </div>
                <span className={`text-[10px] font-mono ${overLimit ? "text-red-400" : "text-[#666]"}`}>
                  {client.usage.images_styled}/{client.usage.limit}
                </span>
              </div>

              {/* Stats + Platforms row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-[#555]">
                  {client.counts.scheduled > 0 && <span className="text-emerald-400">{client.counts.scheduled} sched</span>}
                  {client.counts.posted > 0 && <span>{client.counts.posted} posted</span>}
                  {client.counts.failed > 0 && <span className="text-red-400">{client.counts.failed} failed</span>}
                  {client.last_posted && <span>{relativeTime(client.last_posted)}</span>}
                </div>
                <div className="flex items-center gap-1">
                  {client.platforms.map((p) => {
                    const color = p.enabled ? (TOKEN_COLORS[p.token_status] || "#555") : "#333";
                    const label = p.platform === "facebook" ? "fb" : p.platform === "instagram" ? "ig" : p.platform.slice(0, 2);
                    return (
                      <span
                        key={p.platform}
                        className="text-[9px] font-mono px-1 py-px rounded"
                        style={{ backgroundColor: `${color}20`, color }}
                        title={`${p.platform}: ${p.token_status}${p.enabled ? "" : " (disabled)"}`}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PostsTable({
  posts,
  filter,
  onFilterChange,
  onRetry,
  retrying,
}: {
  posts: Post[];
  filter: PostFilter;
  onFilterChange: (f: PostFilter) => void;
  onRetry: (id: number) => void;
  retrying: number | null;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-semibold tracking-wider text-[#888]">POSTS</h2>
        <div className="flex gap-1 ml-auto">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                filter === f
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-[#555] hover:text-[#888] border border-transparent"
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[#333] text-sm">No posts match filter</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full hidden md:table">
              <thead>
                <tr className="border-b border-[#1a1a1f]">
                  {["CLIENT", "PLATFORM", "CAPTION", "STATUS", "DATE"].map((h) => (
                    <th key={h} className="text-left p-3 text-[10px] text-[#555] tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => {
                  const statusColor = STATUS_COLORS[post.status] || "#888";
                  const isFailed = post.status === "failed";
                  const isExpanded = expandedId === post.id;
                  return (
                    <>
                      <tr
                        key={post.id}
                        className={`border-b border-[#111] transition-colors ${
                          isFailed ? "hover:bg-red-500/5 cursor-pointer" : "hover:bg-[#0d0d0e]"
                        }`}
                        onClick={() => isFailed && setExpandedId(isExpanded ? null : post.id)}
                      >
                        <td className="p-3 text-sm text-[#aaa]">{post.client_name}</td>
                        <td className="p-3 text-sm text-[#666]">{post.platform}</td>
                        <td className="p-3 text-sm text-[#888] max-w-[280px] truncate">
                          {post.caption?.slice(0, 60)}
                        </td>
                        <td className="p-3">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-mono tracking-wider"
                            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                          >
                            {post.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-[13px] text-[#555] font-mono">
                          {formatDate(post.posted_at || post.scheduled_for || post.created_at)}
                        </td>
                      </tr>
                      {isFailed && isExpanded && (
                        <tr key={`${post.id}-err`} className="border-b border-[#111]">
                          <td colSpan={5} className="px-3 py-3 bg-red-500/5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] text-[#555] tracking-wider block mb-1">ERROR</span>
                                <p className="text-red-300/80 text-xs font-mono whitespace-pre-wrap">
                                  {post.error_message || "No error message recorded"}
                                </p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); onRetry(post.id); }}
                                disabled={retrying === post.id}
                                className="shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-all bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
                              >
                                {retrying === post.id ? "..." : "Retry"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#1a1a1f]">
              {filtered.map((post) => {
                const statusColor = STATUS_COLORS[post.status] || "#888";
                const isFailed = post.status === "failed";
                const isExpanded = expandedId === post.id;
                return (
                  <div
                    key={post.id}
                    className={`p-3 space-y-1.5 ${isFailed ? "cursor-pointer" : ""}`}
                    onClick={() => isFailed && setExpandedId(isExpanded ? null : post.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#ccc]">{post.client_name}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                        style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                      >
                        {post.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-[#666] line-clamp-2">{post.caption?.slice(0, 80)}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#555]">
                      <span>{post.platform}</span>
                      <span>{formatDate(post.posted_at || post.scheduled_for || post.created_at)}</span>
                    </div>
                    {isFailed && isExpanded && (
                      <div className="mt-2 p-3 rounded bg-red-500/5 border border-red-500/10">
                        <p className="text-red-300/80 text-xs font-mono whitespace-pre-wrap mb-2">
                          {post.error_message || "No error message"}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); onRetry(post.id); }}
                          disabled={retrying === post.id}
                          className="px-3 py-1.5 rounded text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
                        >
                          {retrying === post.id ? "..." : "Retry"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──

export default function FactoryPage() {
  return (
    <Suspense>
      <FactoryContent />
    </Suspense>
  );
}

function FactoryContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated, checking } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<PostFilter>((searchParams?.get("filter") as PostFilter) || "all");
  const [retrying, setRetrying] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/hq/factory/dashboard`);
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchData]);

  const handleRetry = useCallback(async (postId: number) => {
    setRetrying(postId);
    try {
      const res = await fetch(`${API_BASE}/hq/factory/posts/${postId}/retry`, { method: "POST" });
      if (res.ok) await fetchData();
    } catch {}
    setRetrying(null);
  }, [fetchData]);

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
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h1 className="text-[#10b981] font-semibold text-sm tracking-wider">THE FACTORY</h1>
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
            <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-20 animate-pulse" />
            <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-16 animate-pulse" />
            <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-60 animate-pulse" />
          </div>
        )}

        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-4 py-3 text-red-400 text-sm">
            Failed to reach Factory. Retrying in {REFRESH_INTERVAL / 1000}s...
          </div>
        )}

        {data && (
          <>
            {/* Pipeline Funnel */}
            <PipelineFunnel funnel={data.funnel} />

            {/* Attention Panel */}
            <AttentionPanel items={data.attention} />

            {/* Two-column: Posts + Client Health */}
            <div className="flex flex-col lg:flex-row gap-4 min-h-0">
              <PostsTable
                posts={data.posts}
                filter={filter}
                onFilterChange={setFilter}
                onRetry={handleRetry}
                retrying={retrying}
              />
              <div className="w-full lg:w-[320px] shrink-0">
                <ClientHealth clients={data.clients} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
