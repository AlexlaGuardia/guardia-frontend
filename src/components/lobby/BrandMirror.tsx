"use client";

import { useState, useEffect, useRef } from "react";
const API_BASE = "https://api.guardiacontent.com";

interface BrandMirrorProps {
  clientId: string;
  jwt: string;
  onStyleUpdated?: () => void;
}

interface BrandData {
  identity: {
    name: string;
    industry: string | null;
    soul: string | null;
    differentiator: string | null;
  };
  colors: string[];
  voice: {
    summary: string | null;
    traits: string[];
  };
  audience: {
    description: string | null;
  };
  visual: {
    style: string | null;

  };
  recent_posts: { styled_url: string; original_url: string }[];
}


// Pencil icon for edit buttons
function EditIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
    </svg>
  );
}

export default function BrandMirror({ clientId: _clientId, jwt, onStyleUpdated }: BrandMirrorProps) {
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showOriginals, setShowOriginals] = useState(false);
  const [_stylePreview, setStylePreview] = useState<{ prompt: string; strength: number; style_name: string } | null>(null);

  // Edit states
  const [editingColors, setEditingColors] = useState(false);
  const [editingVoice, setEditingVoice] = useState(false);
  const [editingAudience, setEditingAudience] = useState(false);
  const [editingVisual, setEditingVisual] = useState(false);

  // Draft values during editing
  const [draftColors, setDraftColors] = useState<string[]>([]);
  const [draftVoice, setDraftVoice] = useState("");
  const [draftAudience, setDraftAudience] = useState("");
  const [draftVisual, setDraftVisual] = useState("");

  // Color input ref for picker
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const res = await fetch(`${API_BASE}/client/me/brand-mirror`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (res.ok) {
          setBrand(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch brand mirror:", err);
      }
      setLoading(false);
    };
    const fetchStylePreview = async () => {
      try {
        const res = await fetch(`${API_BASE}/client/me/style-preview`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (res.ok) {
          setStylePreview(await res.json());
        }
      } catch {}
    };
    fetchBrand();
    fetchStylePreview();
  }, [jwt]);

  const saveBrandField = async (payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/client/me/brand-mirror`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Failed to save");
        setSaving(false);
        return false;
      }
      setError(null);
      onStyleUpdated?.();
      setSaving(false);
      return true;
    } catch {
      setError("Connection error");
      setSaving(false);
      return false;
    }
  };

  // Save handlers
  const saveColors = async () => {
    if (!brand) return;
    const ok = await saveBrandField({ colors: draftColors });
    if (ok) {
      setBrand({ ...brand, colors: [...draftColors] });
      setEditingColors(false);
    }
  };

  const saveVoice = async () => {
    if (!brand) return;
    const ok = await saveBrandField({ voice_summary: draftVoice });
    if (ok) {
      setBrand({ ...brand, voice: { ...brand.voice, summary: draftVoice || null } });
      setEditingVoice(false);
    }
  };

  const saveAudience = async () => {
    if (!brand) return;
    const ok = await saveBrandField({ audience: draftAudience });
    if (ok) {
      setBrand({ ...brand, audience: { description: draftAudience || null } });
      setEditingAudience(false);
    }
  };

  const saveVisual = async () => {
    if (!brand) return;
    const ok = await saveBrandField({ visual_style: draftVisual });
    if (ok) {
      setBrand({ ...brand, visual: { ...brand.visual, style: draftVisual || null } });
      setEditingVisual(false);
    }
  };

  // Start editing helpers
  const startEditColors = () => {
    if (!brand) return;
    setDraftColors([...brand.colors]);
    setEditingColors(true);
  };
  const startEditVoice = () => {
    setDraftVoice(brand?.voice.summary || "");
    setEditingVoice(true);
  };
  const startEditAudience = () => {
    setDraftAudience(brand?.audience.description || "");
    setEditingAudience(true);
  };
  const startEditVisual = () => {
    setDraftVisual(brand?.visual.style || "");
    setEditingVisual(true);
  };


  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-base)]">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-base)]">
        <p className="text-[var(--text-muted)]">Unable to load brand profile</p>
      </div>
    );
  }

  // Section header with optional edit button
  const SectionHeader = ({ label, onEdit, editing, onCancel }: {
    label: string; onEdit?: () => void; editing?: boolean; onCancel?: () => void;
  }) => (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{label}</h3>
      {editing ? (
        <button onClick={onCancel} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
          Cancel
        </button>
      ) : onEdit ? (
        <button onClick={onEdit} className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors p-1 -m-1 rounded-lg hover:bg-[var(--bg-surface)]">
          <EditIcon />
        </button>
      ) : null}
    </div>
  );

  // Save/cancel bar for edit mode
  const SaveBar = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div className="flex items-center justify-end gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
      <button onClick={onCancel} disabled={saving}
        className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors rounded-lg">
        Cancel
      </button>
      <button onClick={onSave} disabled={saving}
        className="px-4 py-1.5 text-xs font-medium rounded-lg transition-all"
        style={{ background: 'var(--accent)', color: 'var(--bg-base)', opacity: saving ? 0.6 : 1 }}>
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-base)]">
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Identity (read-only — set by Giovanni) */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
              style={{
                background: brand.colors[0] ? `${brand.colors[0]}25` : 'var(--bg-surface)',
                color: brand.colors[0] || 'var(--accent)',
              }}>
              {brand.identity.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">{brand.identity.name}</h2>
              {brand.identity.industry && (
                <p className="text-sm text-[var(--text-muted)] mt-0.5">{brand.identity.industry}</p>
              )}
              {brand.identity.differentiator && (
                <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">{brand.identity.differentiator}</p>
              )}
            </div>
          </div>
        </div>

        {/* Colors — editable */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <SectionHeader label="Brand Colors"
            onEdit={startEditColors}
            editing={editingColors}
            onCancel={() => setEditingColors(false)} />

          {editingColors ? (
            <div>
              <div className="flex flex-wrap gap-3">
                {draftColors.map((color, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 group relative">
                    <label className="cursor-pointer">
                      <input type="color" value={color}
                        onChange={(e) => {
                          const updated = [...draftColors];
                          updated[i] = e.target.value;
                          setDraftColors(updated);
                        }}
                        className="sr-only" />
                      <div className="w-12 h-12 rounded-xl shadow-sm ring-2 ring-[var(--accent)]/30 transition-all hover:scale-105"
                        style={{ backgroundColor: color, border: '1px solid var(--border)' }} />
                    </label>
                    <span className="text-xs text-[var(--text-muted)] font-mono">{color}</span>
                    <button onClick={() => setDraftColors(draftColors.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500/80 text-white rounded-full text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      x
                    </button>
                  </div>
                ))}
                {draftColors.length < 5 && (
                  <div className="flex flex-col items-center gap-1.5">
                    <label className="cursor-pointer">
                      <input ref={colorInputRef} type="color" value="#C9A227"
                        onChange={(e) => setDraftColors([...draftColors, e.target.value])}
                        className="sr-only" />
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                        style={{ border: '2px dashed var(--border)' }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </div>
                    </label>
                    <span className="text-xs text-[var(--text-muted)]">Add</span>
                  </div>
                )}
              </div>
              <SaveBar onSave={saveColors} onCancel={() => setEditingColors(false)} />
            </div>
          ) : brand.colors.length > 0 ? (
            <div className="flex gap-3">
              {brand.colors.map((color, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-xl shadow-sm"
                    style={{ backgroundColor: color, border: '1px solid var(--border)' }} />
                  <span className="text-xs text-[var(--text-muted)] font-mono">{color}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic">No brand colors set</p>
          )}
        </div>

        {/* Voice — editable */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <SectionHeader label="Voice & Tone"
            onEdit={startEditVoice}
            editing={editingVoice}
            onCancel={() => setEditingVoice(false)} />

          {editingVoice ? (
            <div>
              {brand.voice.traits.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {brand.voice.traits.map((trait, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      {trait}
                    </span>
                  ))}
                </div>
              )}
              <textarea value={draftVoice} onChange={(e) => setDraftVoice(e.target.value)}
                rows={3} maxLength={1000} placeholder="Describe your brand voice..."
                className="w-full rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
              <SaveBar onSave={saveVoice} onCancel={() => setEditingVoice(false)} />
            </div>
          ) : (
            <>
              {brand.voice.traits.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {brand.voice.traits.map((trait, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      {trait}
                    </span>
                  ))}
                </div>
              )}
              {brand.voice.summary ? (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{brand.voice.summary}</p>
              ) : !brand.voice.traits.length ? (
                <p className="text-sm text-[var(--text-muted)] italic">No voice description set</p>
              ) : null}
            </>
          )}
        </div>

        {/* Audience — editable */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <SectionHeader label="Audience"
            onEdit={startEditAudience}
            editing={editingAudience}
            onCancel={() => setEditingAudience(false)} />

          {editingAudience ? (
            <div>
              <textarea value={draftAudience} onChange={(e) => setDraftAudience(e.target.value)}
                rows={3} maxLength={1000} placeholder="Describe your target audience..."
                className="w-full rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
              <SaveBar onSave={saveAudience} onCancel={() => setEditingAudience(false)} />
            </div>
          ) : brand.audience.description ? (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{brand.audience.description}</p>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic">No audience description set</p>
          )}
        </div>

        {/* Visual Style — editable */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <SectionHeader label="Visual Style"
            onEdit={startEditVisual}
            editing={editingVisual}
            onCancel={() => setEditingVisual(false)} />

          {editingVisual ? (
            <div>
              <textarea value={draftVisual} onChange={(e) => setDraftVisual(e.target.value)}
                rows={4} maxLength={2000} placeholder="Describe your visual style direction..."
                className="w-full rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
              <SaveBar onSave={saveVisual} onCancel={() => setEditingVisual(false)} />
            </div>
          ) : brand.visual.style ? (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{brand.visual.style}</p>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic">No visual style set</p>
          )}
        </div>

        {/* Recent Posts with before/after toggle */}
        {brand.recent_posts.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Recent Work</h3>
              <button onClick={() => setShowOriginals(!showOriginals)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all"
                style={{
                  background: showOriginals ? 'var(--accent)' : 'var(--bg-surface)',
                  color: showOriginals ? 'var(--bg-base)' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                {showOriginals ? "Showing originals" : "Before / After"}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {brand.recent_posts.map((post, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden relative group"
                  style={{ border: '1px solid var(--border)' }}>
                  <img src={showOriginals ? post.original_url : post.styled_url} alt=""
                    className="w-full h-full object-cover transition-opacity duration-300" loading="lazy" />
                  {showOriginals && (
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
                      style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                      Original
                    </div>
                  )}
                </div>
              ))}
            </div>
            {showOriginals && (
              <p className="text-[11px] text-[var(--text-muted)] mt-2 text-center">
                Tap &quot;Before / After&quot; again to see styled versions
              </p>
            )}
          </div>
        )}




        {/* Bottom breathing room */}
        <div className="h-4" />
      </div>
    </div>
  );
}
