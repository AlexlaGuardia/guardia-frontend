"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Check, Building2 } from "lucide-react";

const API_BASE = "https://api.guardiacontent.com";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface FlockLead {
  id: number;
  address: string;
  city: string;
  county: string;
  asking_price: number;
  units: number;
  sqft: number;
  dom: number;
  listing_url: string;
  image_url: string | null;
  property_type: string;
  price_per_door: number;
  estimated_dscr: number;
  composite_score: number;
  owl_reasoning: string;
  status: string;
}

interface FlockDossier extends FlockLead {
  rent_estimate_per_unit: number;
  monthly_gross: number;
  mortgage_estimate: number;
  owner_name: string | null;
  talking_points: string[];
  comps: { address: string; price: number; units: number; sold_date: string }[];
}

interface FlockStats {
  total_leads: number;
  scored?: number;
  calls_made?: number;
  interested?: number;
  last_scan?: string | null;
  by_status?: Record<string, number>;
  avg_score?: number;
  last_scrape?: string | null;
}

// ══════════════════════════════════════════════════════════════════════════════
// STAT PILL
// ══════════════════════════════════════════════════════════════════════════════

function StatPill({ label, value, color = "#888" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg px-4 py-3">
      <span className="text-[#555] text-[10px] tracking-wider block">{label}</span>
      <p className="font-mono text-lg" style={{ color }}>{value}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LEAD CARD (expandable)
// ══════════════════════════════════════════════════════════════════════════════

function LeadCard({ lead, rank }: { lead: FlockLead; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const [dossier, setDossier] = useState<FlockDossier | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(lead.status);

  const loadDossier = useCallback(async () => {
    if (dossier) return;
    setLoadingDossier(true);
    try {
      const res = await fetch(`${API_BASE}/hq/flock/lead/${lead.id}`);
      if (res.ok) { const d = await res.json(); setDossier(d.lead || d); }
    } catch {}
    setLoadingDossier(false);
  }, [lead.id, dossier]);

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadDossier();
  };

  const markOutcome = async (status: string) => {
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/hq/flock/lead/${lead.id}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setCurrentStatus(status);
    } catch {}
    setActionLoading(false);
  };

  const scoreColor = lead.composite_score >= 70 ? "#10b981" : lead.composite_score >= 40 ? "#f59e0b" : "#555";
  const statusColors: Record<string, string> = {
    new: "#3b82f6", called: "#8b5cf6", interested: "#10b981", skip: "#555", dead: "#ef4444"
  };

  return (
    <div className={`bg-[#0a0a0b] border rounded-xl transition-all duration-300 ${expanded ? "border-blue-500/30" : "border-[#1a1a1f] hover:border-[#2a2a2f]"}`}>
      {/* Compact Header */}
      <div className="p-5 cursor-pointer" onClick={handleExpand}>
        <div className="flex items-start gap-4">
          {/* Rank Badge */}
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-400 font-mono text-sm font-bold">#{rank}</span>
          </div>

          {/* Photo */}
          {lead.image_url ? (
            <img src={lead.image_url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-[#1a1a1f] flex-shrink-0 flex items-center justify-center">
              <span className="text-[#333] text-[10px] tracking-wider">NO IMG</span>
            </div>
          )}

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[#ccc] font-medium truncate">{lead.address}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{
                backgroundColor: `${statusColors[currentStatus] || "#555"}15`,
                color: statusColors[currentStatus] || "#555"
              }}>{currentStatus.toUpperCase()}</span>
            </div>
            <p className="text-xs text-[#555] mb-3">{lead.city}, {lead.county} County</p>

            <div className="flex items-center gap-4 text-xs">
              <span className="text-blue-400 font-mono font-medium text-base">${(lead.asking_price / 1000).toFixed(0)}K</span>
              <span className="text-[#666]">{lead.units} units</span>
              <span className="text-[#666]">${(lead.price_per_door / 1000).toFixed(0)}K/door</span>
              <span className="text-[#666]">{lead.dom}d DOM</span>
            </div>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${scoreColor}15` }}>
              <span className="font-mono font-bold text-lg" style={{ color: scoreColor }}>{lead.composite_score}</span>
            </div>
            <span className="text-[10px] text-[#444] mt-1">SCORE</span>
          </div>
        </div>

        {/* Owl Reasoning */}
        <p className="text-xs text-[#666] mt-3 pl-12">{lead.owl_reasoning}</p>

        {/* DSCR + expand hint */}
        <div className="flex items-center gap-4 mt-3 pl-12">
          <span className="text-[10px] text-[#555]">DSCR <span className={`font-mono ${lead.estimated_dscr >= 1.2 ? "text-emerald-400" : lead.estimated_dscr >= 1.0 ? "text-amber-400" : "text-red-400"}`}>{lead.estimated_dscr.toFixed(2)}x</span></span>
          <span className="text-[10px] text-[#333] ml-auto">{expanded ? "▲ collapse" : "▼ expand dossier"}</span>
        </div>
      </div>

      {/* Expanded Dossier */}
      {expanded && (
        <div className="border-t border-[#1a1a1f] p-5">
          {loadingDossier ? (
            <div className="space-y-3">
              <div className="h-4 bg-[#1a1a1f] rounded animate-pulse w-2/3" />
              <div className="h-4 bg-[#1a1a1f] rounded animate-pulse w-1/2" />
              <div className="h-4 bg-[#1a1a1f] rounded animate-pulse w-3/4" />
            </div>
          ) : dossier ? (
            <div className="space-y-5">
              {/* Financial Summary */}
              <div>
                <h4 className="text-[10px] tracking-wider text-blue-500/60 mb-3">FINANCIALS</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#0d0d0e] rounded-lg p-3">
                    <span className="text-[10px] text-[#444] block">Rent/Unit</span>
                    <span className="text-sm font-mono text-[#ccc]">${dossier.rent_estimate_per_unit?.toLocaleString() || "—"}/mo</span>
                  </div>
                  <div className="bg-[#0d0d0e] rounded-lg p-3">
                    <span className="text-[10px] text-[#444] block">Gross Monthly</span>
                    <span className="text-sm font-mono text-emerald-400">${dossier.monthly_gross?.toLocaleString() || "—"}</span>
                  </div>
                  <div className="bg-[#0d0d0e] rounded-lg p-3">
                    <span className="text-[10px] text-[#444] block">Est. Mortgage</span>
                    <span className="text-sm font-mono text-[#ccc]">${dossier.mortgage_estimate?.toLocaleString() || "—"}/mo</span>
                  </div>
                  <div className="bg-[#0d0d0e] rounded-lg p-3">
                    <span className="text-[10px] text-[#444] block">Owner</span>
                    <span className="text-sm text-[#ccc]">{dossier.owner_name || "Unknown"}</span>
                  </div>
                </div>
              </div>

              {/* Talking Points */}
              {dossier.talking_points && dossier.talking_points.length > 0 && (
                <div>
                  <h4 className="text-[10px] tracking-wider text-blue-500/60 mb-3">CALL PREP</h4>
                  <div className="space-y-2">
                    {dossier.talking_points.map((tp, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-blue-500/40 text-xs mt-0.5">›</span>
                        <p className="text-xs text-[#888]">{tp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comps */}
              {dossier.comps && dossier.comps.length > 0 && (
                <div>
                  <h4 className="text-[10px] tracking-wider text-blue-500/60 mb-3">COMPARABLE SALES</h4>
                  <div className="space-y-1">
                    {dossier.comps.map((comp, i) => (
                      <div key={i} className="flex items-center gap-4 text-xs py-1.5 border-b border-[#1a1a1f] last:border-0">
                        <span className="text-[#888] flex-1 truncate">{comp.address}</span>
                        <span className="text-[#ccc] font-mono">${(comp.price / 1000).toFixed(0)}K</span>
                        <span className="text-[#555]">{comp.units}u</span>
                        <span className="text-[#444]">{comp.sold_date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Listing Link */}
              {lead.listing_url && (
                <a href={lead.listing_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-400/60 hover:text-blue-400 transition-colors">
                  View on Crexi ↗
                </a>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 border-t border-[#1a1a1f]">
                {[
                  { status: "called", label: "Called", color: "#8b5cf6" },
                  { status: "interested", label: "Interested", color: "#10b981" },
                  { status: "skip", label: "Skip", color: "#555" },
                  { status: "dead", label: "Dead", color: "#ef4444" },
                ].map(action => (
                  <button
                    key={action.status}
                    onClick={(e) => { e.stopPropagation(); markOutcome(action.status); }}
                    disabled={actionLoading || currentStatus === action.status}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      currentStatus === action.status
                        ? "opacity-100 ring-1"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: `${action.color}15`,
                      color: action.color,
                      ...(currentStatus === action.status ? { ringColor: action.color } : {}),
                    }}
                  >
                    {currentStatus === action.status ? <><Check size={12} className="inline mr-0.5" /> {action.label}</> : action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#555]">Could not load dossier. Backend may not be ready yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function FlockPage() {
  const [leads, setLeads] = useState<FlockLead[]>([]);
  const [stats, setStats] = useState<FlockStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/hq/flock/top`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/hq/flock/stats`).then(r => r.ok ? r.json() : null),
    ])
      .then(([leadsData, statsData]) => {
        setLeads(Array.isArray(leadsData) ? leadsData : leadsData.picks || leadsData.leads || []);
        setStats(statsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);

  return (
    <div className="min-h-screen bg-[#171513] text-[#e8e8e8]">
      {/* Header */}
      <header className="border-b border-[#1a1a1f] bg-[#0a0a0b]/50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h1 className="text-blue-500 font-semibold text-sm tracking-wider">FLOCK</h1>
          </div>
          {(stats?.last_scrape || stats?.last_scan) && (
            <span className="text-[#444] text-xs font-mono">Last scan: {new Date(stats.last_scrape || stats.last_scan || '').toLocaleTimeString()}</span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatPill label="TOTAL LEADS" value={stats.total_leads} color="#3b82f6" />
            <StatPill label="AVG SCORE" value={stats.avg_score ? stats.avg_score.toFixed(0) : "—"} color="#f59e0b" />
            <StatPill label="CALLED" value={stats.by_status?.called || stats.calls_made || 0} color="#8b5cf6" />
            <StatPill label="INTERESTED" value={stats.by_status?.interested || stats.interested || 0} color="#10b981" />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-1 w-fit">
          {["all", "new", "called", "interested", "skip"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === f ? "bg-blue-500/15 text-blue-400" : "text-[#555] hover:text-[#888]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Lead Cards */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-xl h-[180px] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Building2 size={20} className="text-blue-400" />
            </div>
            <p className="text-[#666] text-sm mb-1">No leads yet</p>
            <p className="text-[#444] text-xs">Flock agents are scanning. Check back after the next cycle.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((lead, i) => (
              <LeadCard key={lead.id} lead={lead} rank={i + 1} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
