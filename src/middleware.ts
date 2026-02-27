import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.guardiacontent.com";

// Domains that are "ours" — don't treat as custom domains
const KNOWN_HOSTS = new Set([
  "guardiacontent.com",
  "www.guardiacontent.com",
  "faro.guardiacontent.com",
  "staging.guardiacontent.com",
  "localhost",
  "localhost:3000",
]);

// Simple in-memory cache: domain -> slug (TTL 5 min)
const domainCache = new Map<string, { slug: string; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const hostname = host.split(":")[0].toLowerCase();

  // Skip known hosts
  if (KNOWN_HOSTS.has(host.toLowerCase()) || KNOWN_HOSTS.has(hostname)) {
    return NextResponse.next();
  }

  // Skip static assets and API routes
  const path = req.nextUrl.pathname;
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/favicon") ||
    path.includes(".")
  ) {
    return NextResponse.next();
  }

  // Only rewrite root path for custom domains
  if (path !== "/") {
    return NextResponse.next();
  }

  // Check cache
  const cached = domainCache.get(hostname);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    const url = req.nextUrl.clone();
    url.pathname = `/faro/${cached.slug}`;
    return NextResponse.rewrite(url);
  }

  // Look up domain via backend
  try {
    const res = await fetch(
      `${API_BASE}/faro/domain/lookup?domain=${encodeURIComponent(hostname)}`,
      { next: { revalidate: 300 } }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.slug) {
        domainCache.set(hostname, { slug: data.slug, ts: Date.now() });
        const url = req.nextUrl.clone();
        url.pathname = `/faro/${data.slug}`;
        return NextResponse.rewrite(url);
      }
    }
  } catch {
    // Lookup failed — fall through to normal routing
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
