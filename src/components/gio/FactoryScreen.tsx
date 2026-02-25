"use client";

import { useState, useEffect, useCallback, useRef, SyntheticEvent } from "react";
import Image from "next/image";
import ReviewCard, { ReviewPost } from "./ReviewCard";
import PipelineCard, { PipelineItem } from "./PipelineCard";

/**
 * FactoryScreen — Content pipeline view for Gio app
 *
 * Three sections, priority ordered:
 * 1. Needs Review: styled+captioned content awaiting client approval
 * 2. In Pipeline: content being processed (Artemis/Mercury/Argus)
 * 3. Scheduled: compact upcoming post list
 *
 * Upload Photos button fixed at bottom (gold, prominent).
 * Empty state: Gio thumbs-up + "All caught up!"
 */

const API_BASE = "https://api.guardiacontent.com";

interface ScheduledPost {
  id: number;
  caption: string;
  platform: string;
  image_url: string;
  scheduled_for: string;
  status: string;
}

interface FactoryScreenProps {
  jwt: string | null;
  clientTier?: string;
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

export default function FactoryScreen({ jwt, clientTier }: FactoryScreenProps) {
  // Needs Review
  const [reviewPosts, setReviewPosts] = useState<ReviewPost[]>([]);
  // In Pipeline
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  // Styled pending (caption generation)
  const [styledPending, setStyledPending] = useState(0);
  // Scheduled
  const [scheduled, setScheduled] = useState<ScheduledPost[]>([]);
  // Stale items
  const [staleItems, setStaleItems] = useState<PipelineItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [postsUsed, setPostsUsed] = useState(0);
  const [postsLimit, setPostsLimit] = useState(12);
  const [slotsLimit, setSlotsLimit] = useState(30);
  const isInitialLoad = useRef(true);

  const loadFactory = useCallback(async () => {
    if (!jwt) return;
    if (isInitialLoad.current) setLoading(true);

    try {
      // Fetch gallery and content review in parallel
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

        // Pipeline items: processing in factory
        setPipelineItems(
          items.filter((img: PipelineItem) =>
            ["raw", "queued", "styling", "processing"].includes(img.status)
          )
        );

        // Styled but captioning
        setStyledPending(
          items.filter((img: PipelineItem) => img.status === "ready" || img.status === "styled").length
        );

        // Stale items
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
      console.error("Factory load error:", err);
    }

    if (isInitialLoad.current) {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [jwt]);

  useEffect(() => {
    loadFactory();
  }, [loadFactory]);

  // Adaptive polling: fast when busy, slow when idle
  useEffect(() => {
    const isBusy = pipelineItems.length > 0 || styledPending > 0;
    const interval = isBusy ? 5000 : 30000;
    const timer = setInterval(() => {
      if (!document.hidden) loadFactory();
    }, interval);
    return () => clearInterval(timer);
  }, [pipelineItems.length, styledPending, loadFactory]);

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
    } catch {
      // Upload failed silently
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleBulkApprove = async () => {
    if (reviewPosts.length === 0 || !jwt) return;
    try {
      const res = await fetch(`${API_BASE}/lobby/content-review/bulk-approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) loadFactory();
    } catch {
      // Fail silently
    }
  };

  const handleRetryStale = async () => {
    if (!jwt) return;
    for (const item of staleItems) {
      await fetch(`${API_BASE}/lobby/gallery/${item.id}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
    }
    loadFactory();
  };

  const isEmpty = reviewPosts.length === 0 && pipelineItems.length === 0 && styledPending === 0 && staleItems.length === 0;
  const budgetRatio = postsLimit > 0 ? postsUsed / postsLimit : 0;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-base)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Factory</h2>
        <div className="flex items-center gap-2">
          {reviewPosts.length > 1 && (
            <button
              onClick={handleBulkApprove}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95"
              style={{ background: "#4338CA", boxShadow: "0 2px 6px rgba(67,56,202,0.25)" }}
            >
              Approve All
            </button>
          )}
          <div
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)]"
            style={{
              color: budgetRatio >= 1 ? "#EF4444" : budgetRatio >= 0.8 ? "#F59E0B" : "var(--text-muted)",
              background: budgetRatio >= 1 ? "#FEE2E2" : budgetRatio >= 0.8 ? "#FEF3C7" : "var(--bg-surface)",
            }}
          >
            {postsUsed}/{postsLimit}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5 min-h-0">
        {/* ── Empty State ── */}
        {isEmpty && scheduled.length === 0 && (
          <div className="text-center py-16">
            <div className="w-32 mx-auto mb-4">
              <Image src="/images/gio/thumbs.png" alt="All caught up" width={128} height={192} className="w-full h-auto" />
            </div>
            <p className="text-base font-medium text-[var(--text-primary)]">All caught up!</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Upload photos to start creating content.</p>
          </div>
        )}

        {/* ── Stale Warning ── */}
        {staleItems.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  {staleItems.length} item{staleItems.length > 1 ? "s" : ""} got stuck
                </p>
                <p className="text-xs text-amber-700 mt-0.5">Something went wrong during processing.</p>
              </div>
              <button
                onClick={handleRetryStale}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 border border-amber-300 hover:bg-amber-100 transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ── Section 1: Needs Review ── */}
        {reviewPosts.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Needs Review</h3>
              <span className="text-xs font-semibold text-green-600 ml-auto">{reviewPosts.length}</span>
            </div>
            <div className="space-y-3">
              {reviewPosts.map((post) => (
                <ReviewCard
                  key={post.id}
                  post={post}
                  jwt={jwt}
                  onApproved={loadFactory}
                  onRejected={loadFactory}
                  onMessage={() => {}}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Section 2: In Pipeline ── */}
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

        {/* ── Section 3: Scheduled ── */}
        {scheduled.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Scheduled</h3>
              </div>
              {/* "View all" could navigate to Calendar tab — wired by AppShell later */}
            </div>
            <div className="space-y-1.5">
              {scheduled.map((post) => (
                <div key={post.id} className="flex items-center gap-3 p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl">
                  {/* Mini thumbnail */}
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
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5" className="flex-shrink-0 mt-0.5">
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">You&apos;ve used all {postsLimit} posts this month</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  New uploads will be saved for next month.
                  {clientTier === "spark" && " Upgrade to Pro to unlock more."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload button */}
      <div className="flex-shrink-0 p-4 bg-[var(--bg-base)] border-t border-[var(--border-subtle)]">
        <label
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-sm cursor-pointer transition-all active:scale-[0.98] text-white"
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
            </>
          )}
        </label>
      </div>
    </div>
  );
}
