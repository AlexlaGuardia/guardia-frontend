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

interface TigerCat {
  strategy: string;
  market: string;
  timeframe: string;
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  closed_trades: number;
  open_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  open_positions: Array<{ market: string; direction: string; entry_price: number; pnl: number; created_at: string }>;
  last_closed_at: string | null;
}

interface LionPosition {
  symbol: string;
  shares: number;
  entry_price: number;
  current_price: number;
  pnl_dollars: number;
  pnl_pct: number;
  status: string;
  stop_price: number;
}

interface LionCat {
  strategy: string;
  market: string;
  timeframe: string;
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  positions: LionPosition[];
}

interface CheetahCat {
  strategy: string;
  market: string;
  timeframe: string;
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  closed_trades: number;
  open_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  open_positions: Array<{ market: string; direction: string; entry_price: number; pnl: number; created_at: string }>;
  last_closed_at: string | null;
}

interface JaguarCat {
  strategy: string;
  market: string;
  timeframe: string;
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  training?: boolean;
  forex: { realized_pnl: number; closed_trades: number; wins: number; losses: number; total_pips: number };
  funding: { realized_pnl: number; closed_trades: number; total_funding: number };
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
    starting_capital: number;
    total_realized: number;
    total_unrealized: number;
    total_pnl: number;
  };
  cats: {
    tiger: TigerCat;
    lion: LionCat;
    cheetah: CheetahCat;
    jaguar: JaguarCat;
  };
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

