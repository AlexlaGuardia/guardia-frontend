'use client';

import { useState } from 'react';
import { ArrowLeft, Star, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import IntakeContentStrategy from '@/components/intake/IntakeContentStrategy';

const contentThemes = [
  { id: 'promos', label: 'Promotions & Offers' },
  { id: 'education', label: 'Tips & Education' },
  { id: 'behind-scenes', label: 'Behind the Scenes' },
  { id: 'testimonials', label: 'Customer Stories' },
  { id: 'products', label: 'Product Showcases' },
  { id: 'team', label: 'Team & Culture' },
];

export default function IntakeProPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    website: '',
    platform_1: 'facebook',
    handle_1: '',
    brand_voice: '',
    brand_colors: '',
    content_themes: [] as string[],
    gbp_status: 'not_setup',
    review_tone: 'professional',
    competitors: '',
    contact_email: '',
    contact_name: '',
    contact_phone: '',
    content_strategy: {} as Record<string, unknown>,
  });

  const updateField = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTheme = (themeId: string) => {
    setFormData(prev => ({
      ...prev,
      content_themes: prev.content_themes.includes(themeId)
        ? prev.content_themes.filter(t => t !== themeId)
        : [...prev.content_themes, themeId]
    }));
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.business_name && formData.industry && formData.contact_name && formData.contact_email;
    }
    if (step === 2) {
      return !!formData.handle_1;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('https://api.guardiacontent.com/intake/pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          setError('Something went wrong. Please try again.');
          setIsSubmitting(false);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.detail || 'Submission failed. Please check your information.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Connection error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const tierColor = '#3b82f6';
  const totalSteps = 4;

  // Shared input classes
  const inputCls = "w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10";
  const selectCls = "w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] transition-colors focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10";

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Back link */}
        <Link
          href="/#pricing"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to pricing
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2"
            style={{ borderColor: `${tierColor}30`, backgroundColor: `${tierColor}10` }}
          >
            <Star className="h-4 w-4" style={{ color: tierColor }} />
            <span className="text-sm font-medium" style={{ color: tierColor }}>Pro &bull; $25/month</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">Posts + 24-hour engagement</h1>
          <p className="text-[var(--text-secondary)]">Let&apos;s get you set up. Takes about 5 minutes.</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm text-[var(--text-secondary)]">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}% complete</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%`, backgroundColor: tierColor }}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-400/30 bg-red-50 px-4 py-3 text-center text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-1 text-xl font-semibold">Tell us about your business</h2>
                <p className="text-sm text-[var(--text-secondary)]">We&apos;ll use this to craft content that fits your brand.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-secondary)]">Business Name *</label>
                  <input type="text" placeholder="Acme Coffee Shop" value={formData.business_name} onChange={e => updateField('business_name', e.target.value)} className={inputCls} />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[var(--text-secondary)]">Industry *</label>
                  <select value={formData.industry} onChange={e => updateField('industry', e.target.value)} className={selectCls}>
                    <option value="">Select your industry</option>
                    <option value="restaurant">Restaurant / Food & Beverage</option>
                    <option value="retail">Retail / E-commerce</option>
                    <option value="salon">Salon / Beauty / Spa</option>
                    <option value="pet_grooming">Pet Grooming / Pet Services</option>
                    <option value="fitness">Fitness / Wellness</option>
                    <option value="professional">Professional Services</option>
                    <option value="healthcare">Healthcare / Medical</option>
                    <option value="realestate">Real Estate</option>
                    <option value="automotive">Automotive</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-secondary)]">Your Name *</label>
                    <input type="text" placeholder="Jane Smith" value={formData.contact_name} onChange={e => updateField('contact_name', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-secondary)]">Phone</label>
                    <input type="tel" placeholder="(555) 123-4567" value={formData.contact_phone} onChange={e => updateField('contact_phone', e.target.value)} className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[var(--text-secondary)]">Email *</label>
                  <input type="email" placeholder="jane@acmecoffee.com" value={formData.contact_email} onChange={e => updateField('contact_email', e.target.value)} className={inputCls} />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[var(--text-secondary)]">Website</label>
                  <input type="url" placeholder="https://acmecoffee.com" value={formData.website} onChange={e => updateField('website', e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Platform */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-1 text-xl font-semibold">Connect your Facebook page</h2>
                <p className="text-sm text-[var(--text-secondary)]">We&apos;ll post to your Facebook page. Additional platforms available as add-ons.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-secondary)]">Facebook Page Name *</label>
                  <input type="text" placeholder="Acme Coffee Shop" value={formData.handle_1} onChange={e => updateField('handle_1', e.target.value)} className={inputCls} />
                </div>

                <div
                  className="rounded-xl border p-4"
                  style={{ borderColor: `${tierColor}30`, backgroundColor: `${tierColor}08` }}
                >
                  <p className="text-sm" style={{ color: `${tierColor}cc` }}>
                    <strong>Pro tip:</strong> After signup, we&apos;ll send you a secure link to connect your Facebook page.
                    No passwords shared — we use official platform connections.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Brand & Content */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-1 text-xl font-semibold">Define your brand</h2>
                <p className="text-sm text-[var(--text-secondary)]">Help us understand your vibe so posts feel authentically you.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-3 block text-sm text-[var(--text-secondary)]">Content themes (select all that apply)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {contentThemes.map(theme => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => toggleTheme(theme.id)}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                          formData.content_themes.includes(theme.id)
                            ? 'border-[#C9A227]/50 bg-[#C9A227]/10 text-[var(--text-primary)]'
                            : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                          formData.content_themes.includes(theme.id)
                            ? 'border-[#C9A227] bg-[#C9A227]'
                            : 'border-[var(--text-muted)]'
                        }`}>
                          {formData.content_themes.includes(theme.id) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[var(--text-secondary)]">Brand colors</label>
                  <input type="text" placeholder="#FF6B00 or 'match my website'" value={formData.brand_colors} onChange={e => updateField('brand_colors', e.target.value)} className={inputCls} />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[var(--text-secondary)]">Brand voice</label>
                  <textarea
                    placeholder="E.g., 'Friendly and casual, like talking to a neighbor' or 'Professional but warm'"
                    value={formData.brand_voice}
                    onChange={e => updateField('brand_voice', e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[var(--text-secondary)]">Competitors or brands you admire</label>
                  <input type="text" placeholder="Blue Bottle, Philz Coffee, local spots..." value={formData.competitors} onChange={e => updateField('competitors', e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Content Strategy */}
          {step === 4 && (
            <IntakeContentStrategy
              industry={formData.industry}
              onChange={(data) => updateField('content_strategy', data)}
              initialData={formData.content_strategy as Record<string, unknown>}
            />
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-3 font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-base)]"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="rounded-xl px-8 py-3 font-semibold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: tierColor }}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl px-8 py-3 font-semibold text-white transition-colors disabled:opacity-70"
                style={{ backgroundColor: tierColor }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  'Continue to Payment \u2192'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#C9A227]" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#C9A227]" />
            <span>20 posts + 2 videos/month</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#C9A227]" />
            <span>Secure checkout via Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
