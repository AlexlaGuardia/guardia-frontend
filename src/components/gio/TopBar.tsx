"use client";

import TabIcon from "./TabIcon";
import GioAvatar from "./GioAvatar";

export type Screen = "feed" | "factory" | "calendar" | "stats" | "account" | "post-detail" | "gio-chat";

const tierColors: Record<string, { bg: string; text: string }> = {
  spark: { bg: "bg-amber-500/20", text: "text-amber-600" },
  pro: { bg: "bg-blue-500/20", text: "text-blue-600" },
  unleashed: { bg: "bg-violet-500/20", text: "text-violet-600" },
};

const tabs: { screen: Screen; label: string; icon: "Home" | "Sparkles" | "CalendarDays" | "BarChart3" | "CircleUserRound" }[] = [
  { screen: "feed", label: "Feed", icon: "Home" },
  { screen: "factory", label: "Factory", icon: "Sparkles" },
  { screen: "calendar", label: "Calendar", icon: "CalendarDays" },
  { screen: "stats", label: "Stats", icon: "BarChart3" },
  { screen: "account", label: "Account", icon: "CircleUserRound" },
];

interface TopBarProps {
  clientName?: string;
  tier?: string;
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  onGioClick: () => void;
  unreadCount: number;
  isDesktop: boolean;
}

export default function TopBar({
  clientName,
  tier,
  activeScreen,
  onScreenChange,
  onGioClick,
  unreadCount,
  isDesktop,
}: TopBarProps) {
  const colors = tierColors[tier || "spark"] || tierColors.spark;
  const activeBase = activeScreen === "post-detail" ? "feed" : activeScreen === "gio-chat" ? "feed" : activeScreen;

  return (
    <header
      className="flex-shrink-0 z-40 flex items-center px-4 gap-3 relative"
      style={{ minHeight: 56, paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 min-w-0">
        <img src="/images/guardia-logo.png" alt="Guardia" className="w-8 h-8 object-contain flex-shrink-0" />
        <div className="min-w-0">
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate block leading-tight">
            {clientName || "Guardia"}
          </span>
          {tier && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text} capitalize`}>
              {tier}
            </span>
          )}
        </div>
      </div>

      {/* Desktop tabs */}
      {isDesktop && (
        <nav className="flex-1 flex items-center justify-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeBase === tab.screen;
            return (
              <button
                key={tab.screen}
                onClick={() => onScreenChange(tab.screen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "text-[var(--accent)] bg-[var(--accent)]/10"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                }`}
              >
                <TabIcon name={tab.icon} active={isActive} size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      )}

      {/* Spacer on mobile */}
      {!isDesktop && <div className="flex-1" />}

      {/* Gio widget — overlaps header into content below */}
      <div className="absolute right-4 z-50" style={{ top: 0 }}>
        <GioAvatar onClick={onGioClick} unreadCount={unreadCount} variant="widget" size={130} />
      </div>
      {/* Spacer to reserve space for widget */}
      <div style={{ width: 130 }} className="flex-shrink-0" />
    </header>
  );
}
