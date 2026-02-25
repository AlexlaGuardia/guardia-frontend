"use client";
import React, { useEffect, useState } from 'react';
import { Check, Globe, Zap, Star, Rocket, ArrowRight, Calendar, Mail, Image, Shield } from 'lucide-react';

const packages = [
  {
    name: "Foundation Starter",
    price: 750,
    tagline: "Everything you need to get online",
    icon: Globe,
    gradient: "from-emerald-400 to-teal-500",
    features: [
      "3 custom pages",
      "Mobile responsive",
      "Contact form",
      "Social media links",
      "Basic SEO setup",
      "2-week delivery",
    ],
    cta: "Start Here",
    href: "/websites/starter",
  },
  {
    name: "Foundation Pro",
    price: 1197,
    tagline: "The complete business package",
    icon: Star,
    gradient: "from-blue-400 to-blue-600",
    popular: true,
    features: [
      "6 custom pages",
      "Mobile responsive",
      "Contact form + booking integration",
      "Google reviews widget",
      "Photo gallery (20 images)",
      "Advanced SEO setup",
      "10-day delivery",
    ],
    cta: "Go Pro",
    href: "/websites/pro",
  },
  {
    name: "Foundation Complete",
    price: 1697,
    tagline: "Maximum impact, zero compromise",
    icon: Rocket,
    gradient: "from-violet-400 to-purple-600",
    features: [
      "10 custom pages",
      "Mobile responsive",
      "Contact + booking + email capture",
      "Reviews + testimonials section",
      "Full photo gallery",
      "Speed optimization",
      "Advanced SEO + analytics",
      "7-day priority delivery",
    ],
    cta: "Go Complete",
    href: "/websites/complete",
  },
];

const addons = [
  { name: "+3 Pages", price: 300, icon: Globe, desc: "Services, Gallery, FAQ, Team, etc." },
  { name: "Booking Integration", price: 250, icon: Calendar, desc: "Calendly, Acuity, or Square" },
  { name: "Reviews Section", price: 150, icon: Star, desc: "Google reviews auto-widget" },
  { name: "Photo Gallery", price: 200, icon: Image, desc: "Lightbox gallery with 20 images" },
  { name: "Email Capture", price: 150, icon: Mail, desc: "Popup + Mailchimp integration" },
  { name: "Speed Optimization", price: 200, icon: Zap, desc: "Image compression + caching" },
];

const maintenance = {
  name: "Monthly Maintenance",
  price: 49,
  period: "/mo",
  features: ["Security updates", "Weekly backups", "Minor content changes", "Priority support"],
};

const faqs = [
  {
    q: "How long does it take?",
    a: "Foundation Starter takes about 2 weeks. Pro takes 10 days. Complete takes 7 days with priority delivery. We'll keep you updated throughout."
  },
  {
    q: "What do you need from me?",
    a: "Your logo (if you have one), photos of your business, text content for each page (we can help write it), and any specific features you want. We'll send you a simple questionnaire after purchase."
  },
  {
    q: "Do I need to handle hosting?",
    a: "We set up hosting on Vercel or Netlify (free tier works great for most businesses). You own everything\u2014we just build it."
  },
  {
    q: "Can I make changes myself later?",
    a: "Yes! We build with clean code and can show you how to make simple updates. For bigger changes, the monthly maintenance plan covers those."
  },
  {
    q: "What if I already have a website?",
    a: "We can rebuild it from scratch with modern design, or migrate your content to a better platform. Same pricing applies."
  },
];

const NoiseOverlay = () => (
  <svg className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.035]" aria-hidden="true">
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" />
  </svg>
);

const GlassCard = ({ children, className = "", hover = true, gradient = false }: { children: React.ReactNode; className?: string; hover?: boolean; gradient?: boolean; }) => (
  <div className={`relative rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] ${hover ? 'transition-all duration-500 hover:-translate-y-1.5 hover:border-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:shadow-2xl hover:shadow-black/10' : ''} ${className}`}>
    {gradient && <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C9A227]/[0.04] via-transparent to-transparent" />}
    <div className="relative">{children}</div>
  </div>
);

