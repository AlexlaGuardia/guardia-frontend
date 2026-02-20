"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API_BASE = "https://api.guardiacontent.com";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface Service {
  name: string;
  status: string;
  cpu: number;
  memory: number;
  restarts: number;
  uptime: number;
}

interface ServiceDetails extends Service {
  description: string;
  pid: number;
  pm_id: number;
  exec_mode: string;
  logs: string[];
  error_logs: string[];
}

interface Cluster {
  id: string;
  name: string;
  role: string;
  color: string;
  services: Service[];
  connects_to: string[];
  health: "green" | "amber" | "red";
  online: number;
  total: number;
  position: { x: number; y: number };
}

interface AtlasData {
  clusters: Cluster[];
  total_services: number;
  total_online: number;
}

interface Signal {
  id: number;
  from: string;
  to: string | null;
  type: string;
  content: string;
  ack: boolean;
  time: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// SIGNAL FEED
// ══════════════════════════════════════════════════════════════════════════════

function SignalFeed() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = () => {
      fetch(`${API_BASE}/hq/signals?limit=10`)
        .then((res) => res.json())
        .then((data) => setSignals(data.signals || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const TYPE_COLORS: Record<string, string> = {
    observation: "text-cyan-400",
    handoff: "text-violet-400",
    decision: "text-amber-400",
    alert: "text-red-400",
    focus: "text-emerald-400",
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-xl p-4">
        <div className="text-[#555] text-sm">Loading signals...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1a1a1f] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-orange-400 text-xs font-semibold tracking-wider">
            SIGNAL FEED
          </span>
        </div>
        <span className="text-[#444] text-[10px]">auto-refresh 30s</span>
      </div>
      <div className="divide-y divide-[#1a1a1f] max-h-[200px] overflow-y-auto">
        {signals.length === 0 ? (
          <div className="p-4 text-[#555] text-xs">No recent signals</div>
        ) : (
          signals.map((sig) => (
            <div key={sig.id} className="px-4 py-3 hover:bg-[#0d0d0e] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#888] text-xs font-mono">{sig.from}</span>
                  {sig.to && (
                    <>
                      <span className="text-[#444]">→</span>
                      <span className="text-[#666] text-xs font-mono">{sig.to}</span>
                    </>
                  )}
                  <span
                    className={`text-[10px] uppercase tracking-wider ${
                      TYPE_COLORS[sig.type] || "text-[#555]"
                    }`}
                  >
                    {sig.type}
                  </span>
                </div>
                <span className="text-[#444] text-[10px]">{formatTime(sig.time)}</span>
              </div>
              <p className="text-[#666] text-xs leading-relaxed line-clamp-2">
                {sig.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DETAIL PANEL
// ══════════════════════════════════════════════════════════════════════════════

function DetailPanel({
  serviceName,
  cluster,
  onClose,
}: {
  serviceName: string;
  cluster: Cluster;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/hq/services/${serviceName}/details`)
      .then((res) => res.json())
      .then(setDetails)
      .catch(() => setDetails(null))
      .finally(() => setLoading(false));
  }, [serviceName]);

  const formatUptime = (ms: number) => {
    if (!ms) return "—";
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const isOnline = details?.status === "online";

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#0a0a0b] border-l border-[#1a1a1f] shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1f] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: cluster.color }}
          />
          <div>
            <h2 className="font-mono text-sm text-[#e8e8e8]">{serviceName}</h2>
            <p className="text-[10px] text-[#555]">{cluster.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#555] hover:text-[#888] text-lg px-2"
        >
          ×
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#555] text-sm">Loading...</div>
        </div>
      ) : details ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status */}
          <div className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? "bg-emerald-400" : "bg-red-400 animate-pulse"
                  }`}
                />
                <span
                  className={`text-xs font-mono ${
                    isOnline ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {details.status.toUpperCase()}
                </span>
              </div>
              <span className="text-[10px] text-[#555]">
                PID {details.pid}
              </span>
            </div>
            <p className="text-[#888] text-xs leading-relaxed">
              {details.description}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg p-3 text-center">
              <p className="text-[#555] text-[10px] mb-1">UPTIME</p>
              <p className="text-cyan-400 font-mono text-sm">
                {formatUptime(details.uptime)}
              </p>
            </div>
            <div className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg p-3 text-center">
              <p className="text-[#555] text-[10px] mb-1">MEMORY</p>
              <p className="text-amber-400 font-mono text-sm">
                {details.memory}MB
              </p>
            </div>
            <div className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg p-3 text-center">
              <p className="text-[#555] text-[10px] mb-1">RESTARTS</p>
              <p
                className={`font-mono text-sm ${
                  details.restarts > 0 ? "text-amber-400" : "text-[#888]"
                }`}
              >
                {details.restarts}
              </p>
            </div>
          </div>

          {/* Recent Logs */}
          <div className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg p-3">
            <p className="text-[#555] text-[10px] mb-2 tracking-wider">
              RECENT LOGS
            </p>
            <div className="bg-[#050506] rounded p-2 max-h-[200px] overflow-y-auto">
              {details.logs.length > 0 ? (
                <pre className="text-[10px] text-[#666] font-mono whitespace-pre-wrap break-all leading-relaxed">
                  {details.logs.join("\n")}
                </pre>
              ) : (
                <p className="text-[#444] text-xs italic">No recent logs</p>
              )}
            </div>
          </div>

          {/* Error Logs */}
          {details.error_logs.length > 0 && (
            <div className="bg-[#0d0d0e] border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400/60 text-[10px] mb-2 tracking-wider">
                RECENT ERRORS
              </p>
              <div className="bg-[#050506] rounded p-2 max-h-[100px] overflow-y-auto">
                <pre className="text-[10px] text-red-400/80 font-mono whitespace-pre-wrap break-all">
                  {details.error_logs.join("\n")}
                </pre>
              </div>
            </div>
          )}

          {/* Related Services */}
          <div className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg p-3">
            <p className="text-[#555] text-[10px] mb-2 tracking-wider">
              CLUSTER SERVICES
            </p>
            <div className="space-y-1">
              {cluster.services.map((svc) => (
                <div
                  key={svc.name}
                  className={`flex items-center gap-2 py-1 px-2 rounded text-xs ${
                    svc.name === serviceName
                      ? "bg-[#1a1a1f]"
                      : "hover:bg-[#0a0a0a]"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      svc.status === "online" ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                  <span
                    className={`font-mono ${
                      svc.name === serviceName ? "text-[#e8e8e8]" : "text-[#666]"
                    }`}
                  >
                    {svc.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400/60 text-sm">Failed to load details</div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CLUSTER NODE
// ══════════════════════════════════════════════════════════════════════════════

function ClusterNode({
  cluster,
  expanded,
  onToggle,
  onServiceClick,
}: {
  cluster: Cluster;
  expanded: boolean;
  onToggle: () => void;
  onServiceClick: (name: string) => void;
}) {
  const HEALTH = {
    green: { dot: "bg-emerald-400", glow: "shadow-emerald-500/20" },
    amber: { dot: "bg-amber-400 animate-pulse", glow: "shadow-amber-500/20" },
    red: { dot: "bg-red-400 animate-pulse", glow: "shadow-red-500/20" },
  };

  const health = HEALTH[cluster.health];

  const formatUptime = (ms: number) => {
    if (!ms) return "—";
    const hours = Math.floor(ms / 3600000);
    if (hours > 24) return `${Math.floor(hours / 24)}d`;
    return `${hours}h`;
  };

  return (
    <div
      className="absolute transition-all duration-300 z-10"
      style={{
        left: `${cluster.position.x}%`,
        top: `${cluster.position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className={`bg-[#0d0d0e] border rounded-xl transition-all ${
          expanded
            ? `shadow-lg ${health.glow} border-[#2a2a2f]`
            : "border-[#1a1a1f] hover:scale-105 cursor-pointer"
        }`}
        style={{
          minWidth: expanded ? "260px" : "140px",
          borderColor: expanded ? cluster.color + "40" : undefined,
        }}
      >
        {/* Header - clickable to toggle */}
        <div
          className="p-3 pb-2 cursor-pointer"
          onClick={onToggle}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${health.dot}`} />
              <span
                className="font-bold text-sm"
                style={{ color: cluster.color }}
              >
                {cluster.name}
              </span>
            </div>
            <span className="text-[#555] text-[10px] font-mono">
              {cluster.online}/{cluster.total}
            </span>
          </div>
          <p className="text-[#666] text-[10px]">{cluster.role}</p>
        </div>

        {/* Expanded: Service List - services are clickable */}
        {expanded && (
          <div className="border-t border-[#1a1a1f] p-2 space-y-1 max-h-[280px] overflow-y-auto">
            {cluster.services.map((svc) => {
              const isOnline = svc.status === "online";
              return (
                <div
                  key={svc.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    onServiceClick(svc.name);
                  }}
                  className="flex items-center justify-between py-1.5 px-2 bg-[#0a0a0a] rounded text-[11px] cursor-pointer hover:bg-[#111] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isOnline ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                    <span className="text-[#888] font-mono truncate hover:text-[#ccc]">
                      {svc.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#555] flex-shrink-0">
                    <span>{svc.memory}MB</span>
                    <span className="text-[#444]">{formatUptime(svc.uptime)}</span>
                    {svc.restarts > 0 && (
                      <span className="text-amber-400">R{svc.restarts}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONNECTION LINES
// ══════════════════════════════════════════════════════════════════════════════

function ConnectionLines({ clusters }: { clusters: Cluster[] }) {
  const clusterMap = Object.fromEntries(clusters.map((c) => [c.id, c]));

  const connections: { from: Cluster; to: Cluster }[] = [];
  clusters.forEach((cluster) => {
    cluster.connects_to.forEach((targetId) => {
      const target = clusterMap[targetId];
      if (target) {
        connections.push({ from: cluster, to: target });
      }
    });
  });

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#333" />
        </marker>
      </defs>
      {connections.map((conn, i) => (
        <line
          key={i}
          x1={`${conn.from.position.x}%`}
          y1={`${conn.from.position.y}%`}
          x2={`${conn.to.position.x}%`}
          y2={`${conn.to.position.y}%`}
          stroke="#1a1a1f"
          strokeWidth="2"
          strokeDasharray="8 4"
          markerEnd="url(#arrowhead)"
          className="animate-dash"
        />
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function AtlasPage() {
  const [data, setData] = useState<AtlasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<{
    name: string;
    cluster: Cluster;
  } | null>(null);

  const fetchData = useCallback(() => {
    fetch(`${API_BASE}/hq/services/clusters`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const healthy = data?.total_online === data?.total_services;

  const handleServiceClick = (serviceName: string, cluster: Cluster) => {
    setSelectedService({ name: serviceName, cluster });
  };

  return (
    <div className="min-h-screen bg-[#171513] text-[#e8e8e8]">
      {/* Header */}
      <header className="border-b border-[#1a1a1f] bg-[#0a0a0b]/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              <h1 className="text-cyan-400 font-semibold text-sm tracking-wider">
                SYSTEM ATLAS
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Cluster Legend */}
            <div className="hidden md:flex items-center gap-3 text-[10px]">
              {data?.clusters?.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-[#555]">{c.name}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <div
                className={`w-2 h-2 rounded-full ${
                  healthy ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                }`}
              />
              <span className={healthy ? "text-emerald-400" : "text-amber-400"}>
                {data?.total_online || 0}
              </span>
              <span className="text-[#555]">/{data?.total_services || 0}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="h-[600px] bg-[#0a0a0b] border border-[#1a1a1f] rounded-xl flex items-center justify-center">
            <div className="text-[#555] text-sm">Loading system map...</div>
          </div>
        ) : data?.clusters ? (
          <div className="relative h-[600px] bg-[#0a0a0b] border border-[#1a1a1f] rounded-xl overflow-hidden">
            {/* Background Grid */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `
                  linear-gradient(#333 1px, transparent 1px),
                  linear-gradient(90deg, #333 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />

            {/* Connection Lines */}
            <ConnectionLines clusters={data.clusters} />

            {/* Cluster Nodes */}
            {data.clusters.map((cluster) => (
              <ClusterNode
                key={cluster.id}
                cluster={cluster}
                expanded={expanded === cluster.id}
                onToggle={() =>
                  setExpanded(expanded === cluster.id ? null : cluster.id)
                }
                onServiceClick={(name) => handleServiceClick(name, cluster)}
              />
            ))}

            {/* Flow Labels */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[#333] text-[10px] tracking-wider">
              CORE SERVICES
            </div>
            <div className="absolute bottom-4 left-4 text-[#333] text-[10px] tracking-wider">
              PROCESSING
            </div>
            <div className="absolute bottom-4 right-4 text-[#333] text-[10px] tracking-wider">
              INTELLIGENCE
            </div>
          </div>
        ) : (
          <div className="h-[600px] bg-[#0a0a0b] border border-[#1a1a1f] rounded-xl flex items-center justify-center">
            <div className="text-red-400/60 text-sm">
              Failed to load system map
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[#555]">All Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[#555]">Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-[#555]">Down</span>
          </div>
          <div className="text-[#333]">|</div>
          <span className="text-[#444]">
            Click cluster to expand, click service for details
          </span>
        </div>

        {/* Signal Feed */}
        <div className="mt-6">
          <SignalFeed />
        </div>
      </main>

      {/* Detail Panel */}
      {selectedService && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedService(null)}
          />
          <DetailPanel
            serviceName={selectedService.name}
            cluster={selectedService.cluster}
            onClose={() => setSelectedService(null)}
          />
        </>
      )}

      {/* Animated dash CSS */}
      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -24;
          }
        }
        .animate-dash {
          animation: dash 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
