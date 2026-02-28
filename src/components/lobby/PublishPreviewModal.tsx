"use client";

import { useState, useEffect } from "react";

const API_BASE = "https://api.guardiacontent.com";

interface Platform {
  platform: string;
  handle: string;
  display_name: string;
  enabled: boolean;
}

interface AssetPreview {
  id: number;
  image_url: string;
  caption: string;
  hashtags: string;
  filename: string;
}

interface PublishResult {
  platform: string;
  display_name: string;
  handle: string;
  status: string;
  post_url: string | null;
  error: string | null;
}

interface PublishPreviewModalProps {
  assetId: number;
  jwt: string | null;
  onClose: () => void;
  onPublished: () => void;
}

export default function PublishPreviewModal({ assetId, jwt, onClose, onPublished }: PublishPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [asset, setAsset] = useState<AssetPreview | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [results, setResults] = useState<PublishResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      if (!jwt) return;
      try {
        const res = await fetch(`${API_BASE}/lobby/gallery/${assetId}/preview`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAsset(data.asset);
          setPlatforms(data.platforms);
          if (!data.can_publish) setError("No platforms connected.");
        } else {
          setError("Failed to load preview");
        }
      } catch {
        setError("Connection error");
      }
      setLoading(false);
    };
    loadPreview();
  }, [assetId, jwt]);

  const handlePublish = async () => {
    if (!jwt || !asset) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/lobby/gallery/${assetId}/publish-now`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResults(data.results);
      } else {
        setError(data.detail || "Failed to publish");
      }
    } catch {
      setError("Connection error");
    }
    setPublishing(false);
  };

  const handleDone = () => { onPublished(); onClose(); };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-[var(--bg-elevated)] rounded-2xl p-8">
          <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mx-auto" />
          <p className="text-[var(--text-secondary)] text-sm mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (results) {
    const success = results.filter(r => r.status === "posted");
    const failed = results.filter(r => r.status === "failed");
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-[var(--bg-elevated)] rounded-2xl w-full max-w-md overflow-hidden">
          <div className="p-6 text-center border-b border-[var(--border-subtle)]">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#10b981]/20 rounded-full flex items-center justify-center">
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Posted!</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{success.length} of {results.length} platforms</p>
          </div>
          <div className="p-4 space-y-3">
            {success.map(r => (
              <a key={r.platform} href={r.post_url || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-[var(--bg-surface)] rounded-xl hover:bg-[var(--border)] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                  {r.platform === "facebook" ? <svg width={20} height={20} viewBox="0 0 24 24" fill="#10b981"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> : <svg width={20} height={20} viewBox="0 0 24 24" fill="#10b981"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">View on {r.platform === "facebook" ? "Facebook" : "Instagram"}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{r.display_name}</p>
                </div>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </a>
            ))}
            {failed.map(r => (
              <div key={r.platform} className="flex items-center gap-3 p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#ef4444]/20 flex items-center justify-center">
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#ef4444]">{r.platform === "facebook" ? "Facebook" : "Instagram"} failed</p>
                  <p className="text-xs text-[var(--text-secondary)]">{r.error}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-[var(--border-subtle)]">
            <button onClick={handleDone} className="w-full py-3 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-hover)] transition-colors">Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-elevated)] rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ready to Post</h2>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-lg transition-colors">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {asset && (
          <div className="p-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-[var(--bg-surface)] mb-4">
              <img src={asset.image_url} alt={asset.filename} className="w-full h-full object-cover"/>
            </div>
            {(asset.caption || asset.hashtags) && (
              <div className="bg-[var(--bg-surface)] rounded-xl p-3 mb-4">
                {asset.caption && <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{asset.caption}</p>}
                {asset.hashtags && <p className="text-sm text-[var(--accent)] mt-2">{asset.hashtags}</p>}
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Posting to</p>
              {platforms.map(p => (
                <div key={p.platform} className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                    {p.platform === "facebook" ? <svg width={16} height={16} viewBox="0 0 24 24" fill="#10b981"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> : <svg width={16} height={16} viewBox="0 0 24 24" fill="#10b981"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{p.platform === "facebook" ? "Facebook" : "Instagram"}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{p.platform === "facebook" ? p.display_name : `@${p.handle}`}</p>
                  </div>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
              ))}
              {platforms.length === 0 && (
                <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl">
                  <p className="text-sm text-[#ef4444]">No platforms connected</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Go to Account to connect Facebook or Instagram</p>
                </div>
              )}
            </div>
          </div>
        )}
        {error && <div className="px-4 pb-4"><div className="p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl"><p className="text-sm text-[#ef4444]">{error}</p></div></div>}
        <div className="flex gap-3 p-4 border-t border-[var(--border-subtle)]">
          <button onClick={onClose} className="flex-1 py-3 bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium rounded-xl hover:bg-[var(--border)] transition-colors">Cancel</button>
          <button onClick={handlePublish} disabled={publishing || platforms.length === 0} className="flex-1 py-3 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {publishing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Posting...</> : "Confirm & Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
