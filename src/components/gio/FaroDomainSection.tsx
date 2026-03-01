"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, Loader2, Check, X, AlertCircle, Copy, Unlink } from "lucide-react";

const API_BASE = "https://api.guardiacontent.com";

interface DomainStatus {
  connected: boolean;
  domain?: string;
  status?: string;
  ssl_status?: string;
  cname_target?: string;
}

interface FaroDomainSectionProps {
  jwt: string | null;
}

export default function FaroDomainSection({ jwt }: FaroDomainSectionProps) {
  const [domainData, setDomainData] = useState<DomainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inputDomain, setInputDomain] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadDomain = useCallback(async () => {
    if (!jwt) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/faro/domain`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        setDomainData(await res.json());
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, [jwt]);

  useEffect(() => { loadDomain(); }, [loadDomain]);

  // Auto-poll when pending — check every 15s until active
  useEffect(() => {
    if (domainData?.connected && domainData.status === "pending") {
      const interval = setInterval(loadDomain, 15000);
      return () => clearInterval(interval);
    }
  }, [domainData?.connected, domainData?.status, loadDomain]);

  const connectDomain = async () => {
    if (!jwt || !inputDomain.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/faro/domain`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: inputDomain.trim() }),
      });
      if (res.ok) {
        setInputDomain("");
        await loadDomain();
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to connect domain");
      }
    } catch {
      setError("Network error");
    }
    setSaving(false);
  };

  const disconnectDomain = async () => {
    if (!jwt) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/faro/domain`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        setDomainData({ connected: false });
      }
    } catch {
      setError("Failed to disconnect");
    }
    setSaving(false);
  };

  const copyCname = () => {
    navigator.clipboard.writeText("faro.guardiacontent.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <section className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5">
        <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Custom Domain</label>
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
        </div>
      </section>
    );
  }

  // Domain connected
  if (domainData?.connected) {
    const statusColor =
      domainData.status === "active" ? "text-green-400" :
      domainData.status === "pending" ? "text-yellow-400" :
      "text-[var(--text-muted)]";

    const statusLabel =
      domainData.status === "active" ? "Active" :
      domainData.status === "pending" ? "Pending DNS" :
      domainData.status === "moved" ? "Moved" :
      domainData.status || "Unknown";

    return (
      <section className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-3">
        <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] block">Custom Domain</label>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={16} className={statusColor} />
            <span className="text-sm font-medium text-[var(--text-primary)]">{domainData.domain}</span>
            <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
          </div>
          <button onClick={disconnectDomain} disabled={saving}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
            Disconnect
          </button>
        </div>

        {domainData.status === "pending" && (
          <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-[var(--text-secondary)]">
                Add a CNAME record at your DNS provider:
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[var(--bg-elevated)] rounded-lg px-3 py-2">
              <code className="text-xs text-[var(--text-primary)] flex-1 font-mono">
                {domainData.domain} → faro.guardiacontent.com
              </code>
              <button onClick={copyCname}
                className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              It may take a few minutes for DNS changes to propagate and SSL to activate.
            </p>
          </div>
        )}

        {domainData.status === "active" && (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <Check size={12} />
            <span>Domain active with SSL</span>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </section>
    );
  }

  // No domain connected — show input
  return (
    <section className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-3">
      <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] block">Custom Domain</label>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputDomain}
          onChange={e => setInputDomain(e.target.value.toLowerCase().trim())}
          placeholder="yoursite.com"
          className="flex-1 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
          onKeyDown={e => e.key === "Enter" && connectDomain()}
        />
        <button onClick={connectDomain} disabled={saving || !inputDomain.trim()}
          className="px-4 py-2 text-sm font-medium bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50 flex items-center gap-1.5">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
          Connect
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <X size={12} /> {error}
        </p>
      )}

      <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
        <div className="flex flex-col gap-1.5 mt-0.5">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center text-[9px] font-bold flex-shrink-0">1</span>
            <span>Enter your domain above and click Connect</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] flex items-center justify-center text-[9px] font-bold flex-shrink-0">2</span>
            <span>Add a CNAME record at your DNS provider pointing to <code className="text-[var(--text-secondary)]">faro.guardiacontent.com</code></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] flex items-center justify-center text-[9px] font-bold flex-shrink-0">3</span>
            <span>SSL activates automatically — usually under 5 minutes</span>
          </div>
        </div>
      </div>
    </section>
  );
}
