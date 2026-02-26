"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Link2, Type, Share2, Mail, AlignLeft, Plus, Trash2,
  ChevronUp, ChevronDown, Eye, EyeOff, Pencil, X,
  Check, Globe, ExternalLink, Loader2, Image as ImageIcon,
  Copy, Sparkles,
} from "lucide-react";
import type { GioClient } from "./types";

const API_BASE = "https://api.guardiacontent.com";

// ── Types ────────────────────────────────────────────────────
interface FaroPage {
  id: string;
  slug: string;
  custom_domain: string | null;
  theme: string;
  profile_image_url: string | null;
  display_name: string | null;
  bio: string | null;
  settings: string;
  is_published: number;
  created_at: string;
  updated_at: string | null;
}

interface FaroBlock {
  id: string;
  page_id: string;
  type: "link" | "header" | "social" | "email_capture" | "text";
  title: string | null;
  url: string | null;
  icon: string | null;
  sort_order: number;
  is_visible: number;
  settings: string;
  created_at: string;
}

// ── Theme Data ───────────────────────────────────────────────
const THEMES: Record<string, {
  bg: string; accent: string; text: string; surface: string;
  border: string; radius: string; label: string;
}> = {
  clean:    { bg: "#FFFFFF", accent: "#1A1A1A", text: "#1A1A1A", surface: "#F7F7F8", border: "#E5E7EB", radius: "12px", label: "Clean" },
  midnight: { bg: "#0A0A0B", accent: "#FFFFFF", text: "#F0F0F0", surface: "#141416", border: "#222225", radius: "12px", label: "Midnight" },
  sand:     { bg: "#FAF6F1", accent: "#2A2A2A", text: "#2A2A2A", surface: "#F0E8E0", border: "#E8DDD3", radius: "14px", label: "Sand" },
  bold:     { bg: "#FFFDF7", accent: "#1A1A1A", text: "#1A1A1A", surface: "#1A1A1A", border: "#1A1A1A", radius: "0px",  label: "Bold" },
  bloom:    { bg: "#FDF8F6", accent: "#D4727E", text: "#2D2D2D", surface: "#FFFFFF", border: "#F0E4DF", radius: "24px", label: "Bloom" },
  neon:     { bg: "#09090B", accent: "#22D3EE", text: "#E4E4E7", surface: "#111113", border: "#1E1E22", radius: "10px", label: "Neon" },
};

const BLOCK_TYPES = [
  { type: "link",          label: "Link",          icon: Link2,    description: "Add a clickable link" },
  { type: "header",        label: "Header",        icon: Type,     description: "Section divider text" },
  { type: "social",        label: "Social Icons",  icon: Share2,   description: "Social media links row" },
  { type: "email_capture", label: "Email Capture", icon: Mail,     description: "Collect email addresses" },
  { type: "text",          label: "Text",          icon: AlignLeft, description: "Freeform text block" },
] as const;

