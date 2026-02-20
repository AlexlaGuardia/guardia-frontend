"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * CONTENT DIRECTION PANEL
 * 
 * Niche-aware, 3rd-grade-simple content strategy configuration.
 * Replaces open-ended text fields with guided selections.
 */

const API_BASE = "https://api.guardiacontent.com";

// ═══════════════════════════════════════════════════════════════════════════
// NICHE QUESTION SETS
// ═══════════════════════════════════════════════════════════════════════════

interface QuestionOption {
  id: string;
  label: string;
}

interface NicheQuestion {
  id: string;
  label: string;
  type: "single" | "multi" | "text";
  options?: QuestionOption[];
  placeholder?: string;
}

const UNIVERSAL_QUESTIONS: NicheQuestion[] = [
  {
    id: "hero_element",
    label: "What do customers love most about you?",
    type: "single",
    options: [
      { id: "result", label: "The final result" },
      { id: "skill", label: "How skilled/fast you are" },
      { id: "vibe", label: "The atmosphere/vibe" },
      { id: "personality", label: "Your personality/team" },
    ],
  },
  {
    id: "text_overlay",
    label: "Text on your images?",
    type: "single",
    options: [
      { id: "always", label: "Yes, add captions/quotes" },
      { id: "never", label: "No, let images speak" },
      { id: "sometimes", label: "Sometimes (you decide)" },
    ],
  },
  {
    id: "font_style",
    label: "If text, what style?",
    type: "single",
    options: [
      { id: "display_bold", label: "Bold & attention-grabbing" },
      { id: "clean_sans", label: "Minimal & clean" },
      { id: "handwritten", label: "Playful & fun" },
      { id: "bold_serif", label: "Professional & polished" },
      { id: "elegant_script", label: "Elegant & flowing" },
      { id: "elegant_serif", label: "Classic & timeless" },
    ],
  },
];

