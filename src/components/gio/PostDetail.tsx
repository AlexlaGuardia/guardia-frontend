"use client";

import Image from "next/image";
import { ChevronLeft, Heart, MessageCircle, Share2, Eye, ExternalLink } from "lucide-react";
import type { PostedItem } from "./PostCard";

interface PostDetailProps {
  post: PostedItem | null;
  onBack: () => void;
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-xl p-3 flex flex-col items-center gap-1">
      <div className="text-[var(--text-muted)]">{icon}</div>
      <span className="text-xl font-semibold text-[var(--text-primary)]">{value}</span>
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
  };
  return labels[platform] || platform;
}

export default function PostDetail({ post, onBack }: PostDetailProps) {
  if (!post) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-[var(--text-muted)]">Post not found</p>
        <button onClick={onBack} className="mt-4 text-[var(--accent)] text-sm font-medium">
          Back to Feed
        </button>
      </div>
    );
  }

  const postedDate = new Date(post.posted_at).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-4 pb-24 xl:pb-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium text-[var(--accent)] mb-4 hover:underline"
      >
        <ChevronLeft size={18} />
        Feed
      </button>

      {/* Image */}
      {post.image_url && (
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[var(--bg-surface)] mb-4">
          <Image
            src={post.image_full || post.image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 560px"
          />
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard icon={<Heart size={18} />} value={post.likes} label="Likes" />
        <StatCard icon={<MessageCircle size={18} />} value={post.comments} label="Comments" />
        <StatCard icon={<Share2 size={18} />} value={post.shares} label="Shares" />
        <StatCard icon={<Eye size={18} />} value={post.reach} label="Reach" />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-4 text-sm text-[var(--text-muted)]">
        <span className="capitalize font-medium text-[var(--text-secondary)]">{platformLabel(post.platform)}</span>
        <span>|</span>
        <span>{postedDate}</span>
        {post.post_url && (
          <>
            <span>|</span>
            <a
              href={post.post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[var(--accent)] hover:underline"
            >
              View post <ExternalLink size={12} />
            </a>
          </>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4">
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
            {post.caption}
          </p>
        </div>
      )}
    </div>
  );
}
