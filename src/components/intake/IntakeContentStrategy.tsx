'use client';

import { useState } from 'react';

/**
 * INTAKE CONTENT STRATEGY STEP
 *
 * Niche-aware questions for intake forms.
 * Extracts "viral DNA" through simple selections.
 */

interface QuestionOption {
  id: string;
  label: string;
}

interface NicheQuestion {
  id: string;
  label: string;
  type: 'single' | 'multi' | 'text';
  options?: QuestionOption[];
  placeholder?: string;
}

// Universal questions for all industries
const UNIVERSAL_QUESTIONS: NicheQuestion[] = [
  {
    id: 'hero_element',
    label: 'What do customers love most about you?',
    type: 'single',
    options: [
      { id: 'result', label: 'The final result' },
      { id: 'skill', label: 'How skilled/fast you are' },
      { id: 'vibe', label: 'The atmosphere/vibe' },
      { id: 'personality', label: 'Your personality/team' },
    ],
  },
  {
    id: 'text_overlay',
    label: 'Text on your images?',
    type: 'single',
    options: [
      { id: 'always', label: 'Yes, add captions/quotes' },
      { id: 'never', label: 'No, let images speak' },
      { id: 'sometimes', label: 'Mix of both' },
    ],
  },
];

// Font style question (conditional)
const FONT_STYLE_QUESTION: NicheQuestion = {
  id: 'font_style',
  label: 'What style for text?',
  type: 'single',
  options: [
    { id: 'display_bold', label: 'Bold & eye-catching' },
    { id: 'clean_sans', label: 'Minimal & clean' },
    { id: 'handwritten', label: 'Playful & fun' },
    { id: 'bold_serif', label: 'Professional' },
    { id: 'elegant_script', label: 'Elegant & flowing' },
    { id: 'elegant_serif', label: 'Classic & timeless' },
  ],
};

// Industry-specific questions
const NICHE_QUESTIONS: Record<string, NicheQuestion[]> = {
  restaurant: [
    {
      id: 'show_focus',
      label: 'What should we show most?',
      type: 'single',
      options: [
        { id: 'plating', label: 'Finished dishes' },
        { id: 'cooking', label: 'Cooking in action' },
        { id: 'ambiance', label: 'The atmosphere' },
        { id: 'team', label: 'Your chefs/team' },
      ],
    },
  ],
  salon: [
    {
      id: 'show_focus',
      label: 'What should we highlight?',
      type: 'single',
      options: [
        { id: 'transformation', label: 'Before & after' },
        { id: 'technique', label: 'Technique close-ups' },
        { id: 'result', label: 'Final looks only' },
        { id: 'client', label: 'Happy clients' },
      ],
    },
  ],
  pet_grooming: [
    {
      id: 'show_focus',
      label: 'What makes pet parents share?',
      type: 'single',
      options: [
        { id: 'before_after', label: 'Before & after transformations' },
        { id: 'happy_pets', label: 'Happy, fluffy pups' },
        { id: 'process', label: 'Grooming in action' },
        { id: 'team', label: 'Your groomers with pets' },
      ],
    },
  ],
  fitness: [
    {
      id: 'show_focus',
      label: 'What content works best?',
      type: 'single',
      options: [
        { id: 'workouts', label: 'Workout clips' },
        { id: 'transformations', label: 'Transformations' },
        { id: 'culture', label: 'Gym vibes' },
        { id: 'education', label: 'Tips & demos' },
      ],
    },
  ],
  retail: [
    {
      id: 'product_style',
      label: 'How should products look?',
      type: 'single',
      options: [
        { id: 'lifestyle', label: 'Lifestyle shots' },
        { id: 'clean', label: 'Clean product-only' },
        { id: 'flat', label: 'Flat lay style' },
      ],
    },
  ],
  professional: [
    {
      id: 'trust_builder',
      label: 'What builds trust for clients?',
      type: 'single',
      options: [
        { id: 'expertise', label: 'Show expertise' },
        { id: 'results', label: 'Show results' },
        { id: 'personality', label: 'Show personality' },
      ],
    },
  ],
  realestate: [
    {
      id: 'show_focus',
      label: 'What to highlight?',
      type: 'single',
      options: [
        { id: 'properties', label: 'Properties' },
        { id: 'lifestyle', label: 'Neighborhood' },
        { id: 'agent', label: 'You as agent' },
      ],
    },
  ],
  automotive: [
    {
      id: 'show_focus',
      label: 'What to showcase?',
      type: 'single',
      options: [
        { id: 'before_after', label: 'Before/after' },
        { id: 'process', label: 'Work in progress' },
        { id: 'finished', label: 'Finished results' },
      ],
    },
  ],
  healthcare: [
    {
      id: 'content_focus',
      label: 'What resonates with patients?',
      type: 'single',
      options: [
        { id: 'education', label: 'Health tips' },
        { id: 'team', label: 'Your caring team' },
        { id: 'facility', label: 'Modern facility' },
      ],
    },
  ],
  other: [
    {
      id: 'content_focus',
      label: 'What should we show?',
      type: 'single',
      options: [
        { id: 'product', label: 'Your product/service' },
        { id: 'process', label: 'How you work' },
        { id: 'results', label: 'Results/outcomes' },
        { id: 'team', label: 'You/your team' },
      ],
    },
  ],
};

