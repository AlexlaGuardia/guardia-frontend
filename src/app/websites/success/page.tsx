"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ArrowRight, FileText, Clock, Mail } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("order_id") ?? null;
  const [order, setOrder] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (orderId) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.guardiacontent.com"}/websites/order/${orderId}`
      )
        .then((res) => res.json())
        .then((data) => setOrder(data))
        .catch((err) => console.error(err));
    }
  }, [orderId]);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Logo */}
      <div
        className={`flex items-center justify-center gap-2.5 mb-10 transition-all duration-500 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        <img
          src="/images/guardia-logo.png"
          alt="Guardia"
          className="w-9 h-9 object-contain"
        />
        <span className="text-xl font-semibold text-[var(--text-primary)]">
          Guardia
        </span>
      </div>

      {/* Success Card */}
      <div
        className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-8 text-center transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
      >
        {/* Icon */}
        <div
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-500 delay-100 ${
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
          style={{ background: "linear-gradient(135deg, #C9A227, #d4b44a)" }}
        >
          <Check className="w-8 h-8 text-white" strokeWidth={3} />
        </div>

        <h1
          className={`text-2xl font-bold text-[var(--text-primary)] mb-3 transition-all duration-500 delay-150 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          Your website is in motion
        </h1>

        <p
          className={`text-[var(--text-secondary)] mb-6 transition-all duration-500 delay-200 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          {order?.business_name
            ? `We're building something great for ${order.business_name}.`
            : "We're building something great for you."}
        </p>

        {orderId && (
          <div
            className={`inline-block rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 mb-6 transition-all duration-500 delay-[220ms] ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="text-xs text-[var(--text-muted)]">Order ID:</span>
            <span className="ml-2 font-mono text-sm font-semibold text-[var(--text-primary)]">
              {orderId}
            </span>
          </div>
        )}

        {/* Steps */}
        <div
          className={`rounded-xl p-5 mb-8 text-left space-y-5 transition-all duration-500 delay-[250ms] ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
          }}
        >
          <h2 className="text-sm font-semibold text-[var(--text-primary)] text-center mb-1">
            What happens next
          </h2>

          <Step
            icon={<Mail className="w-4 h-4 text-[#C9A227]" />}
            number={1}
            title="Check your inbox"
            text="Confirmation email with your receipt and a project questionnaire within 10 minutes."
          />
          <Step
            icon={<FileText className="w-4 h-4 text-[#C9A227]" />}
            number={2}
            title="Fill out the questionnaire"
            text="Tell us about your brand, share your content, and upload your logo and photos."
          />
          <Step
            icon={<Clock className="w-4 h-4 text-[#C9A227]" />}
            number={3}
            title="We get to work"
            text="We'll send you a preview within a few days. Then iterate until it's perfect."
          />
        </div>

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row gap-3 justify-center transition-all duration-500 delay-300 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-all"
          >
            Back to Home
          </a>
          <a
            href="/websites"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white hover:brightness-110 transition-all"
            style={{
              background: "linear-gradient(135deg, #C9A227, #b8911f)",
            }}
          >
            View Website Packages
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Support */}
      <p
        className={`text-center text-sm mt-6 transition-all duration-500 delay-[400ms] ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        style={{ color: "var(--text-muted)" }}
      >
        Questions?{" "}
        <a
          href="mailto:support@guardiacontent.com"
          className="text-[#C9A227] hover:underline"
        >
          support@guardiacontent.com
        </a>
      </p>
    </div>
  );
}

export default function WebsiteSuccessPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-6 py-16">
      <Suspense
        fallback={
          <div className="text-center text-[var(--text-muted)]">
            Loading...
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </main>
  );
}

function Step({
  icon,
  number,
  title,
  text,
}: {
  icon: React.ReactNode;
  number: number;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#C9A227]/10 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <span className="text-xs font-semibold text-[#C9A227] uppercase tracking-wider">
          Step {number}
        </span>
        <h3 className="text-sm font-medium text-[var(--text-primary)] mt-0.5">
          {title}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{text}</p>
      </div>
    </div>
  );
}
