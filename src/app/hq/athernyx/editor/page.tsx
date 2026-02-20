"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = "https://api.guardiacontent.com";

interface ChapterSummary {
  volume: string;
  volume_title: string;
  chapter: string;
  title: string;
  total_pages: number;
  approved_pages: number;
  word_count: number;
  has_page_files: boolean;
}

export default function EditorPage() {
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [splitting, setSplitting] = useState<string | null>(null);

  const fetchChapters = () => {
    fetch(`${API_BASE}/hq/athernyx/editor/chapters`)
      .then(r => r.json())
      .then(d => setChapters(d.chapters || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchChapters(); }, []);

  const handleSplit = async (vol: string, ch: string) => {
    const key = `${vol}/${ch}`;
    setSplitting(key);
    try {
      const res = await fetch(`${API_BASE}/hq/athernyx/editor/${vol}/${ch}/split`, { method: "POST" });
      if (res.ok) fetchChapters();
    } catch {}
    setSplitting(null);
  };

  return (
    <div className="min-h-screen bg-[#171513] text-[#e8e8e8]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/hq/athernyx" className="text-[#555] text-xs hover:text-[#888] transition-colors mb-2 block">
              &larr; Back to Canon
            </Link>
            <h1 className="text-2xl font-semibold tracking-wide" style={{ color: "#a855f7" }}>
              Chapter Editor
            </h1>
            <p className="text-[#555] text-sm mt-1">Polish prose, approve pages, publish to bookstore</p>
          </div>
        </div>

        {loading ? (
          <div className="text-[#555] text-sm">Loading chapters...</div>
        ) : chapters.length === 0 ? (
          <div className="text-[#555] text-sm">No expanded chapters found.</div>
        ) : (
          <div className="space-y-4">
            {chapters.map(ch => {
              const key = `${ch.volume}/${ch.chapter}`;
              const progress = ch.total_pages > 0 ? (ch.approved_pages / ch.total_pages) * 100 : 0;

              return (
                <div
                  key={key}
                  className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-xl p-5 hover:border-[#2a2a2f] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-semibold tracking-wider text-[#555] uppercase">
                          {ch.volume_title}
                        </span>
                        <span className="text-[#333] text-xs">{ch.chapter}</span>
                      </div>
                      <h2 className="text-lg font-medium text-[#e8e8e8]">{ch.title}</h2>
                      <div className="flex gap-4 mt-2 text-xs text-[#555]">
                        <span>{ch.total_pages} pages</span>
                        <span>{ch.word_count.toLocaleString()} words</span>
                        {ch.has_page_files && (
                          <span style={{ color: progress === 100 ? "#10b981" : "#a855f7" }}>
                            {ch.approved_pages}/{ch.total_pages} approved
                          </span>
                        )}
                      </div>

                      {ch.has_page_files && (
                        <div className="mt-3 w-full bg-[#1a1a1f] rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: progress === 100 ? "#10b981" : "#a855f7",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      {ch.has_page_files ? (
                        <Link
                          href={`/hq/athernyx/editor/${ch.volume}/${ch.chapter}`}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          style={{ backgroundColor: "#a855f720", color: "#a855f7" }}
                        >
                          Edit
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleSplit(ch.volume, ch.chapter)}
                          disabled={splitting === key}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          style={{ backgroundColor: "#1a1a1f", color: "#888" }}
                        >
                          {splitting === key ? "Splitting..." : "Split Pages"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
