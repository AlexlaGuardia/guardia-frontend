"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
  Zap,
  Shield,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/* =============================================================================
   DATA
============================================================================= */

const freeFeatures = [
  {
    icon: Link2,
    title: "Faro bio page",
    desc: "Your link-in-bio at yourname.guardia.page. 6 themes, unlimited links, social icons.",
    span: "col-span-2",
  },
  {
    icon: Send,
    title: "Manual posting",
    desc: "Upload a photo, write a caption, post to your connected platforms. No limits.",
    span: "col-span-1",
  },
  {
    icon: BarChart3,
    title: "Basic analytics",
    desc: "Page views, link clicks, and referrers. Know what's working.",
    span: "col-span-1",
  },
  {
    icon: Mail,
    title: "Email capture",
    desc: "Collect subscriber emails right from your Faro page. Export anytime.",
    span: "col-span-1",
  },
  {
    icon: Palette,
    title: "6 clean themes",
    desc: "From minimal to bold. Pick a theme, customize your page, publish in minutes.",
    span: "col-span-1",
  },
  {
    icon: Calendar,
    title: "Content calendar",
    desc: "See your upcoming and past posts in one place. Stay consistent.",
    span: "col-span-2",
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
    icon: Zap,
  },
  {
    num: "2",
    title: "Make it yours",
    desc: "Add links, pick a theme, write your bio. Drag to reorder.",
    icon: Palette,
  },
  {
    num: "3",
    title: "Share it everywhere",
    desc: "Drop your link in your bio, email signature, or business card.",
    icon: Globe,
  },
  {
    num: "4",
    title: "Grow with add-ons",
    desc: "When you're ready, add AI posting, platform connections, or analytics from the Store.",
    icon: TrendingUp,
  },
];

/* =============================================================================
   HOOKS
============================================================================= */

function useGsapReveal(containerRef: React.RefObject<HTMLElement | HTMLDivElement | null>) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const children = el.querySelectorAll(".gsap-reveal");
    if (children.length === 0) return;

    gsap.set(children, { opacity: 0, y: 50 });

    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      onEnter: () => {
        gsap.to(children, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power2.out",
        });
      },
      once: true,
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [containerRef]);
}

