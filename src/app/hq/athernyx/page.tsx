"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = "https://api.guardiacontent.com";

interface CanonEntry {
  id: number;
  path: string;
  title: string;
  summary: string | null;
  word_count: number;
  updated: string;
}

interface EntryDetail {
  id: number;
  path: string;
  category: string;
  title: string;
  summary: string | null;
  word_count: number;
  updated: string;
  content: string | null;
  design_ids: number[];
  related_beats: { id: number; chapter: number; beat_type: string; description: string; status: string }[];
}

interface StoryBeat {
  id: number;
  chapter: number;
  beat_type: string;
  description: string;
  characters: string | null;
  status: string;
  thread_name: string | null;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  characters: { label: "Characters", color: "#f59e0b" },
  world: { label: "World", color: "#10b981" },
  story: { label: "Story", color: "#8b5cf6" },
  game: { label: "Game", color: "#3b82f6" },
  root: { label: "Core", color: "#ec4899" },
  templates: { label: "Templates", color: "#6b7280" },
  pipeline: { label: "Pipeline", color: "#14b8a6" },
};

function Sidebar({
  categories,
  selected,
  onSelect,
  onSelectEntry
}: {
  categories: Record<string, CanonEntry[]>;
  selected: string | null;
  onSelect: (cat: string) => void;
  onSelectEntry: (entry: CanonEntry) => void;
}) {
  const cats = Object.keys(categories).filter(c => c !== "..");

  return (
    <div className="hidden md:block w-64 border-r border-[#1a1a1f] bg-[#0a0a0b] overflow-y-auto flex-shrink-0">
      <div className="p-4">
        <h2 className="text-[#555] text-[10px] font-semibold tracking-wider mb-3">CATEGORIES</h2>
        <div className="space-y-1">
          {cats.map(cat => {
            const config = CATEGORY_LABELS[cat] || { label: cat, color: "#666" };
            const isSelected = selected === cat;
            return (
              <div key={cat}>
                <button
                  onClick={() => onSelect(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    isSelected ? "bg-[#1a1a1f]" : "hover:bg-[#151518]"
                  }`}
                  style={{ color: isSelected ? config.color : "#888" }}
                >
                  <span className="font-medium">{config.label}</span>
                  <span className="ml-2 text-[#444] text-xs">{categories[cat].length}</span>
                </button>
                {isSelected && (
                  <div className="ml-3 mt-1 space-y-0.5 border-l border-[#1a1a1f] pl-3">
                    {categories[cat].map(entry => (
                      <button
                        key={entry.id}
                        onClick={() => onSelectEntry(entry)}
                        className="w-full text-left px-2 py-1.5 text-xs text-[#666] hover:text-[#ccc] truncate transition-colors"
                      >
                        {entry.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          onSearch(e.target.value);
        }}
        placeholder="Search canon..."
        className="w-full bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg px-4 py-2 pl-10 text-sm text-[#ccc] placeholder-[#444] focus:outline-none focus:border-purple-500/50"
      />
      <svg className="absolute left-3 top-2.5 w-4 h-4 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
}

function EntryView({ entry, onClose }: { entry: EntryDetail; onClose: () => void }) {
  const config = CATEGORY_LABELS[entry.category] || { label: entry.category, color: "#666" };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded"
                style={{ color: config.color, backgroundColor: `${config.color}15` }}
              >
                {config.label.toUpperCase()}
              </span>
              <span className="text-[#444] text-xs">{entry.word_count} words</span>
            </div>
            <h1 className="text-2xl font-semibold text-[#e8e8e8]">{entry.title}</h1>
          </div>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-[#888] p-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        {entry.summary && (
          <div className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg p-4 mb-6">
            <p className="text-[#888] text-sm leading-relaxed">{entry.summary}</p>
          </div>
        )}

        {/* Content */}
        {entry.content && (
          <div className="prose prose-invert prose-sm max-w-none mb-8">
            <pre className="whitespace-pre-wrap text-[#ccc] text-sm leading-relaxed font-sans bg-transparent p-0">
              {entry.content}
            </pre>
          </div>
        )}

        {/* Related Story Beats */}
        {entry.related_beats && entry.related_beats.length > 0 && (
          <div className="border-t border-[#1a1a1f] pt-6">
            <h3 className="text-[#555] text-xs font-semibold tracking-wider mb-3">RELATED STORY BEATS</h3>
            <div className="space-y-2">
              {entry.related_beats.map(beat => (
                <div key={beat.id} className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-purple-400 text-[10px] font-semibold">CH{beat.chapter}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      beat.beat_type === "foreshadow" ? "bg-cyan-500/20 text-cyan-400" :
                      beat.beat_type === "reveal" ? "bg-amber-500/20 text-amber-400" :
                      beat.beat_type === "payoff" ? "bg-emerald-500/20 text-emerald-400" :
                      "bg-[#1a1a1f] text-[#666]"
                    }`}>
                      {beat.beat_type}
                    </span>
                    <span className={`text-[10px] ${beat.status === "open" ? "text-cyan-400" : "text-[#444]"}`}>
                      {beat.status}
                    </span>
                  </div>
                  <p className="text-[#888] text-xs">{beat.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadsView({ beats }: { beats: StoryBeat[] }) {
  // Group by chapter
  const byChapter: Record<number, StoryBeat[]> = {};
  beats.forEach(b => {
    if (!byChapter[b.chapter]) byChapter[b.chapter] = [];
    byChapter[b.chapter].push(b);
  });

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-purple-400 text-sm font-semibold tracking-wider mb-4">NARRATIVE THREADS</h2>
      <div className="space-y-6">
        {Object.entries(byChapter).map(([chapter, chapterBeats]) => (
          <div key={chapter}>
            <h3 className="text-[#555] text-xs font-semibold mb-2">CHAPTER {chapter}</h3>
            <div className="space-y-2">
              {chapterBeats.map(beat => (
                <div key={beat.id} className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      beat.beat_type === "foreshadow" ? "bg-cyan-500/20 text-cyan-400" :
                      beat.beat_type === "reveal" ? "bg-amber-500/20 text-amber-400" :
                      beat.beat_type === "payoff" ? "bg-emerald-500/20 text-emerald-400" :
                      beat.beat_type === "plant" ? "bg-blue-500/20 text-blue-400" :
                      "bg-[#1a1a1f] text-[#666]"
                    }`}>
                      {beat.beat_type}
                    </span>
                    {beat.thread_name && (
                      <span className="text-purple-400/60 text-[10px]">{beat.thread_name}</span>
                    )}
                    <span className={`ml-auto text-[10px] ${beat.status === "open" ? "text-cyan-400" : "text-[#333]"}`}>
                      {beat.status}
                    </span>
                  </div>
                  <p className="text-[#888] text-xs">{beat.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AthernyxPage() {
  const [categories, setCategories] = useState<Record<string, CanonEntry[]>>({});
  const [beats, setBeats] = useState<StoryBeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<EntryDetail | null>(null);
  const [view, setView] = useState<"browse" | "threads">("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Fetch entries
    fetch(`${API_BASE}/hq/athernyx/entries`)
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || {});
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch threads
    fetch(`${API_BASE}/hq/athernyx/threads`)
      .then(res => res.json())
      .then(data => setBeats(data.beats || []))
      .catch(() => {});
  }, []);

  const handleSelectEntry = async (entry: CanonEntry) => {
    try {
      const res = await fetch(`${API_BASE}/hq/athernyx/entry/${entry.id}`);
      const data = await res.json();
      if (!data.error) {
        setSelectedEntry(data);
      }
    } catch (e) {
      console.error("Failed to load entry:", e);
    }
  };

  // Filter entries by search
  const filteredCategories: Record<string, CanonEntry[]> = {};
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    Object.entries(categories).forEach(([cat, entries]) => {
      const filtered = entries.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.summary && e.summary.toLowerCase().includes(q))
      );
      if (filtered.length > 0) filteredCategories[cat] = filtered;
    });
  }

  const displayCategories = searchQuery ? filteredCategories : categories;

  return (
    <div className="min-h-screen bg-[#050506] text-[#e8e8e8] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1a1a1f] bg-[#0a0a0b]/50 px-6 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <h1 className="text-purple-400 font-semibold text-sm tracking-wider">ATHER-PEDIA</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-[#555] hover:text-[#888] p-2 -ml-2 transition-colors"
              aria-label="Toggle categories"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:block w-64">
              <SearchBar onSearch={setSearchQuery} />
            </div>
            <div className="flex items-center gap-1 bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-1">
              <button
                onClick={() => setView("browse")}
                className={`px-3 py-1 text-xs rounded ${view === "browse" ? "bg-purple-500/20 text-purple-400" : "text-[#555]"}`}
              >
                Browse
              </button>
              <button
                onClick={() => setView("threads")}
                className={`px-3 py-1 text-xs rounded ${view === "threads" ? "bg-purple-500/20 text-purple-400" : "text-[#555]"}`}
              >
                Threads
              </button>
            </div>
            <Link
              href="/hq/athernyx/editor"
              className="px-3 py-1 text-xs rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
            >
              Editor
            </Link>
            <span className="hidden sm:inline text-[#555] text-xs font-mono">{total} entries</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-[#555] text-sm">Loading...</div>
          </div>
        ) : view === "threads" ? (
          <ThreadsView beats={beats} />
        ) : selectedEntry ? (
          <EntryView entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
        ) : (
          <>
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
              <div className="md:hidden fixed inset-0 z-40 flex">
                <div className="w-72 bg-[#0a0a0b] border-r border-[#1a1a1f] overflow-y-auto flex-shrink-0">
                  <div className="p-4 border-b border-[#1a1a1f] flex items-center justify-between">
                    <span className="text-[#555] text-[10px] font-semibold tracking-wider">CATEGORIES</span>
                    <button onClick={() => setSidebarOpen(false)} className="text-[#555] hover:text-[#888] p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="mb-3">
                      <SearchBar onSearch={setSearchQuery} />
                    </div>
                    <div className="space-y-1">
                      {Object.keys(displayCategories).filter(c => c !== "..").map(cat => {
                        const config = CATEGORY_LABELS[cat] || { label: cat, color: "#666" };
                        const isSelected = selectedCat === cat;
                        return (
                          <div key={cat}>
                            <button
                              onClick={() => setSelectedCat(cat)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${isSelected ? "bg-[#1a1a1f]" : "hover:bg-[#151518]"}`}
                              style={{ color: isSelected ? config.color : "#888" }}
                            >
                              <span className="font-medium">{config.label}</span>
                              <span className="ml-2 text-[#444] text-xs">{displayCategories[cat].length}</span>
                            </button>
                            {isSelected && (
                              <div className="ml-3 mt-1 space-y-0.5 border-l border-[#1a1a1f] pl-3">
                                {displayCategories[cat].map(entry => (
                                  <button
                                    key={entry.id}
                                    onClick={() => { handleSelectEntry(entry); setSidebarOpen(false); }}
                                    className="w-full text-left px-2 py-1.5 text-xs text-[#666] hover:text-[#ccc] truncate transition-colors"
                                  >
                                    {entry.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
              </div>
            )}
            {/* Desktop sidebar */}
            <Sidebar
              categories={displayCategories}
              selected={selectedCat}
              onSelect={setSelectedCat}
              onSelectEntry={handleSelectEntry}
            />
            <div className="flex-1 flex items-center justify-center text-[#444]">
              <div className="text-center">
                <p className="text-sm">Select an entry to view</p>
                <p className="text-xs mt-1">Browse by category or search above</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
