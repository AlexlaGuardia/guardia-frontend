"use client";

import { useState, useEffect, useRef } from "react";
import StyleHeroShowcase from "@/components/StyleHeroShowcase";
import {
  Camera,
  Palette,
  CalendarCheck,
  Check,
  ChevronDown,
  Zap,
  Star,
  ArrowRight,
  Sparkles,
  Menu,
  X,
  MessageCircle,
} from "lucide-react";

/* =============================================================================
   DATA
============================================================================= */

const tiers = [
  {
    id: "spark",
    name: "Spark",
    price: 15,
    tagline: "Consistent posts without the hassle",
    icon: Zap,
    color: "#C9A227",
    features: [
      "12 styled posts per month",
      "Facebook + Instagram",
      "AI-styled images from your photos",
      "Captions written for you",
      "Scheduled at optimal times",
    ],
    cta: "Start Spark",
    href: "/intake/spark",
  },
  {
    id: "pro",
    name: "Pro",
    price: 25,
    tagline: "Posts + 24-hour engagement management",
    icon: Star,
    color: "#4338CA",
    popular: true,
    features: [
      "20 styled posts per month",
      "Facebook, IG, TikTok + more",
      "24-hour post management after every post",
      "Comment replies & engagement on your behalf",
      "Dedicated style profile",
    ],
    cta: "Get Started",
    href: "/intake/pro",
  },
];

const steps = [
  {
    icon: Camera,
    title: "You send photos.",
    desc: "Your shop, your food, your team. Snap it on your phone and send it over — we take it from there.",
  },
  {
    icon: Palette,
    title: "We make them post-ready.",
    desc: "Professional styling, captions that sound like you, hashtags that work. Scheduled for when your audience is online.",
  },
  {
    icon: MessageCircle,
    title: "We manage the engagement.",
    desc: "After every post goes live, we reply to comments and keep the conversation going for a full day.",
  },
];