function useTilt(cardRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const card = cardRef.current;
    if (!card || window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    };

    const onLeave = () => {
      card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
    };

    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    return () => {
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, [cardRef]);
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
          ? "bg-[var(--cream)]/95 backdrop-blur-md shadow-[0_1px_3px_rgba(42,42,42,0.08)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <img src="/images/guardia-logo.png" alt="Guardia" className="w-9 h-9 object-contain" />
          <span
            className={`font-semibold tracking-tight font-[var(--font-fraunces)] transition-colors duration-300 ${
              scrolled ? "text-[var(--charcoal)]" : "text-white"
            }`}
          >
            Guardia
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "How It Works", "Add-Ons", "Compare", "FAQ"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "").replace("add-ons", "addons")}`}
              className={`text-sm transition-colors ${
                scrolled
                  ? "text-[var(--warmgray)] hover:text-[var(--charcoal)]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="/client"
            className={`text-sm font-medium transition-colors ${
              scrolled
                ? "text-[var(--warmgray)] hover:text-[var(--charcoal)]"
                : "text-white/70 hover:text-white"
            }`}
          >
            Log In
          </a>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 bg-[var(--gold-500)] text-[var(--warm-black)] text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[var(--gold-300)] transition-all hover:-translate-y-px shadow-[0_4px_14px_rgba(212,168,83,0.35)]"
          >
            Create Your Page
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden p-2 transition-colors ${scrolled ? "text-[var(--charcoal)]" : "text-white"}`}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[var(--cream)] border-t border-[var(--parchment)] px-4 py-4 space-y-3">
          {["Features", "How It Works", "Add-Ons", "Compare", "FAQ"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "").replace("add-ons", "addons")}`}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-[var(--charcoal-light)] py-2"
            >
              {item}
            </a>
          ))}
          <a href="/client" onClick={() => setMobileOpen(false)} className="block text-sm text-[var(--warmgray)] font-medium py-2">
            Log In
          </a>
          <a href="/signup" className="block text-center bg-[var(--gold-500)] text-[var(--warm-black)] font-semibold py-3 rounded-xl">
            Create Your Page
          </a>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Parallax orbs on scroll
    const orbs = el.querySelectorAll(".hero-orb");
    orbs.forEach((orb, i) => {
      gsap.to(orb, {
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
        y: i % 2 === 0 ? -80 : -120,
      });
    });

    // Hero content entrance
    const content = el.querySelector(".hero-content");
    if (content) {
      gsap.from(content.children, {
        opacity: 0,
        y: 40,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
        delay: 0.2,
      });
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100vh] flex items-center justify-center px-6 overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--warm-black) 0%, var(--warm-charcoal) 50%, var(--warm-black) 100%)" }}
    >
      {/* Gradient orbs */}
      <div className="hero-orb animate-orb-drift absolute w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full opacity-40 -top-[15%] -right-[10%]"
        style={{ background: "radial-gradient(circle, rgba(212,168,83,0.45) 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      <div className="hero-orb animate-orb-drift-reverse absolute w-[400px] h-[400px] md:w-[550px] md:h-[550px] rounded-full opacity-30 -bottom-[10%] -left-[10%]"
        style={{ background: "radial-gradient(circle, rgba(232,200,122,0.35) 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      <div className="hero-orb absolute w-[300px] h-[300px] rounded-full opacity-20 top-[40%] left-[50%] -translate-x-1/2"
        style={{ background: "radial-gradient(circle, rgba(252,182,159,0.3) 0%, transparent 70%)", filter: "blur(60px)" }}
      />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="hero-content relative z-10 max-w-4xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 glass-dark rounded-full px-5 py-2.5 mb-8">
          <div className="w-2 h-2 rounded-full bg-[var(--gold-500)] animate-pulse" />
          <span className="text-sm font-semibold text-[var(--gold-300)]">Free forever</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.08] font-[var(--font-fraunces)]">
          Your page. Your links.{" "}
          <span className="text-gradient-gold">No catch.</span>
        </h1>

        <p className="text-lg md:text-xl text-white/60 mb-4 max-w-2xl mx-auto leading-relaxed">
          A bio page, manual posting, analytics, and email capture.
          All free. Add AI tools and platform connections only when you need them.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 mt-10">
          <a
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-[var(--gold-500)] text-[var(--warm-black)] font-semibold px-8 py-4 rounded-xl hover:bg-[var(--gold-300)] transition-all hover:-translate-y-px shadow-[0_4px_24px_rgba(212,168,83,0.4)]"
          >
            Create Your Page
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center gap-2 border-[1.5px] border-white/20 text-white/80 font-medium px-8 py-4 rounded-xl hover:bg-white/5 hover:border-white/30 transition-all"
          >
            See What's Free
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
          {["No credit card", "No hidden fees", "Live in 30 seconds"].map((text) => (
            <div key={text} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--gold-500)]" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade to cream */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--cream)] to-transparent" />
    </section>
  );
}

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref);
  return (
    <div ref={ref} className={`transition-transform duration-150 ease-out ${className}`} style={{ transformStyle: "preserve-3d" }}>
      {children}
    </div>
  );
}

