"use client";

import { useState, useEffect, useCallback } from "react";
import TopBar, { Screen } from "./TopBar";
import BottomTabs from "./BottomTabs";
import FeedScreen from "./FeedScreen";
import PostDetail from "./PostDetail";
import CalendarScreen from "./CalendarScreen";
import StatsScreen from "./StatsScreen";
import AccountScreen from "./AccountScreen";
import GioChatScreen from "./GioChatScreen";
import GioChatPanel from "./GioChatPanel";
import PostComposerScreen from "./PostComposerScreen";
import FaroScreen from "./FaroScreen";
import StoreScreen from "./StoreScreen";
import { useGioChat } from "./chat-logic";
import { useGioNotifications } from "@/hooks/useGioNotifications";
import type { GioClient } from "./types";
import type { PostedItem } from "./PostCard";

const API_BASE = "https://api.guardiacontent.com";

// ============================================
// AUTH SCREEN (from LobbyShell)
// ============================================
interface AuthScreenProps {
  mode: "setup" | "login";
  setupToken: string | null;
  setupData: { business_name: string; contact_name: string } | null;
  onSuccess: (token: string, client: GioClient, isSetup: boolean) => void;
}

function AuthScreen({ mode, setupToken, setupData, onSuccess }: AuthScreenProps) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
      setRecoverySent(true);
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
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <img src="/images/guardia-logo.png" alt="Guardia" className="w-8 h-8 object-contain" />
              <span className="text-xl font-semibold text-[var(--text-primary)]">Guardia</span>
            </div>
          </div>

          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-semibold"
                style={{ background: "linear-gradient(135deg, #4338CA, #7c3aed)", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }}>
                G
              </div>
              <div>
                <div className="text-[var(--text-primary)] font-medium">Giovanni</div>
                <div className="text-[var(--text-secondary)] text-sm">Guardia Assistant</div>
              </div>
            </div>

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
                      <input type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] transition-all"
                        onKeyDown={(e) => e.key === "Enter" && handleRecovery()}
                        disabled={recoveryLoading}
                      />
                    </div>
                    <button onClick={handleRecovery} disabled={recoveryLoading || !recoveryEmail.trim()}
                      className="w-full py-3 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                      {recoveryLoading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                      ) : "Send Reset Link"}
                    </button>
                    <button onClick={() => setRecoveryMode(false)}
                      className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      Back to login
                    </button>
                  </>
                )
              ) : (
                <>
                  <div>
                    <label className="block text-[var(--text-secondary)] text-sm mb-2">Username</label>
                    <input type="text" value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                      placeholder={mode === "setup" ? "e.g. sunnybakery" : "Your username"}
                      className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] transition-all"
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] text-sm mb-2">{mode === "setup" ? "4-Digit PIN" : "PIN"}</label>
                    <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4}
                      value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="••••"
                      className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] transition-all text-center tracking-[0.5em] text-xl"
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</div>
                  )}
                  <button onClick={handleSubmit} disabled={loading || !username.trim() || pin.length !== 4}
                    className="w-full py-3 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{mode === "setup" ? "Setting up..." : "Signing in..."}</>
                    ) : mode === "setup" ? "Continue" : "Sign In"}
                  </button>
                  {mode === "login" && (
                    <button onClick={() => setRecoveryMode(true)}
                      className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                      Forgot your PIN?
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="text-center mt-6 space-y-3">
            <p className="text-[var(--text-secondary)] text-sm">
              Don&rsquo;t have an account?{" "}
              <a href="/signup" className="text-[var(--accent)] hover:underline font-medium">Sign up free</a>
            </p>
            <p className="text-[var(--text-muted)] text-sm">
              Need help? Contact{" "}
              <a href="mailto:support@guardiacontent.com" className="text-[var(--accent)] hover:underline">support@guardiacontent.com</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================
// PLACEHOLDER — replaced by SCC-2/3/4/5
// ============================================
function PlaceholderScreen({ icon, title, subtitle, color }: { icon: string; title: string; subtitle: string; color: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    violet: { bg: "bg-violet-500/10", text: "text-violet-400" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400" },
  };
  const c = colorMap[color] || colorMap.violet;
  const iconPaths: Record<string, string> = {
    link: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    plus: "M12 4v16m8-8H4",
    store: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  };
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${c.bg} flex items-center justify-center`}>
          <svg className={`w-8 h-8 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPaths[icon] || iconPaths.link} />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{title}</h2>
        <p className="text-[var(--text-secondary)]">{subtitle}</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN APP SHELL
// ============================================
export default function AppShell() {
  // Auth state
  const [authState, setAuthState] = useState<"loading" | "setup" | "login" | "authenticated">("loading");
  const [setupToken, setSetupToken] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<{ business_name: string; contact_name: string } | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [client, setClient] = useState<GioClient | null>(null);

  // Screen routing
  const [activeScreen, setActiveScreen] = useState<Screen>("feed");
  const [selectedPost, setSelectedPost] = useState<PostedItem | null>(null);

  // Post tab: calendar/composer toggle
  const [showComposer, setShowComposer] = useState(false);
  const [composerDate, setComposerDate] = useState<string | null>(null);

  // Gio sidebar collapse (desktop/tablet)
  const [gioSidebarOpen, setGioSidebarOpen] = useState(true);

  // Responsive
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      setIsDesktop(window.innerWidth >= 1200);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Chat — single instance shared across all screens
  const chatVisible = activeScreen === "gio-chat" || isDesktop;
  const gioChat = useGioChat(jwt, chatVisible);

  // Notifications — SSE stream, routed into Gio chat
  const handleNotification = useCallback((notif: { type: string; message: string; id: string }) => {
    if (!notif.message) return;
    gioChat.setMessages((prev) => [...prev, { role: "assistant", content: notif.message }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useGioNotifications({
    jwt,
    enabled: authState === "authenticated",
    onNotification: handleNotification,
  });

  // ============================================
  // AUTH INITIALIZATION
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
        gioChat.setMessages([{ role: "assistant", content: greeting }]);
      }
    } catch {
      console.error("Failed to load context");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getGreeting = (ctx: GioClient) => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const name = ctx.contact_name || "there";
    const isFreeUser = ctx.tier === "free";
    let status = "";
    if (ctx.scheduled_posts > 0) {
      status = ` You have ${ctx.scheduled_posts} post${ctx.scheduled_posts > 1 ? "s" : ""} scheduled.`;
    }
    if (!isFreeUser && ctx.pending_uploads > 0) {
      status += ` ${ctx.pending_uploads} image${ctx.pending_uploads > 1 ? "s" : ""} awaiting styling.`;
    }
    if (ctx.needs_platform_setup) {
      status += isFreeUser
        ? " Connect a platform in Account to start posting."
        : " To start posting automatically, connect your Facebook in the Account tab.";
    }
    return `${timeGreeting}, ${name}! Welcome back.${status} How can I help you today?`;
  };

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
  }, [loadContext]);

  // ============================================
  // AUTH HANDLERS
  // ============================================
  const handleAuthSuccess = useCallback(async (token: string, clientData: GioClient, isSetup: boolean) => {
    localStorage.setItem("guardia_jwt", token);
    localStorage.setItem("guardia_client_id", clientData.id);
    setJwt(token);
    setClient(clientData);
    setAuthState("authenticated");

    if (isSetup) {
      // Paid users (setup via invite link) → Factory
      // Free users (signed up at /signup) → Faro page
      const isFreeUser = clientData.tier === "free";
      if (isFreeUser) {
        setActiveScreen("faro");
        gioChat.setMessages([{
          role: "assistant",
          content: `Welcome to Guardia, ${clientData.contact_name || "there"}! Your Faro page is ready — let's set it up. Add your bio, links, and pick a theme to make it yours.`,
        }]);
      } else {
        setActiveScreen("feed");
        gioChat.setMessages([{
          role: "assistant",
          content: `Welcome to Guardia, ${clientData.contact_name || "there"}! Your Feed is ready. Upload some photos and we'll style them up — your first posts go live this week.`,
        }]);
      }
      window.history.replaceState({}, "", "/client");
    } else {
      await loadContext(token);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadContext]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("guardia_jwt");
    localStorage.removeItem("guardia_client_id");
    setJwt(null);
    setClient(null);
    gioChat.setMessages([]);
    setActiveScreen("feed");
    setAuthState("login");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // NAVIGATION
  // ============================================
  const handleScreenChange = useCallback((screen: Screen) => {
    setActiveScreen(screen);
    setSelectedPost(null);
    if (screen !== "post") {
      setShowComposer(false);
      setComposerDate(null);
    }
  }, []);

  const handlePostSelect = useCallback((post: PostedItem) => {
    setSelectedPost(post);
    setActiveScreen("post-detail");
  }, []);

  const handleGioClick = useCallback(() => {
    if (isMobile) {
      setActiveScreen("gio-chat");
    } else {
      setGioSidebarOpen((prev) => !prev);
    }
    gioChat.clearUnread();
  }, [isMobile, gioChat]);

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
  // RENDER: AUTH
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
  // RENDER: APP
  // ============================================
  const chatProps = {
    messages: gioChat.messages,
    input: gioChat.input,
    setInput: gioChat.setInput,
    loading: gioChat.loading,
    onSend: gioChat.sendMessage,
    onKeyDown: gioChat.handleKeyDown,
    messagesEndRef: gioChat.messagesEndRef,
  };

  const screenProps = {
    client,
    jwt,
    onPostSelect: (_postId: number) => {
      // For screens that pass postId instead of full post
      // We'd need to find the post — for now just navigate
      setActiveScreen("stats");
    },
  };

  function renderScreen() {
    switch (activeScreen) {
      case "feed":
        return <FeedScreen jwt={jwt} clientTier={client?.tier} onPostSelect={handlePostSelect} onNavigate={handleScreenChange} />;
      case "faro":
        return <FaroScreen jwt={jwt} client={client} />;
      case "post":
        if (showComposer) {
          return (
            <PostComposerScreen
              jwt={jwt}
              selectedDate={composerDate}
              onBack={() => { setShowComposer(false); setComposerDate(null); }}
              onComplete={() => { setShowComposer(false); setComposerDate(null); }}
            />
          );
        }
        return (
          <CalendarScreen
            {...screenProps}
            onCreatePost={(date) => { setComposerDate(date); setShowComposer(true); }}
            onNewPost={() => { setComposerDate(null); setShowComposer(true); }}
          />
        );
      case "store":
        return <StoreScreen client={client} jwt={jwt} />;
      case "calendar":
        return <CalendarScreen {...screenProps} />;
      case "stats":
        return <StatsScreen {...screenProps} />;
      case "account":
        return <AccountScreen jwt={jwt} onLogout={handleLogout} onNavigateToStore={() => setActiveScreen("store")} />;
      case "post-detail":
        return <PostDetail post={selectedPost} onBack={() => setActiveScreen("feed")} />;
      case "gio-chat":
        return <GioChatScreen {...chatProps} onClose={() => setActiveScreen("feed")} />;
      default:
        return <FeedScreen jwt={jwt} clientTier={client?.tier} onPostSelect={handlePostSelect} onNavigate={handleScreenChange} />;
    }
  }

  const showBottomTabs = !isDesktop && activeScreen !== "gio-chat";
  const showGioSidebar = !isMobile;

  return (
    <main className="h-dvh bg-[var(--bg-base)] flex flex-col overflow-hidden">
      {/* Top bar — always visible except in fullscreen chat */}
      {activeScreen !== "gio-chat" && (
        <TopBar
          clientName={client?.business_name}
          tier={client?.tier}
          activeScreen={activeScreen}
          onScreenChange={handleScreenChange}
          onGioClick={handleGioClick}
          unreadCount={gioChat.unreadCount}
          isDesktop={isDesktop}
        />
      )}

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Center — screen content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {renderScreen()}
        </div>

        {/* Right sidebar — Gio chat (tablet + desktop), collapsible */}
        {showGioSidebar && (
          <aside
            className={`border-l border-[var(--border-subtle)] bg-[var(--bg-base)] flex-shrink-0 hidden md:flex flex-col min-h-0 transition-all duration-300 overflow-hidden ${
              gioSidebarOpen ? "w-[320px]" : "w-0 border-l-0"
            }`}
          >
            <div className="w-[320px] h-full flex-shrink-0">
              <GioChatPanel {...chatProps} />
            </div>
          </aside>
        )}
      </div>

      {/* Bottom tabs — mobile only, hidden during Gio chat */}
      {showBottomTabs && (
        <BottomTabs activeScreen={activeScreen} onScreenChange={handleScreenChange} />
      )}
    </main>
  );
}