export default function WebsitesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] selection:bg-[#C9A227]/20 overflow-x-hidden">
      <NoiseOverlay />

      {/* NAV */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/images/guardia-logo.png" alt="Guardia" className="h-9 w-9 object-contain" />
            <span className="text-lg font-semibold tracking-tight">Guardia</span>
          </a>
          <div className="hidden items-center gap-8 md:flex">
            <a href="/#how" className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">Social Media</a>
            <a href="/websites" className="text-sm text-[var(--text-primary)]">Websites</a>
            <a href="/#faq" className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">FAQ</a>
          </div>
          <a href="/intake/pro" className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-2.5 text-sm font-medium transition-all duration-300 hover:border-[#C9A227]/30 hover:shadow-lg">Get Started</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-32 pb-16">
        <div className="pointer-events-none absolute -right-[10%] -top-[15%] h-[700px] w-[700px] rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(201, 162, 39, 0.15) 0%, transparent 65%)', filter: 'blur(80px)', transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 20}px)` }} />
        <div className="pointer-events-none absolute -bottom-[10%] -left-[10%] h-[600px] w-[600px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(201, 162, 39, 0.1) 0%, transparent 65%)', filter: 'blur(80px)', transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -15}px)` }} />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            <Globe className="h-4 w-4" />
            <span>Custom Websites</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            A website that works
            <span className="block bg-gradient-to-r from-[#C9A227] to-[#d4b44a] bg-clip-text text-transparent">as hard as you do</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-[var(--text-secondary)] leading-relaxed">
            Not a template. Not DIY. A fully custom website built for your business &mdash; mobile-ready, fast-loading, designed to convert.
          </p>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="relative px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Choose Your Foundation</h2>
            <p className="text-[var(--text-secondary)]">One-time payment. You own everything.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {packages.map((pkg, i) => (
              <GlassCard key={i} className={`relative p-6 ${pkg.popular ? 'border-blue-500/30 ring-1 ring-blue-500/20' : ''}`} gradient>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-1 text-xs font-medium text-white shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${pkg.gradient} shadow-lg`}>
                  <pkg.icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="mb-1 text-xl font-semibold">{pkg.name}</h3>
                <p className="mb-4 text-sm text-[var(--text-secondary)]">{pkg.tagline}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold">${pkg.price.toLocaleString()}</span>
                  <span className="ml-2 text-sm text-[var(--text-muted)]">one-time</span>
                </div>

                <ul className="mb-6 space-y-3">
                  {pkg.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#C9A227]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <a href={pkg.href} className={`block w-full rounded-xl py-3 text-center font-medium transition-all duration-300 ${pkg.popular ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25' : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[#C9A227]/30'}`}>
                  {pkg.cta}
                </a>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ADD-ONS */}
      <section className="relative px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Power-Ups</h2>
            <p className="text-[var(--text-secondary)]">Add these to any package</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((addon, i) => (
              <GlassCard key={i} className="p-5" hover={false}>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#C9A227]/10">
                    <addon.icon className="h-5 w-5 text-[#C9A227]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium">{addon.name}</h3>
                      <span className="text-[#C9A227] font-semibold">+${addon.price}</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{addon.desc}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Maintenance */}
          <div className="mt-8">
            <GlassCard className="p-6 max-w-xl mx-auto" gradient>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{maintenance.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Keep your site running smooth</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">${maintenance.price}</span>
                  <span className="text-[var(--text-muted)]">/mo</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {maintenance.features.map((f, i) => (
                  <span key={i} className="rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]">{f}</span>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="relative px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">How It Works</h2>
          </div>

          <div className="space-y-6">
            {[
              { step: "1", title: "Pick your package", desc: "Choose Starter, Pro, or Complete based on your needs. Add any power-ups you want." },
              { step: "2", title: "Share your vision", desc: "Fill out a quick questionnaire. Send us your logo, photos, and content. We'll handle the rest." },
              { step: "3", title: "Review & refine", desc: "We build your site and send you a preview. Request changes until it's perfect." },
              { step: "4", title: "Go live", desc: "We launch your site, set up hosting, and make sure everything works. You own it all." },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #C9A227, #b8911f)' }}>
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Questions?</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <GlassCard key={i} className="overflow-hidden" hover={false}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <span className="font-medium pr-4">{faq.q}</span>
                  <ArrowRight className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-300 ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-48 pb-5' : 'max-h-0'}`}>
                  <p className="px-5 text-sm text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to get online?</h2>
          <p className="mb-8 text-[var(--text-secondary)]">Your social media drives traffic. Give it somewhere to land.</p>
          <a href="/websites/pro" className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-medium text-white transition-all hover:shadow-lg hover:brightness-110" style={{ background: 'linear-gradient(135deg, #C9A227, #b8911f)' }}>
            Build My Website
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)] px-6 py-8">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/images/guardia-logo.png" alt="Guardia" className="h-5 w-5 object-contain opacity-60" />
            <span className="text-sm text-[var(--text-muted)]">Guardia</span>
          </div>
          <a href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">&larr; Back to Social Media</a>
        </div>
      </footer>
    </div>
  );
}
