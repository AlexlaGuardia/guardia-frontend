"use client";

import { GioMessage } from "./chat-logic";

/**
 * GioChatPanel — Desktop sidebar chat panel
 * Always visible in the right sidebar on desktop (>1200px).
 * Receives chat state from parent (useGioChat hook lives in AppShell).
 */

interface GioChatPanelProps {
  messages: GioMessage[];
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

function ChatBubble({ message }: { message: GioMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold mr-2 flex-shrink-0 mt-1"
          style={{ background: "linear-gradient(135deg, #4338CA, #7c3aed)" }}
        >
          G
        </div>
      )}
      <div
        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-[#4338CA] text-white rounded-br-md"
            : "bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-bl-md"
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
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold mr-2 flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #4338CA, #7c3aed)" }}
      >
        G
      </div>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-3.5 py-2.5 rounded-2xl rounded-bl-md">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-[var(--accent)] opacity-60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-1.5 h-1.5 bg-[var(--accent)] opacity-60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-1.5 h-1.5 bg-[var(--accent)] opacity-60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

export default function GioChatPanel({
  messages,
  input,
  setInput,
  loading,
  onSend,
  onKeyDown,
  messagesEndRef,
}: GioChatPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-subtle)]">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #4338CA, #7c3aed)" }}
        >
          G
        </div>
        <div>
          <span className="text-sm font-medium text-[var(--text-primary)]">Giovanni</span>
          <span className="text-xs text-[var(--text-muted)] ml-1.5">Assistant</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden">
              <img src="/images/gio/wave.png" alt="Giovanni" className="w-full h-full object-cover object-top" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">Ask Giovanni anything about your content.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {loading && <TypingDots />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask Giovanni..."
            className="flex-1 px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all"
            disabled={loading}
          />
          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="p-2.5 min-w-[40px] min-h-[40px] bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
