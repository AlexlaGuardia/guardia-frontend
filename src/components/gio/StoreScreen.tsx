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
  X,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { GioClient } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.guardiacontent.com";

const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

// Addons hidden from store display (AI products — SCC-1 backend also filters these)
const HIDDEN_SLUGS = new Set(["ai_pipeline", "auto_scheduling"]);

// ── Types ─────────────────────────────────────────────────────────────────────

interface AddonItem {
  slug: string;
  name: string;
  category: string;
  description: string;
  price_cents: number;
  price_display: string;
  is_listed?: boolean;
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
  has_payment_method?: boolean;
}

// ── Category Config ────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; order: number }> = {
  platform:  { label: "Platforms", icon: Globe, order: 0 },
  platforms: { label: "Platforms", icon: Globe, order: 0 },
  bundle:    { label: "Bundles", icon: ShoppingBag, order: 1 },
  tool:      { label: "Tools", icon: Wrench, order: 2 },
  tools:     { label: "Tools", icon: Wrench, order: 2 },
  ai:        { label: "AI & Automation", icon: Sparkles, order: 3 },
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

// ── Card Form (Stripe Elements) ──────────────────────────────────────────────

interface CardFormProps {
  addon: AddonItem;
  clientSecret: string | null;
  jwt: string;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

function CardFormInner({ addon, clientSecret, jwt, onSuccess, onCancel }: CardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    setCardError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) { setProcessing(false); return; }

    if (clientSecret) {
      // Confirm payment for the already-created incomplete subscription
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });
      if (confirmError) {
        setCardError(confirmError.message || "Payment failed. Please try again.");
        setProcessing(false);
        return;
      }
      onSuccess(`${addon.name} activated!`);
    } else {
      // No client_secret — create payment method first, then subscribe with it
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });
      if (pmError) {
        setCardError(pmError.message || "Card error. Please try again.");
        setProcessing(false);
        return;
      }
      try {
        const res = await apiFetch(jwt, "/addons/subscribe", "POST", {
          addon_slug: addon.slug,
          payment_method_id: paymentMethod.id,
        });
        const json = await res.json();
        if (res.ok && json.success) {
          if (json.requires_action && json.client_secret) {
            // SCA required — confirm the payment
            const { error: scaError } = await stripe.confirmCardPayment(json.client_secret);
            if (scaError) {
              setCardError(scaError.message || "Authentication failed.");
              setProcessing(false);
              return;
            }
          }
          onSuccess(json.message || `${addon.name} activated!`);
        } else {
          setCardError(json.detail || json.message || "Subscription failed.");
        }
      } catch {
        setCardError("Request failed. Check your connection.");
      }
    }
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 cursor-pointer" onClick={onCancel} />

      {/* Card form */}
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Add payment method</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Subscribe to {addon.name} &middot; ${(addon.price_cents / 100).toFixed(2)}/mo
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-elevated)] hover:bg-[var(--bg-base)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Card input */}
        <div className="p-4 space-y-4">
          <div className="rounded-xl p-4 bg-[var(--bg-base)]" style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)" }}>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "var(--text-primary, #e5e5e5)",
                    "::placeholder": { color: "var(--text-muted, #666)" },
                  },
                  invalid: { color: "#ef4444" },
                },
              }}
            />
          </div>

          {cardError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-400">{cardError}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={processing || !stripe}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              background: "linear-gradient(145deg, var(--accent), var(--accent-hover, #7c3aed))",
              color: "white",
              boxShadow: "0 2px 8px rgba(167,139,250,0.3)",
            }}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" />
                Subscribe &middot; ${(addon.price_cents / 100).toFixed(2)}/mo
              </span>
            )}
          </button>

          <p className="text-[11px] text-[var(--text-muted)] text-center">
            Your card will be charged ${(addon.price_cents / 100).toFixed(2)}/mo. Cancel anytime from your Account tab.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Unsubscribe Confirmation ─────────────────────────────────────────────────

interface UnsubscribeDialogProps {
  addon: AddonItem;
  onConfirm: () => void;
  onCancel: () => void;
  processing: boolean;
}

function UnsubscribeDialog({ addon, onConfirm, onCancel, processing }: UnsubscribeDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 cursor-pointer" onClick={onCancel} />
      <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl p-5 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
          Remove {addon.name}?
        </h3>
        <p className="text-sm text-[var(--text-muted)] mb-5">
          This will be prorated. You&apos;ll lose access at the end of your current billing period.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-base)] transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Unsubscribe"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