// ── API Helper ───────────────────────────────────────────────
async function faroFetch(jwt: string, path: string, method = "GET", body?: unknown) {
  return fetch(`${API_BASE}/faro${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${jwt}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

// ── Props ────────────────────────────────────────────────────
interface FaroScreenProps {
  jwt: string | null;
  client: GioClient | null;
}

export default function FaroScreen({ jwt, client }: FaroScreenProps) {
  const [page, setPage] = useState<FaroPage | null>(null);
  const [blocks, setBlocks] = useState<FaroBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [noPage, setNoPage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [addingBlock, setAddingBlock] = useState(false);
  const [newBlockType, setNewBlockType] = useState<string | null>(null);

  // Profile editing
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  // Block editing
  const [blockTitle, setBlockTitle] = useState("");
  const [blockUrl, setBlockUrl] = useState("");

  const [copied, setCopied] = useState(false);

  const resetBlockForm = () => { setBlockTitle(""); setBlockUrl(""); };

  const copyUrl = () => {
    if (!page) return;
    navigator.clipboard.writeText(`https://guardia.page/${page.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Load Page ──────────────────────────────────────────────
  const loadPage = useCallback(async () => {
    if (!jwt) return;
    setLoading(true);
    try {
      const res = await faroFetch(jwt, "/page");
      if (res.ok) {
        const data = await res.json();
        setPage(data.page);
        setBlocks(data.blocks || []);
        setEditName(data.page.display_name || "");
        setEditBio(data.page.bio || "");
        setEditSlug(data.page.slug || "");
        setEditImageUrl(data.page.profile_image_url || "");
        setNoPage(false);
      } else if (res.status === 404) {
        setNoPage(true);
      }
    } catch {
      console.error("Failed to load faro page");
    }
    setLoading(false);
  }, [jwt]);

  useEffect(() => { loadPage(); }, [loadPage]);

  // ── Page Updates ───────────────────────────────────────────
  const updatePage = async (fields: Record<string, unknown>) => {
    if (!jwt || !page) return;
    setSaving(true);
    try {
      const res = await faroFetch(jwt, "/page", "PUT", fields);
      if (res.ok) await loadPage();
    } catch {
      console.error("Failed to update page");
    }
    setSaving(false);
  };

  const saveProfile = () => {
    const updates: Record<string, unknown> = {};
    if (editName !== (page?.display_name || "")) updates.display_name = editName;
    if (editBio !== (page?.bio || "")) updates.bio = editBio;
    if (editImageUrl !== (page?.profile_image_url || "")) updates.profile_image_url = editImageUrl;
    if (Object.keys(updates).length > 0) updatePage(updates);
  };

  const saveSlug = () => {
    if (editSlug && editSlug !== page?.slug) updatePage({ slug: editSlug });
  };

  const togglePublish = () => {
    if (page) updatePage({ is_published: !page.is_published });
  };

  // ── Block Operations ───────────────────────────────────────
  const addBlock = async (type: string) => {
    if (!jwt) return;
    setSaving(true);
    const body: Record<string, unknown> = { type };
    if (type === "link") {
      body.title = blockTitle || "My Link";
      body.url = blockUrl || "https://";
    } else if (type === "header") {
      body.title = blockTitle || "Section";
    } else if (type === "text") {
      body.title = blockTitle || "Some text here";
    } else if (type === "email_capture") {
      body.title = blockTitle || "Join my newsletter";
      body.settings = JSON.stringify({ placeholder: "your@email.com", button_text: "Subscribe" });
    } else if (type === "social") {
      body.title = "Social Links";
      body.settings = JSON.stringify({ platforms: [] });
    }
    try {
      const res = await faroFetch(jwt, "/blocks", "POST", body);
      if (res.ok) {
        await loadPage();
        setAddingBlock(false);
        setNewBlockType(null);
        resetBlockForm();
      }
    } catch {
      console.error("Failed to add block");
    }
    setSaving(false);
  };

  const updateBlock = async (blockId: string, updates: Record<string, unknown>) => {
    if (!jwt) return;
    setSaving(true);
    try {
      const res = await faroFetch(jwt, `/blocks/${blockId}`, "PUT", updates);
      if (res.ok) {
        await loadPage();
        setEditingBlock(null);
        resetBlockForm();
      }
    } catch {
      console.error("Failed to update block");
    }
    setSaving(false);
  };

  const deleteBlock = async (blockId: string) => {
    if (!jwt) return;
    setSaving(true);
    try {
      const res = await faroFetch(jwt, `/blocks/${blockId}`, "DELETE");
      if (res.ok) await loadPage();
    } catch {
      console.error("Failed to delete block");
    }
    setSaving(false);
  };

  const moveBlock = async (blockId: string, direction: "up" | "down") => {
    const idx = blocks.findIndex(b => b.id === blockId);
    if (idx < 0) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === blocks.length - 1) return;
    const newOrder = blocks.map(b => b.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setSaving(true);
    try {
      const res = await faroFetch(jwt!, "/blocks/reorder", "PUT", { block_ids: newOrder });
      if (res.ok) await loadPage();
    } catch {
      console.error("Failed to reorder");
    }
    setSaving(false);
  };

  const startEditBlock = (block: FaroBlock) => {
    setEditingBlock(block.id);
    setBlockTitle(block.title || "");
    setBlockUrl(block.url || "");
  };

  // ── Render: Loading ────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        <p className="text-sm text-[var(--text-secondary)]">Loading your Faro page...</p>
      </div>
    );
  }

  // ── Render: No Page ────────────────────────────────────────
  if (noPage) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
          <Globe className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Your link page is on the way</h2>
        <p className="text-sm text-[var(--text-muted)]">
          One link for your bio, your posts, your business. It&apos;ll be ready shortly.
        </p>
      </div>
    );
  }

  if (!page) return null;

  const theme = THEMES[page.theme] || THEMES.clean;
  const pageUrl = `https://guardia.page/${page.slug}`;
  const profileDirty = editName !== (page.display_name || "") || editBio !== (page.bio || "") || editImageUrl !== (page.profile_image_url || "");

  // ── Preview Renderer ───────────────────────────────────────
  const renderPreview = () => (
    <div className="rounded-2xl overflow-hidden border border-[var(--border-subtle)]"
      style={{ background: theme.bg, maxWidth: 400, margin: "0 auto" }}>
      <div className="px-6 py-8 flex flex-col items-center text-center" style={{ color: theme.text }}>
        {/* Avatar */}
        {editImageUrl ? (
          <img src={editImageUrl} alt={editName}
            className="w-24 h-24 rounded-full object-cover mb-4"
            style={{ border: `2px solid ${theme.border}` }} />
        ) : (
          <div className="w-24 h-24 rounded-full mb-4 flex items-center justify-center text-2xl font-bold"
            style={{ background: theme.surface, color: theme.accent, border: `2px solid ${theme.border}` }}>
            {(editName || "?")[0]?.toUpperCase()}
          </div>
        )}
        <h2 className="text-lg font-semibold mb-1" style={{ color: theme.text }}>
          {editName || "Your Name"}
        </h2>
        {editBio && (
          <p className="text-sm mb-6 max-w-xs" style={{ color: theme.text, opacity: 0.7 }}>{editBio}</p>
        )}
        {/* Blocks */}
        <div className="w-full space-y-3">
          {blocks.filter(b => b.is_visible).length > 0 ? (
            blocks.filter(b => b.is_visible).map(block => {
              if (block.type === "link") return (
                <div key={block.id} className="w-full py-3.5 px-5 text-center text-sm font-medium"
                  style={{
                    background: theme.surface,
                    color: page.theme === "bold" ? theme.bg : theme.text,
                    borderRadius: theme.radius, border: `1px solid ${theme.border}`,
                  }}>
                  {block.title || "Link"}
                </div>
              );
              if (block.type === "header") return (
                <div key={block.id} className="text-xs uppercase tracking-wider font-medium pt-4 pb-1"
                  style={{ color: theme.text, opacity: 0.5 }}>
                  {block.title}
                </div>
              );
              if (block.type === "text") return (
                <p key={block.id} className="text-sm px-2" style={{ color: theme.text, opacity: 0.7 }}>
                  {block.title}
                </p>
              );
              if (block.type === "email_capture") return (
                <div key={block.id} className="w-full flex gap-2">
                  <div className="flex-1 py-2.5 px-4 text-sm"
                    style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: theme.radius, color: theme.text, opacity: 0.5 }}>
                    your@email.com
                  </div>
                  <div className="py-2.5 px-4 text-sm font-medium"
                    style={{ background: theme.accent, color: theme.bg, borderRadius: theme.radius }}>
                    Subscribe
                  </div>
                </div>
              );
              if (block.type === "social") return (
                <div key={block.id} className="flex justify-center gap-3 py-2">
                  {["IG", "X", "YT"].map(p => (
                    <div key={p} className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{ border: `1px solid ${theme.border}`, color: theme.text }}>
                      {p}
                    </div>
                  ))}
                </div>
              );
              return null;
            })
          ) : (
            /* Placeholder blocks — show what the page could look like */
            <div className="space-y-3" style={{ opacity: 0.35 }}>
              <div className="w-full py-3.5 px-5 text-center text-sm font-medium"
                style={{ background: theme.surface, color: page.theme === "bold" ? theme.bg : theme.text, borderRadius: theme.radius, border: `1px solid ${theme.border}` }}>
                My Website
              </div>
              <div className="w-full py-3.5 px-5 text-center text-sm font-medium"
                style={{ background: theme.surface, color: page.theme === "bold" ? theme.bg : theme.text, borderRadius: theme.radius, border: `1px solid ${theme.border}` }}>
                Book a Session
              </div>
              <div className="flex justify-center gap-3 py-2">
                {["IG", "X", "YT"].map(p => (
                  <div key={p} className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{ border: `1px solid ${theme.border}`, color: theme.text }}>
                    {p}
                  </div>
                ))}
              </div>
              <div className="w-full flex gap-2">
                <div className="flex-1 py-2.5 px-4 text-sm"
                  style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: theme.radius, color: theme.text }}>
                  your@email.com
                </div>
                <div className="py-2.5 px-4 text-sm font-medium"
                  style={{ background: theme.accent, color: theme.bg, borderRadius: theme.radius }}>
                  Subscribe
                </div>
              </div>
              <p className="text-xs text-center pt-2" style={{ color: theme.text }}>
                Add blocks to build your page
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Render: Main ───────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28 xl:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Your Link Page</h1>
          <p className="text-sm text-[var(--text-muted)]">One link for everything — share it in your bio</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(!showPreview)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-all">
            <Eye size={14} />
            {showPreview ? "Edit" : "Preview"}
          </button>
          <button onClick={togglePublish} disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              page.is_published
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]"
            }`}>
            {page.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
            {page.is_published ? "Live" : "Draft"}
          </button>
          {page.is_published && (
            <a href={pageUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--accent)] hover:underline">
              <ExternalLink size={14} /> View
            </a>
          )}
        </div>
      </div>

      {/* Mobile preview */}
      {showPreview && <div className="md:hidden mb-6">{renderPreview()}</div>}

      {/* Desktop: editor + preview */}
      <div className="flex gap-6">
        {/* Editor */}
        <div className={`flex-1 space-y-6 ${showPreview ? "hidden md:block" : ""}`}>

          {/* Slug */}
          <section className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5">
            <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Your Link</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)] flex-shrink-0">guardia.page/</span>
              <input type="text" value={editSlug}
                onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ""))}
                className="flex-1 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                maxLength={30} />
              {editSlug !== page.slug ? (
                <button onClick={saveSlug} disabled={saving}
                  className="px-3 py-2 text-sm font-medium bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50">
                  Save
                </button>
              ) : (
                <button onClick={copyUrl}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                    copied
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-surface)]"
                  }`}>
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </button>
              )}
            </div>
          </section>

          {/* Profile */}
          <section className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Profile</h3>
            <div>
              <label className="text-sm text-[var(--text-secondary)] mb-1 block">Profile Image</label>
              <div className="flex items-center gap-3">
                {editImageUrl ? (
                  <img src={editImageUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-[var(--border)]" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center">
                    <ImageIcon size={16} className="text-[var(--text-muted)]" />
                  </div>
                )}
                <input type="url" value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)}
                  placeholder="Paste an image URL"
                  className="flex-1 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]" />
              </div>
            </div>
            <div>
              <label className="text-sm text-[var(--text-secondary)] mb-1 block">Display Name</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="text-sm text-[var(--text-secondary)] mb-1 block">
                Bio <span className="text-[var(--text-muted)]">({editBio.length}/500)</span>
              </label>
              <textarea value={editBio} onChange={e => setEditBio(e.target.value.slice(0, 500))}
                placeholder="Tell people about yourself..." rows={3}
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none" />
            </div>
            {profileDirty && (
              <button onClick={saveProfile} disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Profile
              </button>
            )}
          </section>

          {/* Theme Picker */}
          <section className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">Theme</h3>
            <div className="flex items-center gap-3 flex-wrap">
              {Object.entries(THEMES).map(([id, t]) => (
                <button key={id} onClick={() => updatePage({ theme: id })} disabled={saving}
                  className={`flex flex-col items-center gap-1.5 ${saving ? "opacity-50" : ""}`}>
                  <div className={`w-12 h-12 rounded-full border-[3px] transition-all ${
                    page.theme === id ? "border-[var(--accent)] scale-110" : "border-transparent hover:border-[var(--border)] hover:scale-105"
                  }`} style={{ background: t.bg, boxShadow: `inset 0 0 0 2px ${t.accent}` }} />
                  <span className={`text-[10px] font-medium ${
                    page.theme === id ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                  }`}>{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Blocks */}
          <section className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Blocks</h3>
              <button onClick={() => { setAddingBlock(true); setNewBlockType(null); resetBlockForm(); }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--accent)] bg-[var(--accent)]/10 rounded-lg hover:bg-[var(--accent)]/20 transition-all">
                <Plus size={12} /> Add Block
              </button>
            </div>

            {/* Type selector */}
            {addingBlock && !newBlockType && (
              <div className="mb-4 p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl space-y-1.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Choose block type</span>
                  <button onClick={() => setAddingBlock(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    <X size={14} />
                  </button>
                </div>
                {BLOCK_TYPES.map(bt => (
                  <button key={bt.type}
                    onClick={() => { setNewBlockType(bt.type); resetBlockForm(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-all text-left">
                    <bt.icon size={16} className="text-[var(--accent)] flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">{bt.label}</div>
                      <div className="text-xs text-[var(--text-muted)]">{bt.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Add block form */}
            {addingBlock && newBlockType && (
              <div className="mb-4 p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    New {BLOCK_TYPES.find(bt => bt.type === newBlockType)?.label}
                  </span>
                  <button onClick={() => { setNewBlockType(null); setAddingBlock(false); }}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    <X size={14} />
                  </button>
                </div>
                {(newBlockType === "link" || newBlockType === "header" || newBlockType === "text" || newBlockType === "email_capture") && (
                  <input type="text" value={blockTitle} onChange={e => setBlockTitle(e.target.value)}
                    placeholder={newBlockType === "link" ? "Link label" : newBlockType === "header" ? "Header text" : newBlockType === "email_capture" ? "Widget title" : "Text content"}
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                    autoFocus />
                )}
                {newBlockType === "link" && (
                  <input type="url" value={blockUrl} onChange={e => setBlockUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]" />
                )}
                <div className="flex gap-2">
                  <button onClick={() => addBlock(newBlockType)} disabled={saving}
                    className="px-4 py-2 text-sm font-medium bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50 flex items-center gap-1.5">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Add
                  </button>
                  <button onClick={() => { setNewBlockType(null); setAddingBlock(false); }}
                    className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Block list */}
            {blocks.length === 0 ? (
              <div className="space-y-2 py-2">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-[var(--accent)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Quick start — tap to add</span>
                </div>
                {[
                  { type: "link", title: "My Website", url: "https://", icon: Link2, desc: "Link to your website" },
                  { type: "link", title: "Book with Me", url: "https://", icon: Link2, desc: "Booking or scheduling link" },
                  { type: "social", title: "Social Links", url: "", icon: Share2, desc: "Your social media profiles" },
                  { type: "email_capture", title: "Join My List", url: "", icon: Mail, desc: "Collect emails from visitors" },
                ].map((suggestion, i) => (
                  <button key={i}
                    onClick={() => {
                      if (suggestion.type === "social") {
                        addBlock("social");
                      } else if (suggestion.type === "email_capture") {
                        setBlockTitle(suggestion.title);
                        addBlock("email_capture");
                      } else {
                        setBlockTitle(suggestion.title);
                        setBlockUrl(suggestion.url);
                        setNewBlockType(suggestion.type);
                        setAddingBlock(true);
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-[var(--bg-surface)] border border-dashed border-[var(--border)] rounded-xl hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all text-left group">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)]/10 transition-colors">
                      <suggestion.icon size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{suggestion.title}</div>
                      <div className="text-xs text-[var(--text-muted)]">{suggestion.desc}</div>
                    </div>
                    <Plus size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {blocks.map((block, idx) => (
                  <div key={block.id}
                    className="flex items-center gap-2 p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl group">
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0">
                      {block.type === "link" && <Link2 size={14} className="text-[var(--accent)]" />}
                      {block.type === "header" && <Type size={14} className="text-[var(--accent)]" />}
                      {block.type === "social" && <Share2 size={14} className="text-[var(--accent)]" />}
                      {block.type === "email_capture" && <Mail size={14} className="text-[var(--accent)]" />}
                      {block.type === "text" && <AlignLeft size={14} className="text-[var(--accent)]" />}
                    </div>

                    {/* Content */}
                    {editingBlock === block.id ? (
                      <div className="flex-1 space-y-2">
                        <input type="text" value={blockTitle} onChange={e => setBlockTitle(e.target.value)}
                          className="w-full px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                          autoFocus />
                        {block.type === "link" && (
                          <input type="url" value={blockUrl} onChange={e => setBlockUrl(e.target.value)} placeholder="URL"
                            className="w-full px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]" />
                        )}
                        <div className="flex gap-1.5">
                          <button onClick={() => updateBlock(block.id, {
                            title: blockTitle, ...(block.type === "link" ? { url: blockUrl } : {}),
                          })} disabled={saving}
                            className="px-2 py-1 text-xs font-medium bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] disabled:opacity-50">
                            Save
                          </button>
                          <button onClick={() => { setEditingBlock(null); resetBlockForm(); }}
                            className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {block.title || block.type}
                        </div>
                        {block.type === "link" && block.url && (
                          <div className="text-xs text-[var(--text-muted)] truncate">{block.url}</div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {editingBlock !== block.id && (
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveBlock(block.id, "up")}
                          disabled={idx === 0 || saving}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => moveBlock(block.id, "down")}
                          disabled={idx === blocks.length - 1 || saving}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30">
                          <ChevronDown size={14} />
                        </button>
                        <button onClick={() => startEditBlock(block)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)]">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => updateBlock(block.id, { is_visible: !block.is_visible })}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                          {block.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button onClick={() => deleteBlock(block.id)} disabled={saving}
                          className="p-1 text-[var(--text-muted)] hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Desktop preview */}
        <div className="hidden md:block w-[400px] flex-shrink-0">
          <div className="sticky top-6 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">Preview</h3>
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  );
}
