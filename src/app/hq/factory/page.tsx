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

// ── Floor 2 Types ──

interface PipeConfig {
  pipe_name: string;
  mission_type: string;
  schedule: "daily" | "weekly";
  run_hour: number;
  days_of_week?: string;
}

interface StyleConfig {
  preferred_style: string;
  lora_model?: string;
  lora_trigger?: string;
}

interface RhythmConfig {
  posts_per_week: number;
  posting_days: string[];
  stagger_hours: boolean;
}

interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  niche: string;
  pipes_config: PipeConfig[];
  style_config: StyleConfig;
  rhythm_config: RhythmConfig;
  preview_image_url: string | null;
  status: "draft" | "active" | "archived";
  store_product_id: string | null;
  price_cents: number | null;
  created_at: string;
  updated_at: string;
}

interface AvailablePipe {
  pipe_name: string;
  client_id: string;
  file_path: string;
  mission_type: string;
}

interface ClientPipe {
  id: number;
  client_id: string;
  pipe_name: string;
  schedule: string;
  run_hour: number;
  days_of_week: string | null;
  enabled: number;
  last_run_at: string | null;
  last_status: string | null;
  total_runs: number;
  total_successes: number;
  consecutive_failures: number;
}

interface MedusaStatusData {
  daemon_running: boolean;
  total_pipes: number;
  active_pipes: number;
  paused_pipes: number;
  failed_pipes: number;
  last_run: string | null;
}

type FloorView = "floor1" | "floor2";

const NICHES = [
  "pet_services", "beauty_wellness", "fitness_health", "food_beverage",
  "local_retail", "creative_services", "real_estate", "home_services",
  "automotive", "professional_services", "healthcare", "local_business",
];

const MISSION_COLORS: Record<string, string> = {
  heartbeat: "#f59e0b", showcase: "#8b5cf6", educate: "#3b82f6",
  engage: "#10b981", trust: "#14b8a6", convert: "#ef4444",
};

const TEMPLATE_STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280", active: "#10b981", archived: "#555555",
};

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
  const [floor, setFloor] = useState<FloorView>("floor1");

  // Floor 2 state
  const [templates, setTemplates] = useState<PipelineTemplate[]>([]);
  const [availablePipes, setAvailablePipes] = useState<AvailablePipe[]>([]);
  const [medusaStatus, setMedusaStatus] = useState<MedusaStatusData | null>(null);
  const [editTemplate, setEditTemplate] = useState<PipelineTemplate | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [f2Loading, setF2Loading] = useState(false);

  const fetchFloor2 = useCallback(async () => {
    setF2Loading(true);
    try {
      const [tRes, pRes, mRes] = await Promise.all([
        fetch(`${API_BASE}/hq/floor2/templates`),
        fetch(`${API_BASE}/hq/floor2/pipes/available`),
        fetch(`${API_BASE}/hq/floor2/medusa/status`),
      ]);
      if (tRes.ok) setTemplates((await tRes.json()).templates);
      if (pRes.ok) setAvailablePipes((await pRes.json()).pipes);
      if (mRes.ok) setMedusaStatus(await mRes.json());
    } catch {}
    setF2Loading(false);
  }, []);

  useEffect(() => {
    if (floor === "floor2" && isAuthenticated) fetchFloor2();
  }, [floor, isAuthenticated, fetchFloor2]);

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
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h1 className="text-[#10b981] font-semibold text-sm tracking-wider">THE FACTORY</h1>
            <div className="flex bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg overflow-hidden ml-2">
              <button
                onClick={() => setFloor("floor1")}
                className={`text-[10px] px-2.5 py-1 transition-colors ${
                  floor === "floor1" ? "bg-emerald-500/15 text-emerald-300" : "text-[#555] hover:text-[#888]"
                }`}
              >
                Floor 1
              </button>
              <button
                onClick={() => setFloor("floor2")}
                className={`text-[10px] px-2.5 py-1 transition-colors ${
                  floor === "floor2" ? "bg-emerald-500/15 text-emerald-300" : "text-[#555] hover:text-[#888]"
                }`}
              >
                Floor 2
              </button>
            </div>
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

        {floor === "floor1" && data && (
          <>
            <PipelineFunnel funnel={data.funnel} />
            <AttentionPanel items={data.attention} />
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

        {floor === "floor2" && (
          <>
            {f2Loading && !templates.length ? (
              <div className="space-y-4">
                <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-20 animate-pulse" />
                <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-60 animate-pulse" />
              </div>
            ) : (
              <>
                {/* Medusa Status Bar */}
                {medusaStatus && <MedusaStatusBar status={medusaStatus} />}

                {/* Template Grid */}
                <TemplateGrid
                  templates={templates}
                  onSelect={(t) => { setEditTemplate(t); setCreatingNew(false); }}
                  onNew={() => { setEditTemplate(null); setCreatingNew(true); }}
                />

                {/* Client Pipelines */}
                <ClientPipelinesPanel />
              </>
            )}

            {/* Template Editor Panel */}
            {(editTemplate || creatingNew) && (
              <TemplateEditorPanel
                template={editTemplate}
                availablePipes={availablePipes}
                onClose={() => { setEditTemplate(null); setCreatingNew(false); }}
                onSave={async (data) => {
                  const method = editTemplate ? "PATCH" : "POST";
                  const url = editTemplate
                    ? `${API_BASE}/hq/floor2/templates/${editTemplate.id}`
                    : `${API_BASE}/hq/floor2/templates`;
                  const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  });
                  if (res.ok) {
                    setEditTemplate(null);
                    setCreatingNew(false);
                    fetchFloor2();
                  }
                }}
                onDelete={editTemplate ? async () => {
                  await fetch(`${API_BASE}/hq/floor2/templates/${editTemplate.id}`, { method: "DELETE" });
                  setEditTemplate(null);
                  fetchFloor2();
                } : undefined}
                onPublish={editTemplate ? async (priceCents: number) => {
                  await fetch(`${API_BASE}/hq/floor2/templates/${editTemplate.id}/publish`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ price_cents: priceCents }),
                  });
                  fetchFloor2();
                } : undefined}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}


