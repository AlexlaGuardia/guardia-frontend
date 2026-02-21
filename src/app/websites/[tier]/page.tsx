"use client";
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Globe, ArrowRight, Check, Loader2 } from 'lucide-react';

const packages: Record<string, { name: string; price: number; features: string[]; gradient: string }> = {
  starter: {
    name: "Foundation Starter",
    price: 750,
    gradient: "from-emerald-400 to-teal-500",
    features: ["3 custom pages", "Mobile responsive", "Contact form", "Social links", "Basic SEO", "2-week delivery"],
  },
  pro: {
    name: "Foundation Pro",
    price: 1197,
    gradient: "from-blue-400 to-blue-600",
    features: ["6 custom pages", "Booking integration", "Reviews widget", "Photo gallery", "Advanced SEO", "10-day delivery"],
  },
  complete: {
    name: "Foundation Complete",
    price: 1697,
    gradient: "from-violet-400 to-purple-600",
    features: ["10 custom pages", "All integrations", "Email capture", "Speed optimization", "Analytics", "7-day priority"],
  },
};

const addons = [
  { id: "extra_pages", name: "+3 Pages", price: 300 },
  { id: "booking", name: "Booking Integration", price: 250 },
  { id: "reviews", name: "Reviews Section", price: 150 },
  { id: "gallery", name: "Photo Gallery", price: 200 },
  { id: "email_capture", name: "Email Capture", price: 150 },
  { id: "speed_optimization", name: "Speed Optimization", price: 200 },
];

export default function WebsiteIntakePage() {
  const params = useParams();
  const router = useRouter();
  const tier = params?.tier as string;
  const pkg = packages[tier];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    phone: '',
    currentWebsite: '',
    description: '',
  });
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!pkg) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex items-center justify-center">
        <p>Invalid package. <a href="/websites" className="text-[#C9A227] underline">Go back</a></p>
      </div>
    );
  }

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    let total = pkg.price;
    selectedAddons.forEach(id => {
      const addon = addons.find(a => a.id === id);
      if (addon) total += addon.price;
    });
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.guardiacontent.com'}/websites/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: tier,
          addons: selectedAddons,
          email: formData.email,
          name: formData.name,
          business_name: formData.businessName,
        }),
      });

      const data = await res.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.detail || 'Something went wrong');
        setLoading(false);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Nav */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/images/guardia-logo.png" alt="Guardia" className="h-9 w-9 object-contain" />
            <span className="text-lg font-semibold tracking-tight">Guardia</span>
          </a>
          <a href="/websites" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">&larr; Back to Packages</a>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 pt-28 pb-16">
        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          {/* Form */}
          <div className="order-2 lg:order-1">
            <div className="mb-8">
              <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${pkg.gradient} px-4 py-1.5 text-sm font-medium text-white mb-4`}>
                <Globe className="h-4 w-4" />
                {pkg.name}
              </div>
              <h1 className="text-3xl font-bold mb-2">Let&apos;s build your website</h1>
              <p className="text-[var(--text-secondary)]">Fill out the basics. We&apos;ll handle the rest.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10 transition-all"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10 transition-all"
                    placeholder="jane@business.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Name *</label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10 transition-all"
                  placeholder="Awesome Business LLC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Website (if any)</label>
                <input
                  type="url"
                  value={formData.currentWebsite}
                  onChange={e => setFormData({ ...formData, currentWebsite: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10 transition-all"
                  placeholder="https://currentsite.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tell us about your business</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10 transition-all resize-none"
                  placeholder="What do you do? Who are your customers?"
                />
              </div>

              {/* Add-ons */}
              <div>
                <label className="block text-sm font-medium mb-3">Add Power-Ups (optional)</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {addons.map(addon => (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon.id)}
                      className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                        selectedAddons.includes(addon.id)
                          ? 'border-[#C9A227]/50 bg-[#C9A227]/10'
                          : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <span className="text-sm">{addon.name}</span>
                      <span className={`text-sm font-medium ${selectedAddons.includes(addon.id) ? 'text-[#C9A227]' : 'text-[var(--text-muted)]'}`}>
                        +${addon.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-400/30 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-4 font-medium text-white transition-all hover:brightness-110 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #C9A227, #b8911f)', boxShadow: '0 4px 14px rgba(201, 162, 39, 0.2)' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[var(--text-muted)]">
                Secure checkout powered by Stripe. You&apos;ll be charged ${calculateTotal().toLocaleString()} today.
              </p>
            </form>
          </div>

          {/* Summary */}
          <div className="order-1 lg:order-2">
            <div className="sticky top-28 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
              <h3 className="font-semibold mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">{pkg.name}</span>
                  <span>${pkg.price.toLocaleString()}</span>
                </div>

                {selectedAddons.map(id => {
                  const addon = addons.find(a => a.id === id);
                  return addon ? (
                    <div key={id} className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">{addon.name}</span>
                      <span>${addon.price}</span>
                    </div>
                  ) : null;
                })}
              </div>

              <div className="border-t border-[var(--border)] pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${calculateTotal().toLocaleString()}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">One-time payment</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">What&apos;s included:</h4>
                <ul className="space-y-2">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <Check className="h-4 w-4 text-[#C9A227] shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
