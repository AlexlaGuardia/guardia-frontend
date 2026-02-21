'use client';

import { useState } from 'react';
import { Check, Send, Globe, Share2, MapPin, ExternalLink } from "lucide-react";
import Image from 'next/image';

export default function VIPStartPage() {
  const [formData, setFormData] = useState({
    name: '',
    business: '',
    email: '',
    phone: '',
    vision: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/vip-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center animate-fade-in-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A227, #b8911f)' }}>
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">You&apos;re In!</h1>
          <p className="text-[var(--text-secondary)] text-lg mb-6">
            We&apos;ve received your info. Someone from our team will reach out within 24 hours to discuss your vision.
          </p>
          <p className="text-[#C9A227] font-medium">
            Talk soon, {formData.name.split(' ')[0]}!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] relative overflow-hidden">
      {/* Subtle gradient orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#C9A227]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#C9A227]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C9A227]/10 border border-[#C9A227]/20 mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            <span className="text-[#C9A227] text-sm font-medium">VIP Package</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
            Your Business,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A227] to-[#d4b44a]">
              Everywhere
            </span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto">
            Website. Social media. Google Business. One team, one monthly partnership.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: What You Get */}
          <div className="space-y-6 md:space-y-8">
            {/* Gio intro */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] text-center sm:text-left">
              <div className="flex-shrink-0">
                <Image
                  src="/images/gio/wave.png"
                  alt="Gio"
                  width={80}
                  height={80}
                  className="rounded-xl"
                />
              </div>
              <div>
                <p className="text-[var(--text-primary)] font-medium mb-1">Hey, I&apos;m Gio!</p>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  I help local businesses look great online. Fill out the form and we&apos;ll reach out to understand your vision and put together a plan.
                </p>
              </div>
            </div>

            {/* What's included */}
            <div className="space-y-4">
              <h3 className="text-[var(--text-primary)] font-semibold text-lg">What&apos;s Included</h3>

              <div className="grid gap-3">
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[#C9A227]/20 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[#C9A227]/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-[#C9A227]" />
                  </div>
                  <div>
                    <p className="text-[var(--text-primary)] font-medium text-sm sm:text-base">Professional Website</p>
                    <p className="text-[var(--text-muted)] text-xs sm:text-sm">Custom design, your own domain, mobile-friendly, ongoing updates</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[#C9A227]/20 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[#C9A227]/10 flex items-center justify-center flex-shrink-0">
                    <Share2 className="w-5 h-5 text-[#C9A227]" />
                  </div>
                  <div>
                    <p className="text-[var(--text-primary)] font-medium text-sm sm:text-base">Social Media Management</p>
                    <p className="text-[var(--text-muted)] text-xs sm:text-sm">AI-styled posts, caption writing, scheduled posting, monthly reports</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[#C9A227]/20 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[#C9A227]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#C9A227]" />
                  </div>
                  <div>
                    <p className="text-[var(--text-primary)] font-medium text-sm sm:text-base">Google Business Profile</p>
                    <p className="text-[var(--text-muted)] text-xs sm:text-sm">Setup, optimization, photos, posts, review management</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo showcase */}
            <div className="space-y-4">
              <h3 className="text-[var(--text-primary)] font-semibold text-lg">Sites We&apos;ve Built</h3>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm">Tap to preview &mdash; these are real sites we created for local businesses.</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { niche: 'Pet Grooming', emoji: '\uD83D\uDC3E', href: '/demo/grooming', gradient: 'from-amber-800/40 to-orange-900/40' },
                  { niche: 'Barbershop', emoji: '\u2702\uFE0F', href: '/demo/barbershop', gradient: 'from-slate-700/40 to-slate-900/40' },
                  { niche: 'Luxury Salon', emoji: '\uD83D\uDC87', href: '/demo/salon', gradient: 'from-violet-800/40 to-purple-900/40' },
                  { niche: 'Print Shop', emoji: '\uD83D\uDDA8\uFE0F', href: '/demo/printshop', gradient: 'from-teal-800/40 to-teal-950/40' },
                ].map((demo) => (
                  <a
                    key={demo.niche}
                    href={demo.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative p-3 sm:p-4 rounded-xl bg-gradient-to-br ${demo.gradient} border border-[var(--border)] hover:border-[#C9A227]/30 transition-all hover:scale-[1.02]`}
                  >
                    <span className="text-2xl">{demo.emoji}</span>
                    <p className="text-[var(--text-primary)] text-xs sm:text-sm font-medium mt-2">{demo.niche}</p>
                    <ExternalLink className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[#C9A227] absolute top-3 right-3 transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* Pricing hint */}
            <div className="p-3 sm:p-4 rounded-xl bg-[#C9A227]/5 border border-[#C9A227]/20">
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm">
                <span className="text-[#C9A227] font-semibold">Investment:</span> One-time setup + monthly partnership. We&apos;ll discuss pricing on our call based on your specific needs.
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:sticky lg:top-8">
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
              <h3 className="text-[var(--text-primary)] font-semibold text-xl mb-6">Let&apos;s Talk About Your Business</h3>

              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-[var(--text-secondary)] text-sm mb-2">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 min-h-[48px] rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-base placeholder-[var(--text-muted)] focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10 transition-all"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label htmlFor="business" className="block text-[var(--text-secondary)] text-sm mb-2">Business Name</label>
                  <input
                    type="text"
                    id="business"
                    required
                    value={formData.business}
                    onChange={(e) => setFormData({...formData, business: e.target.value})}
                    className="w-full px-4 py-3 min-h-[48px] rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-base placeholder-[var(--text-muted)] focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10 transition-all"
                    placeholder="Smith's Plumbing"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-[var(--text-secondary)] text-sm mb-2">Email</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 min-h-[48px] rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-base placeholder-[var(--text-muted)] focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10 transition-all"
                    placeholder="john@smithsplumbing.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-[var(--text-secondary)] text-sm mb-2">Phone <span className="text-[var(--text-muted)]">(optional)</span></label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 min-h-[48px] rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-base placeholder-[var(--text-muted)] focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10 transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="vision" className="block text-[var(--text-secondary)] text-sm mb-2">Tell us about your business & vision</label>
                  <textarea
                    id="vision"
                    rows={4}
                    value={formData.vision}
                    onChange={(e) => setFormData({...formData, vision: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-base placeholder-[var(--text-muted)] focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10 transition-all resize-none"
                    placeholder="What does your business do? What are you hoping to achieve online?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 min-h-[52px] rounded-xl text-white font-semibold text-base sm:text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #C9A227, #b8911f)', boxShadow: '0 4px 14px rgba(201, 162, 39, 0.2)' }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Let&apos;s Talk
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[var(--text-muted)] text-xs text-center mt-4">
                We&apos;ll reach out within 24 hours. No spam, no pressure.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