const faqs = [
  {
    q: "How fast do I see results?",
    a: "Your first styled post goes live within 48 hours. Most clients see increased engagement within the first two weeks as consistent, professional content starts building momentum.",
  },
  {
    q: "What does 24-hour post management mean?",
    a: "After each post goes live, we monitor comments and reply on your behalf. We thank new followers, answer questions, and keep the conversation going — so you don't have to.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no commitments. Cancel with one click whenever you want.",
  },
  {
    q: "What if I don't like the captions?",
    a: "We learn your voice during onboarding. Most clients approve 90%+ of captions on the first pass. Pro includes unlimited revisions.",
  },
  {
    q: "What platforms do you post to?",
    a: "Spark covers Facebook and Instagram. Pro adds TikTok, YouTube, and more.",
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
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5">
          <img src="/images/guardia-logo.png" alt="Guardia" className="w-9 h-9 object-contain" />
          <span className="text-[#2A2A2A] font-semibold tracking-tight font-[var(--font-fraunces)]">
            Guardia
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-sm text-[#635C54] hover:text-[#2A2A2A] transition-colors">
            How It Works
          </a>
          <a href="#results" className="text-sm text-[#635C54] hover:text-[#2A2A2A] transition-colors">
            Results
          </a>
          <a href="#pricing" className="text-sm text-[#635C54] hover:text-[#2A2A2A] transition-colors">
            Pricing
          </a>
          <a href="#faq" className="text-sm text-[#635C54] hover:text-[#2A2A2A] transition-colors">
            FAQ
          </a>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/client"
            className="text-sm text-[#635C54] hover:text-[#2A2A2A] transition-colors font-medium"
          >
            Client Login
          </a>
          <a
            href="/intake/pro"
            className="inline-flex items-center gap-2 bg-[#4338CA] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#3730A3] transition-all hover:-translate-y-px"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-[#2A2A2A]"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#FAF6F1] border-t border-[#E8DDD3] px-4 py-4 space-y-3">
          <a href="#how" onClick={() => setMobileOpen(false)} className="block text-sm text-[#3D3D3D] py-2">How It Works</a>
          <a href="#results" onClick={() => setMobileOpen(false)} className="block text-sm text-[#3D3D3D] py-2">Results</a>
          <a href="#pricing" onClick={() => setMobileOpen(false)} className="block text-sm text-[#3D3D3D] py-2">Pricing</a>
          <a href="#faq" onClick={() => setMobileOpen(false)} className="block text-sm text-[#3D3D3D] py-2">FAQ</a>
          <a href="/client" onClick={() => setMobileOpen(false)} className="block text-sm text-[#635C54] font-medium py-2">Client Login</a>
          <a
            href="/intake/pro"
            className="block text-center bg-[#4338CA] text-white font-semibold py-3 rounded-xl"
          >
            Get Started
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
        {/* Price anchor badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-[#E8DDD3] rounded-full px-5 py-2.5 mb-8 shadow-[0_2px_8px_rgba(42,42,42,0.06)]">
          <span className="text-sm font-semibold text-[#C9A227]">Starting at $15/month</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2A2A2A] mb-6 leading-[1.1] font-[var(--font-fraunces)]">
          Your photos.{" "}
          <span className="text-[#C9A227]">Styled. Captioned. Posted.</span>
        </h1>

        {/* Subhead */}
        <p className="text-lg md:text-xl text-[#635C54] mb-4 max-w-2xl mx-auto leading-relaxed">
          Send us your photos. We style them, write the captions,
          post on schedule, and handle engagement — so you can run your business.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 mt-10">
          <a
            href="/intake/pro"
            className="inline-flex items-center justify-center gap-2 bg-[#4338CA] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#3730A3] transition-all hover:-translate-y-px shadow-[0_4px_14px_rgba(67,56,202,0.3)]"
          >
            Get Your First Post in 48 Hours
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#results"
            className="inline-flex items-center justify-center gap-2 border-[1.5px] border-[#4338CA] text-[#4338CA] font-medium px-8 py-4 rounded-xl hover:bg-[#4338CA]/5 transition-colors"
          >
            See Results
          </a>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#635C54]">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#C9A227]" />
            <span>No contracts</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#C9A227]" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#C9A227]" />
            <span>Posts live in 48 hours</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="how" className="py-24 px-6">
      <div ref={ref} className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2A2A2A] mb-4 font-[var(--font-fraunces)]">
            How it works.
          </h2>
          <p className="text-[#635C54] text-lg">
            Three steps. Zero effort on your end.
          </p>
        </div>

        <div className={`grid md:grid-cols-3 gap-6 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-8 border border-[#E8DDD3] shadow-[0_4px_20px_rgba(42,42,42,0.08)] hover:shadow-[0_8px_40px_rgba(42,42,42,0.12)] transition-shadow"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-[#C9A227]/10 flex items-center justify-center mb-6">
                <step.icon className="w-6 h-6 text-[#C9A227]" />
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-[#C9A227] font-semibold mb-2">
                <span className="w-6 h-6 rounded-full bg-[#C9A227] text-white text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                Step {i + 1}
              </div>
              <h3 className="text-xl font-semibold text-[#2A2A2A] mb-3 font-[var(--font-fraunces)]">
                {step.title}
              </h3>
              <p className="text-[#635C54] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function StyleShowcase() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="results" className="py-24 px-6 bg-[#F0E8E0]">
      <div ref={ref} className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 border border-[#C9A227]/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-[#C9A227]" />
            <span className="text-sm font-medium text-[#C9A227]">Styled by Guardia</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2A2A2A] mb-4 font-[var(--font-fraunces)]">
            From phone photo to post-ready.
          </h2>
          <p className="text-[#635C54] max-w-2xl mx-auto">
            Your photos, professionally styled and ready to post. Drag to compare.
          </p>
        </div>

        <div className={`mt-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <StyleHeroShowcase />
        </div>

        <div className="text-center mt-12">
          <p className="text-[#635C54] mb-4">
            Works for any business. Bakeries, salons, restaurants, fitness — you name it.
          </p>
          <a
            href="/intake/pro"
            className="inline-flex items-center gap-2 text-[#4338CA] hover:text-[#3730A3] font-medium transition-colors"
          >
            Get your first post in 48 hours
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="pricing" className="py-24 px-6 bg-[#F0E8E0]">
      <div ref={ref} className="max-w-5xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2A2A2A] mb-4 font-[var(--font-fraunces)]">
            Simple pricing. Real results.
          </h2>
          <p className="text-[#635C54] mb-2">
            No hidden fees. No contracts. Cancel anytime.
          </p>
        </div>

        <div className={`mt-12 grid md:grid-cols-2 gap-6 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Spark */}
          <div className="bg-white rounded-2xl p-8 border border-[#E8DDD3] shadow-[0_4px_20px_rgba(42,42,42,0.08)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#C9A227]/10">
                <Zap className="w-5 h-5 text-[#C9A227]" />
              </div>
              <h3 className="text-2xl font-bold text-[#2A2A2A] font-[var(--font-fraunces)]">Spark</h3>
            </div>
            <p className="text-[#635C54] mb-6">{tiers[0].tagline}</p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-[#2A2A2A]">$15</span>
              <span className="text-[#635C54]">/mo</span>
            </div>

            <ul className="space-y-3 mb-8">
              {tiers[0].features.map((feature, j) => (
                <li key={j} className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#C9A227]" />
                  <span className="text-[#3D3D3D]">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="/intake/spark"
              className="block w-full text-center font-semibold py-4 rounded-xl border-2 border-[#C9A227] text-[#C9A227] hover:bg-[#C9A227] hover:text-white transition-all"
            >
              Start Spark
            </a>
          </div>

          {/* Pro */}
          <div className="relative bg-white rounded-2xl p-8 border-2 border-[#4338CA]/30 shadow-[0_12px_48px_rgba(67,56,202,0.12)]">
            <div className="absolute -top-3 left-6">
              <span className="text-xs font-bold px-4 py-1.5 rounded-full bg-[#4338CA] text-white uppercase tracking-wide">
                Most Popular
              </span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#4338CA]/10">
                <Star className="w-5 h-5 text-[#4338CA]" />
              </div>
              <h3 className="text-2xl font-bold text-[#2A2A2A] font-[var(--font-fraunces)]">Pro</h3>
            </div>
            <p className="text-[#635C54] mb-6">{tiers[1].tagline}</p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-[#2A2A2A]">$25</span>
              <span className="text-[#635C54]">/mo</span>
            </div>

            <ul className="space-y-3 mb-8">
              {tiers[1].features.map((feature, j) => (
                <li key={j} className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#4338CA]" />
                  <span className="text-[#3D3D3D]">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="/intake/pro"
              className="block w-full text-center font-semibold py-4 rounded-xl bg-[#4338CA] text-white hover:bg-[#3730A3] transition-all hover:-translate-y-px shadow-[0_4px_14px_rgba(67,56,202,0.3)] text-lg"
            >
              Get Started
            </a>
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
    <section id="faq" className="py-24 px-6">
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
    <section className="py-24 px-6 bg-[#F0E8E0]">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#2A2A2A] mb-4 font-[var(--font-fraunces)]">
          Start posting this week.
        </h2>
        <p className="text-lg text-[#635C54] mb-2">
          Your first styled post goes live within 48 hours.
        </p>
        <p className="text-lg text-[#2A2A2A] font-medium mb-8">
          We write it. We post it. We manage it.
        </p>

        <a
          href="/intake/pro"
          className="inline-flex items-center gap-2 bg-[#4338CA] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#3730A3] transition-all hover:-translate-y-px shadow-[0_4px_14px_rgba(67,56,202,0.3)] text-lg"
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </a>

        <p className="mt-6 text-sm text-[#635C54]">
          From $15/mo &middot; Cancel anytime
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
          <a href="/privacy" className="hover:text-[#2A2A2A] transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-[#2A2A2A] transition-colors">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}

/* =============================================================================
   PAGE
============================================================================= */

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F1]">
      <Nav />
      <Hero />
      <HowItWorks />
      <StyleShowcase />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
