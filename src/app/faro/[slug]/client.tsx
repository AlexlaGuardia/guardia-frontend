"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.guardiacontent.com";

interface Props {
  slug: string;
  blockId: string;
  type: "link" | "email";
  children: ReactNode;
}

function trackEvent(slug: string, eventType: string, blockId?: string) {
  fetch(`${API_BASE}/faro/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug,
      event_type: eventType,
      block_id: blockId,
    }),
  }).catch(() => {});
}

export default function FaroPageClient({ slug, blockId, type, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  // Track page view once
  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackEvent(slug, "page_view");
    }
  }, [slug]);

  useEffect(() => {
    if (!ref.current) return;

    if (type === "link") {
      const link = ref.current.querySelector("a");
      if (link) {
        const handler = () => trackEvent(slug, "link_click", blockId);
        link.addEventListener("click", handler);
        return () => link.removeEventListener("click", handler);
      }
    }

    if (type === "email") {
      const form = ref.current.querySelector("[data-faro-email-form]");
      if (form) {
        const handler = async (e: Event) => {
          e.preventDefault();
          const input = form.querySelector("input[name=email]") as HTMLInputElement;
          const button = form.querySelector("button") as HTMLButtonElement;
          if (!input?.value) return;

          button.textContent = "...";
          button.disabled = true;

          try {
            await fetch(`${API_BASE}/faro/capture-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug, email: input.value }),
            });
            trackEvent(slug, "email_submit", blockId);
            input.value = "";
            button.textContent = "Subscribed!";
            setTimeout(() => {
              button.textContent = "Subscribe";
              button.disabled = false;
            }, 2000);
          } catch {
            button.textContent = "Try again";
            button.disabled = false;
          }
        };
        form.addEventListener("submit", handler);
        return () => form.removeEventListener("submit", handler);
      }
    }
  }, [slug, blockId, type]);

  return <div ref={ref}>{children}</div>;
}

interface LinkedPost {
  id: number;
  platform: string;
  caption: string | null;
  post_url: string | null;
  posted_at: string | null;
  image_url: string | null;
}

export function FaroLinkedPosts({ slug }: { slug: string }) {
  const [posts, setPosts] = useState<LinkedPost[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/faro/public/${slug}/posts`)
      .then(r => r.ok ? r.json() : { posts: [] })
      .then(d => setPosts(d.posts || []))
      .catch(() => {});
  }, [slug]);

  if (posts.length === 0) return null;

  return (
    <div className="faro-linked-posts">
      <div className="faro-linked-posts-label">Recent Posts</div>
      <div className="faro-linked-posts-grid">
        {posts.map(post => (
          <a
            key={post.id}
            href={post.post_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="faro-linked-post"
          >
            {post.image_url ? (
              <img src={post.image_url} alt="" className="faro-linked-post-img" />
            ) : (
              <div className="faro-linked-post-placeholder" />
            )}
            <div className="faro-linked-post-platform">{post.platform}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
