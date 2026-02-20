"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const API_BASE = "https://api.guardiacontent.com";

const NAV_ITEMS = [
  { label: "Home", href: "/hq", color: "#a78bfa" },
  { label: "Paradise", href: "/hq/paradise", color: "#d4af37" },
  { label: "Factory", href: "/hq/factory", color: "#10b981" },
  { label: "Cortex", href: "/hq/cortex", color: "#8b5cf6" },
  { label: "Clients", href: "/clients", color: "#f59e0b" },
  { label: "Atlas", href: "/hq/atlas", color: "#06b6d4" },
  { label: "Lab", href: "/hq/lab", color: "#14b8a6" },
  { label: "Athernyx", href: "/hq/athernyx", color: "#a855f7" },
  { label: "Luna", href: "/hq/luna", color: "#a78bfa" },
];

export default function HQNav() {
  const pathname = usePathname();
  const [health, setHealth] = useState<"loading" | "healthy" | "degraded">("loading");

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setHealth(data.status === "healthy" ? "healthy" : "degraded"))
      .catch(() => setHealth("degraded"));
  }, []);

  const isActive = (href: string) => {
    if (href === "/hq") return pathname === "/hq";
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <nav className="bg-[#0a0a0b] border-b border-[#1a1a1f] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1">
        {/* Logo */}
        <Link href="/hq" className="flex items-center gap-2 pr-4 py-3 shrink-0">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
          <span className="text-[#666] font-semibold text-xs tracking-wider hidden sm:inline">HQ</span>
        </Link>

        <div className="h-4 w-px bg-[#1a1a1f] shrink-0" />

        {/* Nav Links — scrollable */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-3 py-3 text-[10px] font-mono uppercase tracking-wider shrink-0 transition-colors"
                style={{ color: active ? item.color : "#555" }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = "#888";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = "#555";
                }}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Health Indicator */}
        <div className="flex items-center gap-2 pl-3 shrink-0">
          <div className={`w-2 h-2 rounded-full ${
            health === "loading" ? "bg-[#444] animate-pulse" :
            health === "healthy" ? "bg-emerald-400" :
            "bg-amber-400 animate-pulse"
          }`} />
          <span className="text-[#555] text-[10px] font-mono uppercase tracking-wider hidden sm:inline">
            {health === "loading" ? "..." : health}
          </span>
        </div>
      </div>
    </nav>
  );
}
