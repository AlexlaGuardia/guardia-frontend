"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Mail, Inbox, Upload } from "lucide-react";

export default function BillingSuccessPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
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
          {/* Success Icon */}
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-500 delay-100 ${
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
            style={{ background: "linear-gradient(135deg, #C9A227, #d4b44a)" }}
          >
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>

          {/* Heading */}
          <h1
            className={`text-2xl font-bold text-[var(--text-primary)] mb-3 transition-all duration-500 delay-150 ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          >
            You&rsquo;re all set
          </h1>

          {/* Subtitle */}
          <p
            className={`text-[var(--text-secondary)] mb-8 transition-all duration-500 delay-200 ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          >
            Check your email for a setup link from Giovanni. Click it, pick
            your style, and your first posts go live this week.
          </p>

          {/* Steps */}
          <div
            className={`rounded-xl p-5 mb-8 text-left space-y-4 transition-all duration-500 delay-[250ms] ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
            }}
          >
            <Step
              icon={<Inbox className="w-4 h-4 text-[#C9A227]" />}
              number={1}
              text="Check your inbox for the welcome email"
            />
            <Step
              icon={<Mail className="w-4 h-4 text-[#C9A227]" />}
              number={2}
              text="Click setup link and create your username + PIN"
            />
            <Step
              icon={<Upload className="w-4 h-4 text-[#C9A227]" />}
              number={3}
              text="Pick your style, upload photos, and watch it happen"
            />
          </div>

          {/* CTA */}
          <Link
            href="/client"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-500 delay-300 hover:brightness-110 ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
            style={{ background: "linear-gradient(135deg, #C9A227, #b8911f)" }}
          >
            Go to Lobby
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Back link */}
        <div
          className={`text-center mt-6 transition-all duration-500 delay-[350ms] ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          <Link
            href="/"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-sm"
          >
            &larr; Back to Homepage
          </Link>
        </div>

        {/* Support */}
        <p
          className={`text-center text-sm mt-4 transition-all duration-500 delay-[400ms] ${
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
    </main>
  );
}

function Step({
  icon,
  number,
  text,
}: {
  icon: React.ReactNode;
  number: number;
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
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">{text}</p>
      </div>
    </div>
  );
}
