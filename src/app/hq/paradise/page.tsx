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

interface KalshiBalance {
  cash: number;
  portfolio_value: number;
  total: number;
  updated_at?: string;
}

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
  live?: boolean;
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
  live?: boolean;
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
  live?: boolean;
  kalshi_balance?: KalshiBalance;
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
  live?: boolean;
  forex: { realized_pnl: number; closed_trades: number; wins: number; losses: number; total_pips: number };
  funding: { realized_pnl: number; closed_trades: number; total_funding: number };
}

interface BirdStatus {
  mode: string;
  threshold?: number;
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
  birds: Record<string, BirdStatus>;
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

const BIRD_ICONS: Record<string, LucideIcon> = {
  hawk: Shield,
  eagle: Eye,
  vulture: Scale,
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
  if (n == null) return "\u2014";
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "p";
}

function formatMoney(n: number | null): string {
  if (n == null) return "\u2014";
  return (n >= 0 ? "+" : "") + n.toFixed(2);
}

function formatDollars(n: number): string {
  return "$" + n.toFixed(2);
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
// CAT AVATAR
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
  const capital = data.account.starting_capital;
  return (
    <header className="border-b border-[#1a1a1f] bg-gradient-to-b from-[#0c0a08] to-[#080706]">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[#d4af37] font-serif text-xl tracking-wide">Paradice</span>
            <span className="text-xs tracking-[0.2em] text-[#d4af37] font-mono border border-[#d4af37]/30 px-2 py-0.5 rounded bg-[#d4af37]/10">LIVE</span>
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
            <div className="text-[#555] text-xs tracking-[0.15em]">ACCOUNT</div>
            <div className="text-[#d4af37] font-mono text-lg">{formatDollars(capital)}</div>
          </div>
          <div className="text-right">
            <div className="text-[#555] text-xs tracking-[0.15em]">P&amp;L</div>
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
// CARD SHELLS
// ══════════════════════════════════════════════════════════════════════════════

function CardShell({ name, subtitle, badge, children }: { name: string; subtitle: string; badge?: string; children: React.ReactNode }) {
  const color = CAT_COLORS[name] || "#888";
  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-5 hover:border-[#2a2a2f] transition-colors flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center gap-3 min-w-0">
        <CatAvatar name={name} size={36} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-medium tracking-wide" style={{ color }}>{name.toUpperCase()}</span>
            {badge && (
              <span className="text-[9px] tracking-[0.2em] text-[#4a4535] font-mono border border-[#2a2a2f] px-1.5 py-0.5 rounded shrink-0">
                {badge}
              </span>
            )}
          </div>
          <div className="text-[#444] text-[11px] font-mono truncate">{subtitle}</div>
        </div>
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

// ══════════════════════════════════════════════════════════════════════════════
// LIVE HERO — CHEETAH
// ══════════════════════════════════════════════════════════════════════════════

function CheetahHero({ cheetah }: { cheetah: CheetahCat }) {
  const bal = cheetah.kalshi_balance;
  const hasPositions = cheetah.open_positions?.length > 0;
  const color = CAT_COLORS.cheetah;

  return (
    <div className="bg-[#0a0a0b] border border-[#d4af37]/20 rounded-lg p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/[0.03] to-transparent pointer-events-none" />

      <div className="relative space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CatAvatar name="cheetah" size={48} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-medium tracking-wide" style={{ color }}>CHEETAH</span>
                <span className="text-[10px] tracking-[0.2em] text-[#d4af37] font-mono border border-[#d4af37]/30 px-1.5 py-0.5 rounded bg-[#d4af37]/10">LIVE</span>
              </div>
              <span className="text-[#555] text-xs font-mono">{cheetah.strategy} &middot; {cheetah.market}</span>
            </div>
          </div>
          {cheetah.closed_trades > 0 && (
            <div className="text-right">
              <div
                className="inline-flex items-center px-2.5 py-1 rounded text-sm font-mono font-semibold"
                style={{ backgroundColor: color + "15", color }}
              >
                {cheetah.win_rate.toFixed(1)}% WR
              </div>
              <div className="text-[#555] text-xs font-mono mt-1">{cheetah.closed_trades} trades</div>
            </div>
          )}
        </div>

        {/* Account balance hero */}
        {bal && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0e0e10] rounded-lg p-4 border border-[#1a1a1f]">
              <div className="text-[#555] text-[10px] tracking-[0.15em] mb-1">CASH</div>
              <div className="font-mono text-xl text-[#e8e4d9]">{formatDollars(bal.cash)}</div>
            </div>
            <div className="bg-[#0e0e10] rounded-lg p-4 border border-[#1a1a1f]">
              <div className="text-[#555] text-[10px] tracking-[0.15em] mb-1">PORTFOLIO</div>
              <div className="font-mono text-xl text-[#e8e4d9]">{formatDollars(bal.portfolio_value)}</div>
            </div>
            <div className="bg-[#0e0e10] rounded-lg p-4 border border-[#d4af37]/20]">
              <div className="text-[#555] text-[10px] tracking-[0.15em] mb-1">TOTAL VALUE</div>
              <div className="font-mono text-xl text-[#d4af37]">{formatDollars(bal.total)}</div>
            </div>
          </div>
        )}

        {/* P&L row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#0e0e10] rounded p-3">
            <div className="text-[#555] text-[10px] tracking-[0.1em]">TOTAL P&L</div>
            <div className={`font-mono text-lg mt-0.5 font-semibold ${cheetah.total_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
              {formatMoney(cheetah.total_pnl)}
            </div>
          </div>
          <div className="bg-[#0e0e10] rounded p-3">
            <div className="text-[#555] text-[10px] tracking-[0.1em]">REALIZED</div>
            <div className={`font-mono text-sm mt-0.5 ${cheetah.realized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
              {formatMoney(cheetah.realized_pnl)}
            </div>
          </div>
          <div className="bg-[#0e0e10] rounded p-3">
            <div className="text-[#555] text-[10px] tracking-[0.1em]">UNREALIZED</div>
            <div className={`font-mono text-sm mt-0.5 ${cheetah.unrealized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
              {formatMoney(cheetah.unrealized_pnl)}
            </div>
          </div>
          <div className="bg-[#0e0e10] rounded p-3">
            <div className="text-[#555] text-[10px] tracking-[0.1em]">W / L</div>
            <div className="font-mono text-sm mt-0.5">
              <span className="text-[#50c878]">{cheetah.wins}W</span>
              <span className="text-[#555]"> / </span>
              <span className="text-[#e74c3c]">{cheetah.losses}L</span>
            </div>
          </div>
        </div>

        {/* Open positions */}
        {hasPositions && (
          <div>
            <div className="text-[#555] text-[10px] tracking-[0.15em] mb-2">OPEN POSITIONS ({cheetah.open_trades})</div>
            <div className="space-y-1.5">
              {cheetah.open_positions.map((pos, i) => (
                <div key={i} className="flex items-center justify-between bg-[#0e0e10] rounded px-4 py-2 border border-[#1a1a1f]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#FFD700] text-xs">
                      {pos.direction === "long" ? "\u2191" : pos.direction === "short" ? "\u2193" : "\u25C6"}
                    </span>
                    <span className="text-[#bbb] text-sm font-mono truncate max-w-[300px]">{pos.market}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[#555] text-xs font-mono">@{pos.entry_price.toFixed(2)}</span>
                    <span className={`font-mono text-sm ${pos.pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                      {formatMoney(pos.pnl)}
                    </span>
                  </div>
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
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TRAINING CARDS
// ══════════════════════════════════════════════════════════════════════════════

function TigerCard({ tiger }: { tiger: TigerCat }) {
  const hasPositions = tiger.open_positions?.length > 0;
  return (
    <CardShell name="tiger" subtitle={`${tiger.strategy} \u00b7 ${tiger.market}`} badge="PAPER">
      <div className="flex items-end justify-between">
        <PnlDisplay value={tiger.total_pnl} label="TOTAL P&L" />
        <div className="text-right">
          <div
            className="inline-flex items-center px-2.5 py-1 rounded text-sm font-mono font-semibold"
            style={{ backgroundColor: "#FF634715", color: "#FF6347" }}
          >
            {tiger.win_rate != null ? tiger.win_rate.toFixed(1) : "\u2014"}% WR
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
                <span className="text-[#aaa] text-xs font-mono truncate max-w-[180px]">{pos.market}</span>
                <span className={`font-mono text-xs ${pos.pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                  {formatMoney(pos.pnl)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardShell>
  );
}

function LionCard({ lion }: { lion: LionCat }) {
  const hasPositions = lion.positions?.length > 0;
  return (
    <CardShell name="lion" subtitle={`${lion.strategy} \u00b7 ${lion.market}`} badge="PAPER">
      <div className="flex items-end justify-between">
        <PnlDisplay value={lion.total_pnl} label="TOTAL P&L" />
        <div className="text-right">
          <div className="text-[#555] text-[10px]">REALIZED</div>
          <div className={`font-mono text-sm ${lion.realized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
            {formatMoney(lion.realized_pnl)}
          </div>
        </div>
      </div>

      {hasPositions && (
        <div className="space-y-1.5">
          {lion.positions.map((pos, i) => (
            <div key={i} className="bg-[#0e0e10] rounded px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#FF8C00] font-mono text-sm font-medium">{pos.symbol}</span>
                  <span className="text-[#555] text-[11px]">{pos.shares}sh</span>
                  <span
                    className="text-[9px] px-1 py-0.5 rounded shrink-0"
                    style={{
                      backgroundColor: pos.status === "trailing" ? "#f59e0b20" : "#88888820",
                      color: pos.status === "trailing" ? "#f59e0b" : "#888",
                    }}
                  >
                    {pos.status.toUpperCase()}
                  </span>
                </div>
                <span className={`font-mono text-sm shrink-0 ${pos.pnl_dollars >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
                  {formatMoney(pos.pnl_dollars)}
                </span>
              </div>
              <div className="text-[#555] text-[11px] font-mono mt-0.5">
                {pos.entry_price.toFixed(2)} &rarr; {pos.current_price.toFixed(2)} ({pos.pnl_pct >= 0 ? "+" : ""}{pos.pnl_pct.toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasPositions && (
        <div className="text-[#444] text-sm text-center py-2">No open positions</div>
      )}
    </CardShell>
  );
}

function JaguarCard({ jaguar }: { jaguar: JaguarCat }) {
  return (
    <CardShell name="jaguar" subtitle={`${jaguar.strategy} \u00b7 ${jaguar.market}`} badge="TRAINING">
      <div className="flex items-end justify-between">
        <div>
          <PnlDisplay value={jaguar.total_pnl} label="TOTAL P&L" />
          <span className="text-[10px] text-[#555]">Not included in totals</span>
        </div>
        <div className="text-right">
          <div className="text-[#555] text-[10px]">REALIZED</div>
          <div className={`font-mono text-sm ${jaguar.realized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}`}>
            {formatMoney(jaguar.realized_pnl)}
          </div>
        </div>
      </div>

      <div className="bg-[#0e0e10] rounded p-3">
        <div className="text-[#d4af37] text-[10px] tracking-[0.2em] font-medium mb-2">FOREX</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-mono">
            <span className="text-[#50c878]">{jaguar.forex.wins}W</span>
            <span className="text-[#555]">/</span>
            <span className="text-[#e74c3c]">{jaguar.forex.losses}L</span>
            <span className="text-[#555] text-xs">({jaguar.forex.closed_trades})</span>
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

      <div className="bg-[#0e0e10] rounded p-3">
        <div className="text-[#d4af37] text-[10px] tracking-[0.2em] font-medium mb-2">FUNDING ARB</div>
        <div className="flex items-center justify-between">
          <div className="text-[#555] text-xs">{jaguar.funding.closed_trades} trades</div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className={jaguar.funding.realized_pnl >= 0 ? "text-[#50c878]" : "text-[#e74c3c]"}>
              {formatMoney(jaguar.funding.realized_pnl)}
            </span>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BIRD GATES
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
        <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg h-48 animate-pulse" />
          ))}
        </div>
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

        <main className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-4 py-2 text-[#ef4444] text-sm flex items-center gap-2">
              <AlertTriangle size={14} />
              Connection issue &mdash; retrying...
            </div>
          )}

          {/* LIVE SECTION */}
          <div>
            <div className="text-[#9a8e7e] text-sm tracking-[0.2em] font-medium mb-3">
              LIVE ACCOUNTS
            </div>
            <CheetahHero cheetah={data.cats.cheetah} />
          </div>

          {/* TRAINING SECTION */}
          <div>
            <div className="text-[#555] text-sm tracking-[0.2em] font-medium mb-3">
              TRAINING &amp; PAPER
              <span className="ml-2 text-[#333] text-xs normal-case tracking-normal">not included in live P&amp;L</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TigerCard tiger={data.cats.tiger} />
              <LionCard lion={data.cats.lion} />
              <JaguarCard jaguar={data.cats.jaguar} />
            </div>
          </div>

          {/* RISK GATES */}
          <BirdGatesPanel birds={data.birds} />
        </main>
      </div>
    </div>
  );
}
