"use client";

import { useState } from "react";
import { Message } from "./LobbyShell";

const API_BASE = "https://api.guardiacontent.com";

const categoryIcons: Record<string, string> = {
  brand: "\u2728",
  content: "\u270D\uFE0F",
  voice: "\u{1F399}\uFE0F",
  audience: "\u{1F465}",
  goals: "\u{1F3AF}",
};

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  jwt?: string | null;
  onQuestionAnswered?: (questionId: number, answer: string) => void;
}

export default function MessageBubble({ message, isUser, jwt, onQuestionAnswered }: MessageBubbleProps) {
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [answered, setAnswered] = useState(message.answered || false);

  // Soul question card
  if (message.question_id && !isUser) {
    const icon = categoryIcons[message.category || "brand"] || "\u2728";

    const handleAction = async (action: "answer" | "skip" | "later") => {
      if (!jwt) return;
      try {
        await fetch(`${API_BASE}/client/notifications/question/${message.question_id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
          body: JSON.stringify({ action, answer: action === "answer" ? replyText : null }),
        });
      } catch (err) {
        console.error("Question response error:", err);
      }
      setAnswered(true);
      setShowReply(false);
      if (action === "answer" && onQuestionAnswered) {
        onQuestionAnswered(message.question_id!, replyText);
      }
    };

    return (
      <div className="flex justify-start animate-fade-in">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold mr-2 flex-shrink-0 mt-1"
          style={{ background: "linear-gradient(135deg, #4338CA, #7c3aed)" }}>
          G
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-bl-md overflow-hidden"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          {/* Category header */}
          <div className="px-4 py-2 border-b border-[var(--border-subtle)] flex items-center gap-2">
            <span className="text-sm">{icon}</span>
            <span className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-medium">
              {message.category || "Getting to know you"}
            </span>
          </div>
          {/* Question */}
          <div className="px-4 py-3">
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{message.content}</p>
          </div>
          {/* Actions */}
          {!answered ? (
            <div className="px-4 pb-3">
              {showReply ? (
                <div className="space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your answer..."
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent)]"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleAction("answer")} disabled={!replyText.trim()}
                      className="flex-1 py-2 bg-[var(--accent)] text-white rounded-xl text-xs font-medium disabled:opacity-50">
                      Send
                    </button>
                    <button onClick={() => setShowReply(false)}
                      className="px-3 py-2 text-[var(--text-muted)] text-xs hover:text-[var(--text-primary)]">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setShowReply(true)}
                    className="flex-1 py-2 bg-[var(--accent)] text-white rounded-xl text-xs font-medium transition-transform active:scale-[0.98]">
                    Reply
                  </button>
                  <button onClick={() => handleAction("later")}
                    className="px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-secondary)] rounded-xl text-xs">
                    Later
                  </button>
                  <button onClick={() => handleAction("skip")}
                    className="px-3 py-2 text-[var(--text-muted)] text-xs">
                    Skip
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 pb-3">
              <span className="text-xs text-[var(--text-muted)]">\u2713 Answered</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Standard message bubble
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold mr-2 flex-shrink-0 mt-1"
          style={{ background: "linear-gradient(135deg, #4338CA, #7c3aed)", boxShadow: "0 1px 4px rgba(99,102,241,0.25)" }}>
          G
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-[#4338CA] text-white rounded-br-md"
            : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
