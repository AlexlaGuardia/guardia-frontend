"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.guardiacontent.com";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    username: "",
    pin: "",
    industry: "general",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "username") {
      setUsernameStatus("idle");
    }
  };

  // Debounced username check
  const checkUsername = useCallback(async (username: string) => {
    if (username.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`${API_BASE}/intake/check-username?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } else {
        setUsernameStatus("idle");
      }
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  const handleSubmit = async () => {
    // Validate
    if (!form.contact_name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (!form.contact_email.trim() || !form.contact_email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (!form.username.trim() || form.username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) {
      setError("Letters, numbers, and underscores only. 3-30 characters.");
      return;
    }
    if (!/^\d{4,6}$/.test(form.pin)) {
      setError("PIN must be 4-6 digits.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const body = {
        ...form,
        business_name: form.business_name.trim() || form.contact_name.trim(),
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim().toLowerCase(),
        username: form.username.trim().toLowerCase(),
      };

      const res = await fetch(`${API_BASE}/intake/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        localStorage.setItem("guardia_jwt", data.token);
        localStorage.setItem("guardia_client_id", data.client_id);
        router.push("/client");
      } else {
        setError(data.detail || "Signup failed. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    }

    setLoading(false);
  };

  const inputClasses =
    "w-full px-4 py-3 bg-[var(--warm-black)] border border-[#2a2520] rounded-xl text-white placeholder-[#6b5f52] focus:outline-none focus:border-[var(--gold-500)] focus:ring-2 focus:ring-[var(--gold-500)]/20 transition-all";

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--warm-black) 0%, var(--warm-charcoal) 50%, var(--warm-black) 100%)" }}
    >
      {/* Gradient orbs matching landing hero */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-30 -top-[15%] -right-[10%]"
        style={{ background: "radial-gradient(circle, rgba(212,168,83,0.35) 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-20 -bottom-[10%] -left-[10%]"
        style={{ background: "radial-gradient(circle, rgba(232,200,122,0.25) 0%, transparent 70%)", filter: "blur(80px)" }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center gap-2 mb-4">
              <img src="/images/guardia-logo.png" alt="Guardia" className="w-8 h-8 object-contain" />
              <span className="text-xl font-semibold text-white font-[var(--font-fraunces)]">Guardia</span>
            </a>
            <h1 className="text-2xl font-bold text-white mt-4 font-[var(--font-fraunces)]">
              Start creating. <span className="text-[var(--gold-500)]">It&rsquo;s free.</span>
            </h1>
            <p className="text-white/50 text-sm mt-2">
              Your bio page, manual posting, and analytics — no credit card, no catch.
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: "rgba(28,25,21,0.8)",
              border: "1px solid rgba(212,168,83,0.12)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-white/60 text-sm mb-2">Your name</label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={(e) => updateField("contact_name", e.target.value)}
                  placeholder="Alex Black"
                  className={inputClasses}
                  disabled={loading}
                />
              </div>

              {/* Business name (optional) */}
              <div>
                <label className="block text-white/60 text-sm mb-2">
                  Business name <span className="text-white/25">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={(e) => updateField("business_name", e.target.value)}
                  placeholder="Your brand or business"
                  className={inputClasses}
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-white/60 text-sm mb-2">Email address</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => updateField("contact_email", e.target.value)}
                  placeholder="you@example.com"
                  className={inputClasses}
                  disabled={loading}
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-white/60 text-sm mb-2">Pick a username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
                      updateField("username", val);
                    }}
                    onBlur={() => form.username.length >= 3 && checkUsername(form.username)}
                    placeholder="yourname"
                    className={`${inputClasses} pr-10`}
                    disabled={loading}
                  />
                  {usernameStatus === "checking" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-[var(--gold-500)] rounded-full animate-spin" />
                    </div>
                  )}
                  {usernameStatus === "available" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {usernameStatus === "taken" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-white/25 text-xs mt-1.5">
                  This becomes guardiacontent.com/faro/{form.username || "yourname"}
                </p>
                {usernameStatus === "taken" && (
                  <p className="text-red-400 text-xs mt-1">That username is taken. Try another.</p>
                )}
              </div>

              {/* PIN */}
              <div>
                <label className="block text-white/60 text-sm mb-2">Create a 4-digit PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={form.pin}
                  onChange={(e) => updateField("pin", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••"
                  className={`${inputClasses} text-center tracking-[0.5em] text-xl`}
                  disabled={loading}
                />
                <p className="text-white/25 text-xs mt-1.5">You&rsquo;ll use this to log in</p>
              </div>

              {/* Error */}
              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || usernameStatus === "taken"}
                className="w-full py-3.5 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2 hover:-translate-y-px"
                style={{
                  background: "var(--gold-500)",
                  color: "var(--warm-black)",
                  boxShadow: "0 4px 20px rgba(212,168,83,0.35)",
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[var(--warm-black)]/30 border-t-[var(--warm-black)] rounded-full animate-spin" />
                    Creating your page...
                  </>
                ) : (
                  "Create my page"
                )}
              </button>
            </div>
          </div>

          {/* Footer links */}
          <div className="text-center mt-6 space-y-3">
            <p className="text-white/30 text-sm">
              Already have an account?{" "}
              <a href="/client" className="text-[var(--gold-500)] hover:text-[var(--gold-300)] transition-colors">
                Log in
              </a>
            </p>
            <p className="text-white/20 text-xs">
              By signing up you agree to our{" "}
              <a href="/terms" className="hover:text-white/40 underline transition-colors">terms</a>
              {" "}and{" "}
              <a href="/privacy" className="hover:text-white/40 underline transition-colors">privacy policy</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
