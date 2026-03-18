"use client";

import { useState, useEffect, useRef } from "react";
import StyleHeroShowcase from "@/components/StyleHeroShowcase";
import {
  Check,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Menu,
  X,
  Link2,
  BarChart3,
  Mail,
  Palette,
  Send,
  Globe,
  Cpu,
  Calendar,
  TrendingUp,
  AtSign,
} from "lucide-react";

/* =============================================================================
   DATA
============================================================================= */

const freeFeatures = [
  {
    icon: Link2,
    title: "Faro bio page",
    desc: "Your link-in-bio at yourname.guardia.page. 6 themes, unlimited links, social icons.",
  },
  {
    icon: Send,
    title: "Manual posting",
    desc: "Upload a photo, write a caption, post to your connected platforms. No limits.",
  },
  {
    icon: BarChart3,
    title: "Basic analytics",
    desc: "Page views, link clicks, and referrers. Know what's working.",
  },
  {
    icon: Mail,
    title: "Email capture",
    desc: "Collect subscriber emails right from your Faro page. Export anytime.",
  },
  {
    icon: Palette,
    title: "6 clean themes",
    desc: "From minimal to bold. Pick a theme, customize your page, publish in minutes.",
  },
  {
    icon: Calendar,
    title: "Content calendar",
    desc: "See your upcoming and past posts in one place. Stay consistent.",
  },
];

const addons = {
  platforms: [
    { name: "Instagram", price: "$1.99" },
    { name: "Facebook", price: "$1.99" },
    { name: "TikTok", price: "$1.99" },
    { name: "X / Twitter", price: "$2.99" },
    { name: "LinkedIn", price: "$1.99" },
    { name: "Pinterest", price: "$1.99" },
  ],
  ai: [
    { name: "AI Content Pipeline", price: "$4.99", desc: "Styling, captions, and scheduling — fully automatic." },
    { name: "Auto-Scheduling", price: "$1.99", desc: "Posts go live at the best time for your audience." },
  ],
  extras: [
    { name: "Advanced Analytics", price: "$1.99", desc: "Full breakdown of clicks, views, referrers, and growth." },
    { name: "Custom Domain", price: "$0.99", desc: "Use your own domain for your Faro page." },
    { name: "Email Marketing", price: "$2.99", desc: "Send campaigns to your Faro email subscribers." },
  ],
};

const bundles = [
  { name: "Starter Pack", price: "$8.99/mo", includes: "1 platform + AI Pipeline + Analytics", save: "$1" },
  { name: "Growth Pack", price: "$16.99/mo", includes: "3 platforms + AI + Scheduling + Analytics", save: "$3" },
  { name: "Full Stack", price: "$24.99/mo", includes: "Everything", save: "$5+" },
];

