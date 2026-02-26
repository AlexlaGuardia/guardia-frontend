"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * PostComposerScreen — Manual post composer
 *
 * Bypasses AI pipeline (Artemis/Mercury/Argus). Upload image + write caption
 * + pick platform → publish immediately. Wires to:
 *   POST /post/manual          (multipart: file + caption + hashtags + platform)
 *   GET  /post/manual/platforms (connected platforms list)
 */

const API_BASE = "https://api.guardiacontent.com";

const MAX_CAPTION = 2200;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface ConnectedPlatform {
  platform: string;
  handle: string;
  display_name: string;
  token_status: string;
}

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  instagram: { label: "Instagram", color: "#E4405F" },
  facebook: { label: "Facebook", color: "#1877F2" },
  tiktok: { label: "TikTok", color: "#000000" },
  linkedin: { label: "LinkedIn", color: "#0A66C2" },
  pinterest: { label: "Pinterest", color: "#E60023" },
  youtube: { label: "YouTube", color: "#FF0000" },
};

interface PostComposerScreenProps {
  jwt: string | null;
  selectedDate?: string | null;
  onBack?: () => void;
  onComplete?: () => void;
}

export default function PostComposerScreen({ jwt, selectedDate, onBack, onComplete }: PostComposerScreenProps) {
  // Platforms
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>([]);
  const [platformsLoading, setPlatformsLoading] = useState(true);

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState("");

  // Submit state
  const [posting, setPosting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load connected platforms ──
  const loadPlatforms = useCallback(async () => {
    if (!jwt) return;
    setPlatformsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/post/manual/platforms`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list: ConnectedPlatform[] = data.platforms || [];
        setPlatforms(list);
        if (list.length > 0 && !platform) {
          setPlatform(list[0].platform);
        }
      }
    } catch {
      // silent
    }
    setPlatformsLoading(false);
  }, [jwt, platform]);

  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  // ── File selection ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Only JPEG, PNG, WebP, and GIF images are supported.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError("Image too large. Maximum size is 10 MB.");
      return;
    }

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Submit ──
  const handlePost = async () => {
    if (!jwt || !file || !platform) return;

    setPosting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caption", caption);
      formData.append("hashtags", hashtags);
      formData.append("platform", platform);
      if (selectedDate) formData.append("scheduled_for", selectedDate);

      const res = await fetch(`${API_BASE}/post/manual`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
        body: formData,
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Failed to create post. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    }

    setPosting(false);
  };

  // ── Reset for another post ──
  const handleReset = () => {
    clearFile();
    setCaption("");
    setHashtags("");
    setSuccess(false);
    setError(null);
  };

  // ── Success state ──
  if (success) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            {selectedDate && selectedDate > new Date().toISOString().slice(0, 10) ? "Post scheduled!" : "Post queued!"}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Your post to{" "}
            <span className="font-medium" style={{ color: PLATFORM_META[platform]?.color || "var(--accent)" }}>
              {PLATFORM_META[platform]?.label || platform}
            </span>{" "}
            {selectedDate && selectedDate > new Date().toISOString().slice(0, 10)
              ? `is scheduled for ${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`
              : "will publish within 60 seconds."}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-2xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #C9A227, #D4AF37)", boxShadow: "0 4px 16px rgba(201,162,39,0.35)" }}
            >
              Post Another
            </button>
            {onComplete && (
              <button
                onClick={onComplete}
                className="px-6 py-3 rounded-2xl font-semibold text-sm text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border)] transition-all active:scale-[0.98] hover:border-[var(--text-muted)]"
              >
                Back to Calendar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── No platforms connected ──
  if (!platformsLoading && platforms.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Connect a platform first</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Head to your Account tab and connect Instagram or Facebook to start posting.
          </p>
        </div>
      </div>
    );
  }

  const captionLen = caption.length;
  const canPost = file && platform && !posting;

  return (
    <div className="h-full flex flex-col bg-[var(--bg-base)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-surface)] transition-colors">
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create Post</h2>
            {selectedDate && (
              <p className="text-xs text-[var(--accent)]">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
            )}
          </div>
        </div>
        {captionLen > 0 && (
          <span className={`text-xs font-medium ${captionLen > MAX_CAPTION ? "text-red-500" : "text-[var(--text-muted)]"}`}>
            {captionLen}/{MAX_CAPTION}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 min-h-0">
        {/* Image upload */}
        <div className="relative">
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden border border-[var(--border)]">
              <img src={preview} alt="Preview" className="w-full max-h-[300px] object-contain bg-[var(--bg-surface)]" />
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-surface)] cursor-pointer hover:border-[var(--accent)] transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">Tap to add a photo</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">JPEG, PNG, WebP, or GIF up to 10 MB</p>
              </div>
            </label>
          )}
        </div>

        {/* Caption */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write your caption..."
            rows={4}
            maxLength={MAX_CAPTION + 50}
            className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] transition-all resize-none"
          />
        </div>

        {/* Hashtags */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Hashtags</label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#guardia #content #socialmedia"
            className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] transition-all"
          />
        </div>

        {/* Platform selector */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Platform</label>
          {platformsLoading ? (
            <div className="flex items-center gap-2 py-3">
              <div className="w-4 h-4 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
              <span className="text-sm text-[var(--text-muted)]">Loading platforms...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => {
                const meta = PLATFORM_META[p.platform];
                const isSelected = platform === p.platform;
                return (
                  <button
                    key={p.platform}
                    onClick={() => setPlatform(p.platform)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      isSelected
                        ? "border-transparent text-white shadow-sm"
                        : "border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:border-[var(--text-muted)]"
                    }`}
                    style={isSelected ? { background: meta?.color || "var(--accent)" } : {}}
                  >
                    <PlatformIcon platform={p.platform} />
                    <span>{meta?.label || p.platform}</span>
                    {p.handle && (
                      <span className={`text-xs ${isSelected ? "text-white/70" : "text-[var(--text-muted)]"}`}>
                        @{p.handle}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}
      </div>

      {/* Post button */}
      <div className="flex-shrink-0 p-4 bg-[var(--bg-base)] border-t border-[var(--border-subtle)]">
        <button
          onClick={handlePost}
          disabled={!canPost}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canPost
              ? `linear-gradient(135deg, ${PLATFORM_META[platform]?.color || "#C9A227"}, ${PLATFORM_META[platform]?.color || "#D4AF37"}cc)`
              : "var(--bg-surface)",
            boxShadow: canPost ? "0 4px 16px rgba(0,0,0,0.2)" : "none",
          }}
        >
          {posting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {selectedDate && selectedDate > new Date().toISOString().slice(0, 10)
                ? `Schedule for ${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : `Post to ${PLATFORM_META[platform]?.label || platform || "..."}`}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Platform icon (small colored dot + icon) ──
function PlatformIcon({ platform }: { platform: string }) {
  const color = PLATFORM_META[platform]?.color || "#9CA3AF";
  return (
    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: color }} />
  );
}
