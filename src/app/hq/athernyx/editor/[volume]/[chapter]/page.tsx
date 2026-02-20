"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = "https://api.guardiacontent.com";

interface PageMeta {
  page_number: number;
  status: "draft" | "approved";
  word_count: number;
  edited_at: string | null;
  approved_at: string | null;
}

// Calculate character offsets where every Nth word boundary falls
function getWordBoundaryOffsets(text: string, interval: number): number[] {
  const offsets: number[] = [];
  let wordCount = 0;
  let i = 0;
  const len = text.length;
  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(text[i])) i++;
    if (i >= len) break;
    // Start of a word
    wordCount++;
    if (wordCount > 0 && wordCount % interval === 0) {
      offsets.push(i);
    }
    // Skip word
    while (i < len && !/\s/.test(text[i])) i++;
  }
  return offsets;
}

export default function ChapterEditorPage() {
  const params = useParams() ?? {};
  const volume = (params.volume as string) || "";
  const chapter = (params.chapter as string) || "";

  const [title, setTitle] = useState("");
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "">("");
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [markerPositions, setMarkerPositions] = useState<number[]>([]);
  const [splitting, setSplitting] = useState(false);
  const [merging, setMerging] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  contentRef.current = content;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const dirty = content !== originalContent;

  // Fetch page list
  const fetchPages = useCallback(() => {
    fetch(`${API_BASE}/hq/athernyx/editor/${volume}/${chapter}/pages`)
      .then(r => r.json())
      .then(d => {
        setTitle(d.title || "");
        setPages(d.pages || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [volume, chapter]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  // Load a page's content
  const loadPage = useCallback(async (pageNum: number) => {
    setPageLoading(true);
    try {
      const res = await fetch(`${API_BASE}/hq/athernyx/editor/${volume}/${chapter}/pages/${pageNum}`);
      const d = await res.json();
      setContent(d.content || "");
      setOriginalContent(d.content || "");
      setActivePage(pageNum);
      setSaveStatus("");
    } catch {}
    setPageLoading(false);
  }, [volume, chapter]);

  // Load first page on init
  useEffect(() => {
    if (pages.length > 0 && !pageLoading && loading === false) {
      loadPage(activePage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length, loading]);

  // Calculate 300-word marker positions using mirror div
  useEffect(() => {
    const mirror = mirrorRef.current;
    const textarea = textareaRef.current;
    if (!mirror || !textarea) return;

    const offsets = getWordBoundaryOffsets(content, 300);
    if (offsets.length === 0) {
      setMarkerPositions([]);
      return;
    }

    // Copy textarea styles to mirror
    const cs = getComputedStyle(textarea);
    mirror.style.width = cs.width;
    mirror.style.font = cs.font;
    mirror.style.letterSpacing = cs.letterSpacing;
    mirror.style.wordSpacing = cs.wordSpacing;
    mirror.style.padding = cs.padding;
    mirror.style.lineHeight = cs.lineHeight;
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.wordWrap = "break-word";
    mirror.style.overflowWrap = "break-word";

    const positions: number[] = [];
    for (const offset of offsets) {
      // Render content up to offset, measure height
      mirror.textContent = content.slice(0, offset);
      positions.push(mirror.scrollHeight);
    }
    setMarkerPositions(positions);
  }, [content, showPreview]); // recalc when content or layout changes

  // Sync gutter scroll with textarea
  const handleTextareaScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Save content
  const saveContent = useCallback(async () => {
    if (contentRef.current === originalContent) return;
    setSaving(true);
    setSaveStatus("saving");
    try {
      const res = await fetch(`${API_BASE}/hq/athernyx/editor/${volume}/${chapter}/pages/${activePage}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentRef.current }),
      });
      if (res.ok) {
        const d = await res.json();
        setOriginalContent(contentRef.current);
        setSaveStatus("saved");
        setPages(prev => prev.map(p =>
          p.page_number === activePage
            ? { ...p, word_count: d.word_count, status: d.status, edited_at: d.edited_at, approved_at: null }
            : p
        ));
      }
    } catch {}
    setSaving(false);
  }, [volume, chapter, activePage, originalContent]);

  // Debounced auto-save
  useEffect(() => {
    if (!dirty) return;
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { saveContent(); }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [content, dirty, saveContent]);

  // Switch page (save first if dirty)
  const switchPage = async (pageNum: number) => {
    if (pageNum === activePage) return;
    if (dirty) await saveContent();
    loadPage(pageNum);
  };

  // Toggle approve
  const toggleApprove = async () => {
    if (dirty) await saveContent();
    try {
      const res = await fetch(`${API_BASE}/hq/athernyx/editor/${volume}/${chapter}/pages/${activePage}/approve`, {
        method: "PATCH",
      });
      if (res.ok) {
        const d = await res.json();
        setPages(prev => prev.map(p =>
          p.page_number === activePage
            ? { ...p, status: d.status, approved_at: d.approved_at }
            : p
        ));
      }
    } catch {}
  };

  // Split at cursor
  const handleSplit = async () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const offset = textarea.selectionStart;
    if (offset <= 0 || offset >= content.length) return;

    if (dirty) await saveContent();
    setSplitting(true);
    try {
      const res = await fetch(`${API_BASE}/hq/athernyx/editor/${volume}/${chapter}/pages/${activePage}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offset }),
      });
      if (res.ok) {
        fetchPages();
        // Reload current page (first half)
        setTimeout(() => loadPage(activePage), 300);
      }
    } catch {}
    setSplitting(false);
  };

  // Merge with next page
  const handleMerge = async () => {
    if (dirty) await saveContent();
    setMerging(true);
    try {
      const res = await fetch(`${API_BASE}/hq/athernyx/editor/${volume}/${chapter}/pages/${activePage}/merge`, {
        method: "POST",
      });
      if (res.ok) {
        fetchPages();
        setTimeout(() => loadPage(activePage), 300);
      }
    } catch {}
    setMerging(false);
  };

  // Export .docx
  const handleExport = () => {
    window.open(`${API_BASE}/hq/athernyx/editor/${volume}/${chapter}/export`, "_blank");
  };

  // Publish
  const handlePublish = async () => {
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch(`${API_BASE}/hq/athernyx/editor/${volume}/${chapter}/publish`, { method: "POST" });
      const d = await res.json();
      if (d.success) {
        setPublishResult(`Published! ${d.total_pages} pages, ${d.word_count.toLocaleString()} words`);
      } else {
        setPublishResult(`${d.error}. Draft pages: ${d.draft_pages?.join(", ")}`);
      }
    } catch {
      setPublishResult("Publish failed");
    }
    setPublishing(false);
  };

  const currentPage = pages.find(p => p.page_number === activePage);
  const isLastPage = activePage === pages.length;
  const approvedCount = pages.filter(p => p.status === "approved").length;
  const allApproved = approvedCount === pages.length && pages.length > 0;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  if (loading) {
    return <div className="min-h-screen bg-[#171513] text-[#555] flex items-center justify-center">Loading editor...</div>;
  }

  return (
    <div className="h-screen bg-[#171513] text-[#e8e8e8] flex flex-col overflow-hidden">
      {/* Hidden mirror for measuring word positions */}
      <div
        ref={mirrorRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -9999,
          left: -9999,
          visibility: "hidden",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
      />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1f] bg-[#0a0a0b] flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/hq/athernyx/editor" className="text-[#555] text-xs hover:text-[#888] transition-colors">
            &larr; Chapters
          </Link>
          <span className="text-sm font-medium" style={{ color: "#a855f7" }}>{title}</span>
          <span className="text-[#333] text-xs">Page {activePage}</span>
          <span className="text-[#444] text-xs">{wordCount} words</span>
          {saveStatus && (
            <span className={`text-xs ${
              saveStatus === "saved" ? "text-[#10b981]" :
              saveStatus === "saving" ? "text-[#f59e0b]" :
              "text-[#555]"
            }`}>
              {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSplit}
            disabled={splitting || saving}
            className="px-2.5 py-1.5 rounded-lg text-xs text-[#555] hover:text-[#888] hover:bg-[#1a1a1f] transition-colors disabled:opacity-30"
            title="Split page at cursor position"
          >
            {splitting ? "Splitting..." : "Split"}
          </button>
          <button
            onClick={handleMerge}
            disabled={merging || saving || isLastPage}
            className="px-2.5 py-1.5 rounded-lg text-xs text-[#555] hover:text-[#888] hover:bg-[#1a1a1f] transition-colors disabled:opacity-30"
            title="Merge with next page"
          >
            {merging ? "Merging..." : "Merge"}
          </button>
          <div className="w-px h-4 bg-[#1a1a1f]" />
          <button
            onClick={handleExport}
            className="px-2.5 py-1.5 rounded-lg text-xs text-[#555] hover:text-[#888] hover:bg-[#1a1a1f] transition-colors"
            title="Download as .docx manuscript"
          >
            Export
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-2.5 py-1.5 rounded-lg text-xs text-[#555] hover:text-[#888] hover:bg-[#1a1a1f] transition-colors"
          >
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
          <div className="w-px h-4 bg-[#1a1a1f]" />
          <button
            onClick={toggleApprove}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: currentPage?.status === "approved" ? "#10b98120" : "#1a1a1f",
              color: currentPage?.status === "approved" ? "#10b981" : "#888",
            }}
          >
            {currentPage?.status === "approved" ? "Approved" : "Approve"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-[#1a1a1f] bg-[#0a0a0b] overflow-y-auto flex-shrink-0 flex flex-col">
          <div className="p-3 flex-1">
            <div className="text-[10px] font-semibold tracking-wider text-[#555] mb-3">PAGES</div>
            <div className="space-y-0.5">
              {pages.map(p => (
                <button
                  key={p.page_number}
                  onClick={() => switchPage(p.page_number)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    p.page_number === activePage ? "bg-[#1a1a1f]" : "hover:bg-[#151518]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.status === "approved" ? "#a855f7" : "#333" }}
                    />
                    <span style={{ color: p.page_number === activePage ? "#e8e8e8" : "#888" }}>
                      Page {p.page_number}
                    </span>
                  </span>
                  <span className="text-[10px] text-[#444]">{p.word_count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Publish section */}
          <div className="p-3 border-t border-[#1a1a1f]">
            <div className="text-[10px] text-[#555] mb-2">
              {approvedCount}/{pages.length} approved
            </div>
            <div className="w-full bg-[#1a1a1f] rounded-full h-1 mb-3">
              <div
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: `${pages.length > 0 ? (approvedCount / pages.length) * 100 : 0}%`,
                  backgroundColor: allApproved ? "#10b981" : "#a855f7",
                }}
              />
            </div>
            <button
              onClick={handlePublish}
              disabled={!allApproved || publishing}
              className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
              style={{
                backgroundColor: allApproved ? "#10b98120" : "#1a1a1f",
                color: allApproved ? "#10b981" : "#555",
              }}
            >
              {publishing ? "Publishing..." : "Publish Chapter"}
            </button>
            {publishResult && (
              <div className={`text-[10px] mt-2 ${publishResult.startsWith("Published") ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                {publishResult}
              </div>
            )}
          </div>
        </div>

        {/* Editor with gutter */}
        <div className={`flex-1 flex overflow-hidden`}>
          <div className={`${showPreview ? "w-1/2" : "w-full"} flex border-r border-[#1a1a1f] relative`}>
            {pageLoading ? (
              <div className="flex-1 flex items-center justify-center text-[#555] text-sm">Loading page...</div>
            ) : (
              <>
                {/* Word marker gutter */}
                <div
                  ref={gutterRef}
                  className="w-3 flex-shrink-0 overflow-hidden relative bg-[#050506]"
                  style={{ pointerEvents: "none" }}
                >
                  {markerPositions.map((top, i) => (
                    <div
                      key={i}
                      className="absolute right-0.5"
                      style={{ top: top - 3 }}
                      title={`~${(i + 1) * 300} words`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#ef444480" }} />
                    </div>
                  ))}
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  onScroll={handleTextareaScroll}
                  className="flex-1 w-full bg-[#050506] text-[#e8e8e8] py-6 pr-6 pl-3 resize-none outline-none text-sm leading-relaxed"
                  style={{ fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace" }}
                  spellCheck={true}
                />
              </>
            )}
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="w-1/2 overflow-y-auto p-6 bg-[#080809]">
              <div className="prose prose-invert prose-sm max-w-none
                prose-p:text-[#ccc] prose-p:leading-relaxed
                prose-strong:text-[#e8e8e8]
                prose-em:text-[#bbb]
                prose-headings:text-[#e8e8e8]
                prose-blockquote:border-[#a855f7] prose-blockquote:text-[#999]
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
