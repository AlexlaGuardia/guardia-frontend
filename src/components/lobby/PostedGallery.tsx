"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FileText } from "lucide-react";

const API_BASE = "https://api.guardiacontent.com";

interface PostedItem {
  id: number;
  caption: string | null;
  platform: string;
  posted_at: string;
  post_url: string | null;
  image_url: string | null;
  image_full: string | null;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
}

interface PostedGalleryProps {
  jwt: string | null;
  onSelectPost: (postId: number) => void;
  onOpenFactory: () => void;
}

export default function PostedGallery({ jwt, onSelectPost, onOpenFactory }: PostedGalleryProps) {
  const [posts, setPosts] = useState<PostedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!jwt) return;
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/lobby/posted?limit=50`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
          setTotal(data.total || 0);
          setHasMore(data.has_more || false);
        }
      } catch (err) {
        console.error("Failed to fetch posted content:", err);
      }
      setLoading(false);
    };
    fetchPosts();
  }, [jwt]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const platformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case "instagram":
        return (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C16.67.014 16.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-[var(--text-primary)] font-medium mb-1">No posts yet</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Upload images and schedule your first post to see them here.
          </p>
          <button
            onClick={onOpenFactory}
            className="px-4 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded-xl hover:bg-[var(--accent-hover)] transition-colors"
          >
            Open Factory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[var(--text-primary)] font-medium">Your Posts</h2>
          <p className="text-sm text-[var(--text-muted)]">{total} published</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => onSelectPost(post.id)}
            className="group relative aspect-square rounded-xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/30 transition-all hover:shadow-[var(--shadow-soft)] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)]"
          >
            {/* Image or text-only fallback */}
            {post.image_url ? (
              <Image
                src={post.image_url}
                alt={post.caption || "Posted content"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-[var(--bg-surface)]">
                <FileText className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                {post.caption && (
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-4 text-center leading-relaxed">{post.caption}</p>
                )}
              </div>
            )}

            {/* Hover overlay with metrics */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-end">
              <div className="w-full p-2.5 translate-y-full group-hover:translate-y-0 transition-transform">
                {/* Metrics row */}
                <div className="flex items-center gap-3 text-white/90 text-xs mb-1">
                  {post.likes > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      {post.likes}
                    </span>
                  )}
                  {post.comments > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      {post.comments}
                    </span>
                  )}
                  {post.shares > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      {post.shares}
                    </span>
                  )}
                </div>
                {/* Caption preview */}
                {post.caption && (
                  <p className="text-white/80 text-xs line-clamp-2 leading-relaxed">{post.caption}</p>
                )}
              </div>
            </div>

            {/* Platform badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/90">
              {platformIcon(post.platform)}
              <span className="text-[10px] font-medium">{formatDate(post.posted_at)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              if (!jwt || loadingMore) return;
              setLoadingMore(true);
              try {
                const newOffset = posts.length;
                const res = await fetch(`${API_BASE}/lobby/posted?limit=50&offset=${newOffset}`, {
                  headers: { Authorization: `Bearer ${jwt}` },
                });
                if (res.ok) {
                  const data = await res.json();
                  setPosts(prev => [...prev, ...(data.posts || [])]);
                  setHasMore(data.has_more || false);
                }
              } catch (err) {
                console.error("Failed to load more:", err);
              }
              setLoadingMore(false);
            }}
            disabled={loadingMore}
            className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
