"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useGioNotifications,
  type GioNotification,
} from "@/hooks/useGioNotifications";

/**
 * GIO NOTIFICATION BUBBLE
 *
 * Displays popup notifications separate from chat:
 * - Request outcomes (auto-dismiss after 10s)
 * - Soul questions (first after 60s, then every 20min)
 *
 * Receives notifications via SSE stream (no polling).
 */

const API_BASE = "https://api.guardiacontent.com";

interface NotificationBubbleProps {
  jwt: string | null;
}

export default function NotificationBubble({ jwt }: NotificationBubbleProps) {
  const [queue, setQueue] = useState<GioNotification[]>([]);
  const [current, setCurrent] = useState<GioNotification | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  // SSE hook — pushes notifications as they arrive
  const handleNotification = useCallback((n: GioNotification) => {
    setQueue((prev) => {
      if (prev.some((p) => p.id === n.id)) return prev;
      return [...prev, n];
    });
  }, []);

  useGioNotifications({
    jwt,
    enabled: !!jwt,
    onNotification: handleNotification,
  });

  // Show next notification when current is cleared
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [current, queue]);

  // Auto-dismiss outcomes after 10s
  useEffect(() => {
    if (current?.type === "outcome" && !dismissing) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [current, dismissing]);

  // Dismiss notification
  const handleDismiss = async () => {
    if (!current || !jwt) return;
    setDismissing(true);

    try {
      await fetch(`${API_BASE}/client/notifications/${current.id}/dismiss`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
    } catch (err) {
      console.error("Dismiss error:", err);
    }

    setTimeout(() => {
      setCurrent(null);
      setDismissing(false);
      setShowReply(false);
      setReplyText("");
    }, 300);
  };

  // Handle question response
  const handleQuestionAction = async (
    action: "answer" | "skip" | "later"
  ) => {
    if (!current || current.type !== "question" || !jwt) return;

    try {
      await fetch(
        `${API_BASE}/client/notifications/question/${current.question_id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            answer: action === "answer" ? replyText : null,
          }),
        }
      );
    } catch (err) {
      console.error("Question response error:", err);
    }

    handleDismiss();
  };

  if (!current) return null;

  const isQuestion = current.type === "question";
  const isOutcome = current.type === "outcome";

  return (
    <div
      className={`fixed bottom-24 left-4 right-4 z-50 transition-all duration-300 ${
        dismissing ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      }`}
    >
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
          {isOutcome && (
            <>
              <span className="text-lg">
                {current.status === "approved"
                  ? "\u2713"
                  : current.status === "denied"
                  ? "\u2717"
                  : "\u25CB"}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {current.status === "approved"
                  ? "Request approved"
                  : current.status === "denied"
                  ? "Request update"
                  : "Update"}
              </span>
            </>
          )}
          {isQuestion && (
            <>
              <span className="text-lg">{"\u2728"}</span>
              <span className="text-xs text-[var(--accent)]">
                Quick question from Giovanni
              </span>
            </>
          )}

          <button
            onClick={handleDismiss}
            className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            {current.message}
          </p>
        </div>

        {/* Reply input for questions */}
        {isQuestion && showReply && (
          <div className="px-4 pb-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your answer..."
              className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent)]"
              rows={2}
              autoFocus
            />
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pb-4">
          {isOutcome && (
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Got it
            </button>
          )}

          {isQuestion && !showReply && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowReply(true)}
                className="flex-1 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-medium transition-transform active:scale-98"
              >
                Reply
              </button>
              <button
                onClick={() => handleQuestionAction("later")}
                className="px-4 py-2.5 bg-[var(--bg-surface)] text-[var(--text-secondary)] rounded-xl text-sm hover:bg-[var(--bg-surface)] transition-colors"
              >
                Later
              </button>
              <button
                onClick={() => handleQuestionAction("skip")}
                className="px-4 py-2.5 text-[var(--text-muted)] text-sm hover:text-[var(--text-muted)] transition-colors"
              >
                Skip
              </button>
            </div>
          )}

          {isQuestion && showReply && (
            <div className="flex gap-2">
              <button
                onClick={() => handleQuestionAction("answer")}
                disabled={!replyText.trim()}
                className="flex-1 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-medium transition-transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
              <button
                onClick={() => setShowReply(false)}
                className="px-4 py-2.5 bg-[var(--bg-surface)] text-[var(--text-secondary)] rounded-xl text-sm hover:bg-[var(--bg-surface)] transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Auto-dismiss indicator for outcomes */}
        {isOutcome && !dismissing && (
          <div className="h-1 bg-[var(--bg-surface)]">
            <div
              className="h-full bg-[var(--accent)]/30"
              style={{
                animation: "shrink 10s linear forwards",
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