interface ContentStrategyData {
  hero_element?: string;
  text_overlay?: string;
  font_style?: string;
  niche_config?: Record<string, string>;
}

interface IntakeContentStrategyProps {
  industry: string;
  onChange: (data: ContentStrategyData) => void;
  initialData?: ContentStrategyData;
}

function OptionButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all border ${
        selected
          ? 'border-[#C9A227]/50 bg-[#C9A227]/10 text-[var(--text-primary)]'
          : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
      }`}
    >
      <span className="flex-1">{label}</span>
      {selected && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

export default function IntakeContentStrategy({
  industry,
  onChange,
  initialData = {},
}: IntakeContentStrategyProps) {
  const [data, setData] = useState<ContentStrategyData>(initialData);

  // Get niche-specific questions
  const nicheKey = industry?.toLowerCase() || 'other';
  const nicheQuestions = NICHE_QUESTIONS[nicheKey] || NICHE_QUESTIONS.other;

  // Show font style only if text_overlay is not "never"
  const showFontStyle = data.text_overlay && data.text_overlay !== 'never';

  // Build question list
  const allQuestions = [
    ...UNIVERSAL_QUESTIONS,
    ...(showFontStyle ? [FONT_STYLE_QUESTION] : []),
    ...nicheQuestions,
  ];

  const updateData = (key: string, value: string, isNiche = false) => {
    const newData = isNiche
      ? { ...data, niche_config: { ...(data.niche_config || {}), [key]: value } }
      : { ...data, [key]: value };

    // Clear font_style if text_overlay is "never"
    if (key === 'text_overlay' && value === 'never') {
      delete newData.font_style;
    }

    setData(newData);
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-semibold">How should your content look?</h2>
        <p className="text-sm text-[var(--text-secondary)]">Quick questions so we nail your style from day one.</p>
      </div>

      <div className="space-y-5">
        {allQuestions.map((q) => {
          const isNiche = nicheQuestions.includes(q);
          const currentValue = isNiche
            ? data.niche_config?.[q.id]
            : data[q.id as keyof ContentStrategyData];

          return (
            <div key={q.id} className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text-primary)]">{q.label}</label>
              <div className="grid grid-cols-2 gap-2">
                {q.options?.map((opt) => (
                  <OptionButton
                    key={opt.id}
                    selected={currentValue === opt.id}
                    onClick={() => updateData(q.id, opt.id, isNiche)}
                    label={opt.label}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview */}
      {(data.text_overlay || data.hero_element) && (
        <div className="rounded-xl border border-[#C9A227]/20 bg-[#C9A227]/5 p-4">
          <div className="flex items-start gap-3">
            <div className="text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--text-primary)] font-medium">Your content will: </span>
              {data.text_overlay === 'never' && 'focus on clean, striking images'}
              {data.text_overlay === 'always' && `include ${data.font_style || 'styled'} text overlays`}
              {data.text_overlay === 'sometimes' && 'mix clean images with occasional text'}
              {data.hero_element && ` showcasing ${
                data.hero_element === 'result' ? 'your results' :
                data.hero_element === 'skill' ? 'your expertise' :
                data.hero_element === 'vibe' ? 'your atmosphere' :
                data.hero_element === 'personality' ? 'your personality' : ''
              }`}.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
