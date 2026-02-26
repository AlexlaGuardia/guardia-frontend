"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import PostCard, { PostedItem } from "./PostCard";
import type { Screen } from "./TopBar";

const API_BASE = "https://api.guardiacontent.com";
const PAGE_SIZE = 20;

interface FeedScreenProps {
  jwt: string | null;
  onPostSelect: (post: PostedItem) => void;
  onNavigate?: (screen: Screen) => void;
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden animate-pulse">
      <div className="w-full aspect-[4/3] bg-[var(--bg-surface)]" />
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

export default function FeedScreen({ jwt, onPostSelect, onNavigate }: FeedScreenProps) {
  const [posts, setPosts] = useState<PostedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPosts = useCallback(async (offset: number, append: boolean) => {
    if (!jwt) return;
    if (append) setLoadingMore(true); else setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/lobby/posted?limit=${PAGE_SIZE}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        const newPosts: PostedItem[] = data.posts || [];
        setPosts((prev) => append ? [...prev, ...newPosts] : newPosts);
        setHasMore(data.has_more || false);
      }
    } catch {
      console.error("Failed to load posts");
    }

    if (append) setLoadingMore(false); else setLoading(false);
  }, [jwt]);

  useEffect(() => {
    loadPosts(0, false);
  }, [loadPosts]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadPosts(posts.length, true);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-24 xl:pb-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 flex flex-col items-center text-center">
        <Image
          src="/images/gio/wave.png"
          alt="Giovanni"
          width={80}
          height={80}
          className="rounded-2xl mb-4"
        />
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No posts yet</h3>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Upload some photos and we&apos;ll handle the rest — styled, captioned, and posted.
        </p>
        {onNavigate && (
          <button
            onClick={() => onNavigate("factory")}
            className="px-6 py-2.5 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-hover)] transition-all"
          >
            Go to Factory
          </button>
        )}
      </div>
    );
  }

  // Feed
  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-24 xl:pb-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onClick={() => onPostSelect(post)} />
      ))}

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
    </div>
  );
}
