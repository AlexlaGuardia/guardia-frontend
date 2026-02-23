"use client";

import { useState, useEffect, useCallback } from "react";
import PortalMain from "./PortalMain";
import TabletMode from "./TabletMode";
import NotificationBubble from "./NotificationBubble";

// ============================================
// TYPES
// ============================================
export interface ClientContext {
  id: string;
  business_name: string;
  contact_name: string;
  tier: "spark" | "pro";
  preferred_style?: string;
  industry?: string;
  pending_uploads: number;
  styled_ready: number;
  scheduled_posts: number;
  posted_this_month: number;
  last_post?: string;
  facebook_connected?: boolean;
  instagram_connected?: boolean;
  needs_platform_setup?: boolean;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  tool?: string | null;
  question_id?: number;
  category?: string;
  answered?: boolean;
}

type AuthState = "loading" | "setup" | "login" | "authenticated";
export type TabletTab = "calendar" | "gallery" | "styles" | "analytics" | "engage" | "account";

const API_BASE = "https://api.guardiacontent.com";

// ============================================
// TIER COLORS
// ============================================
export const tierColors: Record<string, { bg: string; text: string; accent: string }> = {
  spark: { bg: "bg-amber-500/20", text: "text-amber-300", accent: "amber-500" },
  pro: { bg: "bg-blue-500/20", text: "text-blue-300", accent: "blue-500" },
  unleashed: { bg: "bg-violet-500/20", text: "text-violet-300", accent: "violet-500" },
};

