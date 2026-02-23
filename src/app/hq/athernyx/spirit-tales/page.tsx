"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, BookOpen, Sparkles, ArrowLeft } from "lucide-react";

const API = "https://api.guardiacontent.com";

interface Book {
  id: number;
  title: string;
  subtitle: string | null;
  book_number: number;
  synopsis: string | null;
  theme: string | null;
  target_words: number;
  status: string;
  word_count: number;
  chapter_count: number;
}

const STATUS_COLORS: Record<string, string> = {
  outline: "#555",
  drafting: "#f59e0b",
  revision: "#06b6d4",
  illustrated: "#a855f7",
  published: "#22c55e",
};

function ProgressBar({ current, target, accent }: { current: number; target: number; accent: string }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-[#1a1a1f] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: accent }}
      />
    </div>
  );
}

export default function SpiritTalesLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTheme, setNewTheme] = useState("");
  const [newSynopsis, setNewSynopsis] = useState("");

  useEffect(() => {
    fetch(`${API}/hq/athernyx/spirit-tales/books`)
      .then((r) => r.json())
      .then((d) => { setBooks(d.books || []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  async function createBook() {
    if (!newTitle.trim()) return;
    const res = await fetch(`${API}/hq/athernyx/spirit-tales/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        book_number: books.length + 1,
        theme: newTheme || undefined,
        synopsis: newSynopsis || undefined,
        target_words: 10000,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setCreating(false);
      setNewTitle("");
      setNewTheme("");
      setNewSynopsis("");
      // Refresh
      const r2 = await fetch(`${API}/hq/athernyx/spirit-tales/books`);
      const d2 = await r2.json();
      setBooks(d2.books || []);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e8e8e8]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/hq/athernyx"
            className="inline-flex items-center gap-2 text-[11px] text-[#555] hover:text-[#888] mb-4 transition-colors"
          >
            <ArrowLeft size={12} /> Athernyx Hub
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h1 className="text-sm font-semibold tracking-wider text-amber-400">
              SPIRIT TALES
            </h1>
          </div>
          <p className="text-[#555] text-sm max-w-lg">
            Bonn & Momo{"'"}s adventures in the Ather. Illustrated chapter books for ages 6-13.
          </p>
        </header>

        {/* Stats bar */}
        {loaded && books.length > 0 && (
          <div className="flex items-center gap-6 mb-8 text-[11px]">
            <span className="text-amber-400 font-mono">{books.length} books</span>
            <span className="text-[#555]">
              {books.reduce((a, b) => a + b.word_count, 0).toLocaleString()} total words
            </span>
            <span className="text-[#555]">
              {books.reduce((a, b) => a + b.chapter_count, 0)} chapters
            </span>
          </div>
        )}

        {/* Book Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/hq/athernyx/spirit-tales/${book.id}`}
              className="group block"
            >
              <div className="relative overflow-hidden rounded-xl border border-[#f59e0b20] bg-[#0a0a0b] transition-all duration-300 hover:border-[#f59e0b40]">
                <div
                  className="h-[2px] w-full"
                  style={{ background: "linear-gradient(90deg, #f59e0b60, transparent)" }}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f59e0b15]">
                        <BookOpen size={15} className="text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-semibold text-[#e8e8e8] group-hover:text-amber-300 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-[10px] text-[#444]">Book {book.book_number}</p>
                      </div>
                    </div>
                    <span
                      className="text-[9px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded"
                      style={{
                        color: STATUS_COLORS[book.status] || "#555",
                        backgroundColor: `${STATUS_COLORS[book.status] || "#555"}15`,
                      }}
                    >
                      {book.status}
                    </span>
                  </div>

                  {book.theme && (
                    <p className="text-[11px] text-[#666] mb-1 italic">
                      Theme: {book.theme}
                    </p>
                  )}
                  {book.synopsis && (
                    <p className="text-[11px] text-[#444] mb-3 line-clamp-2">
                      {book.synopsis}
                    </p>
                  )}
                  {!book.synopsis && book.theme && <div className="mb-3" />}

                  <div className="flex gap-4 mb-3 text-[11px]">
                    <span className="text-amber-400 font-mono">
                      {book.chapter_count} ch
                    </span>
                    <span className="text-[#666] font-mono">
                      {book.word_count.toLocaleString()} words
                    </span>
                  </div>

                  <ProgressBar
                    current={book.word_count}
                    target={book.target_words}
                    accent="#f59e0b"
                  />
                  <p className="text-[9px] text-[#333] mt-1">
                    {Math.round((book.word_count / book.target_words) * 100)}% of{" "}
                    {(book.target_words / 1000).toFixed(0)}k target
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {/* New Book Card */}
          {!creating ? (
            <button
              onClick={() => setCreating(true)}
              className="group flex items-center justify-center rounded-xl border border-dashed border-[#1a1a1f] bg-[#0a0a0b] p-8 transition-colors hover:border-[#f59e0b40] min-h-[180px]"
            >
              <div className="text-center">
                <Plus
                  size={24}
                  className="mx-auto text-[#333] group-hover:text-amber-400/60 transition-colors mb-2"
                />
                <p className="text-[12px] text-[#444] group-hover:text-[#666] transition-colors">
                  New Book
                </p>
              </div>
            </button>
          ) : (
            <div className="rounded-xl border border-[#f59e0b30] bg-[#0a0a0b] p-6 sm:col-span-2 lg:col-span-3">
              <h3 className="text-[13px] font-semibold text-amber-400 mb-4">New Book</h3>
              <input
                type="text"
                placeholder="Book title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#111] border border-[#1a1a1f] rounded-lg px-3 py-2 text-[13px] text-[#e8e8e8] mb-3 outline-none focus:border-[#f59e0b40]"
                autoFocus
              />
              <textarea
                placeholder="Theme — e.g. Discovery & courage in the unknown"
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                rows={3}
                className="w-full bg-[#111] border border-[#1a1a1f] rounded-lg px-3 py-2 text-[13px] text-[#e8e8e8] mb-3 outline-none focus:border-[#f59e0b40] resize-none"
              />
              <textarea
                placeholder="Synopsis — what happens in this book? Pour it out here..."
                value={newSynopsis}
                onChange={(e) => setNewSynopsis(e.target.value)}
                rows={8}
                className="w-full bg-[#111] border border-[#1a1a1f] rounded-lg px-3 py-2 text-[13px] text-[#e8e8e8] mb-4 outline-none focus:border-[#f59e0b40] resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={createBook}
                  className="bg-amber-500/20 text-amber-400 rounded-lg px-5 py-1.5 text-[12px] font-medium hover:bg-amber-500/30 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => { setCreating(false); setNewTitle(""); setNewTheme(""); setNewSynopsis(""); }}
                  className="px-3 py-1.5 text-[12px] text-[#555] hover:text-[#888] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Empty state */}
        {loaded && books.length === 0 && !creating && (
          <div className="text-center py-16">
            <Sparkles size={32} className="mx-auto text-amber-400/30 mb-4" />
            <p className="text-[#555] text-sm mb-1">No books yet</p>
            <p className="text-[#333] text-[11px]">
              Create your first Spirit Tales book to start writing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
