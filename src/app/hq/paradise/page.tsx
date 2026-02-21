"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TrendingUp, Zap, Target, Archive, Shield, Eye, Scale,
  RefreshCw, AlertTriangle, Clock, ImagePlus, type LucideIcon
} from "lucide-react";

const API_BASE = "https://api.guardiacontent.com";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface CatPerformance {
  total_signals: number;
  wins: number;
  losses: number;
  expired: number;
  win_rate: number;
  total_pips: number;
  avg_pips: number;
  shadow_count: number;
}

interface CatData {
  strategy: string;
  timeframe: string;
  last_signal: {
    pair: string;
    direction: string;
    outcome: string;
    pnl_pips: number;
    shadow: number;
    created_at: string;
  } | null;
  vulture: { approved: boolean; consecutive_losses: number };
  performance: CatPerformance;
  trades: { realized_pnl: number; total: number };
}

interface Position {
  strategy: string;
  pair: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  units: number;
  unrealized_pnl: number;
  oanda_id: string;
}

interface Signal {
  id: number;
  cat: string;
  pair: string;
  direction: string;
  entry_price: number;
  outcome: string;
  pnl_pips: number;
  shadow: number;
  created_at: string;
}

interface BirdStatus {
  mode: string;
  daily_pnl?: number;
  can_trade?: boolean;
  threshold?: number;
}

interface PriceData {
  bid: number;
  ask: number;
  spread: number;
  timestamp: string;
}

