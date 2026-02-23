"use client";

import { useState, useRef, useEffect, useCallback, Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { ClientContext, Message, tierColors } from "./LobbyShell";
import StatusPill from "./StatusPill";
import MessageBubble from "./MessageBubble";
import LoadingIndicator from "./LoadingIndicator";
import { useGioNotifications, type GioNotification } from "@/hooks/useGioNotifications";

const API_BASE = "https://api.guardiacontent.com";

interface GioWidgetProps {
  client: ClientContext | null;
  jwt: string | null;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  onLogout: () => void;
}

export default function GioWidget({
  client,
  jwt,
  messages,
  setMessages,
  chatOpen,
  setChatOpen,
  onLogout,
}: GioWidgetProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(messages.length);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!chatOpen && messages.length > prevMessageCount.current) {
      const newMessages = messages.slice(prevMessageCount.current);
      const assistantMessages = newMessages.filter(m => m.role === "assistant");
      setUnreadCount(prev => prev + assistantMessages.length);
    }
    prevMessageCount.current = messages.length;
  }, [messages, chatOpen]);

  // Clear unread when opening chat
  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0);
    }
  }, [chatOpen]);

  // Soul question injection via SSE
  const handleSoulQuestion = useCallback((n: GioNotification) => {
    if (n.type === "question" && n.question_id) {
      setMessages((prev) => {
        if (prev.some((m) => m.question_id === n.question_id)) return prev;
        return [...prev, {
          role: "assistant" as const,
          content: n.message,
          question_id: n.question_id,
          category: n.category,
        }];
      });
      if (!chatOpen) setUnreadCount((c) => c + 1);
    }
  }, [chatOpen, setMessages]);

  useGioNotifications({ jwt, enabled: !!jwt, onNotification: handleSoulQuestion });

  // Auto-scroll messages
  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen]);

  const sendMessage = async () => {
    const userMsg = input.trim();
    if (!userMsg || loading || !jwt) return;

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const tier = client?.tier || "pro";
  const colors = tierColors[tier] || tierColors.pro;

  return (
    <div className="fixed top-4 left-4 z-40 flex items-start gap-0">
      {/* Avatar button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-[var(--shadow-medium)]"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
      >
        <Image
          src="/images/gio/widget.png"
          alt="Giovanni"
          fill
          className="object-contain drop-shadow-lg"
          sizes="80px"
          priority
        />
        {/* Unread badge */}
        {unreadCount > 0 && !chatOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
            style={{ boxShadow: "0 0 8px rgba(239,68,68,0.5)" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </button>

      {/* Widget info (always visible next to avatar) */}
      <div className="ml-2 mt-1 hidden sm:block">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">Giovanni</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
            {(tier || "pro").charAt(0).toUpperCase() + (tier || "pro").slice(1)}
          </span>
        </div>
        <div className="mt-0.5">
          <StatusPill client={client} />
        </div>
      </div>

      {/* Chat panel — slides out from widget */}
      {chatOpen && (
        <div
          className="fixed top-24 left-4 sm:left-4 sm:top-24 w-[calc(100vw-2rem)] sm:w-[380px] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden animate-slide-up"
          style={{ maxHeight: "calc(100vh - 160px)", boxShadow: "0 12px 48px rgba(0,0,0,0.15)" }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold overflow-hidden"
                style={{ background: "linear-gradient(135deg, #4338CA, #7c3aed)", boxShadow: "0 1px 4px rgba(99,102,241,0.25)" }}>
                G
              </div>
              <div>
                <span className="text-sm font-medium text-[var(--text-primary)]">Giovanni</span>
                <span className="text-xs text-[var(--text-muted)] ml-1.5">Assistant</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onLogout}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
              >
                Sign out
              </button>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 hover:bg-[var(--bg-surface)] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="overflow-y-auto p-3 space-y-3" style={{ maxHeight: "calc(100vh - 300px)" }}>
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--text-muted)]">Ask Giovanni anything about your content.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                isUser={msg.role === "user"}
                jwt={jwt}
                onQuestionAnswered={(qId, answer) => {
                  setMessages((prev) => prev.map((m) =>
                    m.question_id === qId ? { ...m, answered: true } : m
                  ));
                  if (answer) {
                    setMessages((prev) => [...prev, {
                      role: "assistant" as const,
                      content: "Thanks for sharing! That really helps me understand your brand better.",
                    }]);
                  }
                }}
              />
            ))}
            {loading && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Giovanni..."
                className="flex-1 px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-2.5 min-w-[40px] min-h-[40px] bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
