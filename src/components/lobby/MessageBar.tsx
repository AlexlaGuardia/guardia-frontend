"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { Message } from "./LobbyShell";

const API_BASE = "https://api.guardiacontent.com";

interface MessageBarProps {
  jwt: string | null;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  onFocus: () => void;
}

export default function MessageBar({ jwt, messages, setMessages, onFocus }: MessageBarProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const userMsg = input.trim();
    if (!userMsg || loading || !jwt) return;

    setInput("");
    onFocus(); // Open chat panel to show response
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

  return (
    <div className="px-4 sm:px-6 pb-2">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl px-3 py-2 shadow-sm hover:border-[var(--border)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-muted)] transition-all">
          {/* Gio icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
            style={{ background: "linear-gradient(135deg, #4338CA, #7c3aed)" }}>
            G
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            placeholder="Ask Giovanni anything..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none py-1"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 p-2 min-w-[36px] min-h-[36px] bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
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
