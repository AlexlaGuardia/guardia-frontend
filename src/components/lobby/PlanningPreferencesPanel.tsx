"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * PLANNING PREFERENCES PANEL
 * 
 * Toggle-based preferences for content mix, caption style, and posting approach.
 * These inform Mercury (captions) and Artemis (content suggestions).
 */

const API_BASE = "https://api.guardiacontent.com";

interface PlanningPreferences {
  // Content Mix
  include_seasonal: boolean;
  show_behind_scenes: boolean;
  feature_reviews: boolean;
  share_tips: boolean;
  mix_team_moments: boolean;
  // Caption Style
  ask_questions: boolean;
  include_local_refs: boolean;
  keep_tone_casual: boolean;
  create_urgency: boolean;
  use_emojis: boolean;
  // Posting Approach
  build_series: boolean;
  reference_trends: boolean;
}

const DEFAULT_PREFERENCES: PlanningPreferences = {
  include_seasonal: true,
  show_behind_scenes: false,
  feature_reviews: true,
  share_tips: true,
  mix_team_moments: false,
  ask_questions: true,
  include_local_refs: false,
  keep_tone_casual: true,
  create_urgency: false,
  use_emojis: true,
  build_series: false,
  reference_trends: false,
};

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between py-2.5 cursor-pointer group">
      <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-10 h-6 rounded-full transition-all"
        style={{
          background: checked 
            ? "linear-gradient(145deg, #f59e0b, #d97706)" 
            : "var(--bg-elevated)",
          boxShadow: checked
            ? "0 0 8px rgba(245, 158, 11, 0.3)"
            : "inset 0 2px 4px rgba(0,0,0,0.4)",
        }}
      >
        <span
          className="absolute top-1 w-4 h-4 rounded-full transition-all"
          style={{
            left: checked ? "22px" : "4px",
            background: checked ? "white" : "var(--text-muted)",
          }}
        />
      </button>
    </label>
  );
}

interface ToggleGroupProps {
  title: string;
  children: React.ReactNode;
}

function ToggleGroup({ title, children }: ToggleGroupProps) {
  return (
    <div className="space-y-1">
      <h4 className="text-xs text-[var(--text-muted)] uppercase tracking-wider pb-2 border-b border-[var(--border-subtle)]">
        {title}
      </h4>
      <div className="divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

interface PlanningPreferencesPanelProps {
  clientId: string;
  jwt: string | null;
  onSave?: () => void;
  onMessage?: (msg: string) => void;
}

export default function PlanningPreferencesPanel({
  clientId: _clientId,
  jwt,
  onSave,
  onMessage,
}: PlanningPreferencesPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<PlanningPreferences>(DEFAULT_PREFERENCES);
  const [initialPrefs, setInitialPrefs] = useState<PlanningPreferences>(DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);

  const loadPreferences = useCallback(async () => {
    if (!jwt) return;
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/lobby/planning-preferences`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        const loaded = { ...DEFAULT_PREFERENCES, ...data.preferences };
        setPrefs(loaded);
        setInitialPrefs(loaded);
      }
    } catch (err) {
      console.error("Load preferences error:", err);
    }
    
    setLoading(false);
  }, [jwt]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    const changed = JSON.stringify(prefs) !== JSON.stringify(initialPrefs);
    setHasChanges(changed);
  }, [prefs, initialPrefs]);

  const updatePref = (key: keyof PlanningPreferences, value: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!jwt || !hasChanges) return;
    setSaving(true);
    
    try {
      const res = await fetch(`${API_BASE}/lobby/planning-preferences`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prefs),
      });
      
      if (res.ok) {
        setInitialPrefs(prefs);
        setHasChanges(false);
        onMessage?.("Preferences saved!");
        onSave?.();
      } else {
        onMessage?.("Couldn't save. Try again?");
      }
    } catch {
      onMessage?.("Save failed. Check your connection.");
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[#f59e0b] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Planning Preferences</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Shape how your content sounds and what it covers</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
          style={{
            background: hasChanges
              ? "linear-gradient(145deg, #f59e0b, #d97706)"
              : "var(--bg-elevated)",
            boxShadow: hasChanges
              ? "0 2px 8px rgba(245,158,11,0.3)"
              : "inset 0 1px 2px rgba(0,0,0,0.3)",
            color: hasChanges ? "white" : "var(--text-muted)",
          }}
        >
          {saving ? "Saving..." : hasChanges ? "Save" : "Saved"}
        </button>
      </div>

      {/* Toggle Groups */}
      <div 
        className="rounded-2xl p-5 space-y-6"
        style={{
          background: "var(--bg-surface)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <ToggleGroup title="Content Mix">
          <ToggleRow 
            label="Include seasonal and holiday themes" 
            checked={prefs.include_seasonal} 
            onChange={(v) => updatePref("include_seasonal", v)} 
          />
          <ToggleRow 
            label="Show behind-the-scenes process" 
            checked={prefs.show_behind_scenes} 
            onChange={(v) => updatePref("show_behind_scenes", v)} 
          />
          <ToggleRow 
            label="Feature customer stories and reviews" 
            checked={prefs.feature_reviews} 
            onChange={(v) => updatePref("feature_reviews", v)} 
          />
          <ToggleRow 
            label="Share tips and how-tos" 
            checked={prefs.share_tips} 
            onChange={(v) => updatePref("share_tips", v)} 
          />
          <ToggleRow 
            label="Mix in team or personal moments" 
            checked={prefs.mix_team_moments} 
            onChange={(v) => updatePref("mix_team_moments", v)} 
          />
        </ToggleGroup>

        <ToggleGroup title="Caption Style">
          <ToggleRow 
            label="Ask questions to followers" 
            checked={prefs.ask_questions} 
            onChange={(v) => updatePref("ask_questions", v)} 
          />
          <ToggleRow 
            label="Include local references" 
            checked={prefs.include_local_refs} 
            onChange={(v) => updatePref("include_local_refs", v)} 
          />
          <ToggleRow 
            label="Keep tone light and casual" 
            checked={prefs.keep_tone_casual} 
            onChange={(v) => updatePref("keep_tone_casual", v)} 
          />
          <ToggleRow 
            label="Create urgency (limited time, etc.)" 
            checked={prefs.create_urgency} 
            onChange={(v) => updatePref("create_urgency", v)} 
          />
          <ToggleRow 
            label="Use emojis" 
            checked={prefs.use_emojis} 
            onChange={(v) => updatePref("use_emojis", v)} 
          />
        </ToggleGroup>

        <ToggleGroup title="Posting Approach">
          <ToggleRow 
            label="Build ongoing series or themes" 
            checked={prefs.build_series} 
            onChange={(v) => updatePref("build_series", v)} 
          />
          <ToggleRow 
            label="Reference trending topics" 
            checked={prefs.reference_trends} 
            onChange={(v) => updatePref("reference_trends", v)} 
          />
        </ToggleGroup>
      </div>
    </div>
  );
}