function StoreScreenInner({ client, jwt }: StoreScreenProps) {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [activeData, setActiveData] = useState<ActiveData | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [activeLoading, setActiveLoading] = useState(false);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Payment flow state
  const [cardFormAddon, setCardFormAddon] = useState<AddonItem | null>(null);
  const [cardFormSecret, setCardFormSecret] = useState<string | null>(null);
  const [unsubConfirmAddon, setUnsubConfirmAddon] = useState<AddonItem | null>(null);

  // ── Data Loading ─────────────────────────────────────────────────────────

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setError(null);
    try {
      const res = await apiFetch(null, "/addons/catalog");
      if (!res.ok) throw new Error("Failed to load store catalog");
      const json = await res.json();
      setCatalog({ categories: json.catalog || json.categories || {} });
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

  // ── Subscribe / Unsubscribe ────────────────────────────────────────────

  const isActive = (slug: string) =>
    activeData?.addons.some((a) => a.slug === slug) ?? false;

  const handleSubscribe = async (addon: AddonItem) => {
    if (!jwt) return;
    setTogglingSlug(addon.slug);

    try {
      const res = await apiFetch(jwt, "/addons/subscribe", "POST", { addon_slug: addon.slug });
      const json = await res.json();

      if (res.ok && json.success) {
        if (json.requires_action && json.client_secret) {
          // Subscription created but payment incomplete — show card form
          setCardFormSecret(json.client_secret);
          setCardFormAddon(addon);
        } else {
          showToast(json.message || `${addon.name} activated!`);
          await loadActive();
        }
      } else if (res.status === 402) {
        // Payment required — try with card form via new subscribe
        setCardFormAddon(addon);
      } else {
        showToast(json.message || json.detail || "Something went wrong. Try again.");
      }
    } catch {
      showToast("Request failed. Check your connection.");
    }
    setTogglingSlug(null);
  };

  const handleUnsubscribeConfirm = async () => {
    if (!jwt || !unsubConfirmAddon) return;
    setTogglingSlug(unsubConfirmAddon.slug);

    try {
      const res = await apiFetch(jwt, "/addons/unsubscribe", "POST", { addon_slug: unsubConfirmAddon.slug });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || `${unsubConfirmAddon.name} removed`);
        await loadActive();
      } else {
        showToast(json.message || "Something went wrong. Try again.");
      }
    } catch {
      showToast("Request failed. Check your connection.");
    }
    setTogglingSlug(null);
    setUnsubConfirmAddon(null);
  };

  const handleToggle = (addon: AddonItem) => {
    if (isActive(addon.slug)) {
      setUnsubConfirmAddon(addon);
    } else {
      handleSubscribe(addon);
    }
  };

  const handleCardSuccess = async (message: string) => {
    showToast(message);
    setCardFormAddon(null);
    setCardFormSecret(null);
    await loadActive();
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

  // ── Filter & Sort Categories ────────────────────────────────────────────

  const sortedCategories: Array<{ key: string; label: string; icon: React.ElementType; addons: AddonItem[] }> =
    catalog
      ? Object.entries(catalog.categories)
          .map(([key, addons]) => ({
            key,
            label: CATEGORY_META[key]?.label ?? key,
            icon: CATEGORY_META[key]?.icon ?? ShoppingBag,
            // Client-side filter: hide unlisted AI addons
            addons: addons.filter((a) => !HIDDEN_SLUGS.has(a.slug) && a.is_listed !== false),
          }))
          .filter(({ addons }) => addons.length > 0)
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
      <div className="max-w-2xl mx-auto px-4 py-6 pb-28 xl:pb-6 space-y-6">

        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)] leading-tight">Add-on Store</h1>
            <p className="text-sm text-[var(--text-muted)]">Extend your account with individual features</p>
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
                        ${(addon.price_cents / 100).toFixed(2)}
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
                            "Remove"
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

        {/* Billing hint */}
        {jwt && (
          <p className="text-xs text-[var(--text-muted)] text-center pb-2">
            Add-ons are billed monthly. Manage active services from your Account tab.
          </p>
        )}
      </div>

      {/* Card Form Modal */}
      {cardFormAddon && jwt && (
        <CardFormInner
          addon={cardFormAddon}
          clientSecret={cardFormSecret}
          jwt={jwt}
          onSuccess={handleCardSuccess}
          onCancel={() => { setCardFormAddon(null); setCardFormSecret(null); }}
        />
      )}

      {/* Unsubscribe Confirmation */}
      {unsubConfirmAddon && (
        <UnsubscribeDialog
          addon={unsubConfirmAddon}
          onConfirm={handleUnsubscribeConfirm}
          onCancel={() => setUnsubConfirmAddon(null)}
          processing={togglingSlug === unsubConfirmAddon.slug}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-xl text-sm text-[var(--text-primary)] whitespace-nowrap pointer-events-none animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}

// ── Wrapper with Stripe Provider ─────────────────────────────────────────────

export default function StoreScreen(props: StoreScreenProps) {
  if (stripePromise) {
    return (
      <Elements stripe={stripePromise} options={{ appearance: { theme: "night" } }}>
        <StoreScreenInner {...props} />
      </Elements>
    );
  }
  // Stripe not configured — render without payment capability
  return <StoreScreenInner {...props} />;
}
