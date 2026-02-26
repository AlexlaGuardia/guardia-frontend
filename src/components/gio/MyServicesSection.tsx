"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, ExternalLink, Loader2, ShoppingBag, CreditCard } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.guardiacontent.com";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MyAddon {
  slug: string;
  name: string;
  category: string;
  price_cents: number;
  price_display: string;
  activated_at: string;
  via_bundle?: string | null;
  via_bundle_name?: string | null;
  is_bundle_grant?: boolean;
}

interface MyAddonsData {
  addons: MyAddon[];
  monthly_total_cents: number;
  monthly_total_display: string;
}

interface MyServicesSectionProps {
  jwt: string | null;
  onNavigateToStore?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MyServicesSection({ jwt, onNavigateToStore }: MyServicesSectionProps) {
  const [data, setData] = useState<MyAddonsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadMyAddons = useCallback(async () => {
    if (!jwt) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_BASE}/addons/my-addons`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        setData(await res.json());
      } else {
        // Endpoint may not exist yet (SCC-1 dependency) — fall back to /addons/active
        const fallback = await fetch(`${API_BASE}/addons/active`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (fallback.ok) {
          const fb = await fallback.json();
          setData({
            addons: (fb.addons || []).map((a: MyAddon) => ({ ...a, via_bundle: null })),
            monthly_total_cents: fb.monthly_total_cents || 0,
            monthly_total_display: fb.monthly_total_display || "$0.00",
          });
        } else {
          setError(true);
        }
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [jwt]);

  useEffect(() => { loadMyAddons(); }, [loadMyAddons]);

  const handleBillingPortal = async () => {
    if (!jwt) return;
    setPortalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/addons/billing-portal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.portal_url) window.open(json.portal_url, "_blank", "noopener,noreferrer");
      }
    } catch {
      // silent
    }
    setPortalLoading(false);
  };

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wider mb-3 px-1 text-[var(--text-muted)]">
          My Services
        </h3>
        <div className="rounded-2xl p-6 flex justify-center" style={{ background: "var(--bg-surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.08), var(--shadow-soft)" }}>
          <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wider mb-3 px-1 text-[var(--text-muted)]">
          My Services
        </h3>
        <div className="rounded-2xl p-6 text-center" style={{ background: "var(--bg-surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.08), var(--shadow-soft)" }}>
          <p className="text-sm text-[var(--text-muted)]">Could not load services.</p>
          <button
            onClick={loadMyAddons}
            className="mt-2 text-sm text-[var(--accent)] hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasAddons = data && data.addons.length > 0;

  // ── Empty State ─────────────────────────────────────────────────────────────

  if (!hasAddons) {
    return (
      <div className="mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wider mb-3 px-1 text-[var(--text-muted)]">
          My Services
        </h3>
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: "var(--bg-surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.08), var(--shadow-soft)" }}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center">
            <Package className="w-6 h-6 text-[var(--text-muted)]" />
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">You&apos;re on the free plan</p>
          <p className="text-xs text-[var(--text-muted)] mb-4">Visit the Store to add features and grow your presence.</p>
          {onNavigateToStore && (
            <button
              onClick={onNavigateToStore}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Browse Store
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Active Services ─────────────────────────────────────────────────────────

  return (
    <div className="mb-6">
      <h3 className="text-xs font-medium uppercase tracking-wider mb-3 px-1 text-[var(--text-muted)]">
        My Services
      </h3>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.08), var(--shadow-soft)" }}
      >
        {/* Monthly Total Header */}
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Monthly total
            </span>
            <span className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
              {data!.monthly_total_display}
            </span>
          </div>
        </div>

        {/* Addon List */}
        <div className="divide-y divide-[var(--border-subtle)]">
          {data!.addons.map((addon) => (
            <div key={addon.slug} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-[var(--text-primary)]">{addon.name}</span>
              </div>
              {addon.via_bundle_name || addon.via_bundle ? (
                <span className="text-xs text-[var(--text-muted)] flex-shrink-0 ml-3">
                  via {addon.via_bundle_name || addon.via_bundle}
                </span>
              ) : (
                <span className="text-xs text-[var(--text-muted)] tabular-nums flex-shrink-0 ml-3">
                  ${(addon.price_cents / 100).toFixed(2)}/mo
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex gap-3">
          <button
            onClick={handleBillingPortal}
            disabled={portalLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all disabled:opacity-50"
          >
            {portalLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CreditCard className="w-3.5 h-3.5" />
            )}
            Manage Billing
          </button>
          {onNavigateToStore && (
            <button
              onClick={onNavigateToStore}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Browse Store
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