interface DashboardData {
  account: {
    balance: number;
    realized_pnl: number;
    unrealized_pnl: number;
    total_trades: number;
    open_count: number;
  };
  cats: Record<string, CatData>;
  other_cats: Record<string, { strategy: string; status: string }>;
  positions: Position[];
  signals: Signal[];
  birds: Record<string, BirdStatus>;
  prices: Record<string, PriceData>;
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const CAT_COLORS: Record<string, string> = {
  lion: "#FF8C00",
  cheetah: "#FFD700",
  tiger: "#FF6347",
  jaguar: "#00CED1",
};

const CAT_ICONS: Record<string, LucideIcon> = {
  lion: TrendingUp,
  cheetah: Zap,
  tiger: Target,
  jaguar: Archive,
};

const BIRD_ICONS: Record<string, LucideIcon> = {
  hawk: Shield,
  eagle: Eye,
  vulture: Scale,
};

const OUTCOME_COLORS: Record<string, string> = {
  hit_target: "#10b981",
  hit_stop: "#ef4444",
  expired: "#f59e0b",
  pending: "#666",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr + "Z").getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatPips(n: number | null): string {
  if (n == null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "p";
}

function formatMoney(n: number | null): string {
  if (n == null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(2);
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════════

function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    setIsAuthenticated(localStorage.getItem("hq_auth") === "true");
    setChecking(false);
  }, []);
  return { isAuthenticated, checking };
}

// ══════════════════════════════════════════════════════════════════════════════
// CAT AVATAR (drop zone + localStorage persistence)
// ══════════════════════════════════════════════════════════════════════════════

function CatAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const storageKey = `cat_avatar_${name}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) setSrc(stored);
  }, [storageKey]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      localStorage.setItem(storageKey, result);
      setSrc(result);
    };
    reader.readAsDataURL(file);
  };

  const color = CAT_COLORS[name] || "#888";

  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 cursor-pointer border-2 transition-all ${
        dragOver ? "scale-110" : ""
      }`}
      style={{
        width: size,
        height: size,
        borderColor: dragOver ? "#fff6" : src ? color : color + "40",
        borderStyle: src ? "solid" : "dashed",
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      title={`Click or drag to set ${name} avatar`}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
          <ImagePlus size={size * 0.4} style={{ color }} className="opacity-40" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function ParadiseHeader({ data, lastRefresh, refreshing, onRefresh }: {
  data: DashboardData;
  lastRefresh: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const totalPnl = (data.account.realized_pnl ?? 0) + (data.account.unrealized_pnl ?? 0);
  return (
    <header className="border-b border-[#1a1a1f] bg-gradient-to-b from-[#0c0a08] to-[#080706]">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[#d4af37] font-serif text-xl tracking-wide">Paradice</span>
            <span className="text-xs tracking-[0.2em] text-[#4a4535] font-mono border border-[#2a2a2f] px-2 py-0.5 rounded">PAPER</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-[#555] hover:text-[#888] transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {lastRefresh && (
              <span className="text-[10px] font-mono">{timeAgo(lastRefresh.toISOString().replace("Z", ""))}</span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[#555] text-xs tracking-[0.15em]">BALANCE</div>
            <div className="text-[#d4af37] font-mono text-lg">${data.account.balance.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-[#555] text-xs tracking-[0.15em]">TOTAL P&L</div>
            <div className={`font-mono text-lg ${totalPnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
              {formatMoney(totalPnl)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function ActivityTicker({ data }: { data: DashboardData }) {
  const items: Array<{ key: string; color: string; text: string }> = [];

  // Recent signals (most interesting)
  for (const sig of data.signals.slice(0, 8)) {
    const c = CAT_COLORS[sig.cat] || "#888";
    const dir = sig.direction === "long" ? "\u2191" : sig.direction === "short" ? "\u2193" : "\u2014";
    const outcome = sig.outcome?.toUpperCase() || (sig.direction === "neutral" ? "SCAN" : "PENDING");
    const pips = sig.pnl_pips != null ? ` ${formatPips(sig.pnl_pips)}` : "";
    items.push({
      key: `sig-${sig.id}`,
      color: c,
      text: `${sig.cat.toUpperCase()} ${dir} ${sig.pair} ${outcome}${pips} \u00b7 ${timeAgo(sig.created_at)}`,
    });
  }

  // Open positions
  for (const pos of data.positions) {
    const c = CAT_COLORS[pos.strategy] || "#888";
    const dir = pos.direction === "long" ? "\u2191" : "\u2193";
    const pnl = formatMoney(pos.unrealized_pnl);
    items.push({
      key: `pos-${pos.oanda_id}`,
      color: c,
      text: `${pos.strategy.toUpperCase()} ${dir} ${pos.pair} open ${pnl}`,
    });
  }

  // Cat scan status for cats with no recent signal
  for (const [name, cat] of Object.entries(data.cats)) {
    if (!cat.last_signal || cat.last_signal.direction === "neutral") {
      items.push({
        key: `scan-${name}`,
        color: CAT_COLORS[name] || "#888",
        text: `${name.toUpperCase()} scanning...`,
      });
    }
  }

  // Account summary
  items.push({
    key: "account",
    color: "#d4af37",
    text: `BAL $${data.account.balance.toFixed(2)} \u00b7 ${data.account.open_count} open \u00b7 ${data.account.total_trades} total trades`,
  });

  if (items.length === 0) return null;

  return (
    <div className="border-b border-[#1a1a1f] bg-[#0a0908] overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)" }}>
      <div className="flex animate-ticker">
        {[...items, ...items].map((item, i) => (
          <div
            key={`${item.key}-${i}`}
            className="flex items-center gap-2 px-5 py-2 whitespace-nowrap shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-[#999] font-mono">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatStatusCard({ name, cat }: { name: string; cat: CatData }) {
  const color = CAT_COLORS[name] || "#888";
  const perf = cat.performance;
  const v = cat.vulture;

  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-5 hover:border-[#2a2a2f] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <CatAvatar name={name} size={108} />
          <span className="text-lg font-medium tracking-wide" style={{ color }}>{name.toUpperCase()}</span>
        </div>
        <span className="text-[#555] text-xs">{cat.strategy} &middot; {cat.timeframe}</span>
      </div>

      {cat.last_signal ? (
        <div className="mb-3 px-3 py-2 bg-[#0e0e10] rounded border border-[#1a1a1f]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#aaa] font-mono">{cat.last_signal.pair}</span>
            {cat.last_signal.direction === "neutral" ? (
              <span className="text-[#555]">SCANNING</span>
            ) : (
              <span className={cat.last_signal.direction === "long" ? "text-[#50c878]" : "text-[#e74c3c]"}>
                {cat.last_signal.direction === "long" ? "\u2191" : "\u2193"} {cat.last_signal.direction.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: (OUTCOME_COLORS[cat.last_signal.outcome] || "#666") + "20",
                color: OUTCOME_COLORS[cat.last_signal.outcome] || "#666",
              }}
            >
              {cat.last_signal.outcome || (cat.last_signal.direction === "neutral" ? "scan" : "pending")}
            </span>
            <span className="text-[#555] text-xs">{timeAgo(cat.last_signal.created_at)}</span>
          </div>
        </div>
      ) : (
        <div className="mb-3 px-3 py-2 bg-[#0e0e10] rounded border border-[#1a1a1f] text-[#444] text-sm">
          No signals yet
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${!v.approved ? "animate-pulse" : ""}`}
            style={{ backgroundColor: v.approved ? (v.consecutive_losses >= 2 ? "#f59e0b" : "#10b981") : "#ef4444" }}
          />
          <span className="text-[#777] text-xs">
            Vulture: {v.approved ? "CLEAR" : "BLOCKED"} ({v.consecutive_losses}L)
          </span>
        </div>
        <span className="text-[#555] text-xs font-mono">
          {perf.total_signals} sigs &middot; {formatPips(perf.total_pips)}
        </span>
      </div>
    </div>
  );
}

function OtherCatCard({ name, info }: { name: string; info: { strategy: string; status: string } }) {
  const color = CAT_COLORS[name] || "#888";
  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-4 hover:border-[#2a2a2f] transition-colors opacity-60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CatAvatar name={name} size={84} />
          <span className="text-sm font-medium" style={{ color }}>{name.toUpperCase()}</span>
        </div>
        <span className="text-[#444] text-xs">{info.strategy}</span>
      </div>
    </div>
  );
}

function PositionsTable({ positions }: { positions: Position[] }) {
  if (positions.length === 0) {
    return (
      <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-8 text-center">
        <div className="text-[#444] text-sm">No open positions &mdash; cats are watching</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg overflow-hidden">
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1a1a1f]">
              {["PAIR", "CAT", "DIR", "ENTRY", "STOP", "UNITS", "P&L"].map((h) => (
                <th key={h} className="text-left text-[10px] tracking-[0.15em] text-[#555] font-medium px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, i) => (
              <tr key={i} className="border-b border-[#111] hover:bg-[#0e0e10] transition-colors">
                <td className="px-4 py-3 font-mono text-sm text-[#ccc]">{pos.pair}</td>
                <td className="px-4 py-3">
                  <span className="text-xs capitalize" style={{ color: CAT_COLORS[pos.strategy] || "#888" }}>
                    {pos.strategy}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm ${pos.direction === "long" ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                    {pos.direction === "long" ? "\u2191" : "\u2193"} {pos.direction.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-sm text-[#888]">{pos.entry_price}</td>
                <td className="px-4 py-3 font-mono text-sm text-[#666]">{pos.stop_loss}</td>
                <td className="px-4 py-3 font-mono text-sm text-[#888]">{pos.units}</td>
                <td className={`px-4 py-3 font-mono text-sm ${(pos.unrealized_pnl ?? 0) >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                  {formatMoney(pos.unrealized_pnl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-[#1a1a1f]">
        {positions.map((pos, i) => (
          <div key={i} className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#ccc] font-mono">{pos.pair}</span>
              <span className={`font-mono ${(pos.unrealized_pnl ?? 0) >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                {formatMoney(pos.unrealized_pnl)}
              </span>
            </div>
            <div className="flex gap-4 text-xs text-[#666]">
              <span style={{ color: CAT_COLORS[pos.strategy] }}>{pos.strategy}</span>
              <span>{pos.direction === "long" ? "\u2191 LONG" : "\u2193 SHORT"}</span>
              <span>Entry: {pos.entry_price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalFeed({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) {
    return (
      <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-6 text-center text-[#444] text-sm">
        No signals yet
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
      {signals.map((sig) => {
        const oc = OUTCOME_COLORS[sig.outcome] || "#666";
        const isShadow = sig.shadow === 1;
        return (
          <div
            key={sig.id}
            className={`flex items-center justify-between px-4 py-2.5 border-b border-[#111] hover:bg-[#0e0e10] transition-colors ${
              isShadow ? "border-l-2 border-l-dashed border-l-[#555]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-[#555] text-sm w-16">{timeAgo(sig.created_at)}</span>
              <span className="text-xs capitalize" style={{ color: CAT_COLORS[sig.cat] || "#888" }}>
                {sig.cat}
              </span>
              <span className="text-[#aaa] font-mono text-base">{sig.pair}</span>
              {sig.direction === "neutral" ? (
                <span className="text-[#555] text-xs">&mdash;</span>
              ) : (
                <span className={`text-xs ${sig.direction === "long" ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                  {sig.direction === "long" ? "\u2191" : "\u2193"}
                </span>
              )}
              {isShadow && <span className="text-[#555] text-[10px]">(shadow)</span>}
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded tracking-wider ${!sig.outcome ? "animate-pulse" : ""}`}
                style={{ backgroundColor: oc + "20", color: oc }}
              >
                {sig.outcome?.toUpperCase() || (sig.direction === "neutral" ? "SCAN" : "PENDING")}
              </span>
              {sig.pnl_pips != null && (
                <span className={`font-mono text-xs w-16 text-right ${sig.pnl_pips >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                  {formatPips(sig.pnl_pips)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BirdGatesPanel({ birds }: { birds: Record<string, BirdStatus> }) {
  const birdList = [
    { key: "hawk", label: "Hawk", desc: "Risk Gate" },
    { key: "eagle", label: "Eagle", desc: "Signal Quality" },
    { key: "vulture", label: "Vulture", desc: "Discipline" },
  ];

  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-5">
      <div className="text-[#555] text-sm tracking-[0.2em] font-medium mb-4">RISK GATES</div>
      <div className="space-y-3">
        {birdList.map(({ key, label, desc }) => {
          const bird = birds[key];
          if (!bird) return null;
          const isNormal = bird.mode === "normal";
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${!isNormal ? "animate-pulse" : ""}`}
                  style={{ backgroundColor: isNormal ? "#10b981" : "#ef4444" }}
                />
                {(() => { const BIcon = BIRD_ICONS[key]; return BIcon ? <BIcon size={14} className="text-[#666]" /> : null; })()}
                <span className="text-[#aaa] text-sm">{label}</span>
                <span className="text-[#444] text-xs">{desc}</span>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded tracking-wider"
                style={{
                  backgroundColor: isNormal ? "#10b98120" : "#ef444420",
                  color: isNormal ? "#10b981" : "#ef4444",
                }}
              >
                {bird.mode.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PerformancePanel({ cats }: { cats: Record<string, CatData> }) {
  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-5">
      <div className="text-[#555] text-sm tracking-[0.2em] font-medium mb-4">PERFORMANCE</div>
      <div className="space-y-4">
        {Object.entries(cats).map(([name, cat]) => {
          const p = cat.performance;
          const total = p.wins + p.losses;
          const winPct = total > 0 ? (p.wins / total) * 100 : 0;
          return (
            <div key={name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm flex items-center gap-1.5" style={{ color: CAT_COLORS[name] }}>
                  <CatAvatar name={name} size={60} />
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </span>
                <span className={`font-mono text-sm ${p.total_pips >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                  {formatPips(p.total_pips)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#666] mb-1.5">
                <span className="text-[#10b981]">{p.wins}W</span>
                <span className="text-[#ef4444]">{p.losses}L</span>
                <span className="text-[#f59e0b]">{p.expired}E</span>
                <span className="text-[#555]">&middot;</span>
                <span>{cat.trades.total} trades</span>
                <span className={`font-mono ${cat.trades.realized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                  ${cat.trades.realized_pnl.toFixed(2)}
                </span>
              </div>
              {total > 0 && (
                <div className="h-1 bg-[#1a1a1f] rounded-full overflow-hidden">
                  <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${winPct}%` }} />
                </div>
              )}
              {p.shadow_count > 0 && (
                <div className="text-[10px] text-[#555] mt-1">Shadow: {p.shadow_count} tracked</div>
              )}
              {p.shadow_count === 0 && p.total_signals > 0 && (
                <div className="text-[10px] text-[#444] mt-1">No shadow data yet</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ══════════════════════════════════════════════════════════════════════════════

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#171513] text-[#e8e4d9]">
      <header className="border-b border-[#1a1a1f] bg-gradient-to-b from-[#0c0a08] to-[#080706] h-16" />
      <main className="max-w-[1400px] mx-auto p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-40 animate-pulse" />
          ))}
        </div>
        <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-48 animate-pulse" />
        <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-64 animate-pulse" />
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function ParadisePage() {
  const { isAuthenticated, checking } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/hq/paradise/dashboard`);
      if (res.ok) {
        setData(await res.json());
        setError(false);
        setLastRefresh(new Date());
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
  }, []);

  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchData]);

  if (checking) return <div className="min-h-screen bg-[#171513]" />;

  if (!isAuthenticated) {
    if (typeof window !== "undefined") window.location.href = "/hq";
    return null;
  }

  if (!data) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-[#171513] text-[#e8e4d9]">
      <div className="fixed inset-0 bg-gradient-to-br from-[#d4af37]/[0.05] via-transparent to-[#d4af37]/[0.01] pointer-events-none" />

      <div className="relative">
        <ParadiseHeader data={data} lastRefresh={lastRefresh} refreshing={refreshing} onRefresh={manualRefresh} />
        <ActivityTicker data={data} />

        <main className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-4 py-2 text-[#ef4444] text-sm flex items-center gap-2">
              <AlertTriangle size={14} />
              Connection issue &mdash; retrying...
            </div>
          )}

          {/* Stale signal warning */}
          {(() => {
            const allSignals = Object.values(data.cats)
              .map(c => c.last_signal?.created_at)
              .filter(Boolean) as string[];
            if (allSignals.length === 0) return null;
            const newest = Math.max(...allSignals.map(s => new Date(s + "Z").getTime()));
            const hoursAgo = (Date.now() - newest) / 3600000;
            if (hoursAgo < 12) return null;
            return (
              <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg px-4 py-2 text-[#f59e0b] text-sm flex items-center gap-2">
                <Clock size={14} />
                Signals stale &mdash; last scan was {Math.floor(hoursAgo)}h ago
              </div>
            );
          })()}

          {/* Cat Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data.cats).map(([name, cat]) => (
              <CatStatusCard key={name} name={name} cat={cat} />
            ))}
          </div>

          {/* Other Cats (Tiger, Jaguar) */}
          {Object.keys(data.other_cats).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(data.other_cats).map(([name, info]) => (
                <OtherCatCard key={name} name={name} info={info} />
              ))}
            </div>
          )}

          {/* Open Positions */}
          <div>
            <div className="text-[#9a8e7e] text-sm tracking-[0.2em] font-medium mb-3">
              OPEN POSITIONS
              {data.account.open_count > 0 && (
                <span className="ml-2 text-[#888]">({data.account.open_count})</span>
              )}
            </div>
            <PositionsTable positions={data.positions} />
          </div>

          {/* Signal Feed */}
          <div>
            <div className="text-[#9a8e7e] text-sm tracking-[0.2em] font-medium mb-3">
              SIGNAL FEED <span className="text-[#444]">last 20</span>
            </div>
            <SignalFeed signals={data.signals} />
          </div>

          {/* Bottom Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BirdGatesPanel birds={data.birds} />
            <PerformancePanel cats={data.cats} />
          </div>
        </main>
      </div>
    </div>
  );
}
