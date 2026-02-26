"use client";

import { Home, Link2, PenSquare, Store, CircleUserRound } from "lucide-react";

const iconMap = {
  Home,
  Link2,
  PenSquare,
  Store,
  CircleUserRound,
} as const;

type IconName = keyof typeof iconMap;

interface TabIconProps {
  name: IconName;
  active: boolean;
  size?: number;
}

export default function TabIcon({ name, active, size = 24 }: TabIconProps) {
  const Icon = iconMap[name];
  return (
    <Icon
      size={size}
      strokeWidth={active ? 2 : 1.5}
      className="transition-all duration-200"
      color={active ? "var(--accent)" : "var(--text-muted)"}
    />
  );
}
