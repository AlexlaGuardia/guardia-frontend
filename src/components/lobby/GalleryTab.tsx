"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ClientContext } from "./LobbyShell";
import PublishPreviewModal from "./PublishPreviewModal";

/**
 * GUARDIA GALLERY — Content Workbench
 *
 * Desert Mirage design language (LIGHT theme):
 * - Cream palette (#FAF6F1, #F0E8E0)
 * - Gold accent (#C9A227) for in-progress states
 * - Indigo CTAs (#4338CA) for primary actions
 * - Warm grays, soft shadows, grain texture
 *
 * Sections:
 * - Upload Review: new uploads needing confirmation
 * - Content Review: posts awaiting approval (image + caption + platform)
 * - Conveyor Belt: items being processed in factory
 *
 * Budget-aware: counter shows posts_used/posts_limit with tier-based colors
 */

const API_BASE = "https://api.guardiacontent.com";

// Deep compare gallery items to prevent unnecessary re-renders
function arraysEqual(a: GalleryImage[], b: GalleryImage[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].status !== b[i].status || a[i].styled_url !== b[i].styled_url) {
      return false;
    }
  }
  return true;
}

interface GalleryImage {
  url?: string;
  id: number;
  original_filename: string;
  status: "pending" | "styled" | "approved" | "rejected" | "processing" | "ready" | "failed" | "queued" | "raw" | "styling" | "pending_review" | "received" | "stale";
  styled_url?: string;
  original_url?: string;
  thumbnail_url?: string;
  uploaded_at: string;
  caption?: string;
}

interface ContentReviewPost {
  id: number;
  asset_id?: number;
  caption: string;
  hashtags: string;
  platform: string;
  image_url: string;
  mission_type: string;
  holiday?: string | null;
  source: "upload" | "ai_generated";
  created_at: string;
}

interface GalleryTabProps {
  client: ClientContext | null;
  jwt: string | null;
  onMessage: (msg: string) => void;
  onSwitchToGio?: (context?: string) => void;
}

// Status dot for section headers
function StatusDot({ active, color = "gold" }: { active: boolean; color?: "gold" | "green" | "gray" }) {
  const colors = {
    gold: "#C9A227",
    green: "#22c55e",
    gray: "#9CA3AF",
  };

  return (
    <div
      className={`w-2 h-2 rounded-full transition-all ${active ? "animate-pulse" : ""}`}
      style={{
        background: active ? colors[color] : "#D1D5DB",
        boxShadow: active ? `0 0 8px ${colors[color]}40` : "none",
      }}
    />
  );
}

