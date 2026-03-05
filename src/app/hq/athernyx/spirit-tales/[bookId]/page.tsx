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
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  X,
  Eye,
  EyeOff,
  List,
  PenLine,
  Image,
  Maximize2,
  Minimize2,
  Users,
  Scissors,
  FileText,
  Merge,
  Paintbrush,
} from "lucide-react";

const API = "https://api.guardiacontent.com";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArtCallouts(text: string): { count: number; callouts: string[] } {
  const regex = /\[ART:\s*([^\]]+)\]/g;
  const callouts: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    callouts.push(match[1].trim());
  }
  return { count: callouts.length, callouts };
}

function renderPreviewContent(text: string, accent: string) {
  const parts = text.split(/(\[ART:\s*[^\]]+\])/g);
  return parts.map((part, i) => {
    const artMatch = part.match(/^\[ART:\s*([^\]]+)\]$/);
    if (artMatch) {
      return (
        <div
          key={i}
          className="my-4 rounded-lg border border-dashed p-4 flex items-start gap-3"
          style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}
        >
          <Image size={16} style={{ color: accent }} className="shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-semibold tracking-wider" style={{ color: accent }}>
              ILLUSTRATION
            </span>
            <p className="text-[12px] text-[#999] mt-1 leading-relaxed italic">
              {artMatch[1].trim()}
            </p>
          </div>
        </div>
      );
    }
    return part.split("\n\n").filter(Boolean).map((para, j) => (
      <p key={`${i}-${j}`} className="text-[14px] leading-[1.8] text-[#bbb] mb-3"
         style={{ fontFamily: "var(--font-lora), Georgia, serif" }}>
        {para}
      </p>
    ));
  });
}

const SPIRIT_TALES_CHARACTERS = [
  {
    name: "Bonn",
    role: "Protagonist",
    color: "#f59e0b",
    traits: [
      "Young Alkin girl, narrator (first person)",
      "Curious, brave, sometimes uncertain",
      "Short sentences when scared, longer when wondering",
    ],
    voice: "Natural young girl — asks questions, notices details adults miss, tries to be brave even when scared.",
  },
  {
    name: "Momo",
    role: "Mana'mal Companion",
    color: "#a78bfa",
    traits: [
      "Playful, loyal, expressive without human speech",
      "Communicates through sounds, gestures, glowing patterns",
      "Patterns glow brighter with emotions",
    ],
    voice: "Show, don't tell. Describe sounds (chirps, trills), body language, and glow color/intensity.",
  },
  {
    name: "Moglins",
    role: "Ather Creatures",
    color: "#22c55e",
    traits: [
      "Friendly creatures Bonn encounters in the Ather",
      "Each one slightly different — unique shape, color, sound",
      "Helpful but mischievous",
    ],
    voice: "Whimsical and warm. Comic relief but also the heart.",
  },
];

interface PageMeta {
  page_number: number;
  word_count: number;
  status: "draft" | "approved";
  illustration_note: string;
  approved_at: string | null;
}

interface Chapter {
  id: number;
  book_id: number;
  chapter_number: number;
  title: string;
  content: string;
  outline: string;
  ghost_content: string;
  illustration_notes: string;
  word_count: number;
  status: string;
  has_pages?: boolean;
  page_count?: number;
  canon_context?: string;
  summary?: string;
}

