"use client";

interface ChloeTabProps {
  clientId: string;
  jwt: string;
  onMessage: (msg: string) => void;
}

const PREVIEW_ITEMS = [
  { icon: "logo", label: "Custom Logos", desc: "From quick marks to full brand identities", price: "$1.99+" },
  { icon: "social", label: "Social Kits", desc: "Post-ready icons, highlights, templates", price: "$5" },
  { icon: "mascot", label: "Brand Mascots", desc: "A character that represents your brand", price: "$29.99" },
  { icon: "voice", label: "Brand Voice", desc: "A unique AI voice for your content", price: "$9.99" },
  { icon: "pipeline", label: "Content Pipelines", desc: "Automated content strategies, built for you", price: "$4.99+" },
];

const ICONS: Record<string, React.ReactNode> = {
  logo: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  ),
  social: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  mascot: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  voice: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  pipeline: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

export default function ChloeTab({ clientId: _clientId, jwt: _jwt, onMessage: _onMessage }: ChloeTabProps) {
  return (
    <div className="h-full overflow-y-auto flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* Chloe icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/25">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 w-20 h-20 bg-violet-500/20 rounded-2xl animate-ping-slow" />
        </div>

        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Chloe&apos;s Brand Studio
        </h2>
        <p className="text-[var(--text-secondary)] max-w-sm mb-2">
          Your AI brand stylist is getting ready.
        </p>
        <p className="text-sm text-violet-300/70 mb-10">Coming soon</p>

        {/* Preview items */}
        <div className="w-full max-w-md space-y-2">
          {PREVIEW_ITEMS.map((item) => (
            <div
              key={item.icon}
              className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl opacity-80"
            >
              <div className="w-9 h-9 bg-violet-500/10 rounded-lg flex items-center justify-center text-violet-400 shrink-0">
                {ICONS[item.icon]}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{item.desc}</p>
              </div>
              <span className="text-sm font-semibold text-violet-300/60 shrink-0">{item.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center border-t border-[var(--border)]">
        <p className="text-xs text-[var(--text-muted)]">
          Chloe will help you build logos, mascots, voices, and content strategies — all personalized for your brand.
        </p>
      </div>

      <style jsx>{`
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.3; }
          75%, 100% { transform: scale(1.3); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
