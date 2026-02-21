"use client";

import { useState, useEffect } from "react";

const API_BASE = "https://api.guardiacontent.com";

// ── Types ────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  category: string;
  product_group: string;
  tier_level: string;
  description: string;
  tagline: string;
  price_cents: number;
  includes: string[];
  comparison: { diy?: string; ai?: string; chloe?: string };
  owned: boolean;
}

interface ProductGroup {
  name: string;
  category: string;
  tiers: Product[];
}

interface BrandContext {
  has_soul_gem: boolean;
  business_name: string;
  brand_voice?: string;
  target_audience?: string;
  tone?: string;
  style_description?: string;
  industry?: string;
}

interface Completeness {
  score: number;
  completed: string[];
  missing: string[];
  next_upgrade?: string;
  dimensions: Record<string, { label: string; weight: number; completed: boolean }>;
}

interface PaymentInfo {
  has_card: boolean;
  brand?: string;
  last4?: string;
}

interface Purchase {
  id: number;
  product_name: string;
  category: string;
  price_cents: number;
  status: string;
  asset_status?: string;
  created_at: string;
}

interface StudioData {
  brand: BrandContext;
  completeness: Completeness;
  recommended: ProductGroup[];
  product_groups: Record<string, ProductGroup>;
  purchases: Purchase[];
  payment: PaymentInfo;
}

interface PostPurchaseData {
  product_name: string;
  category: string;
  next_steps: {
    message: string;
    action: string;
    next_product?: string;
    next_label?: string;
  };
}

interface ChloeTabProps {
  clientId: string;
  jwt: string;
  onMessage: (msg: string) => void;
}

