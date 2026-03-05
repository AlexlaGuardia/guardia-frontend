"use client";

import { useState, useCallback } from "react";

/**
 * ReviewCard — Content awaiting client approval
 * Shows styled image + caption + platform + approve/edit actions.
 * Used in FactoryScreen "Needs Review" section.
 */

const API_BASE = "https://api.guardiacontent.com";

export interface ReviewPost {
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

interface ReviewCardProps {
  post: ReviewPost;
  jwt: string | null;
  onApproved: () => void;
  onRejected: () => void;
  onMessage: (msg: string) => void;
}

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
    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide" style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ReviewCard({ post, jwt, onApproved, onRejected, onMessage }: ReviewCardProps) {
  const [acting, setActing] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);

  const handleApprove = async () => {
    if (!jwt || acting) return;
    setActing(true);
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 600);

    try {
      // Record style reaction (non-blocking)
      if (post.asset_id) {
        fetch(`${API_BASE}/approval/review/${post.asset_id}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reaction: "loved" }),
        }).catch(() => {});
      }

      const res = await fetch(`${API_BASE}/lobby/content-review/${post.id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        const platformName = post.platform === 'facebook' ? 'Facebook' : post.platform === 'instagram' ? 'Instagram' : post.platform;
        onMessage(`Approved! Scheduling to ${platformName}.`);
        onApproved();
      }
    } catch {
      onMessage("Had trouble approving. Let's try again.");
    }
    setActing(false);
  };

  const handleReject = async () => {
    if (!jwt || acting) return;
    setActing(true);

    try {
      if (post.asset_id) {
        fetch(`${API_BASE}/approval/review/${post.asset_id}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reaction: "skipped" }),
        }).catch(() => {});
      }

      const res = await fetch(`${API_BASE}/lobby/content-review/${post.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        onMessage("Skipped — we'll try a different style.");
        onRejected();
      }
    } catch {
      onMessage("Had trouble with that. Let's try again.");
    }
    setActing(false);
  };

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* Image */}
      <div className="aspect-square bg-[var(--bg-surface)] relative overflow-hidden">
        {post.image_url && !imgError ? (
          <img src={post.image_url} alt="Post preview" className="w-full h-full object-cover" onError={handleImgError} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg-elevated)] gap-2">
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            {imgError && post.image_url && (
              <button
                onClick={() => setImgError(false)}
                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        )}
        {/* Heart pop */}
        {heartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              width={64} height={64} viewBox="0 0 24 24" fill="#e74c6f" stroke="none"
              className="animate-ping opacity-70"
              style={{ filter: "drop-shadow(0 2px 8px rgba(231,76,111,0.4))" }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5 mb-1.5">
          <PlatformBadge platform={post.platform} />
          <span className="text-[10px] text-[var(--text-secondary)]">
            Publishing to {post.platform === 'facebook' ? 'Facebook' : post.platform === 'instagram' ? 'Instagram' : post.platform}
          </span>
          {post.holiday && (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              {post.holiday}
            </span>
          )}
          {post.source === "ai_generated" && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-violet-50 text-violet-600">AI</span>
          )}
          <span className="text-[10px] text-[var(--text-muted)] ml-auto">{timeAgo(post.created_at)}</span>
        </div>
        {post.caption && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">{post.caption}</p>
        )}
        {post.hashtags && (
          <p className="text-[10px] text-[var(--text-muted)] mt-1 line-clamp-1">{post.hashtags}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex border-t border-[var(--border)]">
        <button
          onClick={handleReject}
          disabled={acting}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50/50 transition-all disabled:opacity-50 border-r border-[var(--border)]"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
          Skip
        </button>
        <button
          onClick={handleApprove}
          disabled={acting}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-[#4338CA] hover:bg-indigo-500/10 transition-all disabled:opacity-50"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          Approve
        </button>
      </div>
    </div>
  );
}