// Image card for upload review section
function ImageCard({
  image,
  imageUrl,
  index,
  total,
  onRed,
  onGreen,
  redLabel,
  greenLabel,
  emptyIcon,
  emptyTitle,
  emptySubtitle
}: {
  image: GalleryImage | null;
  imageUrl?: string;
  index: number;
  total: number;
  onRed: () => void;
  onGreen: () => void;
  redLabel: string;
  greenLabel: string;
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptySubtitle: string;
}) {
  if (!image || total === 0) {
    return (
      <div className="rounded-xl p-6 text-center bg-[var(--bg-elevated)] border border-[var(--border)]">
        {emptyIcon}
        <p className="text-sm font-medium text-[var(--text-secondary)] mt-3">{emptyTitle}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Soft-shadow framed image */}
      <div className="relative mx-auto" style={{ maxWidth: 260 }}>
        <div
          className="rounded-xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border)]"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="aspect-square bg-[var(--bg-surface)]">
            {imageUrl ? (
              <img src={imageUrl} alt={image.original_filename || "image"} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="p-3 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate flex-1">{image.original_filename || "Image"}</p>
              <span className="text-xs text-[var(--text-muted)] ml-2">{index + 1}/{total}</span>
            </div>
            {image.caption && (
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2">{image.caption}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-3 mt-4">
        <button
          onClick={onRed}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 bg-[var(--bg-elevated)] border border-[var(--border)] text-red-600 hover:bg-red-50 hover:border-red-200"
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          {redLabel}
        </button>
        <button
          onClick={onGreen}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 text-white"
          style={{
            background: "#4338CA",
            boxShadow: "0 2px 8px rgba(67, 56, 202, 0.3)",
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          {greenLabel}
        </button>
      </div>
    </div>
  );
}

// Relative time helper
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

// Platform badge
function PlatformBadge({ platform }: { platform: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    facebook: { label: "FB", bg: "#E8F0FE", text: "#1877F2" },
    instagram: { label: "IG", bg: "#FCEEF5", text: "#E4405F" },
    tiktok: { label: "TT", bg: "#F0F0F0", text: "#000000" },
    linkedin: { label: "LI", bg: "#E8F4FD", text: "#0A66C2" },
    pinterest: { label: "PN", bg: "#FDE8E8", text: "#E60023" },
  };
  const c = config[platform] || { label: platform.slice(0, 2).toUpperCase(), bg: "#F3F4F6", text: "#6B7280" };

  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}

export default function GalleryTab({ client, jwt, onMessage, onSwitchToGio }: GalleryTabProps) {
  // Upload review (assets needing confirmation)
  const [uploadReview, setUploadReview] = useState<GalleryImage[]>([]);
  // Processing queue (assets being styled)
  const [inQueue, setInQueue] = useState<GalleryImage[]>([]);
  // Styled assets without posts yet (caption generation pending)
  const [styledPending, setStyledPending] = useState(0);
  // Content review (posts awaiting approval)
  const [contentReview, setContentReview] = useState<ContentReviewPost[]>([]);
  // Stale items (stuck in intermediate state >30 min)
  const [staleItems, setStaleItems] = useState<GalleryImage[]>([]);

  const [uploading, setUploading] = useState(false);
  const [recentUpload, setRecentUpload] = useState(false);
  const isInitialLoad = useRef(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [uploadReviewIndex, setUploadReviewIndex] = useState(0);
  const [contentReviewIndex, setContentReviewIndex] = useState(0);
  const [publishingAssetId, setPublishingAssetId] = useState<number | null>(null);

  // Style reactions state
  const [reactions, setReactions] = useState<Record<number, "loved" | "skipped">>({});
  const [reactingId, setReactingId] = useState<number | null>(null);
  const [heartPop, setHeartPop] = useState<number | null>(null);

  // Budget state
  const [postsUsed, setPostsUsed] = useState(0);
  const [postsLimit, setPostsLimit] = useState(12);
  const [slotsLimit, setSlotsLimit] = useState(30);

  const loadGallery = useCallback(async () => {
    if (!jwt) return;
    if (isInitialLoad.current) {
      setLoading(true);
    }
    try {
      const res = await fetch(`${API_BASE}/lobby/gallery`, { headers: { Authorization: `Bearer ${jwt}` } });
      if (!res.ok) { setLoadError(true); return; }
      setLoadError(false);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];

        // Budget data
        setPostsUsed(data.posts_used ?? 0);
        setPostsLimit(data.posts_limit ?? 12);
        setSlotsLimit(data.slots_limit ?? 30);

        // Upload Review: needs client confirmation
        const newUploadReview = items.filter((img: GalleryImage) =>
          img.status === "pending_review" || img.status === "received"
        );

        // In Queue: processing in factory (raw/queued/styling)
        const newInQueue = items.filter((img: GalleryImage) =>
          img.status === "raw" || img.status === "queued" || img.status === "styling" || img.status === "processing"
        );

        // Styled but no post yet (caption being generated)
        const styledItems = items.filter((img: GalleryImage) =>
          img.status === "ready" || img.status === "styled"
        );
        setStyledPending(styledItems.length);

        // Stale: items the backend flagged as stuck (>30 min in intermediate state)
        const newStaleItems = items.filter((img: GalleryImage) => img.status === "stale");
        setStaleItems(prev => arraysEqual(prev, newStaleItems) ? prev : newStaleItems);

        setUploadReview(prev => {
          if (arraysEqual(prev, newUploadReview)) return prev;
          // Clamp index if list shrank
          setUploadReviewIndex(i => Math.min(i, Math.max(0, newUploadReview.length - 1)));
          return newUploadReview;
        });
        setInQueue(prev => arraysEqual(prev, newInQueue) ? prev : newInQueue);
      }
    } catch (err) {
      console.error("Failed to load gallery:", err);
    }
    if (isInitialLoad.current) {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [jwt]);

  const loadContentReview = useCallback(async () => {
    if (!jwt) return;
    try {
      const res = await fetch(`${API_BASE}/lobby/content-review`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        const posts = data.posts || [];
        setContentReview((prev: ContentReviewPost[]) => {
          if (prev.length === posts.length && prev.every((p: ContentReviewPost, i: number) => p.id === posts[i]?.id)) return prev;
          // Clamp index if list shrank
          setContentReviewIndex(i => Math.min(i, Math.max(0, posts.length - 1)));
          return posts;
        });
      }
    } catch (err) {
      console.error("Failed to load content review:", err);
    }
  }, [jwt]);

  useEffect(() => { loadGallery(); loadContentReview(); }, [loadGallery, loadContentReview]);

  // Fast poll (3s) when items are actively processing, slow poll (30s) when idle
  useEffect(() => {
    const isBusy = inQueue.length > 0 || uploadReview.length > 0 || styledPending > 0 || recentUpload;
    const interval = isBusy ? 3000 : 30000;

    const pollTimer = setInterval(() => {
      if (!document.hidden) {
        loadGallery();
        loadContentReview();
      }
    }, interval);

    return () => clearInterval(pollTimer);
  }, [inQueue.length, uploadReview.length, styledPending, recentUpload, loadGallery, loadContentReview]);

  useEffect(() => {
    if (!recentUpload) return;
    const timeout = setTimeout(() => setRecentUpload(false), 30000);
    return () => clearTimeout(timeout);
  }, [recentUpload]);

  // ── Upload Review Actions ──

  const handleDiscardUpload = async () => {
    if (uploadReview.length === 0) return;
    const img = uploadReview[uploadReviewIndex];
    try {
      const res = await fetch(`${API_BASE}/lobby/gallery/${img.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        setUploadReview(items => items.filter((_, i) => i !== uploadReviewIndex));
        setUploadReviewIndex(i => Math.min(i, Math.max(0, uploadReview.length - 2)));
        onMessage(`Discarded "${img.original_filename || 'image'}".`);
      } else {
        onMessage(data.message || "Couldn't discard. Try again?");
      }
    } catch {
      onMessage("Had trouble with that. Let's try again.");
    }
  };

  const handleSendToFactory = async () => {
    if (uploadReview.length === 0 || !jwt) return;
    const img = uploadReview[uploadReviewIndex];
    try {
      const res = await fetch(`${API_BASE}/lobby/gallery/${img.id}/send-to-factory`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        onMessage(data.message || "Sent to polish! Check the queue below.");
      } else {
        onMessage(data.message || "Couldn't send to factory. Try again?");
      }
      loadGallery();
    } catch (err) {
      console.error("Send to factory error:", err);
      onMessage("Something went wrong. Let's try that again.");
    }
  };

  // ── Content Review Actions ──

  const handleApprovePost = async () => {
    if (contentReview.length === 0 || !jwt) return;
    const post = contentReview[contentReviewIndex];
    try {
      const res = await fetch(`${API_BASE}/lobby/content-review/${post.id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        setContentReview(items => items.filter((_, i) => i !== contentReviewIndex));
        setContentReviewIndex(i => Math.min(i, Math.max(0, contentReview.length - 2)));
        onMessage("Approved! Scheduling shortly.");
      }
    } catch {
      onMessage("Had trouble approving. Let's try again.");
    }
  };

  const handleRejectPost = async () => {
    if (contentReview.length === 0 || !jwt) return;
    const post = contentReview[contentReviewIndex];
    try {
      const res = await fetch(`${API_BASE}/lobby/content-review/${post.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        setContentReview(items => items.filter((_, i) => i !== contentReviewIndex));
        setContentReviewIndex(i => Math.min(i, Math.max(0, contentReview.length - 2)));
        onMessage("Post removed.");
      }
    } catch {
      onMessage("Had trouble with that. Let's try again.");
    }
  };

  const handleReaction = async (assetId: number | undefined, reaction: "loved" | "skipped") => {
    if (!assetId || contentReview.length === 0 || !jwt) return;
    const post = contentReview[contentReviewIndex];
    setReactingId(assetId);
    if (reaction === "loved") {
      setHeartPop(assetId);
      setTimeout(() => setHeartPop(null), 600);
    }
    try {
      // Record style reaction (non-blocking)
      fetch(`${API_BASE}/approval/review/${assetId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction }),
      }).then(res => {
        if (res.ok) setReactions(prev => ({ ...prev, [assetId]: reaction }));
      }).catch(() => {});

      // Love = approve, Skip = reject
      const action = reaction === "loved" ? "approve" : "reject";
      const res = await fetch(`${API_BASE}/lobby/content-review/${post.id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        setContentReview(items => items.filter((_, i) => i !== contentReviewIndex));
        setContentReviewIndex(i => Math.min(i, Math.max(0, contentReview.length - 2)));
        onMessage(reaction === "loved" ? "Approved! Scheduling shortly." : "Skipped — we'll try a different style.");
      }
    } catch {
      onMessage("Had trouble with that. Let's try again.");
    } finally {
      setReactingId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (contentReview.length === 0 || !jwt) return;
    try {
      const res = await fetch(`${API_BASE}/lobby/content-review/bulk-approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        setContentReview([]);
        setContentReviewIndex(0);
        onMessage(`Approved ${data.approved_count} post${data.approved_count > 1 ? "s" : ""}!`);
      }
    } catch {
      onMessage("Had trouble with bulk approve. Try again?");
    }
  };

  const handleRetryStale = async (items: GalleryImage[]) => {
    if (!jwt) return;
    for (const item of items) {
      await fetch(`${API_BASE}/lobby/gallery/${item.id}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
    }
    onMessage("Sent back to the factory!");
    loadGallery();
  };

  const handleDiscardStale = async (items: GalleryImage[]) => {
    if (!jwt) return;
    for (const item of items) {
      await fetch(`${API_BASE}/lobby/gallery/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
      });
    }
    onMessage("Cleared!");
    loadGallery();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !jwt) return;
    const totalQueue = uploadReview.length + inQueue.length + styledPending + contentReview.length;
    if (totalQueue >= slotsLimit) {
      onMessage(`Queue is full (${slotsLimit} max). Approve or discard items to make room.`);
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/lobby/gallery/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        onMessage(`Uploaded "${file.name}"! Review it below.`);
        setRecentUpload(true);
        loadGallery();
      }
      else { onMessage(data.message || "Upload failed."); }
    } catch { onMessage("Upload failed."); }
    setUploading(false);
    e.target.value = "";
  };

  // Content Review empty state
  const getContentReviewEmpty = () => {
    if (staleItems.length > 0) {
      return {
        title: `${staleItems.length} item${staleItems.length > 1 ? "s" : ""} got stuck`,
        subtitle: "Something went wrong during processing",
        icon: (
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.5" className="mx-auto">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        ),
        stale: true,
      };
    }
    if (styledPending > 0) {
      return {
        title: "Generating captions...",
        subtitle: `${styledPending} styled image${styledPending > 1 ? "s" : ""} being prepared`,
        icon: (
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="1.5" className="mx-auto">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        ),
      };
    }
    if (inQueue.length > 0) {
      return {
        title: "Polishing in progress",
        subtitle: `${inQueue.length} item${inQueue.length > 1 ? "s" : ""} in the factory`,
        icon: (
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="1.5" className="mx-auto">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        ),
      };
    }
    if (uploadReview.length > 0) {
      return {
        title: "Review your uploads first",
        subtitle: "Approve them above to start polishing",
        icon: (
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" className="mx-auto">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/>
          </svg>
        ),
      };
    }
    return {
      title: "All caught up!",
      subtitle: "Upload images to get started",
      icon: (
        <svg width={32} height={32} viewBox="0 0 24 24" fill="#22c55e" className="mx-auto" opacity="0.4">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
    };
  };

  const currentUploadReview = uploadReview[uploadReviewIndex];
  const currentPost = contentReview[contentReviewIndex];

  // Budget display
  const budgetRatio = postsLimit > 0 ? postsUsed / postsLimit : 0;
  const budgetColor = budgetRatio >= 1 ? "#EF4444" : budgetRatio >= 0.8 ? "#F59E0B" : "var(--text-muted)";
  const budgetBg = budgetRatio >= 1 ? "#FEE2E2" : budgetRatio >= 0.8 ? "#FEF3C7" : "var(--bg-surface)";
  const isCapReached = postsUsed >= postsLimit;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-base)]">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError && uploadReview.length === 0 && contentReview.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--bg-base)] gap-3 px-6">
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
        <p className="text-sm text-[var(--text-secondary)] text-center">Couldn&apos;t load gallery</p>
        <button
          onClick={() => { setLoadError(false); loadGallery(); loadContentReview(); }}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-base)] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Gallery</h2>
        <div className="flex items-center gap-2">
          <label
            className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm cursor-pointer transition-all active:scale-95 text-white"
            style={{
              background: "#4338CA",
              boxShadow: "0 2px 8px rgba(67, 56, 202, 0.3)",
            }}
          >
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.heic" onChange={handleUpload} className="hidden" disabled={uploading} />
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {uploading ? "..." : "Add"}
          </label>
          {/* Budget counter */}
          <div
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)]"
            style={{ background: budgetBg, color: budgetColor }}
          >
            {postsUsed}/{postsLimit}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

        {/* ═══════════════════════════════════════════════════════════════════
            UPLOAD REVIEW — New uploads needing confirmation
        ═══════════════════════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border)]"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <StatusDot active={uploadReview.length > 0} color="gold" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Upload Review</h3>
            </div>
            {uploadReview.length > 0 && (
              <span className="text-xs font-semibold" style={{ color: "#C9A227" }}>{uploadReview.length}</span>
            )}
          </div>

          <div className="p-4">
            <ImageCard
              image={currentUploadReview}
              imageUrl={currentUploadReview?.url || currentUploadReview?.thumbnail_url}
              index={uploadReviewIndex}
              total={uploadReview.length}
              onRed={handleDiscardUpload}
              onGreen={handleSendToFactory}
              redLabel="Discard"
              greenLabel="Polish It"
              emptyIcon={
                <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" className="mx-auto">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M12 8v8M8 12h8"/>
                </svg>
              }
              emptyTitle="Nothing to review"
              emptySubtitle="Upload images to get started"
            />

            {uploadReview.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-4">
                {uploadReview.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setUploadReviewIndex(i)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      background: i === uploadReviewIndex ? '#C9A227' : '#D1D5DB',
                      boxShadow: i === uploadReviewIndex ? '0 0 6px rgba(201,162,39,0.4)' : 'none'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CONTENT REVIEW — Posts awaiting client approval
        ═══════════════════════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border)]"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          {/* Content Review Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <StatusDot
                active={contentReview.length > 0 || inQueue.length > 0 || styledPending > 0}
                color={contentReview.length > 0 ? "green" : "gold"}
              />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Content Review</h3>
            </div>
            <div className="flex items-center gap-2">
              {contentReview.length > 1 && (
                <button
                  onClick={handleBulkApprove}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 text-white"
                  style={{
                    background: "#4338CA",
                    boxShadow: "0 2px 6px rgba(67, 56, 202, 0.25)",
                  }}
                >
                  Approve All
                </button>
              )}
              {contentReview.length > 0 && (
                <span className="text-xs font-semibold text-green-600">{contentReview.length} ready</span>
              )}
              {contentReview.length === 0 && staleItems.length > 0 && inQueue.length === 0 && styledPending === 0 && (
                <span className="text-xs font-semibold" style={{ color: "#B45309" }}>{staleItems.length} stuck</span>
              )}
              {contentReview.length === 0 && (inQueue.length > 0 || styledPending > 0) && (
                <span className="text-xs text-[var(--text-muted)]">
                  {inQueue.length > 0 ? `${inQueue.length} processing` : `${styledPending} captioning`}
                </span>
              )}
            </div>
          </div>

          {/* Post Preview */}
          <div className="p-4">
            {contentReview.length > 0 && currentPost ? (
              <div>
                {/* Post card with image + caption */}
                <div className="relative mx-auto" style={{ maxWidth: 300 }}>
                  <div
                    className="rounded-xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border)]"
                    style={{ boxShadow: "var(--shadow-soft)" }}
                  >
                    {/* Image */}
                    <div className="aspect-square bg-[var(--bg-surface)] relative overflow-hidden">
                      {currentPost.image_url ? (
                        <img src={currentPost.image_url} alt="Post preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
                        </div>
                      )}
                      {/* Heart pop animation on love */}
                      {heartPop === currentPost.asset_id && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg
                            width={64} height={64} viewBox="0 0 24 24" fill="#e74c6f" stroke="none"
                            className="animate-[heartPop_0.5s_ease-out_forwards] opacity-0"
                            style={{ filter: "drop-shadow(0 2px 8px rgba(231,76,111,0.4))" }}
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Caption + meta */}
                    <div className="p-3 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <PlatformBadge platform={currentPost.platform} />
                          {currentPost.holiday && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              {currentPost.holiday}
                            </span>
                          )}
                          {currentPost.source === "ai_generated" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-violet-50 text-violet-600">
                              AI Generated
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{contentReviewIndex + 1}/{contentReview.length}</span>
                      </div>
                      {currentPost.caption && (
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-4 leading-relaxed">
                          {currentPost.caption}
                        </p>
                      )}
                      {currentPost.hashtags && (
                        <p className="text-[10px] text-[var(--text-muted)] mt-1.5 line-clamp-2">
                          {currentPost.hashtags}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Style reaction buttons */}
                {currentPost.asset_id && (
                  <div className="flex justify-center gap-2.5 mt-3 mx-auto" style={{ maxWidth: 320 }}>
                    {(() => {
                      const r = reactions[currentPost.asset_id!];
                      const isLoving = reactingId === currentPost.asset_id;
                      return (
                        <>
                          <button
                            onClick={() => handleReaction(currentPost.asset_id, "loved")}
                            disabled={isLoving}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
                              r === "loved"
                                ? "bg-pink-50 border-2 border-pink-300 text-pink-600 shadow-sm"
                                : r === "skipped"
                                ? "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] opacity-40"
                                : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-pink-300 hover:text-pink-600 hover:shadow-sm"
                            }`}
                          >
                            <svg width={14} height={14} viewBox="0 0 24 24" fill={r === "loved" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            Love it
                          </button>
                          <button
                            onClick={() => handleReaction(currentPost.asset_id, "skipped")}
                            disabled={isLoving}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
                              r === "skipped"
                                ? "bg-[var(--parchment)] border-2 border-[var(--warmgray)] text-[var(--warmgray)] shadow-sm"
                                : r === "loved"
                                ? "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] opacity-40"
                                : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--warmgray)] hover:text-[var(--warmgray)] hover:shadow-sm"
                            }`}
                          >
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M9 18l6-6-6-6"/>
                            </svg>
                            Skip
                          </button>
                        </>
                      );
                    })()}
                  </div>
                )}


                {/* Arrow navigation */}
                {contentReview.length > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-4">
                    <button
                      onClick={() => setContentReviewIndex(i => Math.max(0, i - 1))}
                      disabled={contentReviewIndex === 0}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 bg-[var(--bg-surface)] border border-[var(--border)] disabled:opacity-30"
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                    </button>
                    <span className="text-xs text-[var(--text-muted)] tabular-nums">
                      {contentReviewIndex + 1} / {contentReview.length}
                    </span>
                    <button
                      onClick={() => setContentReviewIndex(i => Math.min(contentReview.length - 1, i + 1))}
                      disabled={contentReviewIndex === contentReview.length - 1}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 bg-[var(--bg-surface)] border border-[var(--border)] disabled:opacity-30"
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Empty content review — contextual message */
              (() => {
                const empty = getContentReviewEmpty();
                return (
                  <div className="rounded-xl p-6 text-center bg-[var(--bg-elevated)] border border-[var(--border)]">
                    {empty.icon}
                    <p className="text-sm font-medium text-[var(--text-secondary)] mt-3">{empty.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{empty.subtitle}</p>
                    {"stale" in empty && (
                      <div className="flex gap-2 justify-center mt-4">
                        <button
                          onClick={() => handleRetryStale(staleItems)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95"
                          style={{ background: "rgba(180, 83, 9, 0.1)", color: "#B45309", border: "1px solid rgba(180, 83, 9, 0.2)" }}
                        >
                          Retry
                        </button>
                        <button
                          onClick={() => handleDiscardStale(staleItems)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95"
                          style={{ background: "rgba(220, 38, 38, 0.1)", color: "#DC2626", border: "1px solid rgba(220, 38, 38, 0.2)" }}
                        >
                          Discard
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>

          {/* Divider */}
          {inQueue.length > 0 && <div className="border-t border-[var(--border)]" />}

          {/* BOTTOM ZONE: Conveyor Belt */}
          {inQueue.length > 0 && (
            <div className="px-3 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A227] animate-pulse" />
                <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Processing</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollSnapType: "x mandatory" }}>
                {inQueue.map((img) => {
                  const isProcessing = img.status === "styling" || img.status === "processing";
                  return (
                    <div
                      key={img.id}
                      className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden relative"
                      style={{
                        scrollSnapAlign: "start",
                        border: isProcessing ? "2px solid #C9A227" : "1px solid var(--border)",
                        boxShadow: isProcessing ? "0 0 12px rgba(201,162,39,0.4)" : "none",
                      }}
                    >
                      {(img.url || img.thumbnail_url) ? (
                        <img src={img.url || img.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[var(--bg-base)] flex items-center justify-center">
                          <div className="w-3 h-3 border border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
                        </div>
                      )}
                      {isProcessing && (
                        <div
                          className="absolute inset-0 rounded-lg animate-pulse pointer-events-none"
                          style={{ background: "rgba(201,162,39,0.08)" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Budget warning banner */}
        {isCapReached && contentReview.length === 0 && (
          <div
            className="rounded-2xl p-4 border border-amber-200"
            style={{ background: "#FFFBEB" }}
          >
            <div className="flex items-start gap-3">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5" className="flex-shrink-0 mt-0.5">
                <path d="M12 9v4M12 17h.01"/>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  You&apos;ve used all {postsLimit} posts this month
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  New uploads will be saved for next month.
                  {client?.tier === "spark" && " Upgrade to Pro to unlock more."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Publish modal */}
      {publishingAssetId && (
        <PublishPreviewModal
          assetId={publishingAssetId}
          jwt={jwt}
          onClose={() => setPublishingAssetId(null)}
          onPublished={() => { loadGallery(); loadContentReview(); }}
        />
      )}
    </div>
  );
}