const _CAT_ICONS: Record<string, LucideIcon> = {
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
// HEADER
// ══════════════════════════════════════════════════════════════════════════════

function ParadiseHeader({ data, lastRefresh, refreshing, onRefresh }: {
  data: DashboardData;
  lastRefresh: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const pnl = data.account.total_pnl;
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
            <div className="text-[#555] text-xs tracking-[0.15em]">CAPITAL</div>
            <div className="text-[#d4af37] font-mono text-lg">${data.account.starting_capital.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-[#555] text-xs tracking-[0.15em]">TOTAL P&amp;L</div>
            <div className={`font-mono text-lg ${pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
              {formatMoney(pnl)}
            </div>
            <div className="flex gap-3 justify-end mt-0.5">
              <span className="text-[10px] text-[#555] font-mono">
                R <span className={data.account.total_realized >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}>{formatMoney(data.account.total_realized)}</span>
              </span>
              <span className="text-[10px] text-[#555] font-mono">
                U <span className={data.account.total_unrealized >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}>{formatMoney(data.account.total_unrealized)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ACTIVITY TICKER
// ══════════════════════════════════════════════════════════════════════════════

function ActivityTicker({ data }: { data: DashboardData }) {
  const items: Array<{ key: string; color: string; text: string }> = [];

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

  // Tiger open positions
  if (data.cats.tiger?.open_positions?.length > 0) {
    for (const tp of data.cats.tiger.open_positions) {
      items.push({
        key: `tiger-pos-${tp.market}`,
        color: CAT_COLORS.tiger,
        text: `TIGER ${tp.direction === "long" ? "\u2191" : "\u2193"} ${tp.market.slice(0, 30)} ${formatMoney(tp.pnl)}`,
      });
    }
  }

  // Jaguar activity
  if (data.cats.jaguar) {
    const j = data.cats.jaguar;
    if (j.funding.total_funding !== 0) {
      items.push({
        key: "jaguar-funding",
        color: CAT_COLORS.jaguar,
        text: `JAGUAR funding arb ${formatMoney(j.funding.total_funding)} collected \u00b7 ${j.funding.closed_trades} trades`,
      });
    }
  }

  // Account summary
  items.push({
    key: "account",
    color: "#d4af37",
    text: `CAPITAL $${data.account.starting_capital.toLocaleString()} \u00b7 P&L ${formatMoney(data.account.total_pnl)}`,
  });

  if (items.length === 0) return null;

  return (
    <div
      className="border-b border-[#1a1a1f] bg-[#0a0908] overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
      }}
    >
      <div className="flex animate-ticker">
        {[...items, ...items].map((item, i) => (
          <div key={`${item.key}-${i}`} className="flex items-center gap-2 px-5 py-2 whitespace-nowrap shrink-0">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-[#999] font-mono">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CAT CARDS
// ══════════════════════════════════════════════════════════════════════════════

function CardShell({ name, subtitle, children }: { name: string; subtitle: string; children: React.ReactNode }) {
  const color = CAT_COLORS[name] || "#888";
  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-5 hover:border-[#2a2a2f] transition-colors flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CatAvatar name={name} size={40} />
          <span className="text-lg font-medium tracking-wide" style={{ color }}>{name.toUpperCase()}</span>
        </div>
        <span className="text-[#444] text-xs font-mono">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}

function PnlDisplay({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      {label && <div className="text-[#555] text-[10px] tracking-[0.15em] mb-0.5">{label}</div>}
      <div className={`font-mono text-2xl font-semibold ${value >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
        {formatMoney(value)}
      </div>
    </div>
  );
}

function TigerCard({ tiger }: { tiger: TigerCat }) {
  const hasPositions = tiger.open_positions?.length > 0;
  return (
    <CardShell name="tiger" subtitle={`${tiger.strategy} \u00b7 ${tiger.market}`}>
      <div className="flex items-end justify-between">
        <PnlDisplay value={tiger.total_pnl} label="TOTAL P&L" />
        <div className="text-right">
          <div
            className="inline-flex items-center px-2.5 py-1 rounded text-sm font-mono font-semibold"
            style={{ backgroundColor: "#FF634715", color: "#FF6347" }}
          >
            {tiger.win_rate != null ? tiger.win_rate.toFixed(1) : "—"}% WR
          </div>
          <div className="text-[#555] text-xs font-mono mt-1">{tiger.closed_trades} trades</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0e0e10] rounded p-2.5">
          <div className="text-[#555] text-[10px] tracking-[0.1em]">REALIZED</div>
          <div className={`font-mono text-sm mt-0.5 ${tiger.realized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
            {formatMoney(tiger.realized_pnl)}
          </div>
        </div>
        <div className="bg-[#0e0e10] rounded p-2.5">
          <div className="text-[#555] text-[10px] tracking-[0.1em]">UNREALIZED</div>
          <div className={`font-mono text-sm mt-0.5 ${tiger.unrealized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
            {formatMoney(tiger.unrealized_pnl)}
          </div>
        </div>
        <div className="bg-[#0e0e10] rounded p-2.5">
          <div className="text-[#555] text-[10px] tracking-[0.1em]">W / L</div>
          <div className="font-mono text-sm mt-0.5">
            <span className="text-[#50c878]">{tiger.wins}W</span>
            <span className="text-[#555]"> / </span>
            <span className="text-[#e74c3c]">{tiger.losses}L</span>
          </div>
        </div>
      </div>

      {hasPositions && (
        <div>
          <div className="text-[#555] text-[10px] tracking-[0.15em] mb-2">OPEN POSITIONS ({tiger.open_trades})</div>
          <div className="space-y-1.5">
            {tiger.open_positions.map((pos, i) => (
              <div key={i} className="flex items-center justify-between bg-[#0e0e10] rounded px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${pos.direction === "long" ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                    {pos.direction === "long" ? "\u2191" : "\u2193"}
                  </span>
                  <span className="text-[#aaa] text-xs font-mono truncate max-w-[140px]">{pos.market}</span>
                </div>
                <span className={`font-mono text-xs ${pos.pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                  {formatMoney(pos.pnl)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tiger.last_closed_at && (
        <div className="flex items-center gap-1.5 text-[#444] text-xs">
          <Clock size={11} />
          <span>Last closed {timeAgo(tiger.last_closed_at)}</span>
        </div>
      )}
    </CardShell>
  );
}

function LionCard({ lion }: { lion: LionCat }) {
  const hasPositions = lion.positions?.length > 0;
  return (
    <CardShell name="lion" subtitle={`${lion.strategy} \u00b7 ${lion.market}`}>
      <div className="flex items-end justify-between">
        <PnlDisplay value={lion.total_pnl} label="TOTAL P&L" />
        <div className="text-right">
          <div className="text-[#555] text-[10px] tracking-[0.1em]">UNREALIZED</div>
          <div className={`font-mono text-sm ${lion.unrealized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
            {formatMoney(lion.unrealized_pnl)}
          </div>
        </div>
      </div>

      {hasPositions ? (
        <div>
          <div className="text-[#555] text-[10px] tracking-[0.15em] mb-2">POSITIONS ({lion.positions.length})</div>
          <div className="space-y-2">
            {lion.positions.map((pos, i) => (
              <div key={i} className="bg-[#0e0e10] rounded px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#ccc] font-mono text-sm font-semibold">{pos.symbol}</span>
                    <span className="text-[#555] text-xs">{pos.shares}sh</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: pos.status === "trailing" ? "#f59e0b20" : "#ffffff10",
                        color: pos.status === "trailing" ? "#f59e0b" : "#777",
                      }}
                    >
                      {pos.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-sm ${pos.pnl_dollars >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                      {formatMoney(pos.pnl_dollars)}
                    </span>
                    <span className={`font-mono text-xs ml-2 ${pos.pnl_pct >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                      ({pos.pnl_pct >= 0 ? "+" : ""}{pos.pnl_pct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-[#555] font-mono">
                  <span>Entry ${pos.entry_price.toFixed(2)}</span>
                  <span>\u2192</span>
                  <span>Now ${pos.current_price.toFixed(2)}</span>
                  {pos.status === "trailing" && <span className="text-[#f59e0b]">Stop ${pos.stop_price.toFixed(2)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-[#444] text-sm text-center py-4">No open positions</div>
      )}

      <div className="bg-[#0e0e10] rounded px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[#555] text-xs">Realized</span>
          <span className={`font-mono text-sm ${lion.realized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
            {formatMoney(lion.realized_pnl)}
          </span>
        </div>
      </div>
    </CardShell>
  );
}

function CheetahCard({ cheetah }: { cheetah: CheetahCat }) {
  const hasPositions = cheetah.open_positions?.length > 0;
  return (
    <CardShell name="cheetah" subtitle={`${cheetah.strategy} \u00b7 ${cheetah.market}`}>
      <div className="flex items-end justify-between">
        <PnlDisplay value={cheetah.total_pnl} label="TOTAL P&L" />
        <div className="text-right">
          <div
            className="inline-flex items-center px-2.5 py-1 rounded text-sm font-mono font-semibold"
            style={{ backgroundColor: "#FFD70015", color: "#FFD700" }}
          >
            {cheetah.win_rate != null ? cheetah.win_rate.toFixed(1) : "—"}% WR
          </div>
          <div className="text-[#555] text-xs font-mono mt-1">{cheetah.closed_trades} trades</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0e0e10] rounded p-2.5">
          <div className="text-[#555] text-[10px] tracking-[0.1em]">REALIZED</div>
          <div className={`font-mono text-sm mt-0.5 ${cheetah.realized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
            {formatMoney(cheetah.realized_pnl)}
          </div>
        </div>
        <div className="bg-[#0e0e10] rounded p-2.5">
          <div className="text-[#555] text-[10px] tracking-[0.1em]">UNREALIZED</div>
          <div className={`font-mono text-sm mt-0.5 ${cheetah.unrealized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
            {formatMoney(cheetah.unrealized_pnl)}
          </div>
        </div>
        <div className="bg-[#0e0e10] rounded p-2.5">
          <div className="text-[#555] text-[10px] tracking-[0.1em]">W / L</div>
          <div className="font-mono text-sm mt-0.5">
            <span className="text-[#50c878]">{cheetah.wins}W</span>
            <span className="text-[#555]"> / </span>
            <span className="text-[#e74c3c]">{cheetah.losses}L</span>
          </div>
        </div>
      </div>

      {hasPositions && (
        <div>
          <div className="text-[#555] text-[10px] tracking-[0.15em] mb-2">OPEN POSITIONS ({cheetah.open_trades})</div>
          <div className="space-y-1.5">
            {cheetah.open_positions.map((pos, i) => (
              <div key={i} className="flex items-center justify-between bg-[#0e0e10] rounded px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${pos.direction === "long" ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                    {pos.direction === "long" ? "\u2191" : "\u2193"}
                  </span>
                  <span className="text-[#aaa] text-xs font-mono truncate max-w-[140px]">{pos.market}</span>
                </div>
                <span className={`font-mono text-xs ${pos.pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                  {formatMoney(pos.pnl)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cheetah.last_closed_at && (
        <div className="flex items-center gap-1.5 text-[#444] text-xs">
          <Clock size={11} />
          <span>Last closed {timeAgo(cheetah.last_closed_at)}</span>
        </div>
      )}
    </CardShell>
  );
}

function JaguarCard({ jaguar }: { jaguar: JaguarCat }) {
  return (
    <CardShell name="jaguar" subtitle={`${jaguar.strategy} \u00b7 ${jaguar.market}`}>
      {jaguar.training && (
        <div className="flex items-center gap-2">
          <span className="text-xs tracking-[0.2em] text-[#f59e0b] font-mono border border-[#f59e0b]/30 px-2 py-0.5 rounded">TRAINING</span>
        </div>
      )}
      <div className="flex items-end justify-between">
        <div>
          <PnlDisplay value={jaguar.total_pnl} label="TOTAL P&L" />
          {jaguar.training && (
            <span className="text-[10px] text-[#555]">Not included in total P&L</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-[#555] text-[10px]">REALIZED</div>
          <div className={`font-mono text-sm ${jaguar.realized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
            {formatMoney(jaguar.realized_pnl)}
          </div>
        </div>
      </div>

      {/* Forex section */}
      <div className="bg-[#0e0e10] rounded p-3">
        <div className="text-[#d4af37] text-[10px] tracking-[0.2em] font-medium mb-2">FOREX</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-mono">
            <span className="text-[#50c878]">{jaguar.forex.wins}W</span>
            <span className="text-[#555]">/</span>
            <span className="text-[#e74c3c]">{jaguar.forex.losses}L</span>
            <span className="text-[#555] text-xs">({jaguar.forex.closed_trades} trades)</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className={jaguar.forex.realized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}>
              {formatMoney(jaguar.forex.realized_pnl)}
            </span>
            <span className={jaguar.forex.total_pips >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}>
              {formatPips(jaguar.forex.total_pips)}
            </span>
          </div>
        </div>
      </div>

      {/* Funding Arb section */}
      <div className="bg-[#0e0e10] rounded p-3">
        <div className="text-[#d4af37] text-[10px] tracking-[0.2em] font-medium mb-2">FUNDING ARB</div>
        <div className="flex items-center justify-between">
          <div className="text-[#555] text-xs">{jaguar.funding.closed_trades} trades</div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="text-right">
              <div className="text-[#555] text-[10px]">Funding Collected</div>
              <div className={jaguar.funding.total_funding >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}>
                {formatMoney(jaguar.funding.total_funding)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[#555] text-[10px]">Realized</div>
              <div className={jaguar.funding.realized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}>
                {formatMoney(jaguar.funding.realized_pnl)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0e0e10] rounded px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[#555] text-xs">Unrealized</span>
          <span className={`font-mono text-sm ${jaguar.unrealized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
            {formatMoney(jaguar.unrealized_pnl)}
          </span>
        </div>
      </div>
    </CardShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// POSITIONS TABLE
// ══════════════════════════════════════════════════════════════════════════════

function PositionsTable({ positions }: { positions: Position[] }) {
  if (positions.length === 0) {
    return (
      <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-8 text-center">
        <div className="text-[#444] text-sm">No open forex positions &mdash; cats are watching</div>
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

// ══════════════════════════════════════════════════════════════════════════════
// SIGNAL FEED
// ══════════════════════════════════════════════════════════════════════════════

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
              isShadow ? "border-l-2 border-l-[#555]" : ""
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

// ══════════════════════════════════════════════════════════════════════════════
// BIRD GATES PANEL
// ══════════════════════════════════════════════════════════════════════════════

function BirdGatesPanel({ birds }: { birds: Record<string, BirdStatus> }) {
  const birdList = [
    { key: "hawk", label: "Hawk", desc: "Risk Gate" },
    { key: "eagle", label: "Eagle", desc: "Signal Quality" },
    { key: "vulture", label: "Vulture", desc: "Discipline" },
  ];

  function birdColor(mode: string) {
    if (mode === "normal") return "#10b981";
    if (mode === "paper") return "#f59e0b";
    return "#ef4444";
  }

  function birdPulse(mode: string) {
    return mode !== "normal" && mode !== "paper";
  }

  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-5">
      <div className="text-[#555] text-sm tracking-[0.2em] font-medium mb-4">RISK GATES</div>
      <div className="space-y-3">
        {birdList.map(({ key, label, desc }) => {
          const bird = birds[key];
          if (!bird) return null;
          const color = birdColor(bird.mode);
          const pulse = birdPulse(bird.mode);
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${pulse ? "animate-pulse" : ""}`}
                  style={{ backgroundColor: color }}
                />
                {(() => { const BIcon = BIRD_ICONS[key]; return BIcon ? <BIcon size={14} className="text-[#666]" /> : null; })()}
                <span className="text-[#aaa] text-sm">{label}</span>
                <span className="text-[#444] text-xs">{desc}</span>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded tracking-wider"
                style={{ backgroundColor: color + "20", color }}
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

// ══════════════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ══════════════════════════════════════════════════════════════════════════════

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#171513] text-[#e8e4d9]">
      <header className="border-b border-[#1a1a1f] bg-gradient-to-b from-[#0c0a08] to-[#080706] h-16" />
      <main className="max-w-[1400px] mx-auto p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-48 animate-pulse" />
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

          {/* Stale activity warning — check cheetah last_closed_at as proxy */}
          {(() => {
            const lastClosed = data.cats.cheetah?.last_closed_at;
            if (!lastClosed) return null;
            const hoursAgo = (Date.now() - new Date(lastClosed + "Z").getTime()) / 3600000;
            if (hoursAgo < 12) return null;
            return (
              <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg px-4 py-2 text-[#f59e0b] text-sm flex items-center gap-2">
                <Clock size={14} />
                Cheetah idle &mdash; last trade closed {Math.floor(hoursAgo)}h ago
              </div>
            );
          })()}

          {/* 2x2 Cat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TigerCard tiger={data.cats.tiger} />
            <LionCard lion={data.cats.lion} />
            <CheetahCard cheetah={data.cats.cheetah} />
            <JaguarCard jaguar={data.cats.jaguar} />
          </div>

          {/* Open Positions (OANDA only) */}
          <div>
            <div className="text-[#9a8e7e] text-sm tracking-[0.2em] font-medium mb-3">
              OPEN POSITIONS
              {data.positions.length > 0 && (
                <span className="ml-2 text-[#888]">({data.positions.length})</span>
              )}
              <span className="ml-2 text-[#444] text-xs normal-case tracking-normal">OANDA forex</span>
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

          {/* Bird Gates (bottom, single col on mobile, half width on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BirdGatesPanel birds={data.birds} />
            <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-5">
              <div className="text-[#555] text-sm tracking-[0.2em] font-medium mb-4">LIVE PRICES</div>
              {Object.keys(data.prices).length === 0 ? (
                <div className="text-[#444] text-sm">No price data</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data.prices).map(([pair, price]) => (
                    <div key={pair} className="flex items-center justify-between">
                      <span className="text-[#aaa] font-mono text-sm">{pair}</span>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-[#50c878]">{price.bid}</span>
                        <span className="text-[#e74c3c]">{price.ask}</span>
                        <span className="text-[#555]">{price.spread}p</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
