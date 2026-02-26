"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Sparkles,
  Wrench,
  Check,
  Loader2,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import type { GioClient } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.guardiacontent.com";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AddonItem {
  slug: string;
  name: string;
  category: string;
  description: string;
  price_cents: number;
  price_display: string;
}

interface ActiveAddon {
  slug: string;
  name: string;
  category: string;
  price_cents: number;
  price_display: string;
  activated_at: string;
}

interface CatalogData {
  categories: Record<string, AddonItem[]>;
}

interface ActiveData {
  addons: ActiveAddon[];
  monthly_total_cents: number;
  monthly_total_display: string;
}

// ── Category Config ────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; order: number }> = {
  platforms: { label: "Platforms", icon: Globe, order: 0 },
  ai:        { label: "AI & Automation", icon: Sparkles, order: 1 },
  tools:     { label: "Tools", icon: Wrench, order: 2 },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface StoreScreenProps {
  client: GioClient | null;
  jwt: string | null;
}

// ── API Helpers ───────────────────────────────────────────────────────────────

async function apiFetch(jwt: string | null, path: string, method = "GET", body?: unknown) {
  return fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StoreScreen({ client, jwt }: StoreScreenProps) {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [activeData, setActiveData] = useState<ActiveData | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [activeLoading, setActiveLoading] = useState(false);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ── Data Loading ─────────────────────────────────────────────────────────

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setError(null);
    try {
      const res = await apiFetch(null, "/addons/catalog");
      if (!res.ok) throw new Error("Failed to load store catalog");
      const data: CatalogData = await res.json();
      setCatalog(data);
    } catch {
      setError("Could not load the store. Please try again.");
    }
    setCatalogLoading(false);
  }, []);

  const loadActive = useCallback(async () => {
    if (!jwt) return;
    setActiveLoading(true);
    try {
      const res = await apiFetch(jwt, "/addons/active");
      if (res.ok) {
        const data: ActiveData = await res.json();
        setActiveData(data);
      }
    } catch {
      // Active addons are supplemental — fail silently
    }
    setActiveLoading(false);
  }, [jwt]);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);
  useEffect(() => { loadActive(); }, [loadActive]);

  // ── Toast Helper ─────────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ── Toggle Subscribe / Unsubscribe ───────────────────────────────────────

  const isActive = (slug: string) =>
    activeData?.addons.some((a) => a.slug === slug) ?? false;

  const handleToggle = async (addon: AddonItem) => {
    if (!jwt) return;
    setTogglingSlug(addon.slug);
    try {
      const action = isActive(addon.slug) ? "unsubscribe" : "subscribe";
      const res = await apiFetch(jwt, `/addons/${action}`, "POST", { addon_slug: addon.slug });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || (action === "subscribe" ? `${addon.name} activated` : `${addon.name} removed`));
        await loadActive();
      } else {
        showToast(json.message || "Something went wrong. Try again.");
      }
    } catch {
      showToast("Request failed. Check your connection.");
    }
    setTogglingSlug(null);
  };

  // ── Billing Portal ───────────────────────────────────────────────────────

  const handleBillingPortal = async () => {
    if (!jwt) return;
    setPortalLoading(true);
    try {
      const res = await apiFetch(jwt, "/addons/billing-portal", "POST");
      if (res.ok) {
        const json = await res.json();
        if (json.portal_url) window.open(json.portal_url, "_blank", "noopener,noreferrer");
      } else {
        showToast("Could not open billing portal.");
      }
    } catch {
      showToast("Request failed. Check your connection.");
    }
    setPortalLoading(false);
  };

  // ── Sorted Categories ─────────────────────────────────────────────────────

  const sortedCategories: Array<{ key: string; label: string; icon: React.ElementType; addons: AddonItem[] }> =
    catalog
      ? Object.entries(catalog.categories)
          .map(([key, addons]) => ({
            key,
            label: CATEGORY_META[key]?.label ?? key,
            icon: CATEGORY_META[key]?.icon ?? ShoppingBag,
            addons,
          }))
          .sort((a, b) => {
            const orderA = CATEGORY_META[a.key]?.order ?? 99;
            const orderB = CATEGORY_META[b.key]?.order ?? 99;
            return orderA - orderB;
          })
      : [];

  // ── Render: Loading ───────────────────────────────────────────────────────

  if (catalogLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        <p className="text-sm text-[var(--text-muted)]">Loading store...</p>
      </div>
    );
  }

  // ── Render: Error ─────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-1">
          <ShoppingBag className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-sm text-[var(--text-secondary)]">{error}</p>
        <button
          onClick={loadCatalog}
          className="mt-1 px-4 py-2 text-sm font-medium bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Render: Main ──────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-base)]">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)] leading-tight">Add-on Store</h1>
            <p className="text-sm text-[var(--text-muted)]">Extend your plan with individual features</p>
          </div>
        </div>

        {/* Monthly Total Bar */}
        {jwt && (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
                Monthly total
              </p>
              {activeLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-muted)]">Loading...</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                    {activeData?.monthly_total_display ?? "$0.00"}
                  </span>
                  {activeData && activeData.addons.length > 0 && (
                    <span className="text-xs text-[var(--text-muted)]">
                      / mo across {activeData.addons.length} add-on{activeData.addons.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleBillingPortal}
              disabled={portalLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all disabled:opacity-50 flex-shrink-0"
            >
              {portalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              Manage Billing
            </button>
          </div>
        )}

        {/* No JWT notice */}
        {!jwt && (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Log in to manage add-ons and see your active subscriptions.
            </p>
          </div>
        )}

        {/* Category Sections */}
        {sortedCategories.map(({ key, label, icon: Icon, addons }) => (
          <section key={key}>
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{label}</h2>
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            </div>

            {/* Add-on Cards */}
            <div className="space-y-2">
              {addons.map((addon) => {
                const active = isActive(addon.slug);
                const toggling = togglingSlug === addon.slug;

                return (
                  <div
                    key={addon.slug}
                    className={`
                      group relative bg-[var(--bg-elevated)] border rounded-2xl p-4 flex items-center gap-4 transition-all duration-200
                      ${active
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-[var(--border-subtle)] hover:border-[var(--border)]"
                      }
                    `}
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {addon.name}
                        </span>
                        {active && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-green-500/15 text-green-400">
                            <Check className="w-2.5 h-2.5" />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">
                        {addon.description}
                      </p>
                    </div>

                    {/* Price + Toggle */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                        {addon.price_display}
                        <span className="text-xs font-normal text-[var(--text-muted)]">/mo</span>
                      </span>

                      {jwt ? (
                        <button
                          onClick={() => handleToggle(addon)}
                          disabled={toggling}
                          className={`
                            flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 min-w-[90px] justify-center
                            ${active
                              ? "bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                              : "bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]/40"
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                        >
                          {toggling ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : active ? (
                            "Unsubscribe"
                          ) : (
                            "Subscribe"
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">Login required</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Empty state if catalog has no categories */}
        {sortedCategories.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">No add-ons available yet. Check back soon.</p>
          </div>
        )}

        {/* Client tier hint */}
        {client && client.tier !== "free" && (
          <p className="text-xs text-[var(--text-muted)] text-center pb-2">
            Add-ons supplement your {client.tier} plan and are billed monthly.
          </p>
        )}

      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-xl text-sm text-[var(--text-primary)] whitespace-nowrap pointer-events-none animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
