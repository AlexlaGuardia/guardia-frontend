"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Wand2,
  BookOpen,
  ChevronDown,
  Loader2,
  Check,
  X,
} from "lucide-react";

const API = "https://api.guardiacontent.com";

interface Chapter {
  id: number;
  book_id: number;
  chapter_number: number;
  title: string;
  content: string;
  ghost_content: string;
  illustration_notes: string;
  word_count: number;
  status: string;
}

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
  chapters: Chapter[];
}

const STATUS_OPTS = ["outline", "draft", "revised", "approved"];

// ---------------------------------------------------------------------------
// Main Editor
// ---------------------------------------------------------------------------

export default function SpiritTalesEditor() {
  const params = useParams();
  const bookId = params?.bookId as string;
  const [book, setBook] = useState<Book | null>(null);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [ghostContent, setGhostContent] = useState("");
  const [showGhost, setShowGhost] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ghosting, setGhosting] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTheme, setEditTheme] = useState("");
  const [editSynopsis, setEditSynopsis] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load book
  const loadBook = useCallback(async () => {
    const res = await fetch(`${API}/hq/athernyx/spirit-tales/books/${bookId}`);
    if (res.ok) {
      const data: Book = await res.json();
      setBook(data);
      setEditTitle(data.title);
      setEditTheme(data.theme || "");
      setEditSynopsis(data.synopsis || "");
      if (data.chapters.length > 0 && activeChapter === null) {
        selectChapter(data.chapters[0], data);
      }
    }
  }, [bookId, activeChapter]);

  useEffect(() => { loadBook(); }, [loadBook]);

  function selectChapter(ch: Chapter, bk?: Book) {
    // Save current first if dirty
    if (dirty && activeChapter !== null) {
      saveChapter(activeChapter, content);
    }
    setActiveChapter(ch.chapter_number);
    setContent(ch.content || "");
    setGhostContent(ch.ghost_content || "");
    setShowGhost(false);
    setDirty(false);
    setSaved(false);
  }

  // Auto-save with debounce
  function handleContentChange(val: string) {
    setContent(val);
    setDirty(true);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (activeChapter !== null) saveChapter(activeChapter, val);
    }, 2000);
  }

  async function saveChapter(chNum: number, text: string) {
    setSaving(true);
    await fetch(
      `${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      }
    );
    setSaving(false);
    setDirty(false);
    setSaved(true);
    // Update local word count
    if (book) {
      const updated = { ...book };
      const ch = updated.chapters.find((c) => c.chapter_number === chNum);
      if (ch) ch.word_count = text.split(/\s+/).filter(Boolean).length;
      setBook(updated);
    }
    setTimeout(() => setSaved(false), 2000);
  }

  async function addChapter() {
    const res = await fetch(
      `${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    if (res.ok) {
      await loadBook();
    }
  }

  async function deleteChapter(chNum: number) {
    const res = await fetch(
      `${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      if (activeChapter === chNum) {
        setActiveChapter(null);
        setContent("");
        setGhostContent("");
      }
      await loadBook();
    }
  }

  async function ghostWrite() {
    if (!activeChapter || !content.trim()) return;
    // Save current content first
    await saveChapter(activeChapter, content);
    setGhosting(true);
    try {
      const res = await fetch(
        `${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${activeChapter}/ghost-write`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setGhostContent(data.ghost_content || "");
        setShowGhost(true);
      }
    } finally {
      setGhosting(false);
    }
  }

  function acceptGhost() {
    setContent(ghostContent);
    setShowGhost(false);
    setDirty(true);
    if (activeChapter !== null) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveChapter(activeChapter, ghostContent), 500);
    }
  }

  async function saveBookMeta() {
    await fetch(`${API}/hq/athernyx/spirit-tales/books/${bookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        theme: editTheme || null,
        synopsis: editSynopsis || null,
      }),
    });
    await loadBook();
    setMetaOpen(false);
  }

  async function updateChapterTitle(chNum: number, title: string) {
    await fetch(
      `${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }
    );
    await loadBook();
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-amber-400/40" />
      </div>
    );
  }

  const currentWords = content.split(/\s+/).filter(Boolean).length;
  const totalWords = book.chapters.reduce((a, c) => a + c.word_count, 0);
  const activeCh = book.chapters.find((c) => c.chapter_number === activeChapter);

  return (
    <div className="h-screen bg-[#0a0a0b] text-[#e8e8e8] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-[#1a1a1f] px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/hq/athernyx/spirit-tales"
            className="text-[#555] hover:text-[#888] transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-amber-400" />
            <button
              onClick={() => setMetaOpen(!metaOpen)}
              className="flex items-center gap-1 text-[13px] font-semibold text-[#e8e8e8] hover:text-amber-300 transition-colors"
            >
              {book.title}
              <ChevronDown size={12} className="text-[#555]" />
            </button>
          </div>
          {book.theme && (
            <span className="text-[10px] text-[#444] italic">
              {book.theme}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-[#444]">
            {totalWords.toLocaleString()} / {(book.target_words / 1000).toFixed(0)}k words
          </span>
          {saving && <span className="text-amber-400/60">Saving...</span>}
          {saved && !saving && <span className="text-green-400/60">Saved</span>}
          {dirty && !saving && !saved && (
            <span className="text-[#555]">Unsaved</span>
          )}
        </div>
      </div>

      {/* Meta dropdown */}
      {metaOpen && (
        <div className="border-b border-[#1a1a1f] bg-[#0d0d0e] px-4 py-4 shrink-0">
          <div className="max-w-xl space-y-2">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-[#111] border border-[#1a1a1f] rounded px-3 py-1.5 text-[13px] text-[#e8e8e8] outline-none focus:border-amber-500/30"
              placeholder="Book title..."
            />
            <input
              value={editTheme}
              onChange={(e) => setEditTheme(e.target.value)}
              className="w-full bg-[#111] border border-[#1a1a1f] rounded px-3 py-1.5 text-[13px] text-[#e8e8e8] outline-none focus:border-amber-500/30"
              placeholder="Theme / lesson..."
            />
            <textarea
              value={editSynopsis}
              onChange={(e) => setEditSynopsis(e.target.value)}
              rows={2}
              className="w-full bg-[#111] border border-[#1a1a1f] rounded px-3 py-1.5 text-[13px] text-[#e8e8e8] outline-none focus:border-amber-500/30 resize-none"
              placeholder="Synopsis..."
            />
            <div className="flex gap-2">
              <button
                onClick={saveBookMeta}
                className="bg-amber-500/20 text-amber-400 rounded px-3 py-1 text-[11px] font-medium hover:bg-amber-500/30 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setMetaOpen(false)}
                className="text-[11px] text-[#555] hover:text-[#888] px-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chapter sidebar */}
        <div className="w-56 border-r border-[#1a1a1f] flex flex-col shrink-0 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1a1a1f]">
            <span className="text-[10px] text-[#444] font-semibold tracking-wider">
              CHAPTERS
            </span>
            <button
              onClick={addChapter}
              className="text-[#555] hover:text-amber-400 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {book.chapters.map((ch) => (
              <button
                key={ch.chapter_number}
                onClick={() => selectChapter(ch)}
                className={`w-full text-left px-3 py-2.5 border-b border-[#0f0f10] transition-colors group ${
                  activeChapter === ch.chapter_number
                    ? "bg-[#1a1a1f]"
                    : "hover:bg-[#111]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[12px] font-medium truncate ${
                      activeChapter === ch.chapter_number
                        ? "text-amber-400"
                        : "text-[#999]"
                    }`}
                  >
                    {ch.title || `Chapter ${ch.chapter_number}`}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this chapter?")) deleteChapter(ch.chapter_number);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[#333] hover:text-red-400/60 transition-all"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                <span className="text-[10px] text-[#333] font-mono">
                  {ch.word_count} words
                </span>
              </button>
            ))}
            {book.chapters.length === 0 && (
              <div className="px-3 py-6 text-center">
                <p className="text-[11px] text-[#333]">No chapters yet</p>
                <button
                  onClick={addChapter}
                  className="text-[11px] text-amber-400/60 hover:text-amber-400 mt-1 transition-colors"
                >
                  + Add first chapter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeChapter !== null && activeCh ? (
            <>
              {/* Chapter header */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#1a1a1f] shrink-0">
                <input
                  value={activeCh.title || ""}
                  onChange={(e) => {
                    const updated = { ...book };
                    const ch = updated.chapters.find(
                      (c) => c.chapter_number === activeChapter
                    );
                    if (ch) ch.title = e.target.value;
                    setBook(updated);
                  }}
                  onBlur={() => {
                    if (activeCh.title) updateChapterTitle(activeChapter, activeCh.title);
                  }}
                  className="bg-transparent text-[14px] font-semibold text-[#e8e8e8] outline-none w-64"
                  placeholder="Chapter title..."
                />
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#444] font-mono">
                    {currentWords} words
                  </span>
                  {currentWords > 0 && (
                    <span
                      className={`text-[10px] font-mono ${
                        currentWords >= 800 && currentWords <= 1200
                          ? "text-green-400/60"
                          : currentWords > 1200
                          ? "text-amber-400/60"
                          : "text-[#333]"
                      }`}
                    >
                      {currentWords >= 800 && currentWords <= 1200
                        ? "in range"
                        : currentWords > 1200
                        ? "over target"
                        : `${800 - currentWords} to go`}
                    </span>
                  )}
                  <button
                    onClick={ghostWrite}
                    disabled={ghosting || !content.trim()}
                    className="flex items-center gap-1.5 bg-purple-500/15 text-purple-400 rounded-lg px-3 py-1.5 text-[11px] font-medium hover:bg-purple-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {ghosting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Wand2 size={12} />
                    )}
                    Ghost Writer
                  </button>
                  <button
                    onClick={() => saveChapter(activeChapter, content)}
                    className="text-[#555] hover:text-[#888] transition-colors"
                  >
                    <Save size={14} />
                  </button>
                </div>
              </div>

              {/* Ghost Writer comparison bar */}
              {showGhost && ghostContent && (
                <div className="flex items-center gap-3 px-5 py-2 border-b border-purple-500/20 bg-purple-500/5 shrink-0">
                  <Wand2 size={12} className="text-purple-400" />
                  <span className="text-[11px] text-purple-300">
                    Ghost Writer draft ready ({ghostContent.split(/\s+/).filter(Boolean).length} words)
                  </span>
                  <div className="flex-1" />
                  <button
                    onClick={acceptGhost}
                    className="flex items-center gap-1 text-[11px] text-green-400 hover:text-green-300 transition-colors"
                  >
                    <Check size={12} /> Accept
                  </button>
                  <button
                    onClick={() => setShowGhost(false)}
                    className="flex items-center gap-1 text-[11px] text-[#555] hover:text-[#888] transition-colors"
                  >
                    <X size={12} /> Dismiss
                  </button>
                </div>
              )}

              {/* Text area(s) */}
              <div className={`flex-1 flex ${showGhost ? "divide-x divide-[#1a1a1f]" : ""} overflow-hidden`}>
                {/* Your draft */}
                <div className={`flex-1 flex flex-col overflow-hidden ${showGhost ? "w-1/2" : ""}`}>
                  {showGhost && (
                    <div className="px-5 py-1.5 border-b border-[#1a1a1f] text-[10px] text-[#444] font-semibold tracking-wider shrink-0">
                      YOUR DRAFT
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="flex-1 w-full bg-transparent text-[13px] leading-relaxed text-[#ccc] outline-none resize-none p-5 font-mono"
                    placeholder="Start writing... Use [ART: description] for illustration callouts."
                    spellCheck
                  />
                </div>

                {/* Ghost Writer output */}
                {showGhost && ghostContent && (
                  <div className="flex-1 flex flex-col overflow-hidden w-1/2">
                    <div className="px-5 py-1.5 border-b border-[#1a1a1f] text-[10px] text-purple-400/60 font-semibold tracking-wider shrink-0">
                      GHOST WRITER
                    </div>
                    <div className="flex-1 overflow-y-auto p-5">
                      <div className="text-[13px] leading-relaxed text-[#aaa] font-mono whitespace-pre-wrap">
                        {ghostContent}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen size={28} className="mx-auto text-[#222] mb-3" />
                <p className="text-[13px] text-[#444]">
                  Select a chapter to start writing
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