interface ReviewIssue {
  page: number;
  type: string;
  quote: string;
  issue: string;
  suggestion: string;
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
const STATUS_COLORS: Record<string, string> = {
  outline: "#555",
  draft: "#f59e0b",
  revised: "#06b6d4",
  approved: "#22c55e",
};

// ---------------------------------------------------------------------------
// Main Editor
// ---------------------------------------------------------------------------

export default function SpiritTalesEditor() {
  const params = useParams();
  const bookId = params?.bookId as string;
  const [book, setBook] = useState<Book | null>(null);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [outline, setOutline] = useState("");
  const [ghostContent, setGhostContent] = useState("");
  const [showGhost, setShowGhost] = useState(false);
  const [editorMode, setEditorMode] = useState<"outline" | "write">("outline");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ghosting, setGhosting] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [showContext, setShowContext] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [charPanelOpen, setCharPanelOpen] = useState(false);
  const [draggedChapter, setDraggedChapter] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTheme, setEditTheme] = useState("");
  const [editSynopsis, setEditSynopsis] = useState("");
  // Page mode state
  const [pageMode, setPageMode] = useState(false);
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [activePage, setActivePage] = useState<number | null>(null);
  const [pageContent, setPageContent] = useState("");
  const [pageIllustration, setPageIllustration] = useState("");
  const [pageSplitting, setPageSplitting] = useState(false);
  // Canon & Luna review state
  const [canonContext, setCanonContext] = useState("");
  const [chapterSummary, setChapterSummary] = useState("");
  const [showCanon, setShowCanon] = useState(false);
  const [reviewIssues, setReviewIssues] = useState<ReviewIssue[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pageSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const sessionStartWords = useRef<number | null>(null);

  // Load book
  const loadBook = useCallback(async () => {
    const res = await fetch(`${API}/hq/athernyx/spirit-tales/books/${bookId}`);
    if (res.ok) {
      const data: Book = await res.json();
      setBook(data);
      if (sessionStartWords.current === null) {
        sessionStartWords.current = data.chapters.reduce((a: number, c: { word_count: number }) => a + c.word_count, 0);
      }
      setEditTitle(data.title);
      setEditTheme(data.theme || "");
      setEditSynopsis(data.synopsis || "");
      if (data.chapters.length > 0 && activeChapter === null) {
        selectChapter(data.chapters[0], data);
      }
    }
  }, [bookId, activeChapter]);

  useEffect(() => { loadBook(); }, [loadBook]);

  // Zen mode ESC handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && zenMode) setZenMode(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [zenMode]);

  // Typewriter scroll — keeps cursor at ~40% viewport in zen mode
  function typewriterScroll() {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror || !zenMode) return;
    const cs = getComputedStyle(textarea);
    mirror.style.width = cs.width;
    mirror.style.font = cs.font;
    mirror.style.letterSpacing = cs.letterSpacing;
    mirror.style.padding = cs.padding;
    mirror.style.lineHeight = cs.lineHeight;
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.wordWrap = "break-word";
    mirror.style.overflowWrap = "break-word";
    mirror.textContent = textarea.value.slice(0, textarea.selectionStart);
    const cursorY = mirror.scrollHeight;
    textarea.scrollTop = Math.max(0, cursorY - textarea.clientHeight * 0.4);
  }

  function selectChapter(ch: Chapter, _bk?: Book) {
    // Save current first if dirty
    if (dirty && activeChapter !== null) {
      if (pageMode && activePage !== null) {
        savePage(activeChapter, activePage, pageContent, pageIllustration);
      } else if (editorMode === "outline") {
        saveOutline(activeChapter, outline);
      } else {
        saveChapter(activeChapter, content);
      }
    }
    setActiveChapter(ch.chapter_number);
    setContent(ch.content || "");
    setOutline(ch.outline || "");
    setGhostContent(ch.ghost_content || "");
    setCanonContext(ch.canon_context || "");
    setChapterSummary(ch.summary || "");
    setShowGhost(false);
    setReviewIssues([]);
    setShowReview(false);
    setDirty(false);
    setSaved(false);
    // Handle page mode
    if (ch.has_pages && ch.page_count && ch.page_count > 0) {
      setPageMode(true);
      setEditorMode("write");
      loadPages(ch.chapter_number).then((pgs) => {
        if (pgs.length > 0) loadPage(ch.chapter_number, 1);
      });
    } else {
      setPageMode(false);
      setPages([]);
      setActivePage(null);
      setEditorMode(ch.content?.trim() ? "write" : "outline");
    }
  }

  // Auto-save with debounce
  function handleContentChange(val: string) {
    setContent(val);
    setDirty(true);
    setSaved(false);
    // Auto-progress status to draft when user starts writing
    if (val.trim() && book && activeCh && activeCh.status === "outline") {
      const updated = { ...book };
      const ch = updated.chapters.find((c) => c.chapter_number === activeChapter);
      if (ch) ch.status = "draft";
      setBook(updated);
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (activeChapter !== null) saveChapter(activeChapter, val);
    }, 2000);
    if (zenMode) requestAnimationFrame(typewriterScroll);
  }

  function handleOutlineChange(val: string) {
    setOutline(val);
    setDirty(true);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (activeChapter !== null) saveOutline(activeChapter, val);
    }, 2000);
  }

  async function saveOutline(chNum: number, text: string) {
    setSaving(true);
    await fetch(
      `${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outline: text }),
      }
    );
    setSaving(false);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function saveChapter(chNum: number, text: string) {
    setSaving(true);
    const payload: Record<string, string> = { content: text };
    // Auto-set status to draft if writing content for an outline-status chapter
    const ch = book?.chapters.find((c) => c.chapter_number === chNum);
    if (ch && ch.status === "outline" && text.trim()) payload.status = "draft";
    await fetch(
      `${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  async function saveCanonContext(chNum: number, text: string) {
    await fetch(
      `${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canon_context: text }),
      }
    );
  }

  async function runLunaReview(chNum: number) {
    setReviewing(true);
    setShowReview(true);
    setReviewIssues([]);
    try {
      const res = await fetch(
        `${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}/luna-review`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setReviewIssues(data.issues || []);
      }
    } catch { /* silently fail */ }
    setReviewing(false);
  }

  async function generateSummary(chNum: number) {
    setGeneratingSummary(true);
    try {
      const res = await fetch(
        `${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}/summary`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auto: true }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setChapterSummary(data.summary || "");
      }
    } catch { /* silently fail */ }
    setGeneratingSummary(false);
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
        setOutline("");
        setGhostContent("");
      }
      await loadBook();
    }
  }

  async function ghostWrite() {
    if (!activeChapter) return;
    const isOutlineMode = editorMode === "outline" && !pageMode;
    // Validate: need content or outline to work from
    if (isOutlineMode && !outline.trim()) return;
    if (!isOutlineMode && !content.trim()) return;
    // Save current state first
    if (pageMode) {
      if (activePage !== null) await savePage(activeChapter, activePage, pageContent, pageIllustration);
    } else if (isOutlineMode) {
      await saveOutline(activeChapter, outline);
    } else {
      await saveChapter(activeChapter, content);
    }
    setGhosting(true);
    try {
      const res = await fetch(
        `${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${activeChapter}/ghost-write`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        const pagesCreated = data.pages_created || 0;
        const startPage = data.start_page || 1;

        if (pagesCreated > 0) {
          // Ghost-write now produces pages directly — switch to page mode
          const pgs = await loadPages(activeChapter);
          setPageMode(true);
          // Load the first new page
          if (pgs.length > 0) {
            loadPage(activeChapter, startPage);
          }
          // Update local chapter state
          if (book) {
            const updated = { ...book };
            const ch = updated.chapters.find((c) => c.chapter_number === activeChapter);
            if (ch) {
              ch.has_pages = true;
              ch.page_count = pgs.length;
              if (isOutlineMode) {
                ch.status = "draft";
              }
            }
            setBook(updated);
          }
          setShowGhost(false);
        }
      }
    } finally {
      setGhosting(false);
    }
  }

  async function deletePage(chNum: number, pageNum: number) {
    const res = await fetch(
      `${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}/pages/${pageNum}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      const data = await res.json();
      const totalPages = data.total_pages || 0;
      if (totalPages === 0) {
        // No pages left — exit page mode
        setPageMode(false);
        setPages([]);
        setActivePage(null);
        if (book) {
          const updated = { ...book };
          const ch = updated.chapters.find((c) => c.chapter_number === chNum);
          if (ch) { ch.has_pages = false; ch.page_count = 0; }
          setBook(updated);
        }
      } else {
        // Reload page list (pages got renumbered)
        const pgs = await loadPages(chNum);
        // If the deleted page was active, load the nearest page
        if (activePage === pageNum) {
          const nextPage = Math.min(pageNum, totalPages);
          loadPage(chNum, nextPage);
        } else if (activePage !== null && activePage > pageNum) {
          // Active page shifted down by 1
          setActivePage(activePage - 1);
        }
        if (book) {
          const updated = { ...book };
          const ch = updated.chapters.find((c) => c.chapter_number === chNum);
          if (ch) { ch.page_count = totalPages; }
          setBook(updated);
        }
      }
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

  async function reorderChapters(fromNum: number, toNum: number) {
    const res = await fetch(
      `${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/reorder`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_chapter: fromNum, to_chapter: toNum }),
      }
    );
    if (res.ok) {
      await loadBook();
      if (activeChapter === fromNum) setActiveChapter(toNum);
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

  // ---- Page functions ----

  async function loadPages(chNum: number): Promise<PageMeta[]> {
    const res = await fetch(`${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}/pages`);
    if (res.ok) {
      const data = await res.json();
      const pgs = data.pages || data;
      setPages(pgs);
      return pgs as PageMeta[];
    }
    return [];
  }

  async function loadPage(chNum: number, pageNum: number) {
    const res = await fetch(`${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}/pages/${pageNum}`);
    if (res.ok) {
      const data = await res.json();
      setPageContent(data.content || "");
      setPageIllustration(data.illustration_note || "");
      setActivePage(pageNum);
    }
  }

  async function savePage(chNum: number, pageNum: number, c: string, ill: string) {
    setSaving(true);
    await fetch(`${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}/pages/${pageNum}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: c, illustration_note: ill }),
    });
    setSaving(false);
    setDirty(false);
    setSaved(true);
    loadPages(chNum);
    setTimeout(() => setSaved(false), 2000);
  }

  async function splitIntoPages(chNum: number) {
    setPageSplitting(true);
    const res = await fetch(`${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}/split-into-pages`, {
      method: "POST",
    });
    if (res.ok) {
      await loadBook();
      const pgs = await loadPages(chNum);
      if (pgs.length > 0) {
        setPageMode(true);
        await loadPage(chNum, 1);
      }
    }
    setPageSplitting(false);
  }

  async function splitPageAtCursor(chNum: number, pageNum: number) {
    const textarea = textareaRef.current;
    const offset = textarea ? textarea.selectionStart : 0;
    const res = await fetch(`${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}/pages/${pageNum}/split`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offset }),
    });
    if (res.ok) {
      await loadPages(chNum);
      await loadPage(chNum, pageNum);
      await loadBook();
    }
  }

  async function mergePageWithNext(chNum: number, pageNum: number) {
    const res = await fetch(`${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}/pages/${pageNum}/merge`, {
      method: "POST",
    });
    if (res.ok) {
      const pgs = await loadPages(chNum);
      const newPageNum = pageNum > pgs.length ? pgs.length : pageNum;
      await loadPage(chNum, newPageNum);
      await loadBook();
    }
  }

  async function togglePageApproval(chNum: number, pageNum: number) {
    const res = await fetch(`${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}/pages/${pageNum}/approve`, {
      method: "PATCH",
    });
    if (res.ok) {
      await loadPages(chNum);
    }
  }

  async function compilePages(chNum: number) {
    const res = await fetch(`${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}/compile-pages`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setContent(data.content || "");
      setPageMode(false);
      setPages([]);
      setActivePage(null);
      await loadBook();
    }
  }

  async function dissolvePages(chNum: number) {
    const res = await fetch(`${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${chNum}/pages`, {
      method: "DELETE",
    });
    if (res.ok) {
      setPageMode(false);
      setPages([]);
      setActivePage(null);
      await loadBook();
    }
  }

  function handlePageContentChange(val: string) {
    setPageContent(val);
    setDirty(true);
    setSaved(false);
    if (pageSaveTimer.current) clearTimeout(pageSaveTimer.current);
    pageSaveTimer.current = setTimeout(() => {
      if (activeChapter !== null && activePage !== null) {
        savePage(activeChapter, activePage, val, pageIllustration);
      }
    }, 2000);
    if (zenMode) requestAnimationFrame(typewriterScroll);
  }

  function handlePageIllustrationChange(val: string) {
    setPageIllustration(val);
    setDirty(true);
    setSaved(false);
    if (pageSaveTimer.current) clearTimeout(pageSaveTimer.current);
    pageSaveTimer.current = setTimeout(() => {
      if (activeChapter !== null && activePage !== null) {
        savePage(activeChapter, activePage, pageContent, val);
      }
    }, 2000);
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
      {/* Hidden mirror for typewriter scroll */}
      <div ref={mirrorRef} aria-hidden="true"
        style={{ position: "absolute", top: -9999, left: -9999, visibility: "hidden", whiteSpace: "pre-wrap", wordWrap: "break-word" }}
      />

      {/* Zen mode exit overlay */}
      {zenMode && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <span className="text-[10px] text-[#333] font-mono">ESC to exit</span>
          <button
            onClick={() => setZenMode(false)}
            className="p-2 rounded-lg bg-[#1a1a1f]/80 text-[#555] hover:text-[#888] backdrop-blur-sm transition-colors"
          >
            <Minimize2 size={14} />
          </button>
        </div>
      )}

      {/* Top Bar */}
      <div className={`flex items-center justify-between border-b border-[#1a1a1f] px-4 py-2.5 shrink-0 ${zenMode ? "hidden" : ""}`}>
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
          {sessionStartWords.current !== null && totalWords > sessionStartWords.current && (
            <span className="text-emerald-400/70 text-[11px] font-mono">
              +{(totalWords - sessionStartWords.current).toLocaleString()} this session
            </span>
          )}
          {saving && <span className="text-amber-400/60">Saving...</span>}
          {saved && !saving && <span className="text-green-400/60">Saved</span>}
          {dirty && !saving && !saved && (
            <span className="text-[#555]">Unsaved</span>
          )}
        </div>
      </div>

      {/* Meta dropdown */}
      {metaOpen && !zenMode && (
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
        <div className={`w-56 border-r border-[#1a1a1f] flex flex-col shrink-0 overflow-hidden ${zenMode ? "hidden" : ""}`}>
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
              <div key={ch.chapter_number}>
                <button
                  onClick={() => selectChapter(ch)}
                  draggable
                  onDragStart={() => setDraggedChapter(ch.chapter_number)}
                  onDragEnd={() => { setDraggedChapter(null); setDropTarget(null); }}
                  onDragOver={(e) => { e.preventDefault(); setDropTarget(ch.chapter_number); }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedChapter !== null && draggedChapter !== ch.chapter_number) {
                      reorderChapters(draggedChapter, ch.chapter_number);
                    }
                    setDraggedChapter(null);
                    setDropTarget(null);
                  }}
                  className={`w-full text-left px-3 py-2.5 border-b border-[#0f0f10] transition-colors group ${
                    activeChapter === ch.chapter_number
                      ? "bg-[#1a1a1f]"
                      : "hover:bg-[#111]"
                  } ${draggedChapter === ch.chapter_number ? "opacity-50" : ""} ${
                    dropTarget === ch.chapter_number && draggedChapter !== ch.chapter_number
                      ? "border-t-2 border-t-amber-400/60"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <span className={`text-[10px] font-mono ${activeChapter === ch.chapter_number ? "text-amber-400/50" : "text-[#444]"}`}>
                        Ch {ch.chapter_number}
                      </span>
                      <span
                        className={`text-[12px] font-medium ml-1.5 ${
                          activeChapter === ch.chapter_number
                            ? "text-amber-400"
                            : ch.title ? "text-[#999]" : "text-[#555] italic"
                        }`}
                      >
                        {ch.title || "Untitled"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {ch.has_pages && (
                        <span className="text-[9px] text-cyan-400/50 font-mono">{ch.page_count}pg</span>
                      )}
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
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#333] font-mono">
                      {ch.word_count} words
                    </span>
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[ch.status] || "#555" }}
                      title={ch.status}
                    />
                  </div>
                </button>
                {/* Page sub-list */}
                {ch.has_pages && activeChapter === ch.chapter_number && pages.length > 0 && (
                  <div className="bg-[#0d0d0e] border-b border-[#0f0f10]">
                    {pages.map((pg) => (
                      <div
                        key={pg.page_number}
                        className={`group w-full flex items-center justify-between pl-8 pr-3 py-1.5 text-[11px] transition-colors cursor-pointer ${
                          activePage === pg.page_number
                            ? "text-cyan-400 bg-[#111]"
                            : "text-[#555] hover:text-[#888] hover:bg-[#0f0f10]"
                        }`}
                        onClick={() => {
                          setPageMode(true);
                          loadPage(ch.chapter_number, pg.page_number);
                        }}
                      >
                        <span className="font-mono flex items-center gap-1.5">
                          Pg {pg.page_number}
                          {pg.illustration_note && (
                            <Paintbrush size={9} className="text-amber-400/60" />
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-[#333]">{pg.word_count}w</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${pg.status === "approved" ? "bg-green-400" : "bg-[#333]"}`} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePage(ch.chapter_number, pg.page_number);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-red-400/40 hover:text-red-400 transition-all"
                            title={`Delete page ${pg.page_number}`}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                <div className="flex items-baseline gap-2 flex-1 min-w-0 mr-4">
                  <span className="text-[11px] text-[#444] font-mono shrink-0">Ch {activeChapter}</span>
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
                    className="bg-transparent text-[14px] font-semibold text-[#e8e8e8] outline-none flex-1 min-w-0"
                    placeholder={activeChapter === 1 ? "The Cabin in the Woods..." : `Chapter ${activeChapter} title...`}
                  />
                </div>
                <div className="flex items-center gap-3">
                  {editorMode === "write" && (
                    <>
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
                    </>
                  )}
                  <button
                    onClick={ghostWrite}
                    disabled={ghosting || (pageMode ? !content.trim() : (editorMode === "write" ? !content.trim() : !outline.trim()))}
                    className="flex items-center gap-1.5 bg-purple-500/15 text-purple-400 rounded-lg px-3 py-1.5 text-[11px] font-medium hover:bg-purple-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {ghosting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Wand2 size={12} />
                    )}
                    {editorMode === "outline" && !pageMode ? "Draft from Outline" : "Ghost Writer"}
                  </button>
                  {pageMode && pages.length > 0 && (
                    <button
                      onClick={() => activeChapter && runLunaReview(activeChapter)}
                      disabled={reviewing}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
                        reviewIssues.length > 0
                          ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                          : "bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25"
                      } disabled:opacity-30`}
                      title="Luna reviews pages against canon"
                    >
                      {reviewing ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Eye size={12} />
                      )}
                      {reviewIssues.length > 0 ? `${reviewIssues.length} issues` : "Luna QC"}
                    </button>
                  )}
                  <button
                    onClick={() => setCharPanelOpen(!charPanelOpen)}
                    className={`transition-colors ${charPanelOpen ? "text-amber-400" : "text-[#555] hover:text-[#888]"}`}
                    title="Character reference"
                  >
                    <Users size={14} />
                  </button>
                  <button
                    onClick={() => setZenMode(!zenMode)}
                    className="text-[#555] hover:text-[#888] transition-colors"
                    title={zenMode ? "Exit zen mode" : "Zen mode"}
                  >
                    {zenMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <button
                    onClick={() => editorMode === "outline" ? saveOutline(activeChapter, outline) : saveChapter(activeChapter, content)}
                    className="text-[#555] hover:text-[#888] transition-colors"
                  >
                    <Save size={14} />
                  </button>
                </div>
              </div>

              {/* Book context reference */}
              {(book.synopsis || book.theme) && !zenMode && (
                <div className="border-b border-[#1a1a1f] shrink-0">
                  <button
                    onClick={() => setShowContext(!showContext)}
                    className="flex items-center gap-2 px-5 py-1.5 text-[10px] text-[#444] hover:text-[#666] transition-colors w-full"
                  >
                    {showContext ? <EyeOff size={10} /> : <Eye size={10} />}
                    <span className="font-semibold tracking-wider">BOOK CONTEXT</span>
                  </button>
                  {showContext && (
                    <div className="px-5 pb-3 space-y-1">
                      {book.theme && (
                        <p className="text-[11px] text-amber-400/50 italic">
                          Theme: {book.theme}
                        </p>
                      )}
                      {book.synopsis && (
                        <p className="text-[11px] text-[#555] leading-relaxed">
                          {book.synopsis}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Canon Context + Summary */}
              {activeCh && !zenMode && (
                <div className="border-b border-[#1a1a1f] shrink-0">
                  <button
                    onClick={() => setShowCanon(!showCanon)}
                    className="flex items-center gap-2 px-5 py-1.5 text-[10px] text-[#444] hover:text-[#666] transition-colors w-full"
                  >
                    {showCanon ? <EyeOff size={10} /> : <Eye size={10} />}
                    <span className="font-semibold tracking-wider">CANON CONTEXT</span>
                    {canonContext.trim() && (
                      <span className="text-[9px] text-amber-400/40 ml-1">has notes</span>
                    )}
                    {chapterSummary.trim() && (
                      <span className="text-[9px] text-green-400/40 ml-1">has summary</span>
                    )}
                  </button>
                  {showCanon && (
                    <div className="px-5 pb-3 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-amber-400/50 font-semibold tracking-wider">CHAPTER LORE NOTES</span>
                          <span className="text-[9px] text-[#333]">Tell the ghost writer what it needs to know</span>
                        </div>
                        <textarea
                          value={canonContext}
                          onChange={(e) => setCanonContext(e.target.value)}
                          onBlur={() => activeChapter && saveCanonContext(activeChapter, canonContext)}
                          rows={3}
                          className="w-full bg-[#111] border border-[#1a1a1f] rounded px-3 py-2 text-[12px] text-[#999] outline-none focus:border-amber-500/30 placeholder-[#333] resize-none"
                          placeholder="e.g. This chapter introduces Gregory. He lives in the Shimmer Garden. He knows what Momo is — looks at him like he recognizes the species..."
                        />
                      </div>
                      {chapterSummary.trim() ? (
                        <div>
                          <span className="text-[10px] text-green-400/50 font-semibold tracking-wider">CHAPTER SUMMARY</span>
                          <p className="text-[11px] text-[#666] leading-relaxed mt-1">{chapterSummary}</p>
                        </div>
                      ) : (
                        activeCh.has_pages && (activeCh.page_count ?? 0) > 0 && (
                          <button
                            onClick={() => activeChapter && generateSummary(activeChapter)}
                            disabled={generatingSummary}
                            className="flex items-center gap-1.5 text-[10px] text-purple-400/60 hover:text-purple-400 transition-colors disabled:opacity-30"
                          >
                            {generatingSummary ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                            Generate summary with Luna
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Outline / Write / Page tabs */}
              <div className={`flex items-center gap-0 border-b border-[#1a1a1f] shrink-0 px-5 ${zenMode ? "hidden" : ""}`}>
                {pageMode ? (
                  <>
                    {/* Page mode navigation */}
                    <button
                      onClick={() => { setPageMode(false); setEditorMode("write"); }}
                      className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-[#555] hover:text-[#888] transition-colors"
                    >
                      <ArrowLeft size={12} /> Back to Chapter
                    </button>
                    <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-cyan-400">
                      <FileText size={12} />
                      <button
                        onClick={() => activePage && activePage > 1 && activeChapter && loadPage(activeChapter, activePage - 1)}
                        disabled={!activePage || activePage <= 1}
                        className="text-[#555] hover:text-[#888] disabled:opacity-20 transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span>Pg {activePage} of {pages.length}</span>
                      <button
                        onClick={() => activePage && activePage < pages.length && activeChapter && loadPage(activeChapter, activePage + 1)}
                        disabled={!activePage || activePage >= pages.length}
                        className="text-[#555] hover:text-[#888] disabled:opacity-20 transition-colors"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    {activePage && activeChapter && (
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => togglePageApproval(activeChapter, activePage)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                            pages.find(p => p.page_number === activePage)?.status === "approved"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-[#1a1a1f] text-[#555] hover:text-[#888]"
                          }`}
                        >
                          <Check size={10} />
                          {pages.find(p => p.page_number === activePage)?.status === "approved" ? "Approved" : "Approve"}
                        </button>
                        <button
                          onClick={() => splitPageAtCursor(activeChapter, activePage)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#1a1a1f] text-[#555] hover:text-[#888] transition-colors"
                          title="Split at cursor"
                        >
                          <Scissors size={10} /> Split
                        </button>
                        {activePage < pages.length && (
                          <button
                            onClick={() => mergePageWithNext(activeChapter, activePage)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#1a1a1f] text-[#555] hover:text-[#888] transition-colors"
                            title="Merge with next page"
                          >
                            <Merge size={10} /> Merge
                          </button>
                        )}
                      </div>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      {pages.length > 0 && pages.every(p => p.status === "approved") && (
                        <button
                          onClick={() => activeChapter && compilePages(activeChapter)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
                        >
                          <Check size={10} /> Compile
                        </button>
                      )}
                      <button
                        onClick={() => activeChapter && dissolvePages(activeChapter)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-red-400/50 hover:text-red-400 transition-colors"
                        title="Dissolve all pages"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditorMode("outline")}
                      className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                        editorMode === "outline"
                          ? "border-amber-400 text-amber-400"
                          : "border-transparent text-[#555] hover:text-[#888]"
                      }`}
                    >
                      <List size={12} /> Outline
                    </button>
                    <button
                      onClick={() => setEditorMode("write")}
                      className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                        editorMode === "write"
                          ? "border-amber-400 text-amber-400"
                          : "border-transparent text-[#555] hover:text-[#888]"
                      }`}
                    >
                      <PenLine size={12} /> Write
                    </button>
                    {/* Split into Pages button */}
                    {editorMode === "write" && content.trim() && !activeCh?.has_pages && (
                      <button
                        onClick={() => activeChapter && splitIntoPages(activeChapter)}
                        disabled={pageSplitting}
                        className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-cyan-400/60 hover:text-cyan-400 border-b-2 border-transparent transition-colors disabled:opacity-30"
                      >
                        {pageSplitting ? <Loader2 size={12} className="animate-spin" /> : <Scissors size={12} />}
                        Split into Pages
                      </button>
                    )}
                    {activeCh && (
                      <button
                        onClick={() => {
                          if (!book || !activeCh) return;
                          const idx = STATUS_OPTS.indexOf(activeCh.status);
                          const next = STATUS_OPTS[(idx + 1) % STATUS_OPTS.length];
                          const updated = { ...book };
                          const ch = updated.chapters.find((c) => c.chapter_number === activeChapter);
                          if (ch) ch.status = next;
                          setBook(updated);
                          fetch(`${API}/hq/athernyx/spirit-tales/books/${bookId}/chapters/${activeChapter}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: next }),
                          });
                        }}
                        className="ml-auto flex items-center gap-1.5 text-[10px] font-medium tracking-wide uppercase transition-colors hover:opacity-80"
                        style={{ color: STATUS_COLORS[activeCh.status] || "#555" }}
                        title="Click to cycle status"
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[activeCh.status] || "#555" }}
                        />
                        {activeCh.status}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* ART callout summary bar */}
              {editorMode === "write" && !zenMode && (() => {
                const artData = parseArtCallouts(content);
                if (artData.count === 0) return null;
                return (
                  <div className="flex items-center gap-3 px-5 py-2 border-b border-amber-500/15 bg-amber-500/5 shrink-0">
                    <Image size={12} className="text-amber-400/60 shrink-0" />
                    <span className="text-[10px] text-amber-400/60 font-mono shrink-0">
                      {artData.count} illustration{artData.count !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-2 overflow-x-auto flex-1 scrollbar-none">
                      {artData.callouts.map((c, i) => (
                        <span key={i} className="text-[10px] text-[#777] bg-[#1a1a1f] rounded px-2 py-0.5 whitespace-nowrap shrink-0">
                          {c.length > 40 ? c.slice(0, 40) + "..." : c}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className={`text-[10px] font-medium shrink-0 transition-colors ${showPreview ? "text-amber-400" : "text-[#555] hover:text-[#888]"}`}
                    >
                      {showPreview ? "Hide preview" : "Preview"}
                    </button>
                  </div>
                );
              })()}

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

              {/* Luna Review Results */}
              {showReview && (reviewIssues.length > 0 || reviewing) && (
                <div className="border-b border-[#1a1a1f] shrink-0 max-h-[200px] overflow-y-auto">
                  <div className="flex items-center gap-2 px-5 py-1.5">
                    <span className="text-[10px] font-semibold tracking-wider text-cyan-400/60">
                      LUNA CANON REVIEW
                    </span>
                    {reviewing && <Loader2 size={10} className="animate-spin text-cyan-400/40" />}
                    {!reviewing && reviewIssues.length === 0 && (
                      <span className="text-[10px] text-green-400/60">All clear</span>
                    )}
                    <div className="flex-1" />
                    <button
                      onClick={() => setShowReview(false)}
                      className="text-[#555] hover:text-[#888] transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  {reviewIssues.length > 0 && (
                    <div className="px-5 pb-3 space-y-2">
                      {reviewIssues.map((issue, i) => (
                        <div key={i} className="rounded-lg bg-[#111] border border-[#1a1a1f] p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                              issue.type === "canon" ? "bg-red-500/15 text-red-400" :
                              issue.type === "world" ? "bg-orange-500/15 text-orange-400" :
                              issue.type === "voice" ? "bg-amber-500/15 text-amber-400" :
                              "bg-purple-500/15 text-purple-400"
                            }`}>
                              {issue.type}
                            </span>
                            <span className="text-[10px] text-[#555]">Page {issue.page}</span>
                          </div>
                          {issue.quote && (
                            <p className="text-[11px] text-[#666] italic mb-1">&ldquo;{issue.quote}&rdquo;</p>
                          )}
                          <p className="text-[11px] text-[#999]">{issue.issue}</p>
                          {issue.suggestion && (
                            <p className="text-[10px] text-cyan-400/50 mt-1">{issue.suggestion}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Text area(s) */}
              {pageMode && activePage ? (
                /* Page mode editor */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <textarea
                      ref={textareaRef}
                      value={pageContent}
                      onChange={(e) => handlePageContentChange(e.target.value)}
                      className={`flex-1 w-full bg-transparent text-[14px] leading-[1.8] text-[#ccc] outline-none resize-none ${zenMode ? "px-[15%] py-12" : "p-5"}`}
                      style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                      placeholder="Page content..."
                      spellCheck
                    />
                    {/* Illustration note */}
                    {!zenMode && (
                      <div className="border-t border-[#1a1a1f] px-5 py-3 shrink-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Image size={11} className="text-amber-400/50" />
                          <span className="text-[10px] text-[#444] font-semibold tracking-wider">ILLUSTRATION NOTE</span>
                          <span className="text-[10px] text-[#333] font-mono">
                            {pageContent.split(/\s+/).filter(Boolean).length} words
                          </span>
                        </div>
                        <input
                          value={pageIllustration}
                          onChange={(e) => handlePageIllustrationChange(e.target.value)}
                          className="w-full bg-[#111] border border-[#1a1a1f] rounded px-3 py-2 text-[12px] text-[#999] outline-none focus:border-amber-500/30 placeholder-[#333]"
                          placeholder="Describe the illustration for this spread..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : editorMode === "outline" ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <textarea
                    value={outline}
                    onChange={(e) => handleOutlineChange(e.target.value)}
                    className="flex-1 w-full bg-transparent text-[13px] leading-relaxed text-[#ccc] outline-none resize-none p-5"
                    placeholder={"What happens in this chapter? Jot down the beats...\n\n- Bonn discovers the cabin\n- She finds the portal inside\n- Steps through, portal closes behind her\n- First glimpse of the Ather\n\nWhen ready, hit \"Draft from Outline\" to generate prose."}
                    spellCheck
                  />
                </div>
              ) : (
                <div className={`flex-1 flex ${showGhost || (showPreview && !showGhost) ? "divide-x divide-[#1a1a1f]" : ""} overflow-hidden`}>
                  {/* Your draft */}
                  <div className={`flex-1 flex flex-col overflow-hidden ${showGhost || (showPreview && !showGhost) ? "w-1/2" : ""}`}>
                    {showGhost && (
                      <div className="px-5 py-1.5 border-b border-[#1a1a1f] text-[10px] text-[#444] font-semibold tracking-wider shrink-0">
                        YOUR DRAFT
                      </div>
                    )}
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className={`flex-1 w-full bg-transparent text-[14px] leading-[1.8] text-[#ccc] outline-none resize-none ${zenMode ? "px-[15%] py-12" : "p-5"}`}
                      style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                      placeholder={
                        activeChapter === 1
                          ? "Start your story here... Set the scene, introduce Bonn, draw the reader in.\n\nUse [ART: description] where you want illustrations."
                          : `Continue the story...\n\nPick up where Chapter ${activeChapter - 1} left off. Use [ART: description] for illustrations.`
                      }
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
                        <div className="text-[14px] leading-[1.8] text-[#aaa] whitespace-pre-wrap"
                             style={{ fontFamily: "var(--font-lora), Georgia, serif" }}>
                          {ghostContent}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ART preview panel */}
                  {showPreview && !showGhost && (
                    <div className="flex-1 flex flex-col overflow-hidden w-1/2">
                      <div className="px-5 py-1.5 border-b border-[#1a1a1f] text-[10px] text-amber-400/60 font-semibold tracking-wider shrink-0">
                        PREVIEW
                      </div>
                      <div className="flex-1 overflow-y-auto p-5">
                        {renderPreviewContent(content, "#f59e0b")}
                      </div>
                    </div>
                  )}
                </div>
              )}
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

        {/* Character reference panel */}
        {charPanelOpen && !zenMode && (
          <div className="w-64 border-l border-[#1a1a1f] flex flex-col shrink-0 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1a1a1f]">
              <span className="text-[10px] text-[#444] font-semibold tracking-wider">CHARACTERS</span>
              <button onClick={() => setCharPanelOpen(false)} className="text-[#555] hover:text-[#888] transition-colors">
                <X size={12} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {SPIRIT_TALES_CHARACTERS.map((char) => (
                <div key={char.name} className="rounded-lg border border-[#1a1a1f] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: char.color }} />
                    <span className="text-[12px] font-semibold" style={{ color: char.color }}>{char.name}</span>
                    <span className="text-[10px] text-[#444]">{char.role}</span>
                  </div>
                  <ul className="space-y-1 mb-2">
                    {char.traits.map((t, i) => (
                      <li key={i} className="text-[10px] text-[#777] leading-relaxed flex gap-1.5">
                        <span className="text-[#333] shrink-0">&bull;</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-[#555] italic leading-relaxed">{char.voice}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
