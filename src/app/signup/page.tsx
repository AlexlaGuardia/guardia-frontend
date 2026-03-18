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

  return (
    <main className="min-h-screen bg-[#050506] relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center gap-2 mb-4">
              <img src="/images/guardia-logo.png" alt="Guardia" className="w-8 h-8 object-contain" />
              <span className="text-xl font-semibold text-white">Guardia</span>
            </a>
            <h1 className="text-2xl font-bold text-white mt-4">Start creating. It&rsquo;s free.</h1>
            <p className="text-[#a1a1aa] text-sm mt-2">
              Your bio page, manual posting, and basic analytics — no credit card, no catch.
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#0d0d0e] border border-[#1e1e22] rounded-2xl p-8">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[#a1a1aa] text-sm mb-2">Your name</label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={(e) => updateField("contact_name", e.target.value)}
                  placeholder="Alex Black"
                  className="w-full px-4 py-3 bg-[#050506] border border-[#1e1e22] rounded-xl text-white placeholder-[#52525b] focus:outline-none focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/20 transition-all"
                  disabled={loading}
                />
              </div>

              {/* Business name (optional) */}
              <div>
                <label className="block text-[#a1a1aa] text-sm mb-2">
                  Business name <span className="text-[#52525b]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={(e) => updateField("business_name", e.target.value)}
                  placeholder="Your brand or business"
                  className="w-full px-4 py-3 bg-[#050506] border border-[#1e1e22] rounded-xl text-white placeholder-[#52525b] focus:outline-none focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/20 transition-all"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[#a1a1aa] text-sm mb-2">Email address</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => updateField("contact_email", e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-[#050506] border border-[#1e1e22] rounded-xl text-white placeholder-[#52525b] focus:outline-none focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/20 transition-all"
                  disabled={loading}
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-[#a1a1aa] text-sm mb-2">Pick a username</label>
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
                    className="w-full px-4 py-3 bg-[#050506] border border-[#1e1e22] rounded-xl text-white placeholder-[#52525b] focus:outline-none focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/20 transition-all pr-10"
                    disabled={loading}
                  />
                  {usernameStatus === "checking" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-[#52525b] border-t-[#a78bfa] rounded-full animate-spin" />
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
                <p className="text-[#52525b] text-xs mt-1.5">
                  This becomes guardia.page/{form.username || "yourname"}
                </p>
                {usernameStatus === "taken" && (
                  <p className="text-red-400 text-xs mt-1">That username is taken. Try another.</p>
                )}
              </div>

              {/* PIN */}
              <div>
                <label className="block text-[#a1a1aa] text-sm mb-2">Create a 4-digit PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={form.pin}
                  onChange={(e) => updateField("pin", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••"
                  className="w-full px-4 py-3 bg-[#050506] border border-[#1e1e22] rounded-xl text-white placeholder-[#52525b] focus:outline-none focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/20 transition-all text-center tracking-[0.5em] text-xl"
                  disabled={loading}
                />
                <p className="text-[#52525b] text-xs mt-1.5">You&rsquo;ll use this to log in</p>
              </div>

              {/* Error */}
              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || usernameStatus === "taken"}
                className="w-full py-3 bg-[#a78bfa] text-white font-semibold rounded-xl hover:bg-[#8b5cf6] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            <p className="text-[#52525b] text-sm">
              Already have an account?{" "}
              <a href="/client" className="text-[#a78bfa] hover:underline">
                Log in
              </a>
            </p>
            <p className="text-[#3f3f46] text-xs">
              By signing up you agree to our{" "}
              <a href="/terms" className="hover:text-[#52525b] underline">terms</a>
              {" "}and{" "}
              <a href="/privacy" className="hover:text-[#52525b] underline">privacy policy</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
