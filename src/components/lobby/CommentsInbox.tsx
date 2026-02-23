"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

const API_BASE = "https://api.guardiacontent.com";

interface Comment {
  id: string;
  post_id: string;
  author_name: string;
  message: string;
  created_time: string;
  liked: boolean;
  replied: boolean;
  reply_suggestion: string | null;
  post_context?: {
    caption: string | null;
    image: string | null;
  };
}

interface CommentsInboxProps {
  clientId: string;
  jwt: string;
  onReply?: (commentId: string, message: string) => void;
  onClose?: () => void;
}

export default function CommentsInbox({ clientId, jwt, onReply, onClose }: CommentsInboxProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "replied" | "all">("pending");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/engagement/comments/${clientId}?status=${filter}`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch (err) {
        console.error("Failed to fetch comments:", err);
      }
      setLoading(false);
    };

    fetchComments();
  }, [clientId, jwt, filter]);

  const handleReply = async (commentId: string) => {
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/engagement/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ comment_id: commentId, message: replyText }),
      });

      if (res.ok) {
        // Update local state
        setComments(comments.map(c => 
          c.id === commentId ? { ...c, replied: true } : c
        ));
        setReplyingTo(null);
        setReplyText("");
        onReply?.(commentId, replyText);
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    }
    setSending(false);
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center justify-between sm:block">
          <div>
            <h3 className="text-[var(--text-primary)] font-medium">Comments Inbox</h3>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {comments.length} {filter === "pending" ? "need replies" : "comments"}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="sm:hidden p-2 hover:bg-[var(--bg-surface)] rounded-lg">
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex bg-[var(--bg-surface)] rounded-lg p-0.5">
            {(["pending", "replied", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  filter === f
                    ? "bg-[var(--accent-muted)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {onClose && (
            <button onClick={onClose} className="hidden sm:block p-2 hover:bg-[var(--bg-surface)] rounded-lg">
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--bg-surface)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-[var(--text-muted)] text-sm">
              {filter === "pending" ? "No comments waiting for replies" : "No comments yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 hover:bg-[var(--bg-surface)] transition-colors">
                {/* Comment header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-sm text-[var(--text-primary)]">
                      {comment.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm text-[var(--text-primary)] font-medium">{comment.author_name}</span>
                      <span className="text-xs text-[var(--text-muted)] ml-2">{formatTime(comment.created_time)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {comment.liked && (
                      <Heart size={12} className="text-rose-400" fill="currentColor" />
                    )}
                    {comment.replied && (
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Replied</span>
                    )}
                  </div>
                </div>

                {/* Comment message */}
                <p className="text-[var(--text-primary)] text-sm mb-3">{comment.message}</p>

                {/* Reply section */}
                {!comment.replied && (
                  <div>
                    {replyingTo === comment.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply..."
                          className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-amber-500/50 resize-none"
                          rows={2}
                        />
                        {comment.reply_suggestion && (
                          <button
                            onClick={() => setReplyText(comment.reply_suggestion || "")}
                            className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Use AI suggestion
                          </button>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReply(comment.id)}
                            disabled={!replyText.trim() || sending}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black text-sm font-medium rounded-lg transition-colors"
                          >
                            {sending ? "Sending..." : "Reply"}
                          </button>
                          <button
                            onClick={() => { setReplyingTo(null); setReplyText(""); }}
                            className="px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-sm text-amber-500 hover:text-amber-400 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Reply
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
