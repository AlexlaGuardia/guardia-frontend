"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import ReviewCard, { ReviewPost } from "./ReviewCard";
import PipelineCard, { PipelineItem } from "./PipelineCard";
import PostCard, { PostedItem } from "./PostCard";
import type { Screen } from "./TopBar";

const API_BASE = "https://api.guardiacontent.com";
const PAGE_SIZE = 20;

interface ScheduledPost {
  id: number;
  caption: string;
  platform: string;
  image_url: string;
  scheduled_for: string;
  status: string;
}

interface FeedScreenProps {
  jwt: string | null;
  clientTier?: string;
  onPostSelect: (post: PostedItem) => void;
  onNavigate?: (screen: Screen) => void;
}

function PlatformDot({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    facebook: "#1877F2",
    instagram: "#E4405F",
    tiktok: "#000000",
    linkedin: "#0A66C2",
    pinterest: "#E60023",
  };
  return (
    <div
      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ background: colors[platform] || "#9CA3AF" }}
      title={platform}
    />
  );
}

function formatScheduleDate(dateStr: string): string {
  if (!dateStr) return "Not scheduled";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Not scheduled";
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return `Tomorrow, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" }) +
    `, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden animate-pulse">
      <div className="w-full aspect-[4/5] bg-[var(--bg-surface)]" />
      <div className="px-4 py-3 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-20 bg-[var(--bg-surface)] rounded" />
          <div className="h-3 w-16 bg-[var(--bg-surface)] rounded" />
        </div>
        <div className="h-3 w-full bg-[var(--bg-surface)] rounded" />
        <div className="h-3 w-2/3 bg-[var(--bg-surface)] rounded" />
      </div>
    </div>
  );
}

