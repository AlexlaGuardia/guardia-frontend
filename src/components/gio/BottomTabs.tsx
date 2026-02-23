"use client";

import TabIcon from "./TabIcon";
import type { Screen } from "./TopBar";

const tabs: { screen: Screen; label: string; icon: "Home" | "Sparkles" | "CalendarDays" | "BarChart3" | "CircleUserRound" }[] = [
  { screen: "feed", label: "Feed", icon: "Home" },
  { screen: "factory", label: "Factory", icon: "Sparkles" },
  { screen: "calendar", label: "Calendar", icon: "CalendarDays" },
  { screen: "stats", label: "Stats", icon: "BarChart3" },
  { screen: "account", label: "Account", icon: "CircleUserRound" },
];

interface BottomTabsProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

export default function BottomTabs({ activeScreen, onScreenChange }: BottomTabsProps) {
  const activeBase = activeScreen === "post-detail" ? "feed" : activeScreen === "gio-chat" ? "feed" : activeScreen;

  return (
    <nav className="flex-shrink-0 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-end justify-around h-20 pb-1">
        {tabs.map((tab) => {
          const isActive = activeBase === tab.screen;
          return (
            <button
              key={tab.screen}
              onClick={() => onScreenChange(tab.screen)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all active:scale-95"
            >
              <div className={`flex items-center justify-center w-14 h-8 rounded-full transition-all duration-200 ${
                isActive ? "bg-violet-400/10" : ""
              }`}>
                <TabIcon name={tab.icon} active={isActive} />
              </div>
              <span className={`text-[10px] transition-colors duration-200 ${
                isActive ? "font-semibold text-[var(--accent)]" : "font-medium text-[var(--text-muted)]"
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
