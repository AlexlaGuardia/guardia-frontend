'use client';

import { useState } from 'react';
import { ArrowLeft, Zap, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function IntakeSparkPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    contact_name: '',
    contact_email: '',
    platform_1: 'instagram',
    platform_2: 'facebook',
    handle_1: '',
    handle_2: '',
    vibe: 'professional',
    posting_preference: 'weekdays',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.business_name && formData.industry && formData.contact_name && formData.contact_email;
    }
    if (step === 2) {
      return formData.handle_1 || formData.handle_2;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('https://api.guardiacontent.com/intake/spark', {
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

  const tierColor = '#f59e0b';

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
            <Zap className="h-4 w-4" style={{ color: tierColor }} />
            <span className="text-sm font-medium" style={{ color: tierColor }}>Spark &bull; $15/month</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">Start showing up consistently</h1>
          <p className="text-[var(--text-secondary)]">Quick setup — you&apos;ll be posting in no time.</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm text-[var(--text-secondary)]">
            <span>Step {step} of 2</span>
            <span>{Math.round((step / 2) * 100)}% complete</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(step / 2) * 100}%`, backgroundColor: tierColor }}
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
                <p className="text-sm text-[var(--text-secondary)]">We&apos;ll use this to get you started.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-secondary)]">Business Name *</label>
                  <input
                    type="text"
                    placeholder="Acme Coffee Shop"
                    value={formData.business_name}
                    onChange={e => updateField('business_name', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[var(--text-secondary)]">Industry *</label>
                  <select
                    value={formData.industry}
                    onChange={e => updateField('industry', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] transition-colors focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10"
                  >
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
                    <input
                      type="text"
                      placeholder="Jane Smith"
                      value={formData.contact_name}
                      onChange={e => updateField('contact_name', e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-secondary)]">Email *</label>
                    <input
                      type="email"
                      placeholder="jane@acmecoffee.com"
                      value={formData.contact_email}
                      onChange={e => updateField('contact_email', e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Platforms & Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-1 text-xl font-semibold">Connect your platforms</h2>
                <p className="text-sm text-[var(--text-secondary)]">Spark includes 2 platforms.</p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-secondary)]">Platform 1</label>
                    <select
                      value={formData.platform_1}
                      onChange={e => updateField('platform_1', e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] transition-colors focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-secondary)]">Handle / Page *</label>
                    <input
                      type="text"
                      placeholder="@acmecoffee"
                      value={formData.handle_1}
                      onChange={e => updateField('handle_1', e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-secondary)]">Platform 2</label>
                    <select
                      value={formData.platform_2}
                      onChange={e => updateField('platform_2', e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] transition-colors focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-secondary)]">Handle / Page</label>
                    <input
                      type="text"
                      placeholder="Acme Coffee Shop"
                      value={formData.handle_2}
                      onChange={e => updateField('handle_2', e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[var(--text-secondary)]">Brand vibe</label>
                  <select
                    value={formData.vibe}
                    onChange={e => updateField('vibe', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] transition-colors focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10"
                  >
                    <option value="professional">Professional & polished</option>
                    <option value="friendly">Friendly & approachable</option>
                    <option value="playful">Playful & fun</option>
                    <option value="luxe">Luxurious & refined</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[var(--text-secondary)]">Posting preference</label>
                  <select
                    value={formData.posting_preference}
                    onChange={e => updateField('posting_preference', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] transition-colors focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10"
                  >
                    <option value="weekdays">Weekdays only</option>
                    <option value="everyday">Every day</option>
                    <option value="mwf">Mon/Wed/Fri</option>
                  </select>
                </div>
              </div>
            </div>
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

            {step < 2 ? (
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
                disabled={isSubmitting || !canProceed()}
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
            <span>12 posts/month</span>
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
