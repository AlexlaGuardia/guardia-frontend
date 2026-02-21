"use client";

import { useState, useEffect } from "react";

const API_BASE = "https://api.guardiacontent.com";

interface Client {
  id: string;
  business_name: string;
  tier: string;
  status: string;
  pin?: string;
  created_at?: string;
  scheduled: number;
  posted: number;
  failed: number;
  last_posted: string | null;
}

const TIER_COLORS: Record<string, string> = {
  unleashed: "#d4af37",
  pro: "#8b5cf6",
  spark: "#10b981",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function ClientCard({ client }: { client: Client }) {
  const [showPin, setShowPin] = useState(false);
  const [copied, setCopied] = useState(false);

  const tierColor = TIER_COLORS[client.tier] || "#666";
  const lobbyUrl = `https://guardiacontent.com/lobby/${client.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(lobbyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = lobbyUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasActivity = client.scheduled > 0 || client.posted > 0 || client.failed > 0;

  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-xl p-5 hover:border-[#2a2a2f] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-[#e8e8e8] font-semibold text-base truncate">
            {client.business_name.toUpperCase()}
          </h3>

          <div className="flex items-center gap-3 mt-1">
            <span className="text-[#555] text-xs font-mono">{client.id}</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ color: tierColor, backgroundColor: `${tierColor}15` }}
            >
              {client.tier}
            </span>
            <span className={`text-xs ${client.status === "active" ? "text-emerald-400" : "text-[#555]"}`}>
              {client.status}
            </span>
          </div>

          {/* Pipeline Stats */}
          <div className="flex items-center gap-4 mt-3">
            {hasActivity ? (
              <>
                <span className="text-[#555] text-xs font-mono">
                  <span className="text-emerald-400">{client.scheduled}</span> scheduled
                </span>
                <span className="text-[#555] text-xs font-mono">
                  <span className="text-[#888]">{client.posted}</span> posted
                </span>
                {client.failed > 0 && (
                  <span className="text-[#555] text-xs font-mono">
                    <span className="text-red-400">{client.failed}</span> failed
                  </span>
                )}
              </>
            ) : (
              <span className="text-[#333] text-xs font-mono">No posts yet</span>
            )}
          </div>

          {/* Last Posted */}
          {client.last_posted && (
            <p className="text-[#444] text-xs mt-1 font-mono">
              Last posted {timeAgo(client.last_posted)}
            </p>
          )}
        </div>

        {/* Right side: PIN & Actions */}
        <div className="flex flex-col items-end gap-2">
          {client.pin && (
            <div className="flex items-center gap-2">
              <span className="text-[#555] text-xs">PIN:</span>
              <span className="text-[#888] font-mono text-sm tracking-wider">
                {showPin ? client.pin : "••••"}
              </span>
              <button
                onClick={() => setShowPin(!showPin)}
                className="text-[#555] hover:text-[#888] text-xs transition-colors"
              >
                {showPin ? "hide" : "show"}
              </button>
            </div>
          )}

          <button
            onClick={copyLink}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
              copied
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-[#1a1a1f] text-[#888] hover:text-[#ccc] hover:bg-[#252528]"
            }`}
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetch(`${API_BASE}/hq/clients`)
      .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch"))
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const tiers = ["unleashed", "pro", "spark"];
  const grouped = tiers.map(tier => ({
    tier,
    clients: clients.filter(c => c.tier === tier)
  })).filter(g => g.clients.length > 0);

  const knownTiers = new Set(tiers);
  const otherClients = clients.filter(c => !knownTiers.has(c.tier));
  if (otherClients.length > 0) {
    grouped.push({ tier: "other", clients: otherClients });
  }

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-[#555] text-sm">Loading...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400/60 text-sm">{error}</div>
        </div>
      ) : clients.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-[#444] text-sm">No clients yet</div>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ tier, clients: tierClients }) => (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: TIER_COLORS[tier] || "#666" }}
                />
                <h2
                  className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: TIER_COLORS[tier] || "#666" }}
                >
                  {tier}
                </h2>
                <span className="text-[#444] text-xs font-mono ml-2">{tierClients.length}</span>
              </div>
              <div className="space-y-3">
                {tierClients.map(client => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