const NICHE_QUESTIONS: Record<string, NicheQuestion[]> = {
  restaurant: [
    {
      id: "show_focus",
      label: "What should we show most?",
      type: "single",
      options: [
        { id: "plating", label: "Finished dishes" },
        { id: "cooking", label: "Cooking in action" },
        { id: "ambiance", label: "The atmosphere" },
        { id: "team", label: "Your chefs/team" },
      ],
    },
    {
      id: "satisfying",
      label: "What's satisfying to watch?",
      type: "multi",
      options: [
        { id: "pour", label: "Sauce/butter pour" },
        { id: "sizzle", label: "Food sizzling" },
        { id: "cut", label: "Cutting into dish" },
        { id: "cheese", label: "Cheese pull/melt" },
      ],
    },
    {
      id: "signature",
      label: "Any signature presentation?",
      type: "text",
      placeholder: "e.g., tableside, flambé, special plating...",
    },
  ],

  salon: [
    {
      id: "show_focus",
      label: "What should we highlight?",
      type: "single",
      options: [
        { id: "transformation", label: "Before & after reveals" },
        { id: "technique", label: "Technique close-ups" },
        { id: "result", label: "Just the final look" },
        { id: "client", label: "Happy clients" },
      ],
    },
    {
      id: "specialty",
      label: "Your specialty?",
      type: "multi",
      options: [
        { id: "color", label: "Color work" },
        { id: "cuts", label: "Cuts & styling" },
        { id: "nails", label: "Nails" },
        { id: "skincare", label: "Skincare" },
      ],
    },
    {
      id: "reveal_style",
      label: "How should reveals look?",
      type: "single",
      options: [
        { id: "side_by_side", label: "Side by side" },
        { id: "dramatic", label: "Dramatic reveal" },
        { id: "swipe", label: "Swipe/slider" },
      ],
    },
  ],

  fitness: [
    {
      id: "show_focus",
      label: "What content works best?",
      type: "single",
      options: [
        { id: "workouts", label: "Workout clips" },
        { id: "transformations", label: "Client transformations" },
        { id: "culture", label: "Gym culture/vibes" },
        { id: "education", label: "Tips & form demos" },
      ],
    },
    {
      id: "content_source",
      label: "Who's in the content?",
      type: "single",
      options: [
        { id: "trainer", label: "Mostly me/trainers" },
        { id: "clients", label: "Mostly clients" },
        { id: "both", label: "Mix of both" },
      ],
    },
    {
      id: "vibe",
      label: "What's your energy?",
      type: "single",
      options: [
        { id: "intense", label: "High energy, intense" },
        { id: "supportive", label: "Supportive, all levels" },
        { id: "zen", label: "Calm, mindful" },
      ],
    },
  ],

  retail: [
    {
      id: "product_style",
      label: "How should products look?",
      type: "single",
      options: [
        { id: "lifestyle", label: "In-use lifestyle shots" },
        { id: "clean", label: "Clean product-only" },
        { id: "flat", label: "Flat lay arrangements" },
        { id: "unboxing", label: "Unboxing style" },
      ],
    },
    {
      id: "show_people",
      label: "Show people using products?",
      type: "single",
      options: [
        { id: "yes", label: "Yes, always" },
        { id: "sometimes", label: "Sometimes" },
        { id: "no", label: "Product only" },
      ],
    },
  ],

  professional: [
    {
      id: "trust_builder",
      label: "What builds trust for your clients?",
      type: "single",
      options: [
        { id: "expertise", label: "Show expertise (tips)" },
        { id: "results", label: "Show results (wins)" },
        { id: "personality", label: "Show personality" },
        { id: "process", label: "Show how you work" },
      ],
    },
    {
      id: "formality",
      label: "How formal?",
      type: "single",
      options: [
        { id: "corporate", label: "Corporate, polished" },
        { id: "approachable", label: "Professional but friendly" },
        { id: "casual", label: "Casual, conversational" },
      ],
    },
  ],

  realestate: [
    {
      id: "show_focus",
      label: "What to highlight?",
      type: "single",
      options: [
        { id: "properties", label: "Property showcases" },
        { id: "lifestyle", label: "Neighborhood/lifestyle" },
        { id: "agent", label: "You as the agent" },
        { id: "wins", label: "Sold/success stories" },
      ],
    },
    {
      id: "property_style",
      label: "Property presentation?",
      type: "single",
      options: [
        { id: "cinematic", label: "Cinematic, dramatic" },
        { id: "clean", label: "Clean, editorial" },
        { id: "walkthrough", label: "Walkthrough feel" },
      ],
    },
  ],

  automotive: [
    {
      id: "show_focus",
      label: "What to showcase?",
      type: "single",
      options: [
        { id: "before_after", label: "Before/after" },
        { id: "process", label: "Work in progress" },
        { id: "finished", label: "Finished results" },
        { id: "expertise", label: "Your expertise" },
      ],
    },
    {
      id: "specialty",
      label: "Your specialty?",
      type: "multi",
      options: [
        { id: "repair", label: "Repairs" },
        { id: "detailing", label: "Detailing" },
        { id: "custom", label: "Custom work" },
        { id: "restoration", label: "Restoration" },
      ],
    },
  ],

  // Default/other
  other: [
    {
      id: "content_focus",
      label: "What's most important to show?",
      type: "single",
      options: [
        { id: "product", label: "Your product/service" },
        { id: "process", label: "How you work" },
        { id: "results", label: "Results/outcomes" },
        { id: "team", label: "You/your team" },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface ContentStrategyData {
  hero_element?: string;
  text_overlay?: string;
  font_style?: string;
  satisfying_moment?: string;
  unique_factor?: string;
  niche_config?: Record<string, string | string[]>;
}

interface ContentDirectionPanelProps {
  clientId: string;
  industry: string;
  jwt: string | null;
  onSave?: () => void;
  onMessage?: (msg: string) => void;
}

function OptionButton({
  selected,
  onClick,
  label,
  multi = false,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  multi?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all active:scale-[0.98] ${
        selected
          ? "bg-[#f59e0b]/20 border-[#f59e0b]/50 text-[var(--text-primary)]"
          : "bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border)] hover:text-[var(--text-secondary)]"
      }`}
      style={{
        border: "1px solid",
        boxShadow: selected
          ? "0 0 12px rgba(245, 158, 11, 0.15)"
          : "inset 0 1px 2px rgba(0,0,0,0.3)",
      }}
    >
      {multi && (
        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
          selected ? "bg-[#f59e0b] border-[#f59e0b]" : "border-[var(--border)]"
        }`}>
          {selected && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}
      <span className="flex-1">{label}</span>
      {!multi && selected && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

function QuestionBlock({
  question,
  value,
  onChange,
}: {
  question: NicheQuestion;
  value: string | string[] | undefined;
  onChange: (val: string | string[]) => void;
}) {
  const handleSingleSelect = (optionId: string) => {
    onChange(optionId);
  };

  const handleMultiSelect = (optionId: string) => {
    const current = Array.isArray(value) ? value : [];
    if (current.includes(optionId)) {
      onChange(current.filter(v => v !== optionId));
    } else {
      onChange([...current, optionId]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[var(--text-primary)]">
        {question.label}
      </label>
      
      {question.type === "text" ? (
        <input
          type="text"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          className="w-full px-4 py-3 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
          style={{
            background: "var(--bg-base)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.03)",
            border: "none",
          }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {question.options?.map((opt) => (
            <OptionButton
              key={opt.id}
              selected={
                question.type === "multi"
                  ? (Array.isArray(value) && value.includes(opt.id))
                  : value === opt.id
              }
              onClick={() =>
                question.type === "multi"
                  ? handleMultiSelect(opt.id)
                  : handleSingleSelect(opt.id)
              }
              label={opt.label}
              multi={question.type === "multi"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContentDirectionPanel({
  clientId,
  industry,
  jwt,
  onSave,
  onMessage,
}: ContentDirectionPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [strategy, setStrategy] = useState<ContentStrategyData>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [initialStrategy, setInitialStrategy] = useState<ContentStrategyData>({});

  // Get niche-specific questions
  const nicheKey = industry?.toLowerCase() || "other";
  const nicheQuestions = NICHE_QUESTIONS[nicheKey] || NICHE_QUESTIONS.other;
  
  // Questions to show: universal + niche-specific
  // But only show font_style if text_overlay is "always" or "sometimes"
  const showFontStyle = strategy.text_overlay === "always" || strategy.text_overlay === "sometimes";

  const universalToShow = UNIVERSAL_QUESTIONS.filter(q => {
    if (q.id === "font_style") return showFontStyle;
    return true;
  });

  const loadStrategy = useCallback(async () => {
    if (!jwt) return;
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/lobby/content-strategy`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setStrategy(data.strategy || {});
        setInitialStrategy(data.strategy || {});
      }
    } catch (err) {
      console.error("Load strategy error:", err);
    }
    
    setLoading(false);
  }, [jwt]);

  useEffect(() => {
    loadStrategy();
  }, [loadStrategy]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(strategy) !== JSON.stringify(initialStrategy);
    setHasChanges(changed);
  }, [strategy, initialStrategy]);

  const updateStrategy = (key: string, value: string | string[]) => {
    setStrategy(prev => ({ ...prev, [key]: value }));
  };

  const updateNicheConfig = (key: string, value: string | string[]) => {
    setStrategy(prev => ({
      ...prev,
      niche_config: {
        ...(prev.niche_config || {}),
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!jwt || !hasChanges) return;
    setSaving(true);
    
    try {
      const res = await fetch(`${API_BASE}/lobby/content-strategy`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(strategy),
      });
      
      if (res.ok) {
        setInitialStrategy(strategy);
        setHasChanges(false);
        onMessage?.("Content direction saved!");
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
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Content Direction</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Tell us what works — we'll handle the rest</p>
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

      {/* Universal Questions */}
      <div 
        className="rounded-2xl p-5 space-y-5"
        style={{
          background: "var(--bg-surface)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">The Basics</span>
        </div>
        
        {universalToShow.map((q) => (
          <QuestionBlock
            key={q.id}
            question={q}
            value={strategy[q.id as keyof ContentStrategyData] as string | string[]}
            onChange={(val) => updateStrategy(q.id, val)}
          />
        ))}
      </div>

      {/* Niche-Specific Questions */}
      {nicheQuestions.length > 0 && (
        <div 
          className="rounded-2xl p-5 space-y-5"
          style={{
            background: "var(--bg-surface)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              For Your {industry?.charAt(0).toUpperCase()}{industry?.slice(1) || "Business"}
            </span>
          </div>
          
          {nicheQuestions.map((q) => (
            <QuestionBlock
              key={q.id}
              question={q}
              value={strategy.niche_config?.[q.id] as string | string[]}
              onChange={(val) => updateNicheConfig(q.id, val)}
            />
          ))}
        </div>
      )}

      {/* Preview/Summary */}
      {(strategy.text_overlay || strategy.hero_element) && (
        <div
          className="rounded-xl p-4 border border-[#f59e0b]/20"
          style={{ background: "rgba(245, 158, 11, 0.05)" }}
        >
          <div className="flex items-start gap-3">
            <div className="text-sm text-[var(--text-muted)]">
              <span className="text-[var(--text-primary)] font-medium">Your content will: </span>
              {strategy.text_overlay === "never" && "focus on clean, striking images"}
              {strategy.text_overlay === "always" && `include ${strategy.font_style || "styled"} text overlays`}
              {strategy.text_overlay === "sometimes" && "mix clean images with occasional text"}
              {strategy.hero_element && ` showcasing ${
                strategy.hero_element === "result" ? "your results" :
                strategy.hero_element === "skill" ? "your expertise" :
                strategy.hero_element === "vibe" ? "your atmosphere" :
                strategy.hero_element === "personality" ? "your personality" : ""
              }`}
              .
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