// ============================================
// MAIN SHELL
// ============================================
export default function LobbyShell() {
  // Auth state
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [setupToken, setSetupToken] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<{ business_name: string; contact_name: string } | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [client, setClient] = useState<ClientContext | null>(null);

  // Mode state
  const [tabletOpen, setTabletOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabletTab>("calendar");
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  // Chat state (shared so it persists across mode switches)
  const [messages, setMessages] = useState<Message[]>([]);

  // ============================================
  // AUTH INITIALIZATION
  // ============================================
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("setup");

      if (token) {
        try {
          const res = await fetch(`${API_BASE}/client/check-setup/${token}`);
          if (res.ok) {
            const data = await res.json();
            if (data.valid) {
              setSetupToken(token);
              setSetupData({ business_name: data.business_name, contact_name: data.contact_name });
              setAuthState("setup");
              return;
            }
          }
          setAuthState("login");
        } catch {
          setAuthState("login");
        }
        return;
      }

      const storedJwt = localStorage.getItem("guardia_jwt");
      if (storedJwt) {
        try {
          const res = await fetch(`${API_BASE}/client/me`, {
            headers: { Authorization: `Bearer ${storedJwt}` },
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem("guardia_client_id", data.id);
            setJwt(storedJwt);
            setClient(data);
            setAuthState("authenticated");
            await loadContext(storedJwt);
            return;
          }
        } catch {
          // Token invalid
        }
        localStorage.removeItem("guardia_jwt");
        localStorage.removeItem("guardia_client_id");
      }

      setAuthState("login");
    };

    init();
  }, []);

  // ============================================
  // CONTEXT & GREETING
  // ============================================
  const loadContext = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/client/context`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClient(data);
        const greeting = getGreeting(data);
        setMessages([{ role: "assistant", content: greeting }]);
      }
    } catch {
      console.error("Failed to load context");
    }
  }, []);

  const getGreeting = (ctx: ClientContext) => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const name = ctx.contact_name || "there";

    let status = "";
    if (ctx.scheduled_posts > 0) {
      status = ` You have ${ctx.scheduled_posts} post${ctx.scheduled_posts > 1 ? "s" : ""} scheduled.`;
    }
    if (ctx.pending_uploads > 0) {
      status += ` ${ctx.pending_uploads} image${ctx.pending_uploads > 1 ? "s" : ""} awaiting styling.`;
    }

    // Nudge for platform connection
    if (ctx.needs_platform_setup) {
      status += " To start posting automatically, connect your Facebook in the Account tab.";
    }

    return `${timeGreeting}, ${name}! Welcome back.${status} How can I help you today?`;
  };

  // ============================================
  // AUTH HANDLERS
  // ============================================
  const handleAuthSuccess = useCallback(async (token: string, clientData: ClientContext, isSetup: boolean) => {
    localStorage.setItem("guardia_jwt", token);
    localStorage.setItem("guardia_client_id", clientData.id);
    setJwt(token);
    setClient(clientData);
    setAuthState("authenticated");

    if (isSetup) {
      setTabletOpen(true);
      setActiveTab("styles");
      setMessages([{
        role: "assistant",
        content: `Welcome to Guardia, ${clientData.contact_name || "there"}! I've opened your dashboard to get started. Pick a visual style, then upload some photos — your first posts go live this week.`,
      }]);
      window.history.replaceState({}, "", "/client");
    } else {
      await loadContext(token);
    }
  }, [loadContext]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("guardia_jwt");
    localStorage.removeItem("guardia_client_id");
    setJwt(null);
    setClient(null);
    setMessages([]);
    setTabletOpen(false);
    setChatOpen(false);
    setAuthState("login");
  }, []);

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (authState === "loading") {
    return (
      <main className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm">Loading...</p>
        </div>
    </main>
    );
  }

  // ============================================
  // RENDER: SETUP / LOGIN (will add these screens back)
  // ============================================
  if (authState === "setup" || authState === "login") {
    return (
      <AuthScreen
        mode={authState}
        setupToken={setupToken}
        setupData={setupData}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  // ============================================
  // RENDER: AUTHENTICATED — PORTAL + TABLET
  // ============================================
  const handleOpenTablet = (tab?: TabletTab, postId?: number) => {
    if (tab) setActiveTab(tab);
    if (postId) setSelectedPostId(postId);
    setTabletOpen(true);
  };

  return (
    <main className="min-h-screen bg-[var(--bg-surface)] relative overflow-hidden">
      {/* Portal Main (base layer — gallery + widget + message bar) */}
      <div className={`relative z-10 ${tabletOpen ? "pointer-events-none opacity-30 scale-[0.98]" : ""} transition-all duration-300`}>
        <PortalMain
          client={client}
          jwt={jwt}
          messages={messages}
          setMessages={setMessages}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          onOpenTablet={handleOpenTablet}
          onLogout={handleLogout}
        />
      </div>

      {/* Tablet Mode (overlay) */}
      {tabletOpen && (
        <TabletMode
          client={client}
          jwt={jwt}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => { setTabletOpen(false); setSelectedPostId(null); }}
          onMessage={(msg) => {
            setMessages((m) => [...m, { role: "assistant", content: msg }]);
          }}
          selectedPostId={selectedPostId}
        />
      )}

      {/* Notification popups — outcomes + soul questions */}
      <NotificationBubble jwt={jwt} />
    </main>
  );
}

// ============================================
// AUTH SCREEN (simplified placeholder)
// ============================================
interface AuthScreenProps {
  mode: "setup" | "login";
  setupToken: string | null;
  setupData: { business_name: string; contact_name: string } | null;
  onSuccess: (token: string, client: ClientContext, isSetup: boolean) => void;
}

