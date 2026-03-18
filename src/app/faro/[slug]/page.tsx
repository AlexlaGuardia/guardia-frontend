import { Metadata } from "next";
import { notFound } from "next/navigation";
import "../themes.css";
import FaroPageClient from "./client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.guardiacontent.com";

interface FaroBlock {
  id: string;
  type: "link" | "header" | "social" | "email_capture" | "text";
  title: string | null;
  url: string | null;
  icon: string | null;
  sort_order: number;
  settings: string | null;
}

interface FaroPage {
  id: string;
  slug: string;
  custom_domain: string | null;
  theme: string;
  profile_image_url: string | null;
  display_name: string | null;
  bio: string | null;
  settings: string | null;
  is_published: number;
}

interface PageData {
  page: FaroPage;
  blocks: FaroBlock[];
}

async function getPageData(slug: string): Promise<PageData | null> {
  try {
    const res = await fetch(`${API_BASE}/faro/public/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPageData(slug);
  if (!data) return { title: "Page Not Found" };

  const name = data.page.display_name || slug;
  const bio = data.page.bio || "";

  return {
    title: `${name} | Guardia`,
    description: bio.slice(0, 160) || `${name} on Guardia`,
    openGraph: {
      title: name,
      description: bio.slice(0, 160) || `${name} on Guardia`,
      type: "profile",
      url: `https://guardiacontent.com/faro/${slug}`,
      ...(data.page.profile_image_url && {
        images: [{ url: data.page.profile_image_url }],
      }),
    },
    twitter: {
      card: "summary",
      title: name,
      description: bio.slice(0, 160) || `${name} on Guardia`,
    },
  };
}

export default async function FaroPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPageData(slug);
  if (!data) notFound();

  const { page, blocks } = data;
  const theme = page.theme || "clean";

  // Parse social block settings for platform data
  const parsedBlocks = blocks.map((block) => {
    if (block.type === "social" && block.settings) {
      try {
        return { ...block, parsedSettings: JSON.parse(block.settings) };
      } catch {
        return block;
      }
    }
    if (block.type === "email_capture" && block.settings) {
      try {
        return { ...block, parsedSettings: JSON.parse(block.settings) };
      } catch {
        return block;
      }
    }
    return block;
  });

  return (
    <>
      {/* Google Fonts for themes */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div
        className="faro-page"
        data-faro-theme={theme}
        style={(() => {
          try {
            const s = page.settings ? JSON.parse(page.settings) : {};
            if (s.accent_color) return { "--faro-accent": s.accent_color } as React.CSSProperties;
          } catch { /* */ }
          return undefined;
        })()}
      >
        <div className="faro-inner">
          {/* Profile */}
          <div className="faro-profile">
            {page.profile_image_url && (
              <img
                src={page.profile_image_url}
                alt={page.display_name || ""}
                className="faro-avatar"
              />
            )}
            {page.display_name && (
              <h1 className="faro-display-name">{page.display_name}</h1>
            )}
            {page.bio && <p className="faro-bio">{page.bio}</p>}
          </div>

          {/* Blocks */}
          <div className="faro-blocks">
            {parsedBlocks.map((block) => {
              switch (block.type) {
                case "link":
                  return (
                    <FaroPageClient
                      key={block.id}
                      slug={slug}
                      blockId={block.id}
                      type="link"
                    >
                      <a
                        href={block.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="faro-block-link"
                      >
                        {block.title || "Link"}
                      </a>
                    </FaroPageClient>
                  );

                case "header":
                  return (
                    <div key={block.id} className="faro-block-header">
                      {block.title}
                    </div>
                  );

                case "text":
                  return (
                    <div key={block.id} className="faro-block-text">
                      {block.title}
                    </div>
                  );

                case "social": {
                  const platforms =
                    (block as any).parsedSettings?.platforms || [];
                  return (
                    <div key={block.id} className="faro-block-social">
                      {platforms.map(
                        (p: { platform: string; url: string }, i: number) => (
                          <a
                            key={i}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="faro-social-icon"
                            title={p.platform}
                          >
                            <SocialIcon platform={p.platform} />
                          </a>
                        )
                      )}
                    </div>
                  );
                }

                case "email_capture": {
                  const settings = (block as any).parsedSettings || {};
                  return (
                    <FaroPageClient
                      key={block.id}
                      slug={slug}
                      blockId={block.id}
                      type="email"
                    >
                      <div className="faro-block-email">
                        <div className="faro-email-title">
                          {settings.title || block.title || "Stay in the loop"}
                        </div>
                        <form className="faro-email-form" data-faro-email-form>
                          <input
                            type="email"
                            name="email"
                            className="faro-email-input"
                            placeholder={
                              settings.placeholder || "your@email.com"
                            }
                            required
                          />
                          <button type="submit" className="faro-email-button">
                            {settings.button_text || "Subscribe"}
                          </button>
                        </form>
                      </div>
                    </FaroPageClient>
                  );
                }

                default:
                  return null;
              }
            })}
          </div>

          {/* Footer */}
          <div className="faro-footer">
            <a href="https://guardiacontent.com" target="_blank" rel="noopener">
              Powered by Guardia
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Social Icons (inline SVGs for zero JS) ───────────────── */
function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p === "instagram")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    );
  if (p === "facebook")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  if (p === "twitter" || p === "x")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  if (p === "tiktok")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    );
  if (p === "youtube")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  if (p === "linkedin")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  // Generic link icon fallback
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}
