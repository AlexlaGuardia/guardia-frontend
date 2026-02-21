"use client";

import { useState, useRef, useEffect, Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { ClientContext, Message, tierColors } from "./LobbyShell";
import StatusPill from "./StatusPill";
import MessageBubble from "./MessageBubble";
import LoadingIndicator from "./LoadingIndicator";
import ChatInput from "./ChatInput";
import QuickActions from "./QuickActions";
import QuickSetupCard from "./QuickSetupCard";

const API_BASE = "https://api.guardiacontent.com";

interface GioModeProps {
  client: ClientContext | null;
  jwt: string | null;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  onOpenTablet: () => void;
  onLogout: () => void;
  isBackground: boolean;
}

export default function GioMode({
  client,
  jwt,
  messages,
  setMessages,
  onOpenTablet,
  onLogout,
  isBackground,
}: GioModeProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !jwt) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const history = messages?.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${API_BASE}/client/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ message: userMsg, history }),
      });

      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.text || "I'm having trouble processing that. Could you try again?",
          tool: data.tool,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." },
      ]);
    }

    setLoading(false);
  };

  const handleConnectFacebook = () => {
    setInput("Help me connect my Facebook page");
    sendMessage();
  };

  const tier = client?.tier || "pro";
  const colors = tierColors[tier] || tierColors.pro;

  return (
    <div className={`min-h-screen bg-[var(--bg-surface)] flex flex-col transition-all duration-300 ${isBackground ? "opacity-30 scale-[0.98]" : ""}`}>
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--bg-elevated)] rounded-xl flex items-center justify-center text-[var(--accent)] font-semibold border border-[var(--border-subtle)]">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[var(--text-primary)] font-medium">Giovanni</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                  {(tier || "pro").charAt(0).toUpperCase() + (tier || "pro").slice(1)}
                </span>
              </div>
              <div className="mt-1">
                <StatusPill client={client} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTablet}
              className="relative flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              title="Open Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span className="text-sm hidden sm:inline">Dashboard</span>

              {((client?.pending_uploads || 0) + (client?.styled_ready || 0)) > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full"
                  style={{ boxShadow: '0 0 6px rgba(245,158,11,0.5)' }}
                />
              )}
            </button>

            <div className="w-px h-6 bg-[var(--border)]" />

            <button
              onClick={onLogout}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm px-3 py-1.5 hover:bg-[var(--bg-elevated)] rounded-lg transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content with Giovanni + Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Giovanni - Desktop only */}
        <div className="hidden lg:flex items-end justify-center w-64 xl:w-72 flex-shrink-0 pb-4 pl-4">
          <div className="relative">
            <Image
              src="/images/gio/casual.png"
              alt="Giovanni"
              width={240}
              height={360}
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 180px)" }}>
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Setup card for new clients */}
              {client && (
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
                      action: onOpenTablet,
                      actionLabel: "Upload",
                    },
                    {
                      id: "post",
                      label: "Publish your first post",
                      complete: (client.posted_this_month || 0) > 0,
                    },
                  ]}
                />
              )}

              {messages?.map((msg, i) => (
                <MessageBubble key={i} message={msg} isUser={msg.role === "user"} />
              ))}

              {loading && <LoadingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="max-w-2xl mx-auto">
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={sendMessage}
                disabled={loading}
              />

              <div className="mt-2">
                <QuickActions
                  client={client}
                  onConnectFacebook={handleConnectFacebook}
                  onOpenTablet={onOpenTablet}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