export default function ChloeTab({ clientId, jwt, onMessage }: ChloeTabProps) {
  const [studio, setStudio] = useState<StudioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<ProductGroup | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [postPurchase, setPostPurchase] = useState<PostPurchaseData | null>(null);

  const headers = { Authorization: `Bearer ${jwt}` };

  useEffect(() => { loadStudio(); }, []);

  async function loadStudio() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chloe/studio`, { headers });
      if (res.ok) setStudio(await res.json());
    } catch (e) {
      console.error("Failed to load Chloe studio:", e);
    }
    setLoading(false);
  }

  async function handlePurchase(product: Product) {
    if (!studio?.payment?.has_card) {
      onMessage("Add a payment method in your Account tab first.");
      return;
    }
    setPurchasing(product.id);
    try {
      const res = await fetch(`${API_BASE}/chloe/purchase`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPostPurchase({
          product_name: data.product_name,
          category: data.category,
          next_steps: data.next_steps,
        });
        setSelectedGroup(null);
        loadStudio();
      } else {
        onMessage(data.detail || "Something went wrong. Try again.");
      }
    } catch {
      onMessage("Connection error. Try again.");
    }
    setPurchasing(null);
  }

  if (loading || !studio) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[var(--border)] border-t-violet-400 rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm">Chloe is getting ready...</p>
        </div>
      </div>
    );
  }

  // Post-purchase celebration
  if (postPurchase) {
    return (
      <PostPurchaseScreen
        data={postPurchase}
        brandName={studio.brand.business_name}
        completeness={studio.completeness}
        onContinue={() => { setPostPurchase(null); loadStudio(); }}
        onViewNext={(groupId) => {
          setPostPurchase(null);
          const g = studio.product_groups[groupId];
          if (g) setSelectedGroup(g);
        }}
      />
    );
  }

  // Product group detail (tier selection)
  if (selectedGroup) {
    return (
      <TierSelector
        group={selectedGroup}
        brand={studio.brand}
        payment={studio.payment}
        purchasing={purchasing}
        onPurchase={handlePurchase}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  // Main studio view
  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {studio.brand.business_name}&apos;s Brand Studio
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">Powered by Chloe, your AI stylist</p>
          </div>
        </div>
      </div>

      {/* Brand Completeness Bar */}
      <div className="px-6 mb-6">
        <CompletenessBar completeness={studio.completeness} />
      </div>

      {/* Soul Gem Status */}
      {studio.brand.has_soul_gem ? (
        <div className="mx-6 mb-6 flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl">
          <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
          <span className="text-sm text-violet-300">
            Chloe knows {studio.brand.business_name} — everything below is personalized for your brand
          </span>
        </div>
      ) : (
        <div className="mx-6 mb-6 flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm text-amber-300">
            Set up your brand in the Styles tab first — Chloe creates better work when she knows you
          </span>
        </div>
      )}

      {/* Recommended Section */}
      {studio.recommended.length > 0 && (
        <div className="px-6 mb-8">
          <h3 className="text-sm font-semibold text-violet-300 uppercase tracking-wider mb-3">
            Recommended for {studio.brand.business_name}
          </h3>
          <div className="space-y-3">
            {studio.recommended.map((group) => (
              <RecommendedCard
                key={group.category}
                group={group}
                completeness={studio.completeness}
                onClick={() => setSelectedGroup(group)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Product Groups */}
      <div className="px-6 pb-8">
        <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          All Brand Upgrades
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(studio.product_groups).map(([key, group]) => {
            const allOwned = group.tiers.every((t) => t.owned);
            const standardTier = group.tiers.find((t) => t.tier_level === "standard") || group.tiers[0];
            return (
              <button
                key={key}
                onClick={() => setSelectedGroup(group)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  allOwned
                    ? "bg-emerald-500/5 border-emerald-500/20 opacity-70"
                    : "bg-[var(--bg-surface)] border-[var(--border)] hover:border-violet-500/40 hover:bg-violet-500/5"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <CategoryIcon category={group.category} />
                  {allOwned ? (
                    <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full">Owned</span>
                  ) : (
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      from ${(standardTier.price_cents / 100).toFixed(0)}
                    </span>
                  )}
                </div>
                <p className="font-medium text-[var(--text-primary)] mb-0.5">{standardTier.name.replace(/ (Pro|Complete|Starter|Standard)$/, "")}</p>
                <p className="text-xs text-violet-300/70 italic">{standardTier.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Purchase History */}
      {studio.purchases.length > 0 && (
        <div className="px-6 pb-8">
          <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Your Upgrades
          </h3>
          <div className="space-y-2">
            {studio.purchases.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm text-[var(--text-primary)] font-medium">{p.product_name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.asset_status || p.status} />
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">${(p.price_cents / 100).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ── Brand Completeness Bar ───────────────────────────────────

function CompletenessBar({ completeness }: { completeness: Completeness }) {
  const { score, dimensions } = completeness;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">Brand Completeness</span>
        <span className="text-lg font-bold text-violet-300">{score}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Dimension pills */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(dimensions).map(([key, dim]) => (
          <span
            key={key}
            className={`text-xs px-2 py-1 rounded-full ${
              dim.completed
                ? "bg-violet-500/20 text-violet-300"
                : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
            }`}
          >
            {dim.completed && (
              <svg className="w-3 h-3 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {dim.label}
          </span>
        ))}
      </div>
    </div>
  );
}


// ── Recommended Card ─────────────────────────────────────────

function RecommendedCard({
  group,
  completeness,
  onClick,
}: {
  group: ProductGroup;
  completeness: Completeness;
  onClick: () => void;
}) {
  const standardTier = group.tiers.find((t) => t.tier_level === "standard") || group.tiers[0];
  const dim = completeness.dimensions[group.category];
  const boostPoints = dim?.weight || 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/25 rounded-xl p-4 hover:border-violet-500/40 transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CategoryIcon category={group.category} highlighted />
          <div>
            <p className="font-medium text-[var(--text-primary)] group-hover:text-violet-200 transition-colors">
              {standardTier.name.replace(/ (Pro|Complete|Starter|Standard)$/, "")}
            </p>
            <p className="text-xs text-violet-300/70 italic">{standardTier.tagline}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-[var(--text-primary)]">
            from ${(group.tiers[0].price_cents / 100).toFixed(0)}
          </span>
          <p className="text-xs text-violet-400">+{boostPoints}% completeness</p>
        </div>
      </div>
    </button>
  );
}


// ── Tier Selector (Product Detail) ───────────────────────────

function TierSelector({
  group,
  brand,
  payment,
  purchasing,
  onPurchase,
  onBack,
}: {
  group: ProductGroup;
  brand: BrandContext;
  payment: PaymentInfo;
  purchasing: string | null;
  onPurchase: (product: Product) => void;
  onBack: () => void;
}) {
  const comparison = group.tiers[0]?.comparison;
  const hasTiers = group.tiers.length > 1;

  return (
    <div className="h-full overflow-y-auto">
      {/* Back button + header */}
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to studio
        </button>

        <div className="flex items-center gap-3 mb-2">
          <CategoryIcon category={group.category} highlighted size="lg" />
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {group.tiers[0].name.replace(/ (Starter|Pro|Complete|Standard)$/, "")}
            </h2>
            <p className="text-sm text-violet-300/80 italic">
              Personalized for {brand.business_name}
            </p>
          </div>
        </div>
      </div>

      {/* DIY / AI / Chloe Comparison */}
      {comparison && (
        <div className="px-6 mb-6">
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            The Difference
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">DIY</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{comparison.diy}</p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-5 h-5 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">AI Tools</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{comparison.ai}</p>
            </div>
            <div className="bg-violet-500/10 border border-violet-500/25 rounded-xl p-3 ring-1 ring-violet-500/10">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">Chloe</span>
              </div>
              <p className="text-xs text-violet-200/90 leading-relaxed">{comparison.chloe}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tier Cards */}
      <div className="px-6 pb-8">
        <div className={`grid gap-4 ${hasTiers ? "grid-cols-1 md:grid-cols-" + Math.min(group.tiers.length, 3) : ""}`}>
          {group.tiers.map((tier, idx) => {
            const isPopular = tier.tier_level === "standard" && hasTiers;
            const isComplete = tier.tier_level === "complete";

            return (
              <div
                key={tier.id}
                className={`relative rounded-xl border p-5 flex flex-col ${
                  tier.owned
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : isPopular
                    ? "bg-violet-500/5 border-violet-500/30 ring-1 ring-violet-500/20 scale-[1.02]"
                    : "bg-[var(--bg-surface)] border-[var(--border)]"
                }`}
              >
                {/* Popular badge */}
                {isPopular && !tier.owned && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-violet-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                    Most Popular
                  </div>
                )}

                {/* Owned badge */}
                {tier.owned && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                    Owned
                  </div>
                )}

                {/* Tier name + price */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{tier.name}</h3>
                    <p className="text-xs text-violet-300/70 italic">{tier.tagline}</p>
                  </div>
                  <span className={`text-2xl font-bold ${isPopular ? "text-violet-300" : "text-[var(--text-primary)]"}`}>
                    ${(tier.price_cents / 100).toFixed(0)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] mb-4">{tier.description}</p>

                {/* Includes */}
                <ul className="space-y-1.5 mb-5 flex-1">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <svg className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {tier.owned ? (
                  <div className="text-center text-sm text-emerald-400 font-medium py-3">
                    Already in your brand
                  </div>
                ) : (
                  <button
                    onClick={() => onPurchase(tier)}
                    disabled={purchasing === tier.id || !payment.has_card}
                    className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      isPopular
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/20"
                        : "bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-violet-500/20 border border-[var(--border)]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {purchasing === tier.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {isPopular ? "Upgrade Your Brand" : isComplete ? "Go Complete" : "Add to Brand"}
                      </>
                    )}
                  </button>
                )}

                {/* Card info under CTA */}
                {!tier.owned && payment.has_card && (
                  <p className="text-[10px] text-[var(--text-muted)] text-center mt-2">
                    {payment.brand} ending {payment.last4} &middot; Instant delivery
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Savings callout for multi-tier */}
        {hasTiers && group.tiers.length >= 3 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-[var(--text-muted)]">
              {group.tiers[group.tiers.length - 1].name} saves you{" "}
              <span className="text-violet-300 font-semibold">
                {Math.round(
                  (1 - group.tiers[group.tiers.length - 1].price_cents /
                  (group.tiers.reduce((sum, t) => sum + (t.tier_level !== "complete" ? t.price_cents : 0), 0) || 1)) * 100
                )}%
              </span>{" "}
              vs buying separately
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Post-Purchase Screen ─────────────────────────────────────

function PostPurchaseScreen({
  data,
  brandName,
  completeness,
  onContinue,
  onViewNext,
}: {
  data: PostPurchaseData;
  brandName: string;
  completeness: Completeness;
  onContinue: () => void;
  onViewNext: (groupId: string) => void;
}) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Success animation */}
        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce-once shadow-xl shadow-violet-500/30">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {brandName} just leveled up
        </h2>
        <p className="text-[var(--text-secondary)] mb-6">{data.next_steps.message}</p>

        {/* Updated completeness */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-secondary)]">Brand Completeness</span>
            <span className="text-lg font-bold text-violet-300">{completeness.score}%</span>
          </div>
          <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000"
              style={{ width: `${completeness.score}%` }}
            />
          </div>
        </div>

        {/* Next product suggestion */}
        {data.next_steps.next_product && data.next_steps.next_label && (
          <button
            onClick={() => onViewNext(data.next_steps.next_product!.replace(/-.*/, ""))}
            className="w-full px-4 py-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm text-violet-300 hover:bg-violet-500/20 transition-all mb-3 text-left"
          >
            <span className="text-[var(--text-muted)] text-xs block mb-0.5">Next upgrade:</span>
            {data.next_steps.next_label}
          </button>
        )}

        <button
          onClick={onContinue}
          className="w-full py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] font-medium hover:bg-[var(--bg-surface)] transition-all"
        >
          Back to Studio
        </button>

        <style jsx>{`
          @keyframes bounce-once {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.1); }
            70% { transform: scale(0.95); }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-bounce-once {
            animation: bounce-once 0.6s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
}


