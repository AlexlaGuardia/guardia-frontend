"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSeriesById, getIssuesForSeries } from "../lib/series-data";
import { statusColor } from "../lib/helpers";
import type {
  IssueScript,
  ComicPage,
  ComicPanel,
  PanelLayout,
  DialogueStyle,
} from "../lib/types";

const API = "https://api.guardiacontent.com";

// ─── Workspace ───────────────────────────────────────────────────────────────

export default function ComicWorkspacePage() {
  const params = useParams() ?? {};
  const searchParams = useSearchParams();
  const seriesId = (params.series as string) || "";
  const series = getSeriesById(seriesId);
  const issues = getIssuesForSeries(seriesId);

  const [script, setScript] = useState<IssueScript | null>(null);
  const [activeIssue, setActiveIssue] = useState(
    Number(searchParams?.get("issue")) || 1
  );
  const [activePage, setActivePage] = useState(1);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "unsaved" | ""
  >("");
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [illustrating, setIllustrating] = useState(false);
  const [publishStep, setPublishStep] = useState(0);
  const [expandedPanel, setExpandedPanel] = useState<number | null>(null);

  const originalRef = useRef("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scriptRef = useRef(script);
  scriptRef.current = script;

  // ── Load issue ──

  const loadIssue = useCallback(
    async (issueNum: number) => {
      setLoading(true);
      try {
        const issueInfo = issues.find((i) => i.number === issueNum);
        const pageCount = issueInfo?.pageCount || 24;
        const res = await fetch(
          `${API}/hq/athernyx/comics/${seriesId}/${issueNum}?pages=${pageCount}`
        );
        const data: IssueScript = await res.json();
        setScript(data);
        setActivePage(1);
        originalRef.current = JSON.stringify(data);
        setSaveStatus("");
      } catch {
        setScript(null);
      }
      setLoading(false);
    },
    [seriesId, issues]
  );

  useEffect(() => {
    loadIssue(activeIssue);
  }, [activeIssue, loadIssue]);

  // ── Dirty check + auto-save ──

  const isDirty = script
    ? JSON.stringify(script) !== originalRef.current
    : false;

  const savePage = useCallback(async () => {
    const s = scriptRef.current;
    if (!s) return;
    const page = s.pages[activePage - 1];
    if (!page) return;
    setSaveStatus("saving");
    try {
      await fetch(
        `${API}/hq/athernyx/comics/${seriesId}/${activeIssue}/pages/${activePage}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: page.summary,
            panels: page.panels,
          }),
        }
      );
      originalRef.current = JSON.stringify(s);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unsaved");
    }
  }, [seriesId, activeIssue, activePage]);

  useEffect(() => {
    if (!isDirty) return;
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => savePage(), 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [script, isDirty, savePage]);

  // ── Page mutations ──

  const updatePage = (pageNum: number, update: Partial<ComicPage>) => {
    setScript((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((p) =>
          p.pageNumber === pageNum ? { ...p, ...update } : p
        ),
      };
    });
  };

  const updatePanel = (
    pageNum: number,
    panelIdx: number,
    update: Partial<ComicPanel>
  ) => {
    setScript((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((p) =>
          p.pageNumber === pageNum
            ? {
                ...p,
                panels: p.panels.map((pnl, i) =>
                  i === panelIdx ? { ...pnl, ...update } : pnl
                ),
              }
            : p
        ),
      };
    });
  };

  // ── AI actions ──

  const handleDraft = async () => {
    if (!script || drafting) return;
    if (isDirty) await savePage();
    setDrafting(true);
    try {
      const res = await fetch(
        `${API}/hq/athernyx/comics/${seriesId}/${activeIssue}/pages/${activePage}/draft`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.ok && data.panels) {
        updatePage(activePage, { panels: data.panels, status: "drafted" });
        originalRef.current = "";  // force dirty so auto-save picks it up
      }
    } catch {}
    setDrafting(false);
  };

  const handleApprove = async () => {
    if (!script) return;
    if (isDirty) await savePage();
    const page = script.pages[activePage - 1];
    if (!page || page.panels.length === 0) return;
    updatePage(activePage, { status: "approved" });
    setTimeout(() => savePage(), 100);
  };

  const handleIllustrate = async () => {
    if (!script || illustrating) return;
    setIllustrating(true);
    try {
      const res = await fetch(
        `${API}/hq/athernyx/comics/${seriesId}/${activeIssue}/pages/${activePage}/illustrate`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.ok && data.illustrationUrl) {
        updatePage(activePage, {
          illustrationUrl: data.illustrationUrl,
          status: "illustrated",
        });
      }
    } catch {}
    setIllustrating(false);
  };

  const handlePublish = async () => {
    if (publishStep === 0) {
      setPublishStep(1);
      return;
    }
    setPublishStep(2);
    try {
      const res = await fetch(
        `${API}/hq/athernyx/comics/${seriesId}/${activeIssue}/publish`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.ok) {
        setScript((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((p) => ({
              ...p,
              status: "published" as const,
            })),
          };
        });
      }
    } catch {}
    setPublishStep(0);
  };

  // ── Switch ──

  const switchIssue = async (num: number) => {
    if (num === activeIssue) return;
    if (isDirty) await savePage();
    setActiveIssue(num);
  };

  const switchPage = (num: number) => {
    if (num === activePage) return;
    if (isDirty) savePage();
    setActivePage(num);
  };

  // ── Derived ──

  const currentPage = script?.pages[activePage - 1] || null;
  const illustratedCount =
    script?.pages.filter(
      (p) => p.status === "illustrated" || p.status === "published"
    ).length || 0;
  const allIllustrated =
    script &&
    script.pages.length > 0 &&
    script.pages.every(
      (p) => p.status === "illustrated" || p.status === "published"
    );
  const accent = series?.accent || "#06b6d4";

  if (!series) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-[#555] flex items-center justify-center">
        Series not found.
      </div>
    );
  }

  if (loading || !script) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-[#555] flex items-center justify-center">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0b] text-[#e8e8e8] flex flex-col overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#1a1a1f] bg-[#0d0d0e] flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/hq/athernyx/comics"
            className="text-[#555] text-xs hover:text-[#888] transition-colors"
          >
            &larr; Comics
          </Link>
          <span
            className="text-sm font-semibold"
            style={{ color: accent }}
          >
            {series.title.toUpperCase()} #{activeIssue}
          </span>
          <span className="text-[#555] text-xs">{script.title}</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Page nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => activePage > 1 && switchPage(activePage - 1)}
              disabled={activePage <= 1}
              className="text-[#555] hover:text-[#888] disabled:opacity-30 transition-colors text-xs"
            >
              &larr;
            </button>
            <span className="text-xs text-[#888]">
              Page {activePage}/{script.pages.length}
            </span>
            <button
              onClick={() =>
                activePage < script.pages.length &&
                switchPage(activePage + 1)
              }
              disabled={activePage >= script.pages.length}
              className="text-[#555] hover:text-[#888] disabled:opacity-30 transition-colors text-xs"
            >
              &rarr;
            </button>
          </div>
          <div className="w-px h-4 bg-[#1a1a1f]" />
          {saveStatus && (
            <span
              className={`text-xs ${
                saveStatus === "saved"
                  ? "text-[#10b981]"
                  : saveStatus === "saving"
                    ? "text-[#f59e0b]"
                    : "text-[#555]"
              }`}
            >
              {saveStatus === "saved"
                ? "Saved"
                : saveStatus === "saving"
                  ? "Saving..."
                  : "Unsaved"}
            </span>
          )}
          {currentPage && (
            <span
              className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded"
              style={{
                color: statusColor(currentPage.status),
                backgroundColor: `${statusColor(currentPage.status)}15`,
              }}
            >
              {currentPage.status}
            </span>
          )}
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <div className="w-48 border-r border-[#1a1a1f] bg-[#0d0d0e] overflow-y-auto flex-shrink-0">
          <div className="p-3">
            <div className="text-[9px] font-semibold tracking-wider text-[#444] mb-2">
              ISSUES
            </div>
            <div className="space-y-0.5 mb-5">
              {issues.map((iss) => (
                <button
                  key={iss.number}
                  onClick={() => switchIssue(iss.number)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    iss.number === activeIssue
                      ? "bg-[#1a1a1f]"
                      : "hover:bg-[#151518]"
                  }`}
                  style={{
                    color: iss.number === activeIssue ? accent : "#888",
                  }}
                >
                  #{iss.number} {iss.title}
                </button>
              ))}
            </div>

            <div className="text-[9px] font-semibold tracking-wider text-[#444] mb-2">
              PAGES
            </div>
            <div className="grid grid-cols-4 gap-1">
              {script.pages.map((p) => (
                <button
                  key={p.pageNumber}
                  onClick={() => switchPage(p.pageNumber)}
                  className={`text-[10px] py-1.5 rounded transition-colors text-center ${
                    p.pageNumber === activePage
                      ? "bg-[#1a1a1f] font-semibold"
                      : "hover:bg-[#151518]"
                  }`}
                  style={{
                    color:
                      p.pageNumber === activePage
                        ? "#e8e8e8"
                        : statusColor(p.status),
                    borderBottom: `2px solid ${statusColor(p.status)}`,
                  }}
                >
                  {p.pageNumber}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content: Vertical Scroll ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
            {/* ── 1. Story Summary ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-semibold tracking-wider text-[#555]">
                  STORY SUMMARY
                </h2>
                <span className="text-[10px] text-[#333]">
                  Page {activePage}
                </span>
              </div>
              <textarea
                value={currentPage?.summary || ""}
                onChange={(e) =>
                  updatePage(activePage, { summary: e.target.value })
                }
                placeholder="Describe what happens on this page. Who's there, what they say, the mood, the action. Eyuun will format it into comic panels when you click Draft..."
                className="w-full bg-[#0d0d0e] text-[#ccc] text-sm p-5 rounded-xl border border-[#1a1a1f] resize-none outline-none leading-relaxed focus:border-[#2a2a2f] transition-colors"
                rows={6}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleDraft}
                  disabled={drafting || !currentPage?.summary}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
                  style={{ backgroundColor: `${accent}20`, color: accent }}
                >
                  {drafting
                    ? "Eyuun is drafting..."
                    : currentPage?.panels && currentPage.panels.length > 0
                      ? "Draft Next Panel"
                      : "Draft First Panel"}
                </button>
              </div>
            </section>

            {/* ── 2. Panels ── */}
            {currentPage?.panels && currentPage.panels.length > 0 && (
              <section>
                <h2 className="text-[11px] font-semibold tracking-wider text-[#555] mb-4">
                  PANELS ({currentPage.panels.length})
                </h2>
                <div className="space-y-2">
                  {currentPage.panels.map((panel, idx) => {
                    const isOpen = expandedPanel === idx;
                    const previewText =
                      panel.dialogue[0]?.text
                        ? `${panel.dialogue[0].speaker}: "${panel.dialogue[0].text.slice(0, 50)}${panel.dialogue[0].text.length > 50 ? "..." : ""}"`
                        : panel.artDirection.slice(0, 60) + (panel.artDirection.length > 60 ? "..." : "");
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#1a1a1f] bg-[#0d0d0e] overflow-hidden"
                      >
                        {/* Panel header — always visible, click to toggle */}
                        <button
                          onClick={() =>
                            setExpandedPanel(isOpen ? null : idx)
                          }
                          className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#111114] transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="text-xs font-semibold flex-shrink-0"
                              style={{ color: accent }}
                            >
                              Panel {panel.panelNumber}
                            </span>
                            <span className="text-[10px] text-[#555] flex-shrink-0 bg-[#1a1a1f] px-2 py-0.5 rounded">
                              {panel.layout}
                            </span>
                            {!isOpen && (
                              <span className="text-xs text-[#444] truncate">
                                {previewText}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!isOpen && (
                              <span className="text-[10px] text-[#333]">
                                {panel.dialogue.length > 0 && `${panel.dialogue.length} line${panel.dialogue.length > 1 ? "s" : ""}`}
                              </span>
                            )}
                            <span className="text-[#444] text-xs">
                              {isOpen ? "▼" : "▶"}
                            </span>
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isOpen && (
                          <>
                            <div className="border-t border-[#1a1a1f] px-5 py-2 flex items-center justify-between">
                              <select
                                value={panel.layout}
                                onChange={(e) =>
                                  updatePanel(activePage, idx, {
                                    layout: e.target.value as PanelLayout,
                                  })
                                }
                                className="bg-[#1a1a1f] text-xs text-[#888] rounded-lg px-2.5 py-1 border-none outline-none cursor-pointer"
                              >
                                <option value="full">Full Page</option>
                                <option value="half">Half</option>
                                <option value="third">Third</option>
                                <option value="quarter">Quarter</option>
                                <option value="hero-strip">Hero Strip</option>
                              </select>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newPanels = currentPage.panels.filter(
                                    (_, i) => i !== idx
                                  );
                                  updatePage(activePage, { panels: newPanels });
                                  setExpandedPanel(null);
                                }}
                                className="text-[#333] hover:text-[#ef4444] text-xs transition-colors px-2 py-1"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="p-5 space-y-4">
                              {/* Art direction */}
                              <div>
                                <label className="text-[10px] font-semibold tracking-wider text-[#444] mb-1.5 block">
                                  ART DIRECTION
                                </label>
                                <textarea
                                  value={panel.artDirection}
                                  onChange={(e) =>
                                    updatePanel(activePage, idx, {
                                      artDirection: e.target.value,
                                    })
                                  }
                                  placeholder="Describe the visual: composition, characters, lighting, mood, colors, camera angle..."
                                  className="w-full bg-[#0a0a0b] text-sm text-[#bbb] p-4 rounded-lg border border-[#1a1a1f] resize-none outline-none leading-relaxed focus:border-[#2a2a2f] transition-colors"
                                  style={{
                                    fontFamily:
                                      "ui-monospace, 'Cascadia Code', monospace",
                                  }}
                                  rows={5}
                                />
                              </div>

                              {/* Dialogue */}
                              <div>
                                <label className="text-[10px] font-semibold tracking-wider text-[#444] mb-2 block">
                                  DIALOGUE
                                </label>
                                <div className="space-y-2">
                                  {panel.dialogue.map((dl, di) => (
                                    <div
                                      key={di}
                                      className="flex items-center gap-2"
                                    >
                                      <input
                                        value={dl.speaker}
                                        onChange={(e) => {
                                          const nd = [...panel.dialogue];
                                          nd[di] = {
                                            ...dl,
                                            speaker: e.target.value,
                                          };
                                          updatePanel(activePage, idx, {
                                            dialogue: nd,
                                          });
                                        }}
                                        placeholder="WHO"
                                        className="w-24 bg-[#1a1a1f] text-xs text-[#aaa] px-3 py-2 rounded-lg border-none outline-none uppercase font-semibold tracking-wide"
                                      />
                                      <input
                                        value={dl.text}
                                        onChange={(e) => {
                                          const nd = [...panel.dialogue];
                                          nd[di] = {
                                            ...dl,
                                            text: e.target.value,
                                          };
                                          updatePanel(activePage, idx, {
                                            dialogue: nd,
                                          });
                                        }}
                                        placeholder="What they say..."
                                        className="flex-1 bg-[#0a0a0b] text-sm text-[#ccc] px-3 py-2 rounded-lg border border-[#1a1a1f] outline-none focus:border-[#2a2a2f] transition-colors"
                                      />
                                      <select
                                        value={dl.style}
                                        onChange={(e) => {
                                          const nd = [...panel.dialogue];
                                          nd[di] = {
                                            ...dl,
                                            style:
                                              e.target.value as DialogueStyle,
                                          };
                                          updatePanel(activePage, idx, {
                                            dialogue: nd,
                                          });
                                        }}
                                        className="bg-[#1a1a1f] text-xs text-[#888] rounded-lg px-2.5 py-2 border-none outline-none cursor-pointer"
                                      >
                                        <option value="normal">Normal</option>
                                        <option value="whisper">Whisper</option>
                                        <option value="shout">Shout</option>
                                        <option value="thought">Thought</option>
                                        <option value="caption">Caption</option>
                                      </select>
                                      <button
                                        onClick={() => {
                                          updatePanel(activePage, idx, {
                                            dialogue: panel.dialogue.filter(
                                              (_, j) => j !== di
                                            ),
                                          });
                                        }}
                                        className="text-[#333] hover:text-[#ef4444] text-sm transition-colors px-2"
                                      >
                                        &times;
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => {
                                      updatePanel(activePage, idx, {
                                        dialogue: [
                                          ...panel.dialogue,
                                          {
                                            speaker: "",
                                            text: "",
                                            style: "normal",
                                          },
                                        ],
                                      });
                                    }}
                                    className="text-xs text-[#444] hover:text-[#888] transition-colors py-1"
                                  >
                                    + Add dialogue line
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions row */}
                <div className="flex items-center justify-between mt-5">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleDraft}
                      disabled={drafting || !currentPage?.summary}
                      className="text-xs font-medium transition-all disabled:opacity-30 px-4 py-2 rounded-lg"
                      style={{ backgroundColor: `${accent}15`, color: accent }}
                    >
                      {drafting ? "Drafting..." : "+ Draft Next Panel"}
                    </button>
                    <button
                      onClick={() => {
                        const newPanel: ComicPanel = {
                          panelNumber: currentPage.panels.length + 1,
                          layout: "half",
                          artDirection: "",
                          dialogue: [],
                        };
                        updatePage(activePage, {
                          panels: [...currentPage.panels, newPanel],
                        });
                      }}
                      className="text-xs text-[#555] hover:text-[#888] transition-colors"
                    >
                      + Add blank panel
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={
                        !currentPage || currentPage.panels.length === 0
                      }
                      className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
                      style={{
                        backgroundColor: "#f59e0b20",
                        color: "#f59e0b",
                      }}
                    >
                      {currentPage.status === "approved"
                        ? "Re-Approve"
                        : currentPage.status === "illustrated" ||
                            currentPage.status === "published"
                          ? "Approved"
                          : "Approve Page"}
                    </button>
                    <button
                      onClick={handleIllustrate}
                      disabled={
                        illustrating ||
                        !currentPage ||
                        currentPage.status !== "approved"
                      }
                      className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
                      style={{
                        backgroundColor: "#a855f720",
                        color: "#a855f7",
                      }}
                    >
                      {illustrating ? "Generating art..." : "Illustrate"}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ── 3. Illustration Preview ── */}
            {currentPage?.illustrationUrl && (
              <section>
                <h2 className="text-[11px] font-semibold tracking-wider text-[#555] mb-3">
                  ILLUSTRATION
                </h2>
                <div
                  className="rounded-xl border border-[#1a1a1f] overflow-hidden mx-auto"
                  style={{ maxWidth: 420, aspectRatio: "2/3" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentPage.illustrationUrl}
                    alt={`Page ${activePage}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </section>
            )}

            {/* ── 4. Camera Roll ── */}
            <section className="pb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-semibold tracking-wider text-[#555]">
                  CAMERA ROLL &mdash; {illustratedCount}/{script.pages.length}
                </h2>
                <button
                  onClick={handlePublish}
                  disabled={!allIllustrated || publishStep === 2}
                  className="px-5 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                  style={{
                    backgroundColor: allIllustrated
                      ? publishStep === 1
                        ? "#ef444420"
                        : "#10b98120"
                      : "#1a1a1f",
                    color: allIllustrated
                      ? publishStep === 1
                        ? "#ef4444"
                        : "#10b981"
                      : "#555",
                  }}
                >
                  {publishStep === 2
                    ? "Publishing..."
                    : publishStep === 1
                      ? "Confirm Publish"
                      : "Publish to Bookstore"}
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {script.pages.map((p) => (
                  <button
                    key={p.pageNumber}
                    onClick={() => switchPage(p.pageNumber)}
                    className={`flex-shrink-0 rounded-lg overflow-hidden border transition-colors ${
                      p.pageNumber === activePage
                        ? "border-[#555]"
                        : "border-[#1a1a1f] hover:border-[#2a2a2f]"
                    }`}
                    style={{ width: 56, height: 84 }}
                  >
                    {p.illustrationUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.illustrationUrl}
                        alt={`p${p.pageNumber}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-[9px] font-medium"
                        style={{
                          backgroundColor: `${statusColor(p.status)}10`,
                          color: statusColor(p.status),
                        }}
                      >
                        {p.pageNumber}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
