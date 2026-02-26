"use client";

import { useEffect, useRef, ReactNode } from "react";

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