const competitors = [
  { name: "Feature", guardia: "Guardia", linktree: "Linktree", beacons: "Beacons", later: "Later", buffer: "Buffer" },
  { name: "Free bio page", guardia: true, linktree: true, beacons: true, later: false, buffer: true },
  { name: "Custom themes", guardia: "12 free", linktree: "1 free", beacons: "Limited", later: "With plan", buffer: "Limited" },
  { name: "Email capture", guardia: "Free", linktree: "$9/mo", beacons: "$10/mo", later: "N/A", buffer: "N/A" },
  { name: "Detailed analytics", guardia: "$1.99/mo", linktree: "$9/mo", beacons: "$10/mo", later: "$25/mo", buffer: "$6/ch/mo" },
  { name: "Email marketing", guardia: "$2.99/mo", linktree: "N/A", beacons: "$10/mo", later: "N/A", buffer: "N/A" },
  { name: "Digital products", guardia: "Free + 5%", linktree: true, beacons: "Free + 9%", later: false, buffer: false },
  { name: "AI content styling", guardia: "$4.99/mo", linktree: "N/A", beacons: "N/A", later: "N/A", buffer: "N/A" },
  { name: "AI engagement scoring", guardia: "$4.99/mo", linktree: "N/A", beacons: "N/A", later: "N/A", buffer: "N/A" },
  { name: "Auto-scheduling", guardia: "$1.99/mo", linktree: "N/A", beacons: "N/A", later: "$25/mo", buffer: "$6/ch/mo" },
  { name: "Platform connections", guardia: "From $1.99", linktree: "N/A", beacons: "N/A", later: "From $25/mo", buffer: "$6/ch/mo" },
  { name: "Custom domain", guardia: "$0.99/mo", linktree: "$24/mo", beacons: "N/A", later: "N/A", buffer: "N/A" },
  { name: "Monthly reports", guardia: "Free", linktree: "N/A", beacons: "N/A", later: "$25/mo", buffer: "$6/ch/mo" },
  { name: "SEO-optimized", guardia: true, linktree: false, beacons: true, later: false, buffer: false },
  { name: "Pay for only what you use", guardia: true, linktree: false, beacons: false, later: false, buffer: false },
];

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes. Your Faro page, manual posting, basic analytics, and email capture are free. Not a trial, not freemium. Free. You only pay if you add optional tools from the Chloe Store.",
  },
  {
    q: "What are add-ons?",
    a: "Add-ons are individual tools you can subscribe to from the Chloe Store. Platform connections, AI features, advanced analytics — pick only what you need. Each has its own monthly price. Cancel any of them anytime.",
  },
  {
    q: "How is this different from Linktree?",
    a: "Guardia gives you more for free — email capture, analytics, and manual posting are included. Plus, we offer AI content creation and multi-platform scheduling as affordable add-ons. And your Faro page is SEO-optimized, unlike Linktree.",
  },
  {
    q: "Can I post to Instagram, TikTok, etc.?",
    a: "Yes. Each platform is a separate add-on starting at $1.99/mo. Connect the ones you use, skip the ones you don't. No bundling platforms you don't need.",
  },
  {
    q: "What if I already have a Guardia account?",
    a: "Your account will be upgraded automatically. You'll keep everything you have, and your Faro page will be created from your existing profile. No action needed.",
  },
  {
    q: "Can I cancel add-ons anytime?",
    a: "Yes. Each add-on cancels independently. No contracts, no commitments. Your free features stay forever.",
  },
];

const steps = [
  {
    num: "1",
    title: "Create your page",
    desc: "Sign up in 30 seconds. Your Faro page is live instantly.",
  },
  {
    num: "2",
    title: "Make it yours",
    desc: "Add links, pick a theme, write your bio. Drag to reorder.",
  },
  {
    num: "3",
    title: "Share it everywhere",
    desc: "Drop your link in your bio, email signature, or business card.",
  },
  {
    num: "4",
    title: "Grow with add-ons",
    desc: "When you're ready, add AI posting, platform connections, or analytics from the Store.",
  },
];