function FreeFeatures() {
  const sectionRef = useRef<HTMLElement>(null);
  useGsapReveal(sectionRef);

  return (
    <section id="features" ref={sectionRef} className="relative py-28 px-6 overflow-hidden">
      {/* Subtle orb behind features */}
      <div className="absolute w-[500px] h-[500px] rounded-full opacity-20 top-[20%] right-[-10%] animate-orb-drift"
        style={{ background: "radial-gradient(circle, rgba(212,168,83,0.25) 0%, transparent 70%)", filter: "blur(80px)" }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16 gsap-reveal">
          <h2 className="text-3xl md:text-5xl font-bold text-[var(--charcoal)] mb-4 font-[var(--font-fraunces)]">
            Everything you need. <span className="text-gradient-gold">Free.</span>
          </h2>
          <p className="text-[var(--warmgray)] text-lg max-w-xl mx-auto">
            Not a trial. Not freemium. These features are yours forever.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {freeFeatures.map((f, i) => (
            <TiltCard
              key={i}
              className={`gsap-reveal ${f.span === "col-span-2" ? "md:col-span-2" : "md:col-span-1"}`}
            >
              <div className="gradient-border rounded-2xl p-7 bg-[var(--warm-white)] shadow-[var(--shadow-elevated)] hover:shadow-[var(--shadow-floating)] transition-shadow duration-300 h-full">
                <div className="w-11 h-11 rounded-xl bg-[var(--gold-500)]/10 flex items-center justify-center mb-5" style={{ transform: "translateZ(20px)" }}>
                  <f.icon className="w-5 h-5 text-[var(--gold-500)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--charcoal)] mb-2">{f.title}</h3>
                <p className="text-[var(--warmgray)] text-sm leading-relaxed">{f.desc}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  useGsapReveal(sectionRef);

  return (
    <section id="howitworks" ref={sectionRef} className="py-28 px-6 bg-[var(--linen)]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 gsap-reveal">
          <h2 className="text-3xl md:text-5xl font-bold text-[var(--charcoal)] mb-4 font-[var(--font-fraunces)]">
            Live in <span className="text-gradient-gold">30 seconds.</span>
          </h2>
          <p className="text-[var(--warmgray)] text-lg">
            Four steps. No setup fees. No waiting.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="gsap-reveal text-center group">
              <div className="w-14 h-14 rounded-2xl bg-[var(--warm-black)] text-[var(--gold-300)] text-lg font-bold flex items-center justify-center mx-auto mb-5 shadow-[0_4px_20px_rgba(28,25,21,0.25)] group-hover:scale-110 transition-transform duration-200">
                <step.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--charcoal)] mb-2 font-[var(--font-fraunces)]">
                {step.title}
              </h3>
              <p className="text-[var(--warmgray)] text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  useGsapReveal(sectionRef);

  return (
    <section ref={sectionRef} className="relative py-28 px-6 overflow-hidden">
      {/* Subtle orb */}
      <div className="absolute w-[400px] h-[400px] rounded-full opacity-15 bottom-[10%] left-[-5%] animate-orb-drift-reverse"
        style={{ background: "radial-gradient(circle, rgba(252,182,159,0.3) 0%, transparent 70%)", filter: "blur(70px)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-6 gsap-reveal">
          <div className="inline-flex items-center gap-2 bg-[var(--gold-500)]/10 border border-[var(--gold-500)]/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-[var(--gold-500)]" />
            <span className="text-sm font-medium text-[var(--gold-500)]">Optional add-on</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[var(--charcoal)] mb-4 font-[var(--font-fraunces)]">
            AI Content <span className="text-gradient-gold">Pipeline.</span>
          </h2>
          <p className="text-[var(--warmgray)] max-w-2xl mx-auto text-lg">
            Send a photo. We style it, write the caption, and post it on schedule.
            $4.99/mo when you're ready for it.
          </p>
        </div>

        <div className="mt-12 gsap-reveal">
          <StyleHeroShowcase />
        </div>

        <div className="text-center mt-12 gsap-reveal">
          <p className="text-[var(--warmgray)]">
            Works for any business. Bakeries, salons, restaurants, fitness — you name it.
          </p>
        </div>
      </div>
    </section>
  );
}

function AddOns() {
  const sectionRef = useRef<HTMLElement>(null);
  useGsapReveal(sectionRef);

  return (
    <section id="addons" ref={sectionRef} className="py-28 px-6 bg-[var(--linen)]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-4 gsap-reveal">
          <h2 className="text-3xl md:text-5xl font-bold text-[var(--charcoal)] mb-4 font-[var(--font-fraunces)]">
            Pay only for <span className="text-gradient-gold">what you use.</span>
          </h2>
          <p className="text-[var(--warmgray)] mb-2 max-w-xl mx-auto text-lg">
            The Chloe Store. Individual add-ons, each on its own monthly price.
            No bundles forced. Cancel any add-on anytime.
          </p>
        </div>

        <div className="mt-12 space-y-10">
          {/* Platforms */}
          <div className="gsap-reveal">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-[var(--gold-500)]" />
              <h3 className="text-lg font-semibold text-[var(--charcoal)]">Platform Connections</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {addons.platforms.map((a, i) => (
                <div key={i} className="glass-warm rounded-xl px-5 py-4 flex items-center justify-between shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)] transition-shadow duration-200">
                  <span className="text-[var(--charcoal)] font-medium text-sm">{a.name}</span>
                  <span className="text-[var(--gold-500)] font-semibold text-sm">{a.price}/mo</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI */}
          <div className="gsap-reveal">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-[var(--gold-500)]" />
              <h3 className="text-lg font-semibold text-[var(--charcoal)]">AI Tools</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {addons.ai.map((a, i) => (
                <div key={i} className="glass-warm rounded-xl px-5 py-4 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)] transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[var(--charcoal)] font-medium">{a.name}</span>
                    <span className="text-[var(--gold-500)] font-semibold text-sm">{a.price}/mo</span>
                  </div>
                  <p className="text-[var(--warmgray)] text-sm">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Extras */}
          <div className="gsap-reveal">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[var(--gold-500)]" />
              <h3 className="text-lg font-semibold text-[var(--charcoal)]">Extras</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {addons.extras.map((a, i) => (
                <div key={i} className="glass-warm rounded-xl px-5 py-4 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)] transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[var(--charcoal)] font-medium text-sm">{a.name}</span>
                    <span className="text-[var(--gold-500)] font-semibold text-sm">{a.price}/mo</span>
                  </div>
                  <p className="text-[var(--warmgray)] text-sm">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bundles */}
          <div className="mt-8 gsap-reveal">
            <h3 className="text-lg font-semibold text-[var(--charcoal)] mb-4 text-center">Save with bundles</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {bundles.map((b, i) => (
                <TiltCard key={i}>
                  <div className="gradient-border rounded-2xl p-6 bg-[var(--warm-white)] shadow-[var(--shadow-elevated)] text-center h-full">
                    <h4 className="font-semibold text-[var(--charcoal)] mb-1">{b.name}</h4>
                    <p className="text-2xl font-bold text-gradient-gold mb-2">{b.price}</p>
                    <p className="text-sm text-[var(--warmgray)] mb-2">{b.includes}</p>
                    <span className="inline-block text-xs font-semibold text-[var(--gold-500)] bg-[var(--gold-500)]/10 px-3 py-1 rounded-full">
                      Save {b.save}
                    </span>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>

          {/* Cost examples */}
          <div className="mt-8 gsap-reveal">
            <div className="gradient-border rounded-2xl p-6 bg-[var(--warm-white)] shadow-[var(--shadow-elevated)]">
              <h3 className="text-lg font-semibold text-[var(--charcoal)] mb-4 text-center">What real creators pay</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { amount: "$0", desc: "Casual creator. Manual posting, free page." },
                  { amount: "~$7", desc: "Growing. Instagram + AI Pipeline." },
                  { amount: "~$13", desc: "Serious. 2 platforms + AI + scheduling + analytics." },
                  { amount: "~$25", desc: "Full stack. Everything. Still cheaper than competitors." },
                ].map((ex, i) => (
                  <div key={i}>
                    <p className="text-2xl font-bold text-gradient-gold">{ex.amount}</p>
                    <p className="text-sm text-[var(--warmgray)] mt-1">{ex.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Comparison() {
  const sectionRef = useRef<HTMLElement>(null);
  useGsapReveal(sectionRef);

  return (
    <section id="compare" ref={sectionRef} className="relative py-28 px-6 overflow-hidden">
      <div className="absolute w-[400px] h-[400px] rounded-full opacity-15 top-[10%] left-[-8%] animate-orb-drift"
        style={{ background: "radial-gradient(circle, rgba(212,168,83,0.2) 0%, transparent 70%)", filter: "blur(70px)" }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12 gsap-reveal">
          <h2 className="text-3xl md:text-5xl font-bold text-[var(--charcoal)] mb-4 font-[var(--font-fraunces)]">
            More for <span className="text-gradient-gold">less.</span>
          </h2>
          <p className="text-[var(--warmgray)] text-lg">
            See how Guardia stacks up against the rest.
          </p>
        </div>

        <div className="gsap-reveal gradient-border rounded-2xl overflow-hidden bg-[var(--warm-white)] shadow-[var(--shadow-elevated)]">
          <div className="md:hidden text-xs text-[var(--warmgray)]/60 text-right p-3 pb-0">Swipe to compare →</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b-2 border-[var(--parchment)]">
                  <th className="text-left py-4 px-4 text-[var(--warmgray)] font-medium sticky left-0 bg-[var(--warm-white)] z-10">Feature</th>
                  <th className="text-center py-4 px-4 text-[var(--gold-500)] font-bold">Guardia</th>
                  <th className="text-center py-4 px-4 text-[var(--warmgray)] font-medium">Linktree</th>
                  <th className="text-center py-4 px-4 text-[var(--warmgray)] font-medium">Beacons</th>
                  <th className="text-center py-4 px-4 text-[var(--warmgray)] font-medium">Later</th>
                  <th className="text-center py-4 px-4 text-[var(--warmgray)] font-medium">Buffer</th>
                </tr>
              </thead>
              <tbody>
                {competitors.slice(1).map((row, i) => (
                  <tr key={i} className="border-b border-[var(--parchment)]/40 hover:bg-[var(--gold-500)]/[0.03] transition-colors">
                    <td className="py-3.5 px-4 text-[var(--charcoal)] font-medium sticky left-0 bg-[var(--warm-white)] z-10">{row.name}</td>
                    {[row.guardia, row.linktree, row.beacons, row.later, row.buffer].map((val, j) => (
                      <td key={j} className="py-3.5 px-4 text-center whitespace-nowrap">
                        {val === true ? (
                          <Check className="w-5 h-5 text-[var(--gold-500)] mx-auto" />
                        ) : val === false ? (
                          <span className="text-[var(--parchment)]">—</span>
                        ) : (
                          <span className={j === 0 ? "font-semibold text-[var(--gold-500)]" : "text-[var(--warmgray)]"}>
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
  const sectionRef = useRef<HTMLElement>(null);
  useGsapReveal(sectionRef);

  return (
    <section id="faq" ref={sectionRef} className="py-28 px-6 bg-[var(--linen)]">
      <div className="max-w-2xl mx-auto">
        <h2 className="gsap-reveal text-3xl md:text-5xl font-bold text-[var(--charcoal)] text-center mb-12 font-[var(--font-fraunces)]">
          Frequently asked <span className="text-gradient-gold">questions</span>
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="gsap-reveal gradient-border rounded-2xl overflow-hidden bg-[var(--warm-white)] shadow-[var(--shadow-soft)]">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-[var(--gold-500)]/[0.03] transition-colors"
              >
                <span className="font-medium text-[var(--charcoal)] pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[var(--gold-500)] flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  open === i ? "max-h-48" : "max-h-0"
                }`}
              >
                <p className="px-5 pb-5 text-[var(--warmgray)] leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const orbs = el.querySelectorAll(".cta-orb");
    orbs.forEach((orb, i) => {
      gsap.to(orb, {
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          end: "bottom top",
          scrub: 1,
        },
        y: i % 2 === 0 ? -40 : -60,
      });
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-32 px-6 overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--warm-black) 0%, var(--warm-charcoal) 50%, var(--warm-black) 100%)" }}
    >
      {/* Orbs */}
      <div className="cta-orb animate-orb-drift-reverse absolute w-[400px] h-[400px] rounded-full opacity-30 -top-[20%] right-[10%]"
        style={{ background: "radial-gradient(circle, rgba(212,168,83,0.35) 0%, transparent 70%)", filter: "blur(70px)" }}
      />
      <div className="cta-orb animate-orb-drift absolute w-[350px] h-[350px] rounded-full opacity-20 bottom-[-15%] left-[5%]"
        style={{ background: "radial-gradient(circle, rgba(232,200,122,0.3) 0%, transparent 70%)", filter: "blur(60px)" }}
      />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-[var(--font-fraunces)]">
          Start creating. <span className="text-gradient-gold">It's free.</span>
        </h2>
        <p className="text-lg text-white/50 mb-2">
          Your Faro page is live the moment you sign up.
        </p>
        <p className="text-lg text-white/80 font-medium mb-8">
          Bio page. Links. Analytics. Email capture. All yours.
        </p>

        <a
          href="/signup"
          className="inline-flex items-center gap-2 bg-[var(--gold-500)] text-[var(--warm-black)] font-semibold px-8 py-4 rounded-xl hover:bg-[var(--gold-300)] transition-all hover:-translate-y-px shadow-[0_4px_24px_rgba(212,168,83,0.4)] text-lg"
        >
          Create Your Page
          <ArrowRight className="w-5 h-5" />
        </a>

        <p className="mt-6 text-sm text-white/30">
          Free forever &middot; No credit card required
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 px-6" style={{ background: "var(--warm-black)" }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <img src="/images/guardia-logo.png" alt="Guardia" className="w-9 h-9 object-contain" />
          <span className="text-white font-semibold font-[var(--font-fraunces)]">Guardia</span>
        </div>

        <p className="text-sm text-white/40">
          &copy; {new Date().getFullYear()} Guardia Content Intelligence &middot; Built in Northumberland, PA
        </p>

        <div className="flex gap-6 text-sm text-white/40">
          <a href="/privacy" className="hover:text-white/70 transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-white/70 transition-colors">Terms</a>
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
    <main className="min-h-screen bg-[var(--cream)]">
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
