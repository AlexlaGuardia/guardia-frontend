"use client";

import { Lock } from "lucide-react";
import { ReactNode } from "react";

interface AddonGateProps {
  addonSlug: string;
  addonName: string;
  activeAddons?: Set<string>;
  onNavigateToStore?: () => void;
  children: ReactNode;
}

export default function AddonGate({
  addonSlug,
  addonName,
  activeAddons,
  onNavigateToStore,
  children,
}: AddonGateProps) {
  // Graceful degradation: if activeAddons is undefined, render children
  if (!activeAddons || activeAddons.has(addonSlug)) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex flex-col items-center justify-center gap-4 py-10 px-6 text-center">
      <div className="w-11 h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
        <Lock className="w-5 h-5 text-[var(--text-muted)]" />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{addonName}</p>
        <p className="text-xs text-[var(--text-muted)]">This feature requires the {addonName} add-on.</p>
      </div>
      {onNavigateToStore && (
        <button
          onClick={onNavigateToStore}
          className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-[var(--accent)] hover:opacity-90 transition-all duration-200"
        >
          Unlock in Store
        </button>
      )}
    </div>
  );
}