/* =============================================================================
   SCROLL REVEAL HOOK
============================================================================= */

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/* =============================================================================
   COMPONENTS
============================================================================= */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#FAF6F1]/95 backdrop-blur-md shadow-[0_1px_3px_rgba(42,42,42,0.08)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <img src="/images/guardia-logo.png" alt="Guardia" className="w-9 h-9 object-contain" />
          <span className="text-[#2A2A2A] font-semibold tracking-tight font-[var(--font-fraunces)]">
            Guardia
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-[#635C54] hover:text-[#2A2A2A] transition-colors">Features</a>
          <a href="#how" className="text-sm text-[#635C54] hover:text-[#2A2A2A] transition-colors">How It Works</a>
          <a href="#addons" className="text-sm text-[#635C54] hover:text-[#2A2A2A] transition-colors">Add-Ons</a>
          <a href="#compare" className="text-sm text-[#635C54] hover:text-[#2A2A2A] transition-colors">Compare</a>
          <a href="#faq" className="text-sm text-[#635C54] hover:text-[#2A2A2A] transition-colors">FAQ</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href="/client" className="text-sm text-[#635C54] hover:text-[#2A2A2A] transition-colors font-medium">
            Log In
          </a>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#4338CA] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#3730A3] transition-all hover:-translate-y-px"
          >
            Create Your Page
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-[#2A2A2A]"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#FAF6F1] border-t border-[#E8DDD3] px-4 py-4 space-y-3">
          <a href="#features" onClick={() => setMobileOpen(false)} className="block text-sm text-[#3D3D3D] py-2">Features</a>
          <a href="#how" onClick={() => setMobileOpen(false)} className="block text-sm text-[#3D3D3D] py-2">How It Works</a>
          <a href="#addons" onClick={() => setMobileOpen(false)} className="block text-sm text-[#3D3D3D] py-2">Add-Ons</a>
          <a href="#compare" onClick={() => setMobileOpen(false)} className="block text-sm text-[#3D3D3D] py-2">Compare</a>
          <a href="#faq" onClick={() => setMobileOpen(false)} className="block text-sm text-[#3D3D3D] py-2">FAQ</a>
          <a href="/client" onClick={() => setMobileOpen(false)} className="block text-sm text-[#635C54] font-medium py-2">Log In</a>
          <a href="/signup" className="block text-center bg-[#4338CA] text-white font-semibold py-3 rounded-xl">
            Create Your Page
          </a>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-[#E8DDD3] rounded-full px-5 py-2.5 mb-8 shadow-[0_2px_8px_rgba(42,42,42,0.06)]">
          <span className="text-sm font-semibold text-[#C9A227]">Free forever</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2A2A2A] mb-6 leading-[1.1] font-[var(--font-fraunces)]">
          Your page. Your links.{" "}
          <span className="text-[#4338CA]">No catch.</span>
        </h1>

        <p className="text-lg md:text-xl text-[#635C54] mb-4 max-w-2xl mx-auto leading-relaxed">
          A bio page, manual posting, analytics, and email capture.
          All free. Add AI tools and platform connections only when you need them.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 mt-10">
          <a
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-[#4338CA] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#3730A3] transition-all hover:-translate-y-px shadow-[0_4px_14px_rgba(67,56,202,0.3)]"
          >
            Create Your Page
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center gap-2 border-[1.5px] border-[#4338CA] text-[#4338CA] font-medium px-8 py-4 rounded-xl hover:bg-[#4338CA]/5 transition-colors"
          >
            See What's Free
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#635C54]">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#C9A227]" />
            <span>No credit card</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#C9A227]" />
            <span>No hidden fees</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#C9A227]" />
            <span>Live in 30 seconds</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function FreeFeatures() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="features" className="py-24 px-6">
      <div ref={ref} className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2A2A2A] mb-4 font-[var(--font-fraunces)]">
            Everything you need. Free.
          </h2>
          <p className="text-[#635C54] text-lg max-w-xl mx-auto">
            Not a trial. Not freemium. These features are yours forever.
          </p>
        </div>

        <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {freeFeatures.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-7 border border-[#E8DDD3] shadow-[0_4px_20px_rgba(42,42,42,0.06)] hover:shadow-[0_8px_40px_rgba(42,42,42,0.1)] transition-shadow"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="w-11 h-11 rounded-lg bg-[#4338CA]/8 flex items-center justify-center mb-5">
                <f.icon className="w-5 h-5 text-[#4338CA]" />
              </div>
              <h3 className="text-lg font-semibold text-[#2A2A2A] mb-2">{f.title}</h3>
              <p className="text-[#635C54] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="how" className="py-24 px-6 bg-[#F0E8E0]">
      <div ref={ref} className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2A2A2A] mb-4 font-[var(--font-fraunces)]">
            Live in 30 seconds.
          </h2>
          <p className="text-[#635C54] text-lg">
            Four steps. No setup fees. No waiting.
          </p>
        </div>

        <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {steps.map((step, i) => (
            <div key={i} className="text-center" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="w-12 h-12 rounded-full bg-[#4338CA] text-white text-lg font-bold flex items-center justify-center mx-auto mb-5">
                {step.num}
              </div>
              <h3 className="text-lg font-semibold text-[#2A2A2A] mb-2 font-[var(--font-fraunces)]">
                {step.title}
              </h3>
              <p className="text-[#635C54] text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIShowcase() {
  const { ref, visible } = useScrollReveal();

  return (
    <section className="py-24 px-6">
      <div ref={ref} className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 border border-[#C9A227]/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-[#C9A227]" />
            <span className="text-sm font-medium text-[#C9A227]">Optional add-on</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2A2A2A] mb-4 font-[var(--font-fraunces)]">
            AI Content Pipeline.
          </h2>
          <p className="text-[#635C54] max-w-2xl mx-auto">
            Send a photo. We style it, write the caption, and post it on schedule.
            $4.99/mo when you're ready for it.
          </p>
        </div>

        <div className={`mt-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <StyleHeroShowcase />
        </div>

        <div className="text-center mt-12">
          <p className="text-[#635C54] mb-4">
            Works for any business. Bakeries, salons, restaurants, fitness — you name it.
          </p>
        </div>
      </div>
    </section>
  );
}

function AddOns() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="addons" className="py-24 px-6 bg-[#F0E8E0]">
      <div ref={ref} className="max-w-5xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2A2A2A] mb-4 font-[var(--font-fraunces)]">
            Pay only for what you use.
          </h2>
          <p className="text-[#635C54] mb-2 max-w-xl mx-auto">
            The Chloe Store. Individual add-ons, each on its own monthly price.
            No bundles forced. Cancel any add-on anytime.
          </p>
        </div>

        <div className={`mt-12 space-y-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Platforms */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-[#4338CA]" />
              <h3 className="text-lg font-semibold text-[#2A2A2A]">Platform Connections</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {addons.platforms.map((a, i) => (
                <div key={i} className="bg-white rounded-xl px-5 py-4 border border-[#E8DDD3] flex items-center justify-between">
                  <span className="text-[#2A2A2A] font-medium text-sm">{a.name}</span>
                  <span className="text-[#4338CA] font-semibold text-sm">{a.price}/mo</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-[#4338CA]" />
              <h3 className="text-lg font-semibold text-[#2A2A2A]">AI Tools</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {addons.ai.map((a, i) => (
                <div key={i} className="bg-white rounded-xl px-5 py-4 border border-[#E8DDD3]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#2A2A2A] font-medium">{a.name}</span>
                    <span className="text-[#4338CA] font-semibold text-sm">{a.price}/mo</span>
                  </div>
                  <p className="text-[#635C54] text-sm">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Extras */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#4338CA]" />
              <h3 className="text-lg font-semibold text-[#2A2A2A]">Extras</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {addons.extras.map((a, i) => (
                <div key={i} className="bg-white rounded-xl px-5 py-4 border border-[#E8DDD3]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#2A2A2A] font-medium text-sm">{a.name}</span>
                    <span className="text-[#4338CA] font-semibold text-sm">{a.price}/mo</span>
                  </div>
                  <p className="text-[#635C54] text-sm">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bundles */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-[#2A2A2A] mb-4 text-center">Save with bundles</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {bundles.map((b, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-[#E8DDD3] text-center">
                  <h4 className="font-semibold text-[#2A2A2A] mb-1">{b.name}</h4>
                  <p className="text-2xl font-bold text-[#4338CA] mb-2">{b.price}</p>
                  <p className="text-sm text-[#635C54] mb-2">{b.includes}</p>
                  <span className="inline-block text-xs font-semibold text-[#C9A227] bg-[#C9A227]/10 px-3 py-1 rounded-full">
                    {b.save}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost examples */}
          <div className="mt-8 bg-white rounded-xl p-6 border border-[#E8DDD3]">
            <h3 className="text-lg font-semibold text-[#2A2A2A] mb-4 text-center">What real creators pay</h3>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#2A2A2A]">$0</p>
                <p className="text-sm text-[#635C54] mt-1">Casual creator. Manual posting, free page.</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#2A2A2A]">~$7</p>
                <p className="text-sm text-[#635C54] mt-1">Growing. Instagram + AI Pipeline.</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#2A2A2A]">~$13</p>
                <p className="text-sm text-[#635C54] mt-1">Serious. 2 platforms + AI + scheduling + analytics.</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#2A2A2A]">~$25</p>
                <p className="text-sm text-[#635C54] mt-1">Full stack. Everything. Still cheaper than competitors.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Comparison() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="compare" className="py-24 px-6">
      <div ref={ref} className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2A2A2A] mb-4 font-[var(--font-fraunces)]">
            More for less.
          </h2>
          <p className="text-[#635C54] text-lg">
            See how Guardia stacks up against the rest.
          </p>
        </div>

        <div className={`relative transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Scroll hint for mobile */}
          <div className="md:hidden text-xs text-[#635C54]/60 text-right mb-2 pr-1">Swipe to compare →</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b-2 border-[#E8DDD3]">
                  <th className="text-left py-3 px-3 text-[#635C54] font-medium sticky left-0 bg-[#FAF6F1] z-10">Feature</th>
                  <th className="text-center py-3 px-3 text-[#4338CA] font-bold">Guardia</th>
                  <th className="text-center py-3 px-3 text-[#635C54] font-medium">Linktree</th>
                  <th className="text-center py-3 px-3 text-[#635C54] font-medium">Beacons</th>
                  <th className="text-center py-3 px-3 text-[#635C54] font-medium">Later</th>
                  <th className="text-center py-3 px-3 text-[#635C54] font-medium">Buffer</th>
                </tr>
              </thead>
              <tbody>
                {competitors.slice(1).map((row, i) => (
                  <tr key={i} className="border-b border-[#E8DDD3]/60">
                    <td className="py-3 px-3 text-[#2A2A2A] font-medium sticky left-0 bg-[#FAF6F1] z-10">{row.name}</td>
                    {[row.guardia, row.linktree, row.beacons, row.later, row.buffer].map((val, j) => (
                      <td key={j} className="py-3 px-3 text-center whitespace-nowrap">
                        {val === true ? (
                          <Check className="w-5 h-5 text-[#C9A227] mx-auto" />
                        ) : val === false ? (
                          <span className="text-[#D4D0CC]">—</span>
                        ) : (
                          <span className={j === 0 ? "font-semibold text-[#4338CA]" : "text-[#635C54]"}>
                            {val as string}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const { ref, visible } = useScrollReveal();

  return (
    <section id="faq" className="py-24 px-6 bg-[#F0E8E0]">
      <div ref={ref} className="max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-[#2A2A2A] text-center mb-12 font-[var(--font-fraunces)]">
          Frequently asked questions
        </h2>

        <div className={`space-y-3 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E8DDD3] overflow-hidden shadow-[0_2px_8px_rgba(42,42,42,0.04)]">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-[#FAF6F1] transition-colors"
              >
                <span className="font-medium text-[#2A2A2A] pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#C9A227] flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  open === i ? "max-h-48" : "max-h-0"
                }`}
              >
                <p className="px-5 pb-5 text-[#635C54] leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#2A2A2A] mb-4 font-[var(--font-fraunces)]">
          Start creating. It's free.
        </h2>
        <p className="text-lg text-[#635C54] mb-2">
          Your Faro page is live the moment you sign up.
        </p>
        <p className="text-lg text-[#2A2A2A] font-medium mb-8">
          Bio page. Links. Analytics. Email capture. All yours.
        </p>

        <a
          href="/signup"
          className="inline-flex items-center gap-2 bg-[#4338CA] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#3730A3] transition-all hover:-translate-y-px shadow-[0_4px_14px_rgba(67,56,202,0.3)] text-lg"
        >
          Create Your Page
          <ArrowRight className="w-5 h-5" />
        </a>

        <p className="mt-6 text-sm text-[#635C54]">
          Free forever &middot; No credit card required
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#E8DDD3] py-12 px-6 bg-[#FAF6F1]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <img src="/images/guardia-logo.png" alt="Guardia" className="w-9 h-9 object-contain" />
          <span className="text-[#2A2A2A] font-semibold font-[var(--font-fraunces)]">Guardia</span>
        </div>

        <p className="text-sm text-[#635C54]">
          &copy; {new Date().getFullYear()} Guardia Content Intelligence &middot; Built in Northumberland, PA
        </p>

        <div className="flex gap-6 text-sm text-[#635C54]">
          <a href="/privacy" className="hover:text-[#2A2A2A] transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-[#2A2A2A] transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}

/* =============================================================================
   PAGE
============================================================================= */

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "Guardia",
      "url": "https://guardiacontent.com",
      "logo": "https://guardiacontent.com/images/guardia-logo.png",
      "description": "Free creator platform with bio pages, manual posting, analytics, and modular add-ons.",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Northumberland",
        "addressRegion": "PA",
        "addressCountry": "US"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "support@guardiacontent.com",
        "contactType": "customer service"
      }
    },
    {
      "@type": "WebSite",
      "name": "Guardia",
      "url": "https://guardiacontent.com"
    },
    {
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    },
    {
      "@type": "SoftwareApplication",
      "name": "Guardia",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free creator platform with bio page, manual posting, analytics, and email capture"
      }
    }
  ]
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F1]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Nav />
      <Hero />
      <FreeFeatures />
      <HowItWorks />
      <AIShowcase />
      <AddOns />
      <Comparison />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