export default function FeedScreen({ jwt, clientTier, onPostSelect, onNavigate }: FeedScreenProps) {
  // Factory state
  const [reviewPosts, setReviewPosts] = useState<ReviewPost[]>([]);
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  const [styledPending, setStyledPending] = useState(0);
  const [scheduled, setScheduled] = useState<ScheduledPost[]>([]);
  const [staleItems, setStaleItems] = useState<PipelineItem[]>([]);
  const [postsUsed, setPostsUsed] = useState(0);
  const [postsLimit, setPostsLimit] = useState(12);
  const [slotsLimit, setSlotsLimit] = useState(30);
  const [uploading, setUploading] = useState(false);

  // Feed state
  const [posts, setPosts] = useState<PostedItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Shared
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);

  // Animation state
  const [animatingOutIds, setAnimatingOutIds] = useState<Set<number>>(new Set());
  const [newlyFeedIds, setNewlyFeedIds] = useState<Set<number>>(new Set());
  const prevPostIdsRef = useRef<Set<number>>(new Set());

  // ── Data fetching ──

  const loadFactory = useCallback(async () => {
    if (!jwt) return;
    try {
      const [galleryRes, reviewRes, scheduledRes] = await Promise.all([
        fetch(`${API_BASE}/lobby/gallery`, { headers: { Authorization: `Bearer ${jwt}` } }),
        fetch(`${API_BASE}/lobby/content-review`, { headers: { Authorization: `Bearer ${jwt}` } }),
        fetch(`${API_BASE}/lobby/posted?status=scheduled&limit=5`, { headers: { Authorization: `Bearer ${jwt}` } }).catch(() => null),
      ]);

      if (galleryRes.ok) {
        const data = await galleryRes.json();
        const items = data.items || [];
        setPostsUsed(data.posts_used ?? 0);
        setPostsLimit(data.posts_limit ?? 12);
        setSlotsLimit(data.slots_limit ?? 30);
        setPipelineItems(items.filter((img: PipelineItem) => ["raw", "queued", "styling", "processing"].includes(img.status)));
        setStyledPending(items.filter((img: PipelineItem) => img.status === "ready" || img.status === "styled").length);
        setStaleItems(items.filter((img: PipelineItem) => img.status === "stale"));
      }
      if (reviewRes.ok) {
        const data = await reviewRes.json();
        setReviewPosts(data.posts || []);
      }
      if (scheduledRes?.ok) {
        const data = await scheduledRes.json();
        setScheduled((data.posts || []).slice(0, 5));
      }
    } catch (err) {
      console.error("Feed factory load error:", err);
    }
  }, [jwt]);

  const loadFeed = useCallback(async (offset: number, append: boolean) => {
    if (!jwt) return;
    if (append) setLoadingMore(true);
    try {
      const res = await fetch(`${API_BASE}/lobby/activity?limit=${PAGE_SIZE}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        const newPosts: PostedItem[] = data.posts || [];
        setPosts((prev) => {
          const updated = append ? [...prev, ...newPosts] : newPosts;
          // Track IDs for animation detection
          if (!append) {
            const newIds = new Set(updated.map((p) => p.id));
            const addedIds = new Set<number>();
            newIds.forEach((id) => {
              if (!prevPostIdsRef.current.has(id)) addedIds.add(id);
            });
            if (addedIds.size > 0 && prevPostIdsRef.current.size > 0) {
              setNewlyFeedIds(addedIds);
              setTimeout(() => setNewlyFeedIds(new Set()), 500);
            }
            prevPostIdsRef.current = newIds;
          }
          return updated;
        });
        setHasMore(data.has_more || false);
      }
    } catch {
      console.error("Failed to load feed");
    }
    if (append) setLoadingMore(false);
  }, [jwt]);

  // Initial load — all data in parallel
  useEffect(() => {
    if (!jwt) return;
    const init = async () => {
      setLoading(true);
      await Promise.all([loadFactory(), loadFeed(0, false)]);
      setLoading(false);
      isInitialLoad.current = false;
    };
    init();
  }, [jwt, loadFactory, loadFeed]);

  // Adaptive polling for factory data (fast when busy, slow when idle)
  useEffect(() => {
    const isBusy = pipelineItems.length > 0 || styledPending > 0;
    const interval = isBusy ? 5000 : 30000;
    const timer = setInterval(() => {
      if (!document.hidden) loadFactory();
    }, interval);
    return () => clearInterval(timer);
  }, [pipelineItems.length, styledPending, loadFactory]);

  // ── Handlers ──

  const handleApprove = useCallback((postId: number) => {
    setAnimatingOutIds((prev) => new Set(prev).add(postId));
    setTimeout(() => {
      setAnimatingOutIds(new Set());
      loadFactory();
      loadFeed(0, false);
    }, 450);
  }, [loadFactory, loadFeed]);

  const handleReject = useCallback(() => {
    loadFactory();
  }, [loadFactory]);

  const handleBulkApprove = async () => {
    if (reviewPosts.length === 0 || !jwt) return;
    try {
      const res = await fetch(`${API_BASE}/lobby/content-review/bulk-approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        loadFactory();
        setTimeout(() => loadFeed(0, false), 500);
      }
    } catch {}
  };

  const handleRetryStale = async () => {
    if (!jwt) return;
    await Promise.all(
      staleItems.map((item) =>
        fetch(`${API_BASE}/lobby/gallery/${item.id}/retry`, {
          method: "POST",
          headers: { Authorization: `Bearer ${jwt}` },
        }).catch(() => {})
      )
    );
    loadFactory();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !jwt) return;
    const totalQueue = reviewPosts.length + pipelineItems.length + styledPending;
    if (totalQueue >= slotsLimit) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/lobby/gallery/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
        body: formData,
      });
      if (res.ok) loadFactory();
    } catch {}
    setUploading(false);
    e.target.value = "";
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) loadFeed(posts.length, true);
  };

  // ── Derived state ──

  const factoryEmpty = reviewPosts.length === 0 && pipelineItems.length === 0 && styledPending === 0 && staleItems.length === 0 && scheduled.length === 0;
  const budgetRatio = postsLimit > 0 ? postsUsed / postsLimit : 0;
  const allEmpty = factoryEmpty && posts.length === 0;

  // ── Render ──

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-10 space-y-4 pb-24 xl:pb-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes approve-out {
          from { max-height: 600px; opacity: 1; transform: scale(1); }
          to { max-height: 0; opacity: 0; transform: scale(0.95); padding: 0; margin: 0; overflow: hidden; }
        }
        @keyframes feed-in {
          from { max-height: 0; opacity: 0; transform: translateY(-20px); }
          to { max-height: 800px; opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-xl mx-auto px-4 pt-10 pb-24 xl:pb-4 space-y-5">

        {/* ── Upload Card ── */}
        <label
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-sm cursor-pointer transition-all active:scale-[0.98] hover:brightness-110 text-white"
          style={{
            background: "linear-gradient(135deg, #C9A227, #D4AF37)",
            boxShadow: "0 4px 16px rgba(201,162,39,0.35)",
          }}
        >
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Upload Photos
              <span className="ml-2 px-2 py-0.5 rounded-lg text-xs font-medium bg-white/20">{postsUsed}/{postsLimit}</span>
            </>
          )}
        </label>

        {/* ── Stale Warning ── */}
        {staleItems.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0 mt-0.5 text-amber-500">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {staleItems.length} item{staleItems.length > 1 ? "s" : ""} got stuck
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Something went wrong during processing.</p>
              </div>
              <button
                onClick={handleRetryStale}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-500 border border-amber-500/30 hover:bg-amber-500/10 transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ── Fresh from the Factory ── */}
        {reviewPosts.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Fresh from the Factory</h3>
              <span className="text-xs font-semibold text-green-600 ml-auto">{reviewPosts.length}</span>
              {reviewPosts.length > 1 && (
                <button
                  onClick={handleBulkApprove}
                  className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white transition-all active:scale-95 hover:brightness-110"
                  style={{ background: "#4338CA", boxShadow: "0 2px 6px rgba(67,56,202,0.25)" }}
                >
                  Approve All
                </button>
              )}
            </div>
            <div className="space-y-3">
              {reviewPosts.map((post) => (
                <div
                  key={post.id}
                  style={animatingOutIds.has(post.id) ? { animation: "approve-out 400ms ease forwards", overflow: "hidden" } : undefined}
                >
                  <ReviewCard
                    post={post}
                    jwt={jwt}
                    onApproved={() => handleApprove(post.id)}
                    onRejected={handleReject}
                    onMessage={() => {}}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── In Pipeline ── */}
        {(pipelineItems.length > 0 || styledPending > 0) && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#C9A227] animate-pulse" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">In Pipeline</h3>
              <span className="text-xs text-[var(--text-muted)] ml-auto">
                {pipelineItems.length + styledPending} item{pipelineItems.length + styledPending > 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {pipelineItems.map((item) => (
                <PipelineCard key={item.id} item={item} />
              ))}
              {styledPending > 0 && (
                <div className="flex items-center gap-3 p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5">
                      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Generating captions</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                      <span className="text-xs text-violet-600">{styledPending} image{styledPending > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Scheduled ── */}
        {scheduled.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Scheduled</h3>
            </div>
            <div className="space-y-1.5">
              {scheduled.map((post) => (
                <div key={post.id} className="flex items-center gap-3 p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--border)]">
                    {post.image_url ? (
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[var(--bg-surface)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text-primary)] line-clamp-1">{post.caption || "Untitled post"}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <PlatformDot platform={post.platform} />
                      <span className="text-[10px] text-[var(--text-muted)]">{formatScheduleDate(post.scheduled_for)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Budget Warning ── */}
        {postsUsed >= postsLimit && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0 mt-0.5 text-amber-500">
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">You&apos;ve used all {postsLimit} posts this month</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  New uploads will be saved for next month.
                  {clientTier === "spark" && " Upgrade to Pro to unlock more."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        {!factoryEmpty && posts.length > 0 && (
          <div className="border-t border-[var(--border-subtle)]" />
        )}

        {/* ── Posted Feed ── */}
        {posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                style={newlyFeedIds.has(post.id) ? { animation: "feed-in 400ms ease forwards" } : undefined}
              >
                <PostCard
                  post={post}
                  onClick={() => {
                    if (!post.status || post.status === "posted") {
                      onPostSelect(post);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Load More ── */}
        {hasMore && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-xl transition-all disabled:opacity-50"
          >
            {loadingMore ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              "Load more"
            )}
          </button>
        )}

        {/* ── Empty State ── */}
        {allEmpty && (
          <div className="flex flex-col items-center text-center py-12">
            <Image
              src="/images/gio/wave.png"
              alt="Giovanni"
              width={80}
              height={80}
              className="rounded-2xl mb-4"
            />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Your Feed</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Upload some photos and we&apos;ll handle the rest — styled, captioned, and posted.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
