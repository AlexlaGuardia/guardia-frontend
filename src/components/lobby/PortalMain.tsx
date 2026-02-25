"use client";

import { Dispatch, SetStateAction } from "react";
import { ClientContext, Message, TabletTab } from "./LobbyShell";
import GioWidget from "./GioWidget";
import PostedGallery from "./PostedGallery";
import MessageBar from "./MessageBar";
import QuickSetupCard from "./QuickSetupCard";

interface PortalMainProps {
  client: ClientContext | null;
  jwt: string | null;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  onOpenTablet: (tab?: TabletTab, postId?: number) => void;
  onLogout: () => void;
}

export default function PortalMain({
  client,
  jwt,
  messages,
  setMessages,
  chatOpen,
  setChatOpen,
  onOpenTablet,
  onLogout,
}: PortalMainProps) {
  const handleConnectFacebook = () => {
    setMessages((m) => [...m, { role: "user", content: "Help me connect my Facebook page" }]);
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-surface)] flex flex-col">
      {/* Top bar with logo + dashboard button */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: spacer for widget overlap */}
          <div className="w-40 sm:w-56" />

          {/* Center: Guardia branding */}
          <div className="flex items-center gap-2">
            <img src="/images/guardia-logo.png" alt="Guardia" className="w-6 h-6 object-contain" />
            <span className="text-sm font-medium text-[var(--text-primary)] hidden sm:inline">
              {client?.business_name || "Guardia"}
            </span>
          </div>

          {/* Right: Dashboard + actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenTablet()}
              className="relative flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              title="Open Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span className="text-sm hidden sm:inline">Dashboard</span>
              {((client?.pending_uploads || 0) + (client?.styled_ready || 0)) > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full"
                  style={{ boxShadow: "0 0 6px rgba(245,158,11,0.5)" }}
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Gio Widget (fixed position, overlaps content) */}
      <GioWidget
        client={client}
        jwt={jwt}
        messages={messages}
        setMessages={setMessages}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        onLogout={onLogout}
      />

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Setup card for new clients */}
        {client && client.needs_platform_setup && (
          <div className="px-4 sm:px-6 pt-6">
            <div className="max-w-2xl mx-auto">
              <QuickSetupCard
                steps={[
                  {
                    id: "connect",
                    label: "Connect your Facebook page",
                    complete: !!client.facebook_connected,
                    action: handleConnectFacebook,
                    actionLabel: "Connect",
                  },
                  {
                    id: "upload",
                    label: "Upload your first photo",
                    complete: (client.pending_uploads || 0) > 0 || (client.styled_ready || 0) > 0 || (client.posted_this_month || 0) > 0,
                    action: () => onOpenTablet("gallery"),
                    actionLabel: "Upload",
                  },
                  {
                    id: "post",
                    label: "Publish your first post",
                    complete: (client.posted_this_month || 0) > 0,
                  },
                ]}
              />
            </div>
          </div>
        )}

        {/* Posted content gallery */}
        <PostedGallery
          jwt={jwt}
          onSelectPost={(postId) => onOpenTablet("analytics", postId)}
          onOpenFactory={() => onOpenTablet("gallery")}
        />
      </div>

      {/* Bottom: Message bar + footer */}
      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] pt-3">
        <MessageBar
          jwt={jwt}
          messages={messages}
          setMessages={setMessages}
          onFocus={() => setChatOpen(true)}
        />
        <footer className="py-3 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Powered by{" "}
            <span className="font-medium text-[var(--text-secondary)]">Guardia</span>
            {" "}&middot;{" "}
            <a href="mailto:support@guardiacontent.com" className="hover:text-[var(--accent)] transition-colors">
              Support
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