function AuthScreen({ mode, setupToken, setupData, onSuccess }: AuthScreenProps) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Recovery flow
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const handleRecovery = async () => {
    if (!recoveryEmail.trim()) return;
    setRecoveryLoading(true);
    try {
      await fetch(`${API_BASE}/client/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail.trim() }),
      });
      setRecoverySent(true);
    } catch {
      setRecoverySent(true); // Show success anyway (anti-enumeration)
    }
    setRecoveryLoading(false);
  };

  const handleSubmit = async () => {
    if (!username.trim() || pin.length !== 4) {
      setError(mode === "setup" ? "Please enter a username and 4-digit PIN." : "Please enter your username and PIN.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "setup" ? "/client/setup" : "/client/login";
      const body = mode === "setup"
        ? { token: setupToken, username: username.toLowerCase().trim(), pin }
        : { username: username.toLowerCase().trim(), pin };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess(data.token, data.client, mode === "setup");
      } else {
        setError(data.detail || (mode === "setup" ? "Setup failed." : "Invalid username or PIN."));
      }
    } catch {
      setError("Connection error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[var(--bg-surface)] relative overflow-hidden">

      

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <img src="/images/guardia-logo.png" alt="Guardia" className="w-8 h-8 object-contain" />
              <span className="text-xl font-semibold text-[var(--text-primary)]">Guardia</span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-8">
            {/* Giovanni avatar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-semibold"
                style={{ background: 'linear-gradient(135deg, #4338CA, #7c3aed)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                G
              </div>
              <div>
                <div className="text-[var(--text-primary)] font-medium">Giovanni</div>
                <div className="text-[var(--text-secondary)] text-sm">Guardia Assistant</div>
              </div>
            </div>

            {/* Message */}
            <div className="bg-[var(--bg-elevated)] rounded-xl p-4 mb-6">
              {recoveryMode ? (
                recoverySent ? (
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-[var(--text-primary)] font-medium">Check your email!</p>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                      If that email is on file, a new setup link is on the way. Check your spam folder too.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-[var(--text-primary)]">No worries! Enter the email on your account and we&rsquo;ll send a fresh setup link.</p>
                    <p className="text-[var(--text-secondary)] text-sm mt-2">You&rsquo;ll create a new username and PIN from the link.</p>
                  </>
                )
              ) : mode === "setup" ? (
                <>
                  <p className="text-[var(--text-primary)]">
                    Welcome to Guardia, {setupData?.contact_name || "there"}! I&rsquo;m Giovanni, here to get{" "}
                    <span className="text-[var(--accent)] font-medium">{setupData?.business_name}</span> set up.
                  </p>
                  <p className="text-[var(--text-secondary)] text-sm mt-2">
                    Let&rsquo;s set up your login credentials. Choose a username and 4-digit PIN.
                  </p>
                </>
              ) : (
                <p className="text-[var(--text-primary)]">Welcome back! Enter your username and PIN to continue.</p>
              )}
            </div>

            {/* Form */}
            <div className="space-y-4">
              {recoveryMode ? (
                recoverySent ? (
                  <button
                    onClick={() => { setRecoveryMode(false); setRecoverySent(false); setRecoveryEmail(""); }}
                    className="w-full py-3 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-hover)] transition-all"
                  >
                    Back to Login
                  </button>
                ) : (
                  <>
                    <div>
                      <label className="block text-[var(--text-secondary)] text-sm mb-2">Email Address</label>
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] transition-all"
                        onKeyDown={(e) => e.key === "Enter" && handleRecovery()}
                        disabled={recoveryLoading}
                      />
                    </div>
                    <button
                      onClick={handleRecovery}
                      disabled={recoveryLoading || !recoveryEmail.trim()}
                      className="w-full py-3 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {recoveryLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </button>
                    <button
                      onClick={() => setRecoveryMode(false)}
                      className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Back to login
                    </button>
                  </>
                )
              ) : (
                <>
                  <div>
                    <label className="block text-[var(--text-secondary)] text-sm mb-2">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                      placeholder={mode === "setup" ? "e.g. sunnybakery" : "Your username"}
                      className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] transition-all"
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] text-sm mb-2">{mode === "setup" ? "4-Digit PIN" : "PIN"}</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="••••"
                      className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] transition-all text-center tracking-[0.5em] text-xl"
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={loading || !username.trim() || pin.length !== 4}
                    className="w-full py-3 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {mode === "setup" ? "Setting up..." : "Signing in..."}
                      </>
                    ) : (
                      mode === "setup" ? "Continue" : "Sign In"
                    )}
                  </button>

                  {mode === "login" && (
                    <button
                      onClick={() => setRecoveryMode(true)}
                      className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      Forgot your PIN?
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <p className="text-center text-[var(--text-muted)] text-sm mt-6">
            Need help? Contact{" "}
            <a href="mailto:support@guardiacontent.com" className="text-[var(--accent)] hover:underline">
              support@guardiacontent.com
            </a>
          </p>

          <div className="text-center mt-4">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[var(--accent)] border border-[var(--accent)]/30 rounded-xl hover:bg-[var(--accent)]/10 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Get Started
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
