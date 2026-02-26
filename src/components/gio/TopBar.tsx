"use client";

import TabIcon from "./TabIcon";
import GioAvatar from "./GioAvatar";

export type Screen = "feed" | "faro" | "post" | "store" | "account" | "post-detail" | "gio-chat" | "factory" | "calendar" | "stats";

const tabs: { screen: Screen; label: string; icon: "Home" | "Link2" | "PenSquare" | "Store" | "CircleUserRound" }[] = [
  { screen: "feed", label: "Feed", icon: "Home" },
  { screen: "faro", label: "Faro", icon: "Link2" },
  { screen: "post", label: "Post", icon: "PenSquare" },
  { screen: "store", label: "Store", icon: "Store" },
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
  activeScreen,
  onScreenChange,
  onGioClick,
  unreadCount,
  isDesktop,
}: TopBarProps) {
  const activeBase = activeScreen === "post-detail" ? "feed" : activeScreen === "gio-chat" ? "feed" : activeScreen;

  return (
    <header
      className="flex-shrink-0 z-40 flex items-center px-4 gap-3 relative"
      style={{ minHeight: isDesktop ? 80 : 64, paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 min-w-0">
        <img src="/images/guardia-logo.png" alt="Guardia" className="w-8 h-8 object-contain flex-shrink-0" />
        <span className="text-sm font-semibold text-[var(--text-primary)] truncate block leading-tight">
          {clientName || "Guardia"}
        </span>
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
        <GioAvatar onClick={onGioClick} unreadCount={unreadCount} variant="widget" size={isDesktop ? 130 : 90} />
      </div>
      {/* Spacer to reserve space for widget */}
      <div style={{ width: isDesktop ? 130 : 90 }} className="flex-shrink-0" />
    </header>
  );
}