// ── Floor 2 Components ──────────────────────────────────────

function MedusaStatusBar({ status }: { status: MedusaStatusData }) {
  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg px-5 py-3 flex items-center gap-6 flex-wrap">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status.daemon_running ? "bg-emerald-500" : "bg-red-500"}`} />
        <span className="text-[10px] text-[#888] tracking-wider">MEDUSA</span>
        <span className={`text-xs font-mono ${status.daemon_running ? "text-emerald-400" : "text-red-400"}`}>
          {status.daemon_running ? "Running" : "Stopped"}
        </span>
      </div>
      <div className="flex items-center gap-4 text-[10px] text-[#666]">
        <span><span className="text-emerald-400 font-mono">{status.active_pipes}</span> active</span>
        <span><span className="font-mono">{status.paused_pipes}</span> paused</span>
        {status.failed_pipes > 0 && (
          <span><span className="text-red-400 font-mono">{status.failed_pipes}</span> failed</span>
        )}
        <span>{status.total_pipes} total pipes</span>
      </div>
      {status.last_run && (
        <span className="text-[10px] text-[#444] font-mono ml-auto">
          Last: {relativeTime(status.last_run)}
        </span>
      )}
    </div>
  );
}

function TemplateGrid({
  templates,
  onSelect,
  onNew,
}: {
  templates: PipelineTemplate[];
  onSelect: (t: PipelineTemplate) => void;
  onNew: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filtered = statusFilter === "all"
    ? templates
    : templates.filter((t) => t.status === statusFilter);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-semibold tracking-wider text-[#888]">TEMPLATES</h2>
        <div className="flex gap-1 ml-2">
          {["all", "draft", "active"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                statusFilter === s
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-[#555] hover:text-[#888] border border-transparent"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={onNew}
          className="ml-auto text-[10px] px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
        >
          + New Template
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-12 text-center">
          <p className="text-[#333] text-sm mb-2">No templates yet</p>
          <p className="text-[#555] text-xs">Create your first pipeline template to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((template) => {
            const statusColor = TEMPLATE_STATUS_COLORS[template.status] || "#888";
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="text-left bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-4 hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm text-[#ccc] font-medium group-hover:text-emerald-300 transition-colors">
                    {template.name}
                  </h3>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-mono tracking-wider shrink-0"
                    style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                  >
                    {template.status.toUpperCase()}
                  </span>
                </div>
                {template.niche && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1a1a1f] text-[#888] inline-block mb-2">
                    {template.niche.replace(/_/g, " ")}
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  {template.pipes_config.map((p) => {
                    const color = MISSION_COLORS[p.mission_type] || "#888";
                    return (
                      <span
                        key={p.pipe_name}
                        className="text-[8px] px-1 py-0.5 rounded font-mono"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {p.pipe_name}
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#555]">
                  <span>{template.pipes_config.length} pipes</span>
                  {template.price_cents && (
                    <span className="text-emerald-400">${(template.price_cents / 100).toFixed(0)}/mo</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TemplateEditorPanel({
  template,
  availablePipes,
  onClose,
  onSave,
  onDelete,
  onPublish,
}: {
  template: PipelineTemplate | null;
  availablePipes: AvailablePipe[];
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onPublish?: (priceCents: number) => Promise<void>;
}) {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [niche, setNiche] = useState(template?.niche || "");
  const [pipes, setPipes] = useState<PipeConfig[]>(template?.pipes_config || []);
  const [preferredStyle, setPreferredStyle] = useState(template?.style_config?.preferred_style || "ghibli");
  const [loraModel, setLoraModel] = useState(template?.style_config?.lora_model || "");
  const [postsPerWeek, setPostsPerWeek] = useState(template?.rhythm_config?.posts_per_week || 5);
  const [saving, setSaving] = useState(false);
  const [publishPrice, setPublishPrice] = useState(template?.price_cents ? String(template.price_cents / 100) : "");
  const [showPublish, setShowPublish] = useState(false);

  const uniquePipes = availablePipes.filter(
    (p, i, arr) => arr.findIndex((x) => x.pipe_name === p.pipe_name) === i
  );

  const togglePipe = (pipeName: string, missionType: string) => {
    const exists = pipes.find((p) => p.pipe_name === pipeName);
    if (exists) {
      setPipes(pipes.filter((p) => p.pipe_name !== pipeName));
    } else {
      setPipes([...pipes, { pipe_name: pipeName, mission_type: missionType, schedule: "daily", run_hour: 6 }]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name,
      description,
      niche,
      pipes_config: pipes,
      style_config: { preferred_style: preferredStyle, ...(loraModel ? { lora_model: loraModel } : {}) },
      rhythm_config: { posts_per_week: postsPerWeek, posting_days: ["mon", "tue", "wed", "thu", "fri"].slice(0, postsPerWeek), stagger_hours: true },
    });
    setSaving(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-[#0a0a0b] border-l border-[#1a1a1f] z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0b] border-b border-[#1a1a1f] px-5 py-3 flex items-center justify-between z-10">
          <h3 className="text-sm text-[#ccc] font-medium">
            {template ? "Edit Template" : "New Template"}
          </h3>
          <button onClick={onClose} className="text-[#555] hover:text-[#ccc] transition-colors text-lg">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Identity */}
          <div>
            <label className="text-[10px] text-[#555] tracking-wider block mb-1">NAME</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Motivational Coach"
              className="w-full bg-[#111] border border-[#1a1a1f] rounded px-3 py-2 text-sm text-[#ccc] focus:border-emerald-500/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-[#555] tracking-wider block mb-1">DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this template does..."
              rows={2}
              className="w-full bg-[#111] border border-[#1a1a1f] rounded px-3 py-2 text-sm text-[#ccc] focus:border-emerald-500/40 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-[#555] tracking-wider block mb-1">TARGET NICHE</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-[#111] border border-[#1a1a1f] rounded px-3 py-2 text-sm text-[#ccc] focus:border-emerald-500/40 focus:outline-none"
            >
              <option value="">Select niche...</option>
              {NICHES.map((n) => (
                <option key={n} value={n}>{n.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {/* Pipes */}
          <div>
            <label className="text-[10px] text-[#555] tracking-wider block mb-2">CONTENT PIPES</label>
            <div className="space-y-1.5">
              {uniquePipes.map((ap) => {
                const isActive = pipes.some((p) => p.pipe_name === ap.pipe_name);
                const color = MISSION_COLORS[ap.mission_type] || "#888";
                return (
                  <button
                    key={ap.pipe_name}
                    onClick={() => togglePipe(ap.pipe_name, ap.mission_type)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded border transition-all ${
                      isActive
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-[#111] border-[#1a1a1f] hover:border-[#2a2a2f]"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors ${
                      isActive ? "border-emerald-400 bg-emerald-500" : "border-[#333]"
                    }`}>
                      {isActive && <span className="text-white text-[8px]">&#10003;</span>}
                    </div>
                    <span className="text-sm text-[#ccc] flex-1">{ap.pipe_name.replace(/_/g, " ")}</span>
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {ap.mission_type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="text-[10px] text-[#555] tracking-wider block mb-1">VISUAL STYLE</label>
            <select
              value={preferredStyle}
              onChange={(e) => setPreferredStyle(e.target.value)}
              className="w-full bg-[#111] border border-[#1a1a1f] rounded px-3 py-2 text-sm text-[#ccc] focus:border-emerald-500/40 focus:outline-none mb-2"
            >
              {["ghibli", "flux_schnell", "flux_dev", "warm_cinematic", "marble_minimal", "none"].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <input
              value={loraModel}
              onChange={(e) => setLoraModel(e.target.value)}
              placeholder="LoRA model ID (optional, future)"
              className="w-full bg-[#111] border border-[#1a1a1f] rounded px-3 py-2 text-xs text-[#888] focus:border-emerald-500/40 focus:outline-none"
            />
          </div>

          {/* Rhythm */}
          <div>
            <label className="text-[10px] text-[#555] tracking-wider block mb-1">
              POSTS PER WEEK: <span className="text-emerald-400">{postsPerWeek}</span>
            </label>
            <input
              type="range"
              min={1}
              max={7}
              value={postsPerWeek}
              onChange={(e) => setPostsPerWeek(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[9px] text-[#444] mt-1">
              <span>1x</span><span>3x</span><span>5x</span><span>7x</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : template ? "Save Changes" : "Create Template"}
            </button>
            {template && onPublish && !template.store_product_id && (
              <button
                onClick={() => setShowPublish(!showPublish)}
                className="px-3 py-2.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/40 text-xs font-medium hover:bg-violet-500/30 transition-colors"
              >
                Publish
              </button>
            )}
            {template && onDelete && (
              <button
                onClick={onDelete}
                className="px-3 py-2.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs hover:bg-red-500/20 transition-colors"
              >
                Archive
              </button>
            )}
          </div>

          {template?.store_product_id && (
            <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded">
              <div className="w-2 h-2 bg-violet-400 rounded-full" />
              <span className="text-xs text-violet-300">Published to Chloe&apos;s Store</span>
              {template.price_cents && (
                <span className="text-xs text-violet-400 ml-auto font-mono">${(template.price_cents / 100).toFixed(0)}/mo</span>
              )}
            </div>
          )}

          {showPublish && onPublish && (
            <div className="bg-[#111] border border-violet-500/20 rounded-lg p-4">
              <label className="text-[10px] text-[#555] tracking-wider block mb-1">STORE PRICE ($/mo)</label>
              <div className="flex gap-2">
                <input
                  value={publishPrice}
                  onChange={(e) => setPublishPrice(e.target.value)}
                  placeholder="29"
                  type="number"
                  className="flex-1 bg-[#0a0a0b] border border-[#1a1a1f] rounded px-3 py-2 text-sm text-[#ccc] focus:border-violet-500/40 focus:outline-none"
                />
                <button
                  onClick={() => {
                    const cents = Math.round(Number(publishPrice) * 100);
                    if (cents > 0) onPublish(cents);
                    setShowPublish(false);
                  }}
                  disabled={!publishPrice || Number(publishPrice) <= 0}
                  className="px-4 py-2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/40 text-xs font-medium hover:bg-violet-500/30 disabled:opacity-50"
                >
                  Publish
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ClientPipelinesPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Array<{ id: string; business_name: string; tier: string }>>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientPipes, setClientPipes] = useState<ClientPipe[]>([]);
  const [loadingPipes, setLoadingPipes] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/hq/clients`)
      .then((r) => r.ok ? r.json() : { clients: [] })
      .then((d) => setClients(Array.isArray(d) ? d : d.clients || []))
      .catch(() => {});
  }, []);

  const loadPipes = async (clientId: string) => {
    setSelectedClient(clientId);
    setLoadingPipes(true);
    try {
      const res = await fetch(`${API_BASE}/hq/floor2/clients/${clientId}/pipes`);
      if (res.ok) setClientPipes((await res.json()).pipes);
    } catch {}
    setLoadingPipes(false);
  };

  const togglePipe = async (pipe: ClientPipe) => {
    await fetch(`${API_BASE}/hq/floor2/clients/${pipe.client_id}/pipes/${pipe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !pipe.enabled }),
    });
    if (selectedClient) loadPipes(selectedClient);
  };

  const filteredClients = searchQuery
    ? clients.filter((c) => c.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.includes(searchQuery))
    : clients;

  return (
    <div>
      <h2 className="text-xs font-semibold tracking-wider text-[#888] mb-3">CLIENT PIPELINES</h2>
      <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg overflow-hidden">
        <div className="p-3 border-b border-[#1a1a1f]">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients..."
            className="w-full bg-[#111] border border-[#1a1a1f] rounded px-3 py-1.5 text-xs text-[#ccc] focus:border-emerald-500/40 focus:outline-none"
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto divide-y divide-[#111]">
          {filteredClients.map((client) => {
            const isSelected = selectedClient === client.id;
            const tierColor = TIER_COLORS[client.tier] || "#888";
            return (
              <div key={client.id}>
                <button
                  onClick={() => isSelected ? setSelectedClient(null) : loadPipes(client.id)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-2 transition-colors ${
                    isSelected ? "bg-emerald-500/5" : "hover:bg-[#0d0d0e]"
                  }`}
                >
                  <span className="text-sm text-[#ccc] flex-1">{client.business_name || client.id}</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded tracking-wider"
                    style={{ backgroundColor: `${tierColor}20`, color: tierColor }}
                  >
                    {client.tier?.toUpperCase()}
                  </span>
                </button>
                {isSelected && (
                  <div className="px-3 pb-3 bg-emerald-500/5">
                    {loadingPipes ? (
                      <div className="py-2 text-[10px] text-[#555]">Loading...</div>
                    ) : clientPipes.length === 0 ? (
                      <div className="py-2 text-[10px] text-[#555]">No pipes assigned</div>
                    ) : (
                      <div className="space-y-1">
                        {clientPipes.map((pipe) => {
                          const statusColor = pipe.enabled ? "#10b981" : "#555";
                          return (
                            <div key={pipe.id} className="flex items-center gap-2 py-1.5">
                              <button
                                onClick={() => togglePipe(pipe)}
                                className={`w-3 h-3 rounded-sm border transition-colors ${
                                  pipe.enabled ? "bg-emerald-500 border-emerald-400" : "border-[#333]"
                                }`}
                              />
                              <span className="text-xs text-[#aaa] flex-1">{pipe.pipe_name}</span>
                              <span className="text-[9px] text-[#555] font-mono">{pipe.schedule}</span>
                              {pipe.last_status && (
                                <span
                                  className="text-[8px] px-1 py-0.5 rounded font-mono"
                                  style={{ backgroundColor: `${pipe.last_status === "success" ? "#10b981" : "#ef4444"}20`, color: pipe.last_status === "success" ? "#10b981" : "#ef4444" }}
                                >
                                  {pipe.last_status}
                                </span>
                              )}
                              <span className="text-[9px] text-[#444] font-mono">
                                {pipe.total_successes}/{pipe.total_runs}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
