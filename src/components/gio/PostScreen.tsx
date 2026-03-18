"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Screen } from "./TopBar";

const API_BASE = "https://api.guardiacontent.com";
const ACCEPT = ".jpg,.jpeg,.png,.webp,.heic";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_CAPTION = 2200;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

interface PostScreenProps {
  jwt: string | null;
  client: { tier?: string } | null;
  onNavigate?: (screen: Screen) => void;
}

interface ConnectedPlatform {
  platform: string;
  handle: string;
  display_name: string;
  token_status: string;
}

interface UploadItem {
  file: File;
  preview: string;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
}

interface GalleryAsset {
  id: number;
  url: string | null;
  styled_url: string | null;
  thumbnail_url: string | null;
  original_filename: string | null;
  status: string;
  caption: string | null;
  created_at: string;
}

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  instagram: { label: "Instagram", color: "#E4405F" },
  facebook: { label: "Facebook", color: "#1877F2" },
  tiktok: { label: "TikTok", color: "#000000" },
  linkedin: { label: "LinkedIn", color: "#0A66C2" },
  pinterest: { label: "Pinterest", color: "#E60023" },
};

export default function PostScreen({ jwt, client, onNavigate }: PostScreenProps) {
  // Addon + auto-schedule state
  const [hasAddon, setHasAddon] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [addonLoading, setAddonLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Factory state
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [postsUsed, setPostsUsed] = useState(0);
  const [postsLimit, setPostsLimit] = useState(12);
  const [slotsUsed, setSlotsUsed] = useState(0);
  const [slotsLimit, setSlotsLimit] = useState(30);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  // Gallery (camera roll)
  const [galleryItems, setGalleryItems] = useState<GalleryAsset[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Composer state
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>([]);
  const [platformsLoading, setPlatformsLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [posting, setPosting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const composeFileRef = useRef<HTMLInputElement>(null);

  // Caption templates
  const [templates, setTemplates] = useState<{ id: number; name: string; template: string; hashtags: string }[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // ── Fetch gallery items (camera roll) ──
  const fetchGallery = useCallback(async () => {
    if (!jwt) return;
    setGalleryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/lobby/gallery`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPostsUsed(data.posts_used ?? 0);
        setPostsLimit(data.posts_limit ?? 12);
        setSlotsUsed(data.slots_used ?? 0);
        setSlotsLimit(data.slots_limit ?? 30);
        setGalleryItems(data.items || []);
      }
    } catch (err) {
      console.error("Gallery fetch error:", err);
    }
    setGalleryLoading(false);
  }, [jwt]);

  // ── Init: check addon, auto-schedule, gallery ──
  useEffect(() => {
    if (!jwt) return;
    const init = async () => {
      setAddonLoading(true);
      try {
        const [addonRes, scheduleRes] = await Promise.all([
          fetch(`${API_BASE}/addons/check/auto_scheduling`, {
            headers: { Authorization: `Bearer ${jwt}` },
          }),
          fetch(`${API_BASE}/lobby/settings/auto-schedule`, {
            headers: { Authorization: `Bearer ${jwt}` },
          }),
        ]);
        if (addonRes.ok) {
          const data = await addonRes.json();
          setHasAddon(!!data.active);
        }
        if (scheduleRes.ok) {
          const data = await scheduleRes.json();
          setAutoEnabled(!!data.enabled);
        }
      } catch (err) {
        console.error("PostScreen init error:", err);
      }
      setAddonLoading(false);
    };
    init();
    fetchGallery();
  }, [jwt, fetchGallery]);

  // ── Load platforms for composer ──
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
    } catch {}
    setPlatformsLoading(false);
  }, [jwt]);

  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  // ── Load caption templates ──
  const fetchTemplates = useCallback(async () => {
    if (!jwt) return;
    try {
      const res = await fetch(`${API_BASE}/client/me/templates`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {}
  }, [jwt]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const applyTemplate = (t: { template: string; hashtags: string }) => {
    setCaption(t.template);
    if (t.hashtags) setHashtags(t.hashtags);
  };

  const saveAsTemplate = async () => {
    if (!jwt || !templateName.trim() || !caption.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/client/me/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ name: templateName.trim(), template: caption, hashtags }),
      });
      if (res.ok) {
        setShowSaveTemplate(false);
        setTemplateName("");
        fetchTemplates();
      }
    } catch {}
  };

  // ── Toggle auto-schedule ──
  const handleToggle = async () => {
    if (!jwt || !hasAddon || toggling) return;
    setToggling(true);
    try {
      const res = await fetch(`${API_BASE}/lobby/settings/auto-schedule`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAutoEnabled(!!data.enabled);
      }
    } catch {}
    setToggling(false);
  };

  // ── Factory: handle file selection ──
  const handleFactoryFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: UploadItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.size > MAX_FILE_SIZE) continue;
      newItems.push({
        file: f,
        preview: URL.createObjectURL(f),
        status: "queued",
      });
    }
    setUploads((prev) => [...prev, ...newItems]);
  };

  // ── Factory: sequential upload processing ──
  useEffect(() => {
    if (uploadingRef.current || !jwt) return;
    const nextIdx = uploads.findIndex((u) => u.status === "queued");
    if (nextIdx === -1) return;

    // Capture file ref before any async work — avoids stale closure
    const fileToUpload = uploads[nextIdx].file;

    uploadingRef.current = true;
    setUploads((prev) =>
      prev.map((u, i) => (i === nextIdx ? { ...u, status: "uploading" } : u))
    );

    const doUpload = async () => {
      const formData = new FormData();
      formData.append("file", fileToUpload);
      try {
        const res = await fetch(`${API_BASE}/lobby/gallery/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${jwt}` },
          body: formData,
        });
        if (res.ok) {
          setUploads((prev) =>
            prev.map((u, i) => (i === nextIdx ? { ...u, status: "done" } : u))
          );
          fetchGallery();
        } else {
          const data = await res.json().catch(() => ({}));
          setUploads((prev) =>
            prev.map((u, i) =>
              i === nextIdx
                ? { ...u, status: "error", error: data.detail || "Upload failed" }
                : u
            )
          );
        }
      } catch {
        setUploads((prev) =>
          prev.map((u, i) =>
            i === nextIdx
              ? { ...u, status: "error", error: "Connection error" }
              : u
          )
        );
      }
      uploadingRef.current = false;
    };
    doUpload();
  }, [uploads, jwt]);

  // ── Composer: file selection ──
  const handleComposeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setComposeError(null);
    if (!ALLOWED_TYPES.includes(f.type)) {
      setComposeError("Only JPEG, PNG, WebP, and HEIC images are supported.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setComposeError("Image too large. Maximum size is 10 MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearComposeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (composeFileRef.current) composeFileRef.current.value = "";
  };

  // ── Composer: submit ──
  const handlePost = async () => {
    if (!jwt || !file || !platform) return;
    setPosting(true);
    setComposeError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caption", caption);
      formData.append("hashtags", hashtags);
      formData.append("platform", platform);
      if (scheduleDate) formData.append("scheduled_for", scheduleDate);

      const res = await fetch(`${API_BASE}/post/manual`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
        body: formData,
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setComposeError(data.detail || "Failed to create post.");
      }
    } catch {
      setComposeError("Connection error. Please try again.");
    }
    setPosting(false);
  };

  const handleComposeReset = () => {
    clearComposeFile();
    setCaption("");
    setHashtags("");
    setScheduleDate("");
    setSuccess(false);
    setComposeError(null);
  };

  // ── Derived ──
  const showFactory = hasAddon && autoEnabled;
  const canPost = file && platform && !posting;

  // ── Loading ──
  if (addonLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Composer: success state ──
  if (!showFactory && success) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            {scheduleDate && scheduleDate > new Date().toISOString().slice(0, 10) ? "Post scheduled!" : "Post queued!"}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Your post to{" "}
            <span className="font-medium" style={{ color: PLATFORM_META[platform]?.color || "var(--accent)" }}>
              {PLATFORM_META[platform]?.label || platform}
            </span>{" "}
            {scheduleDate && scheduleDate > new Date().toISOString().slice(0, 10)
              ? `is scheduled for ${new Date(scheduleDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`
              : "will publish within 60 seconds."}
          </p>
          <button
            onClick={handleComposeReset}
            className="px-6 py-3 rounded-2xl font-semibold text-sm text-white transition-all active:scale-[0.98] hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #C9A227, #D4AF37)", boxShadow: "0 4px 16px rgba(201,162,39,0.35)" }}
          >
            Post Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-base)]">
      {/* ── Header with Auto toggle ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {showFactory ? "The Factory" : "Create a Post"}
        </h2>

        <div className="flex items-center gap-2">
          {!hasAddon && (
            <button
              onClick={() => onNavigate?.("store")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--text-muted)] transition-all"
            >
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Unlock in Store
            </button>
          )}
          <span className={`text-xs font-medium ${hasAddon ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}`}>
            Auto
          </span>
          <button
            onClick={hasAddon ? handleToggle : () => onNavigate?.("store")}
            disabled={toggling}
            className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
              hasAddon && autoEnabled
                ? ""
                : hasAddon
                ? "bg-[var(--bg-surface)] border border-[var(--border)]"
                : "bg-[var(--bg-surface)] border border-[var(--border)] opacity-50"
            }`}
            style={
              hasAddon && autoEnabled
                ? { background: "linear-gradient(135deg, #C9A227, #D4AF37)" }
                : undefined
            }
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                hasAddon && autoEnabled ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {showFactory ? (
          /* ═══ THE FACTORY ═══ */
          <div className="px-4 pb-24 xl:pb-4 space-y-4">
            {/* Counters */}
            <div className="flex gap-3">
              <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-[var(--text-primary)]">
                  {postsUsed}<span className="text-[var(--text-muted)] font-normal">/{postsLimit}</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Posts</div>
              </div>
              <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-[var(--text-primary)]">
                  {slotsUsed}<span className="text-[var(--text-muted)] font-normal">/{slotsLimit}</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Slots</div>
              </div>
            </div>

            {/* Upload zone */}
            <label
              className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:border-[#D4AF37]"
              style={{
                borderColor: "rgba(201,162,39,0.3)",
                background: "linear-gradient(135deg, rgba(201,162,39,0.03), rgba(212,175,55,0.06))",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                multiple
                onChange={(e) => {
                  handleFactoryFiles(e.target.files);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="hidden"
              />
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #C9A227, #D4AF37)" }}
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "#D4AF37" }}>
                  Drop photos into the factory
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">JPEG, PNG, WebP, or HEIC</p>
              </div>
            </label>

            <p className="text-xs text-[var(--text-muted)] text-center">
              Photos will be styled, captioned, and scheduled automatically
            </p>

            {/* Upload thumbnails (ephemeral — current session only) */}
            {uploads.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {uploads.map((item, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)]">
                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                    <div
                      className={`absolute inset-0 flex items-center justify-center ${
                        item.status === "uploading"
                          ? "bg-black/40"
                          : item.status === "done"
                          ? "bg-black/20"
                          : item.status === "error"
                          ? "bg-red-500/30"
                          : "bg-black/20"
                      }`}
                    >
                      {item.status === "uploading" && (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      {item.status === "done" && (
                        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {item.status === "error" && (
                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {item.status === "queued" && (
                        <div className="w-2 h-2 rounded-full bg-white/50" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Camera Roll (server-side gallery) ── */}
            {galleryItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Camera Roll
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {galleryItems.map((asset) => {
                    const imgUrl = asset.thumbnail_url || asset.styled_url || asset.url;
                    const isProcessing = ["received", "pending", "processing", "raw", "styling", "queued", "pending_review"].includes(asset.status);
                    const isReady = ["ready", "styled"].includes(asset.status);
                    const isFailed = asset.status === "failed" || asset.status === "stale";
                    return (
                      <div key={asset.id} className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-surface)]">
                        {imgUrl ? (
                          <img src={imgUrl} alt={asset.original_filename || ""} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {/* Status overlay */}
                        <div className={`absolute inset-x-0 bottom-0 px-2 py-1 ${
                          isProcessing ? "bg-black/60" : isReady ? "bg-emerald-900/60" : isFailed ? "bg-red-900/60" : "bg-black/40"
                        }`}>
                          <span className={`text-[9px] font-semibold uppercase tracking-wider ${
                            isProcessing ? "text-amber-300" : isReady ? "text-emerald-300" : isFailed ? "text-red-300" : "text-white/70"
                          }`}>
                            {isProcessing && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1 align-middle" />
                            )}
                            {({ received: "Uploading", pending_review: "In Queue", raw: "Processing", styling: "Styling", styled: "Styled", ready: "Ready", failed: "Failed", stale: "Stuck" }[asset.status] || asset.status)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {galleryLoading && galleryItems.length === 0 && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          /* ═══ CREATE A POST (manual composer) ═══ */
          <div className="flex flex-col h-full">
            {/* No platforms */}
            {!platformsLoading && platforms.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6">
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
            ) : (
              <>
                {/* Form */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 min-h-0">
                  {/* Image upload */}
                  <div className="relative">
                    {preview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-[var(--border)]">
                        <img src={preview} alt="Preview" className="w-full max-h-[300px] object-contain bg-[var(--bg-surface)]" />
                        <button
                          onClick={clearComposeFile}
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
                          ref={composeFileRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.heic"
                          onChange={handleComposeFile}
                          className="hidden"
                        />
                        <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                          <svg className="w-7 h-7 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-[var(--text-primary)]">Tap to add a photo</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">JPEG, PNG, WebP, or HEIC up to 10 MB</p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Caption */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Caption</label>
                      <div className="flex items-center gap-2">
                        {templates.length > 0 && (
                          <select
                            onChange={(e) => {
                              const t = templates.find((t) => t.id === parseInt(e.target.value));
                              if (t) applyTemplate(t);
                              e.target.value = "";
                            }}
                            defaultValue=""
                            className="text-[11px] px-2 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] focus:outline-none"
                          >
                            <option value="" disabled>Templates</option>
                            {templates.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        )}
                        {caption.length > 0 && (
                          <span className={`text-xs font-medium ${caption.length > MAX_CAPTION ? "text-red-500" : "text-[var(--text-muted)]"}`}>
                            {caption.length}/{MAX_CAPTION}
                          </span>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write your caption..."
                      rows={4}
                      maxLength={MAX_CAPTION + 50}
                      className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] transition-all resize-none"
                    />
                    {/* Save as template */}
                    {caption.trim() && !showSaveTemplate && (
                      <button onClick={() => setShowSaveTemplate(true)}
                        className="mt-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                        Save as template
                      </button>
                    )}
                    {showSaveTemplate && (
                      <div className="flex gap-2 mt-2">
                        <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="Template name..."
                          className="flex-1 px-3 py-1.5 text-xs bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]" />
                        <button onClick={saveAsTemplate} disabled={!templateName.trim()}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent)] text-white disabled:opacity-50">
                          Save
                        </button>
                        <button onClick={() => { setShowSaveTemplate(false); setTemplateName(""); }}
                          className="px-2 py-1.5 text-xs text-[var(--text-muted)]">Cancel</button>
                      </div>
                    )}
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
                                  : "border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:border-[var(--text-muted)] hover:bg-white/5"
                              }`}
                              style={isSelected ? { background: meta?.color || "var(--accent)" } : {}}
                            >
                              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: meta?.color || "#9CA3AF" }} />
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

                  {/* Schedule */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">When</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setScheduleDate("")}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          !scheduleDate
                            ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:border-[var(--text-muted)]"
                        }`}
                      >
                        Post Now
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="date"
                          value={scheduleDate}
                          min={new Date().toISOString().slice(0, 10)}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-all appearance-none cursor-pointer ${
                            scheduleDate
                              ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]"
                              : "border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:border-[var(--text-muted)]"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {composeError && (
                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      {composeError}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="flex-shrink-0 p-4 bg-[var(--bg-base)] border-t border-[var(--border-subtle)]">
                  <button
                    onClick={handlePost}
                    disabled={!canPost}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition-all active:scale-[0.98] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
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
                        {scheduleDate && scheduleDate > new Date().toISOString().slice(0, 10)
                          ? `Schedule for ${new Date(scheduleDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                          : `Post to ${PLATFORM_META[platform]?.label || platform || "..."}`}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
