"use client";

import Image from "next/image";
import { GioMessage } from "./chat-logic";

/**
 * GioChatScreen — Fullscreen mobile chat sheet
 * Slides up from bottom, covers entire viewport (no tab bar visible).
 * Back arrow at top-left to dismiss.
 */

interface GioChatScreenProps {
  messages: GioMessage[];
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClose: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

function ChatBubble({ message }: { message: GioMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold mr-2 flex-shrink-0 mt-1"
          style={{ background: "linear-gradient(135deg, #4338CA, #7c3aed)" }}
        >
          G
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-[#4338CA] text-white rounded-br-md"
            : "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold mr-2 flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #4338CA, #7c3aed)" }}
      >
        G
      </div>
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-[var(--accent)] opacity-60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-[var(--accent)] opacity-60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-[var(--accent)] opacity-60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

export default function GioChatScreen({
  messages,
  input,
  setInput,
  loading,
  onSend,
  onKeyDown,
  onClose,
  messagesEndRef,
}: GioChatScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-base)] flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
          <Image
            src="/images/gio/avatar.png"
            alt="Giovanni"
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="text-base font-semibold text-[var(--text-primary)]">Giovanni</div>
          <div className="text-xs text-[var(--text-muted)]">Your content assistant</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden">
              <Image
                src="/images/gio/wave.png"
                alt="Giovanni waving"
                width={80}
                height={80}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <p className="text-base font-medium text-[var(--text-primary)]">Hey there!</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Ask me anything about your content.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {loading && <TypingDots />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — fixed at bottom with safe area */}
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask Giovanni..."
            className="flex-1 px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all"
            disabled={loading}
            autoFocus
          />
          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="p-3 min-w-[48px] min-h-[48px] bg-[var(--accent)] text-white rounded-2xl hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