// ── Shared Components ────────────────────────────────────────

function CategoryIcon({
  category,
  highlighted = false,
  size = "md",
}: {
  category: string;
  highlighted?: boolean;
  size?: "md" | "lg";
}) {
  const sizeClasses = size === "lg" ? "w-12 h-12" : "w-9 h-9";
  const iconSize = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  const bg = highlighted ? "bg-violet-500/20 text-violet-400" : "bg-[var(--bg-elevated)] text-[var(--text-muted)]";

  const icons: Record<string, React.ReactNode> = {
    logo: (
      <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
    design: (
      <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    document: (
      <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    content: (
      <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    automation: (
      <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  };

  return (
    <div className={`${sizeClasses} ${bg} rounded-lg flex items-center justify-center`}>
      {icons[category] || icons.design}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-emerald-500/20 text-emerald-300",
    queued: "bg-amber-500/20 text-amber-300",
    generating: "bg-amber-500/20 text-amber-300",
    ready: "bg-violet-500/20 text-violet-300",
    failed: "bg-red-500/20 text-red-300",
  };
  const labels: Record<string, string> = {
    paid: "Paid",
    queued: "Creating...",
    generating: "Creating...",
    ready: "Ready",
    failed: "Failed",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.paid}`}>
      {labels[status] || status}
    </span>
  );
}
