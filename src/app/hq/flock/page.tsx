"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Building2, ChevronDown, ExternalLink, Phone, User, FileText } from "lucide-react";

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
  price_per_door: number;
  estimated_dscr: number;
  composite_score: number;
  status: string;
  notes: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  agent_email: string | null;
  call_notes: string | null;
  // Owl-specific
  rank?: number;
  reasoning?: string;
  picked_date?: string;
  owl_reasoning?: string;
}

interface FlockDossier extends FlockLead {
  rent_estimate_per_unit: number;
  monthly_gross: number;
  mortgage_estimate: number;
  monthly_cash_flow: number;
  annual_cash_flow: number;
  down_payment: number;
  cash_on_cash_return: number;
  owner_name: string | null;
  talking_points: string[];
  deal_summary: string;
  red_flags: string[];
  comps: { address: string; price: number; units: number; price_per_door?: number; sold_date: string }[];
}

interface FlockStats {
  total_leads: number;
  by_status?: Record<string, number>;
  avg_score?: number;
  last_scrape?: string | null;
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const PIPELINE_STATUSES: { value: string; label: string; color: string }[] = [
  { value: "new", label: "New", color: "#3b82f6" },
  { value: "reviewed", label: "Reviewed", color: "#6366f1" },
  { value: "called", label: "Called", color: "#8b5cf6" },
  { value: "pitched", label: "Pitched", color: "#a855f7" },
  { value: "locked", label: "Locked", color: "#f59e0b" },
  { value: "submitted", label: "Submitted", color: "#f97316" },
  { value: "closing", label: "Closing", color: "#10b981" },
  { value: "closed", label: "Closed", color: "#22c55e" },
  { value: "dead", label: "Dead", color: "#ef4444" },
  { value: "skip", label: "Skip", color: "#555" },
];

function getStatusColor(status: string): string {
  return PIPELINE_STATUSES.find(s => s.value === status)?.color || "#555";
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#555";
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
// STATUS SELECT
// ══════════════════════════════════════════════════════════════════════════════

function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (status: string) => void;
  disabled?: boolean;
}) {
  const color = getStatusColor(value);
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none bg-transparent border rounded-lg px-3 py-1.5 pr-7 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 transition-all"
        style={{
          borderColor: `${color}40`,
          color,
          backgroundColor: `${color}10`,
        }}
      >
        {PIPELINE_STATUSES.map(s => (
          <option key={s.value} value={s.value} style={{ backgroundColor: "#0a0a0b", color: "#ccc" }}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LEAD CARD (expandable)
// ══════════════════════════════════════════════════════════════════════════════

function LeadCard({ lead, rank, showDate }: { lead: FlockLead; rank?: number; showDate?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [dossier, setDossier] = useState<FlockDossier | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(lead.status || "new");
  const [notes, setNotes] = useState(lead.notes || "");
  const [callNotes, setCallNotes] = useState(lead.call_notes || "");
  const [agentInfo, setAgentInfo] = useState({
    name: lead.agent_name || "",
    phone: lead.agent_phone || "",
    email: lead.agent_email || "",
  });
  const [showAgent, setShowAgent] = useState(!!lead.agent_name);
  const [saving, setSaving] = useState(false);

  const loadDossier = useCallback(async () => {
    if (dossier) return;
    setLoadingDossier(true);
    try {
      const res = await fetch(`${API_BASE}/hq/flock/lead/${lead.id}`);
      if (res.ok) { const d = await res.json(); setDossier(d.lead || d); }
    } catch { /* ignore */ }
    setLoadingDossier(false);
  }, [lead.id, dossier]);

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadDossier();
  };

  const saveOutcome = async (status?: string) => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/hq/flock/lead/${lead.id}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status || currentStatus,
          notes: notes || null,
          call_notes: callNotes || null,
          agent_name: agentInfo.name || null,
          agent_phone: agentInfo.phone || null,
          agent_email: agentInfo.email || null,
        }),
      });
      if (status) setCurrentStatus(status);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const scoreColor = getScoreColor(lead.composite_score || 0);
  const statusColor = getStatusColor(currentStatus);
  const reasoning = lead.reasoning || lead.owl_reasoning;

  return (
    <div className={`bg-[#0a0a0b] border rounded-xl transition-all duration-300 ${expanded ? "border-blue-500/30" : "border-[#1a1a1f] hover:border-[#2a2a2f]"}`}>
      {/* Compact Header */}
      <div className="p-5 cursor-pointer" onClick={handleExpand}>
        <div className="flex items-start gap-4">
          {/* Rank Badge */}
          {rank && (
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-mono text-sm font-bold">#{rank}</span>
            </div>
          )}

          {/* Photo */}
          {lead.image_url ? (
            <img src={lead.image_url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-[#1a1a1f] flex-shrink-0 flex items-center justify-center">
              <Building2 size={20} className="text-[#333]" />
            </div>
          )}

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[#ccc] font-medium truncate">{lead.address}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono flex-shrink-0" style={{
                backgroundColor: `${statusColor}15`,
                color: statusColor,
              }}>{currentStatus.toUpperCase()}</span>
            </div>
            <p className="text-xs text-[#555] mb-3">
              {lead.city}{lead.county ? `, ${lead.county} County` : ""}
              {showDate && lead.picked_date && <span className="ml-2 text-[#444]">{lead.picked_date}</span>}
            </p>

            <div className="flex items-center gap-4 text-xs flex-wrap">
              {lead.asking_price > 0 && <span className="text-blue-400 font-mono font-medium text-base">${(lead.asking_price / 1000).toFixed(0)}K</span>}
              {lead.units > 0 && <span className="text-[#666]">{lead.units} units</span>}
              {lead.price_per_door > 0 && <span className="text-[#666]">${(lead.price_per_door / 1000).toFixed(0)}K/door</span>}
              {lead.dom > 0 && <span className="text-[#666]">{lead.dom}d DOM</span>}
            </div>
          </div>

          {/* Score */}
          {lead.composite_score > 0 && (
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${scoreColor}15` }}>
                <span className="font-mono font-bold text-lg" style={{ color: scoreColor }}>{Math.round(lead.composite_score)}</span>
              </div>
              <span className="text-[10px] text-[#444] mt-1">SCORE</span>
            </div>
          )}
        </div>

        {/* Owl Reasoning */}
        {reasoning && <p className="text-xs text-[#666] mt-3 pl-12 line-clamp-2">{reasoning}</p>}

        {/* DSCR + expand hint */}
        <div className="flex items-center gap-4 mt-3 pl-12">
          {lead.estimated_dscr > 0 && (
            <span className="text-[10px] text-[#555]">DSCR <span className={`font-mono ${lead.estimated_dscr >= 1.2 ? "text-emerald-400" : lead.estimated_dscr >= 1.0 ? "text-amber-400" : "text-red-400"}`}>{lead.estimated_dscr.toFixed(2)}x</span></span>
          )}
          <span className="text-[10px] text-[#333] ml-auto">{expanded ? "collapse" : "expand"}</span>
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
          ) : (
            <div className="space-y-5">
              {/* Deal Summary */}
              {dossier?.deal_summary && (
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                  <p className="text-xs text-[#ccc]">{dossier.deal_summary}</p>
                </div>
              )}

              {/* Financial Summary */}
              {dossier && (
                <div>
                  <h4 className="text-[10px] tracking-wider text-blue-500/60 mb-3">FINANCIALS</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-[#0d0d0e] rounded-lg p-3">
                      <span className="text-[10px] text-[#444] block">Rent/Unit</span>
                      <span className="text-sm font-mono text-[#ccc]">${dossier.rent_estimate_per_unit?.toLocaleString() || "—"}/mo</span>
                    </div>
                    <div className="bg-[#0d0d0e] rounded-lg p-3">
                      <span className="text-[10px] text-[#444] block">Gross Monthly</span>
                      <span className="text-sm font-mono text-emerald-400">${dossier.monthly_gross?.toLocaleString() || "—"}</span>
                    </div>
                    <div className="bg-[#0d0d0e] rounded-lg p-3">
                      <span className="text-[10px] text-[#444] block">Mortgage (75% LTV)</span>
                      <span className="text-sm font-mono text-[#ccc]">${dossier.mortgage_estimate?.toLocaleString() || "—"}/mo</span>
                    </div>
                    <div className="bg-[#0d0d0e] rounded-lg p-3">
                      <span className="text-[10px] text-[#444] block">Monthly Cash Flow</span>
                      <span className={`text-sm font-mono ${(dossier.monthly_cash_flow || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        ${dossier.monthly_cash_flow?.toLocaleString() || "—"}
                      </span>
                    </div>
                    <div className="bg-[#0d0d0e] rounded-lg p-3">
                      <span className="text-[10px] text-[#444] block">Down Payment (25%)</span>
                      <span className="text-sm font-mono text-[#ccc]">${dossier.down_payment?.toLocaleString() || "—"}</span>
                    </div>
                    <div className="bg-[#0d0d0e] rounded-lg p-3">
                      <span className="text-[10px] text-[#444] block">Cash-on-Cash</span>
                      <span className={`text-sm font-mono ${(dossier.cash_on_cash_return || 0) >= 8 ? "text-emerald-400" : (dossier.cash_on_cash_return || 0) >= 4 ? "text-amber-400" : "text-[#ccc]"}`}>
                        {dossier.cash_on_cash_return || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Red Flags */}
              {dossier?.red_flags && dossier.red_flags.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                  <h4 className="text-[10px] tracking-wider text-red-500/60 mb-2">RED FLAGS</h4>
                  <div className="space-y-1">
                    {dossier.red_flags.map((flag, i) => (
                      <p key={i} className="text-xs text-red-400/80">{flag}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Talking Points */}
              {dossier?.talking_points && dossier.talking_points.length > 0 && (
                <div>
                  <h4 className="text-[10px] tracking-wider text-blue-500/60 mb-3">CALL PREP</h4>
                  <div className="space-y-2">
                    {dossier.talking_points.map((tp, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-blue-500/40 text-xs mt-0.5">&#8250;</span>
                        <p className="text-xs text-[#888]">{tp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comps */}
              {dossier?.comps && dossier.comps.length > 0 && (
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

              {/* Status + Actions */}
              <div className="pt-3 border-t border-[#1a1a1f]">
                <h4 className="text-[10px] tracking-wider text-blue-500/60 mb-3">ACTIONS</h4>
                <div className="flex items-center gap-3 mb-4">
                  <StatusSelect
                    value={currentStatus}
                    onChange={(s) => { setCurrentStatus(s); saveOutcome(s); }}
                    disabled={saving}
                  />
                  {lead.listing_url && (
                    <a href={lead.listing_url} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-blue-400/60 hover:text-blue-400 transition-colors">
                      <ExternalLink size={12} /> Crexi
                    </a>
                  )}
                </div>

                {/* Notes */}
                <div className="mb-3">
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    onBlur={() => saveOutcome()}
                    placeholder="Notes..."
                    rows={2}
                    className="w-full bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg px-3 py-2 text-xs text-[#ccc] placeholder-[#333] focus:outline-none focus:border-[#2a2a2f] resize-none"
                  />
                </div>

                {/* Call Notes */}
                {(currentStatus === "called" || currentStatus === "pitched" || callNotes) && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Phone size={10} className="text-[#444]" />
                      <span className="text-[10px] text-[#444]">Call Notes</span>
                    </div>
                    <textarea
                      value={callNotes}
                      onChange={e => setCallNotes(e.target.value)}
                      onBlur={() => saveOutcome()}
                      placeholder="Call outcome, follow-up items..."
                      rows={2}
                      className="w-full bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg px-3 py-2 text-xs text-[#ccc] placeholder-[#333] focus:outline-none focus:border-[#2a2a2f] resize-none"
                    />
                  </div>
                )}

                {/* Agent Info Toggle */}
                {!showAgent ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowAgent(true); }}
                    className="text-[10px] text-[#444] hover:text-[#666] transition-colors"
                  >
                    + Add Agent Info
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <User size={10} className="text-[#444]" />
                      <span className="text-[10px] text-[#444]">Agent Contact</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={agentInfo.name}
                        onChange={e => setAgentInfo({ ...agentInfo, name: e.target.value })}
                        onBlur={() => saveOutcome()}
                        placeholder="Name"
                        className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg px-3 py-1.5 text-xs text-[#ccc] placeholder-[#333] focus:outline-none focus:border-[#2a2a2f]"
                      />
                      <input
                        value={agentInfo.phone}
                        onChange={e => setAgentInfo({ ...agentInfo, phone: e.target.value })}
                        onBlur={() => saveOutcome()}
                        placeholder="Phone"
                        className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg px-3 py-1.5 text-xs text-[#ccc] placeholder-[#333] focus:outline-none focus:border-[#2a2a2f]"
                      />
                      <input
                        value={agentInfo.email}
                        onChange={e => setAgentInfo({ ...agentInfo, email: e.target.value })}
                        onBlur={() => saveOutcome()}
                        placeholder="Email"
                        className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg px-3 py-1.5 text-xs text-[#ccc] placeholder-[#333] focus:outline-none focus:border-[#2a2a2f]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PICKS TAB
// ══════════════════════════════════════════════════════════════════════════════

function PicksTab() {
  const [picksByDate, setPicksByDate] = useState<Record<string, FlockLead[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/hq/flock/top?days=7`)
      .then(r => r.ok ? r.json() : { picks_by_date: {} })
      .then(data => setPicksByDate(data.picks_by_date || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dates = Object.keys(picksByDate).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-xl h-[160px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
          <Building2 size={20} className="text-blue-400" />
        </div>
        <p className="text-[#666] text-sm mb-1">No picks in the last 7 days</p>
        <p className="text-[#444] text-xs">Owl runs daily at 8am EST. Check back tomorrow.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {dates.map(date => {
        const picks = picksByDate[date];
        const isToday = date === new Date().toISOString().split("T")[0];
        const displayDate = isToday ? "Today" : new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

        return (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <h3 className="text-xs font-medium text-[#666] tracking-wider uppercase">{displayDate}</h3>
              <span className="text-[10px] text-[#333] font-mono">{date}</span>
            </div>
            <div className="space-y-3">
              {picks.map((pick, i) => (
                <LeadCard key={pick.id} lead={pick} rank={pick.rank || i + 1} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PIPELINE TAB
// ══════════════════════════════════════════════════════════════════════════════

function PipelineTab() {
  const [pipeline, setPipeline] = useState<Record<string, FlockLead[]>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(0);

  const loadPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${API_BASE}/hq/flock/pipeline?limit=200${minScore > 0 ? `&min_score=${minScore}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPipeline(data.pipeline || {});
        setTotal(data.total_active || 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [minScore]);

  useEffect(() => { loadPipeline(); }, [loadPipeline]);

  const statusOrder = ["new", "reviewed", "called", "pitched", "locked", "submitted", "closing", "closed"];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-xl h-[100px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-[#555] text-xs">{total} active leads</span>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-[#444]">Min Score</span>
          <select
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg px-2 py-1 text-xs text-[#ccc] focus:outline-none"
          >
            <option value={0}>All</option>
            <option value={30}>30+</option>
            <option value={50}>50+</option>
            <option value={70}>70+</option>
          </select>
        </div>
      </div>

      {/* Pipeline Columns */}
      <div className="space-y-6">
        {statusOrder.map(status => {
          const leads = pipeline[status];
          if (!leads || leads.length === 0) return null;
          const color = getStatusColor(status);

          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <h3 className="text-xs font-medium tracking-wider uppercase" style={{ color }}>{status}</h3>
                <span className="text-[10px] text-[#333] font-mono">{leads.length}</span>
              </div>
              <div className="space-y-2">
                {leads.map(lead => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {total === 0 && (
        <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-xl p-12 text-center">
          <p className="text-[#666] text-sm">No active leads in pipeline</p>
          <p className="text-[#444] text-xs mt-1">Leads marked dead or skip are hidden</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function FlockPage() {
  const [tab, setTab] = useState<"picks" | "pipeline">("picks");
  const [stats, setStats] = useState<FlockStats | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/hq/flock/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {});
  }, []);

  const tabs = [
    { key: "picks" as const, label: "Picks" },
    { key: "pipeline" as const, label: "Pipeline" },
  ];

  return (
    <div className="min-h-screen bg-[#171513] text-[#e8e8e8]">
      {/* Header */}
      <header className="border-b border-[#1a1a1f] bg-[#0a0a0b]/50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h1 className="text-blue-500 font-semibold text-sm tracking-wider">FLOCK</h1>
            <span className="text-[#333] text-xs">Real Estate Pipeline</span>
          </div>
          {stats?.last_scrape && (
            <span className="text-[#444] text-xs font-mono">
              Last data: {new Date(stats.last_scrape).toLocaleDateString()}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatPill label="TOTAL LEADS" value={stats.total_leads} color="#3b82f6" />
            <StatPill label="AVG SCORE" value={stats.avg_score ? Math.round(stats.avg_score) : "—"} color="#f59e0b" />
            <StatPill label="REVIEWED" value={(stats.by_status?.reviewed || 0) + (stats.by_status?.called || 0) + (stats.by_status?.pitched || 0)} color="#8b5cf6" />
            <StatPill label="IN PIPELINE" value={Object.entries(stats.by_status || {}).filter(([k]) => !["new", "dead", "skip"].includes(k)).reduce((s, [, v]) => s + v, 0)} color="#10b981" />
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 mb-6 bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-1 w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === t.key ? "bg-blue-500/15 text-blue-400" : "text-[#555] hover:text-[#888]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "picks" ? <PicksTab /> : <PipelineTab />}
      </main>
    </div>
  );
}
