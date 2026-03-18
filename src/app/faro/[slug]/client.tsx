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

/* ── Shop (Digital Products) ──────────────────────────────── */

interface ShopProduct {
  id: number;
  name: string;
  description: string | null;
  price_cents: number;
  price_display: string;
  file_name: string;
}

interface PurchaseInfo {
  found: boolean;
  download_token?: string;
  product_name?: string;
  file_name?: string;
  downloads_used?: number;
  downloads_max?: number;
}

export function FaroShop({ slug }: { slug: string }) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [buying, setBuying] = useState<number | null>(null);
  const [purchase, setPurchase] = useState<PurchaseInfo | null>(null);

  // Fetch products
  useEffect(() => {
    fetch(`${API_BASE}/faro/shop/${slug}`)
      .then(r => r.ok ? r.json() : { products: [] })
      .then(d => setProducts(d.products || []))
      .catch(() => {});
  }, [slug]);

  // Check for post-purchase redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;

    let attempts = 0;
    const poll = () => {
      fetch(`${API_BASE}/faro/shop/purchase/lookup?session_id=${sessionId}`)
        .then(r => r.json())
        .then((data: PurchaseInfo) => {
          if (data.found) {
            setPurchase(data);
            // Clean URL
            window.history.replaceState({}, "", window.location.pathname);
          } else if (attempts < 5) {
            attempts++;
            setTimeout(poll, 2000);
          }
        })
        .catch(() => {});
    };
    poll();
  }, []);

  const handleBuy = async (productId: number) => {
    setBuying(productId);
    try {
      const res = await fetch(`${API_BASE}/faro/shop/${productId}/checkout`, { method: "POST" });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch {
      setBuying(null);
    }
  };

  if (products.length === 0 && !purchase) return null;

  return (
    <div className="faro-shop">
      {/* Purchase success banner */}
      {purchase?.found && (
        <div className="faro-shop-success">
          <div className="faro-shop-success-title">Purchase complete!</div>
          <div className="faro-shop-success-detail">
            {purchase.product_name} — {purchase.file_name}
          </div>
          <a
            href={`${API_BASE}/faro/download/${purchase.download_token}`}
            className="faro-shop-download-btn"
          >
            Download ({purchase.downloads_max! - purchase.downloads_used!} remaining)
          </a>
        </div>
      )}

      {products.length > 0 && (
        <>
          <div className="faro-shop-label">Shop</div>
          <div className="faro-shop-grid">
            {products.map(product => (
              <div key={product.id} className="faro-shop-card">
                <div className="faro-shop-card-body">
                  <div className="faro-shop-card-name">{product.name}</div>
                  {product.description && (
                    <div className="faro-shop-card-desc">{product.description}</div>
                  )}
                  <div className="faro-shop-card-file">{product.file_name}</div>
                </div>
                <div className="faro-shop-card-footer">
                  <span className="faro-shop-card-price">{product.price_display}</span>
                  <button
                    onClick={() => handleBuy(product.id)}
                    disabled={buying !== null}
                    className="faro-shop-card-buy"
                  >
                    {buying === product.id ? "..." : "Buy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Linked Posts ─────────────────────────────────────────── */

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
