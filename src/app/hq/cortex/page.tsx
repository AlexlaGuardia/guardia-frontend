"use client";

import { useState, useEffect } from "react";


const API_BASE = "https://api.guardiacontent.com";

interface FocusItem {
  id?: string;
  p: number;
  task: string;
  owner: string;
  details?: string;
  created_at?: string;
}

const PRIORITY_CONFIG = [
  { p: 1, label: "P1 CRITICAL", sublabel: "now", color: "#ef4444" },
  { p: 2, label: "P2 IMPORTANT", sublabel: "soon", color: "#f59e0b" },
  { p: 3, label: "P3 TODO", sublabel: "this week", color: "#6b7280" },
  { p: 99, label: "BACKLOG", sublabel: "someday", color: "#8b5cf6" },
];

function FocusCard({ item, onExpand, expanded }: { item: FocusItem; onExpand: () => void; expanded: boolean }) {
  const config = PRIORITY_CONFIG.find(c => c.p === item.p) || PRIORITY_CONFIG[3];

  return (
    <div
      onClick={onExpand}
      className={`bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg p-3 cursor-pointer transition-all hover:border-[#2a2a2f] ${expanded ? "ring-1" : ""}`}
      style={{ ...(expanded && { borderColor: config.color, ringColor: `${config.color}40` }) }}
    >
      <p className="text-[#ccc] text-sm leading-relaxed">{item.task}</p>
      {item.owner && (
        <p className="text-[#555] text-xs mt-2">@{item.owner}</p>
      )}
      {expanded && item.details && (
        <div className="mt-3 pt-3 border-t border-[#1a1a1f]">
          <p className="text-[#888] text-xs leading-relaxed">{item.details}</p>
        </div>
      )}
    </div>
  );
}

function PriorityColumn({ config, items, expandedId, onExpand }: {
  config: typeof PRIORITY_CONFIG[0];
  items: FocusItem[];
  expandedId: string | null;
  onExpand: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1a1a1f]">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
        <div>
          <h2 className="text-xs font-semibold tracking-wider" style={{ color: config.color }}>
            {config.label}
          </h2>
          <span className="text-[#444] text-[10px]">{config.sublabel}</span>
        </div>
        <span className="ml-auto text-[#444] text-xs font-mono">{items.length}</span>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-[#333] text-xs text-center py-8">No items</p>
        ) : (
          items.map((item, i) => {
            const itemId = item.id || `${item.p}-${i}`;
            return (
              <FocusCard
                key={itemId}
                item={item}
                expanded={expandedId === itemId}
                onExpand={() => onExpand(expandedId === itemId ? null : itemId)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default function CortexPage() {
  const [focus, setFocus] = useState<FocusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/hq/cortex/focus`)
      .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch"))
      .then(data => setFocus(Array.isArray(data) ? data : []))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // Group items by priority (p > 3 goes to backlog)
  const grouped = PRIORITY_CONFIG.map(config => ({
    config,
    items: focus.filter(item =>
      config.p === 99 ? item.p > 3 : item.p === config.p
    )
  }));

  return (
    <div className="min-h-screen bg-[#171513] text-[#e8e8e8]">
      {/* Header */}
      <header className="border-b border-[#1a1a1f] bg-[#0a0a0b]/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <h1 className="text-violet-400 font-semibold text-sm tracking-wider">CORTEX</h1>
            </div>
          </div>
          <span className="text-[#555] text-xs font-mono">{focus.length} items</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-[#555] text-sm">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400/60 text-sm">{error}</div>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {grouped.map(({ config, items }) => (
              <PriorityColumn
                key={config.p}
                config={config}
                items={items}
                expandedId={expandedId}
                onExpand={setExpandedId}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
