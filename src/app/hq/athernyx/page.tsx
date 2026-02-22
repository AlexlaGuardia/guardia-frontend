"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Scroll,
  Sparkles,
  Database,
  PenTool,
  Layers,
  GitBranch,
  FileText,
  Feather,
} from "lucide-react";

const API_BASE = "https://api.guardiacontent.com";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AthernyxStatus {
  canon_entries: number;
  orphan_designs: number;
  open_threads: number;
  current_chapter: {
    chapter: number;
    chapter_title: string;
    pages_written: number;
    status: string;
  } | null;
}

interface ComicIssue {
  seriesId: string;
  issueNumber: number;
  title: string;
  totalPages: number;
  statusCounts: Record<string, number>;
  lastEdited: string | null;
}

interface ChapterInfo {
  volume: string;
  volume_title: string;
  chapter: string;
  title: string;
  total_pages: number;
  approved_pages: number;
  word_count: number;
  has_page_files: boolean;
}

interface HubData {
  status: AthernyxStatus | null;
  comics: ComicIssue[];
  chapters: ChapterInfo[];
}

// ---------------------------------------------------------------------------
// Static project definitions (metadata only — stats come from API)
// ---------------------------------------------------------------------------

interface WritingProject {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  accent: string;
  icon: typeof BookOpen;
  status: "active" | "coming-soon";
}

const PROJECTS: WritingProject[] = [
  {
    id: "comics",
    title: "Expansion Comics",
    subtitle: "3 Series",
    description:
      "Short story comics set in the ~700s. Space travel budding, adventurers chasing danger beyond the Aterna. Voidbound, Aterna\u2019s Edge, Starfall Drifters.",
    href: "/hq/athernyx/comics",
    accent: "#06b6d4",
    icon: BookOpen,
    status: "active",
  },
  {
    id: "spirit-tales",
    title: "Spirit Tales",
    subtitle: "Children\u2019s Books",
    description:
      "An Alkin girl and her spirit companion. Athernyx-style picture books \u2014 short, beautiful, one lesson per story. Dedicated to your daughter.",
    href: "/hq/athernyx/spirit-tales",
    accent: "#f59e0b",
    icon: Sparkles,
    status: "active",
  },
  {
    id: "heretic",
    title: "The Heretic",
    subtitle: "Secrets of Athernyx \u2014 Vol. I",
    description:
      "The flagship novel. Year 600, the Dying\u2019s final chapter. Prose pipeline: backbone \u2192 skeleton \u2192 expanded.",
    href: "/hq/athernyx/editor",
    accent: "#a855f7",
    icon: Scroll,
    status: "active",
  },
];

// ---------------------------------------------------------------------------
// Quick links
// ---------------------------------------------------------------------------

interface QuickLink {
  label: string;
  href: string;
  icon: typeof Database;
  description: string;
}

const QUICK_LINKS: QuickLink[] = [
  {
    label: "Canon Browser",
    href: "/hq/athernyx/canon",
    icon: Database,
    description: "Browse lore, characters, world entries",
  },
  {
    label: "Chapter Editor",
    href: "/hq/athernyx/editor",
    icon: PenTool,
    description: "Polish prose, approve pages, publish",
  },
  {
    label: "Comics Workspace",
    href: "/hq/athernyx/comics",
    icon: Layers,
    description: "Draft panels, illustrate, publish issues",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatWords(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function getSeriesCount(issues: ComicIssue[]): number {
  return new Set(issues.map((i) => i.seriesId)).size;
}

function getScriptedCount(issues: ComicIssue[]): number {
  return issues.filter((i) => {
    const total = Object.values(i.statusCounts).reduce((a, b) => a + b, 0);
    const empty = i.statusCounts["empty"] || 0;
    return total > 0 && empty < total;
  }).length;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function PulseStat({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string | number;
  accent?: string;
  warn?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3">
      <p
        className="text-[15px] font-semibold font-mono"
        style={{ color: warn ? "#f59e0b" : accent || "#888" }}
      >
        {value}
      </p>
      <p className="text-[10px] text-[#444] uppercase tracking-wide">{label}</p>
    </div>
  );
}

function ProjectCard({
  project,
  stats,
}: {
  project: WritingProject;
  stats?: { label: string; value: string }[];
}) {
  const Icon = project.icon;
  const isActive = project.status === "active";

  const inner = (
    <div
      className="group relative overflow-hidden rounded-xl border transition-all duration-300 hover:border-opacity-40 h-full"
      style={{
        borderColor: `${project.accent}20`,
        background: "#0a0a0b",
      }}
    >
      {/* Top accent line */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, ${project.accent}60, transparent)`,
        }}
      />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${project.accent}15` }}
            >
              <Icon size={18} style={{ color: project.accent }} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#e8e8e8]">
                {project.title}
              </h3>
              <p className="text-[11px] text-[#555]">{project.subtitle}</p>
            </div>
          </div>
          {!isActive && (
            <span
              className="text-[9px] font-semibold tracking-widest uppercase rounded px-2 py-0.5"
              style={{
                color: project.accent,
                backgroundColor: `${project.accent}15`,
              }}
            >
              Soon
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-[12px] leading-relaxed text-[#777] mb-5">
          {project.description}
        </p>

        {/* Stats */}
        {stats && (
          <div className="flex gap-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: project.accent }}
                >
                  {s.value}
                </p>
                <p className="text-[10px] text-[#444]">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hover glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${project.accent}08 0%, transparent 70%)`,
        }}
      />
    </div>
  );

  return isActive ? (
    <Link href={project.href} className="block h-full">
      {inner}
    </Link>
  ) : (
    <div className="h-full opacity-80 cursor-default">{inner}</div>
  );
}

function CurrentChapter({
  chapter,
}: {
  chapter: AthernyxStatus["current_chapter"];
}) {
  if (!chapter) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#1a1a1f] bg-[#0a0a0b] px-4 py-3">
      <Feather size={14} className="text-purple-400/60 shrink-0" />
      <div className="min-w-0">
        <p className="text-[12px] text-[#888]">
          <span className="text-purple-400">Ch {chapter.chapter}</span>
          {" \u2014 "}
          <span className="text-[#ccc]">{chapter.chapter_title}</span>
        </p>
        <p className="text-[10px] text-[#444]">
          {chapter.pages_written} pages {"\u00b7"} {chapter.status}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AthernyxHubPage() {
  const [data, setData] = useState<HubData>({
    status: null,
    comics: [],
    chapters: [],
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [statusRes, comicsRes, chaptersRes] = await Promise.allSettled([
        fetch(`${API_BASE}/hq/athernyx/status`).then((r) => r.json()),
        fetch(`${API_BASE}/hq/athernyx/comics/issues`).then((r) => r.json()),
        fetch(`${API_BASE}/hq/athernyx/editor/chapters`).then((r) => r.json()),
      ]);
      setData({
        status:
          statusRes.status === "fulfilled" ? statusRes.value : null,
        comics:
          comicsRes.status === "fulfilled"
            ? comicsRes.value.issues || []
            : [],
        chapters:
          chaptersRes.status === "fulfilled"
            ? chaptersRes.value.chapters || []
            : [],
      });
      setLoaded(true);
    }
    load();
  }, []);

  // Derive stats for project cards
  const comicStats = [
    { label: "Series", value: String(getSeriesCount(data.comics) || 3) },
    { label: "Issues", value: String(data.comics.length || 10) },
    {
      label: "Scripted",
      value: `${getScriptedCount(data.comics)}/${data.comics.length || 10}`,
    },
  ];

  const totalWords = data.chapters.reduce((a, c) => a + c.word_count, 0);
  const expandedCount = data.chapters.filter(
    (c) => c.has_page_files
  ).length;
  const hereticStats = [
    { label: "Chapters", value: String(data.chapters.length || 2) },
    { label: "Expanded", value: String(expandedCount || 2) },
    { label: "Words", value: totalWords ? formatWords(totalWords) : "21.5k" },
  ];

  const spiritStats = [
    { label: "Books", value: "5 drafted" },
    { label: "Art", value: "0 pages" },
    { label: "Format", value: "32 pg" },
  ];

  const statsMap: Record<string, { label: string; value: string }[]> = {
    comics: comicStats,
    "spirit-tales": spiritStats,
    heretic: hereticStats,
  };

  const orphans = data.status?.orphan_designs ?? 0;
  const threads = data.status?.open_threads ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e8e8e8]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <h1
              className="text-sm font-semibold tracking-wider"
              style={{ color: "#a855f7" }}
            >
              ATHERNYX WRITERS HUB
            </h1>
          </div>
          <p className="text-[#555] text-sm max-w-lg">
            All Athernyx literature in one place. Pick a project and write.
          </p>
        </header>

        {/* Production Pulse */}
        <section className="mb-10">
          <div className="flex items-center gap-6 rounded-xl border border-[#1a1a1f] bg-[#0a0a0b] overflow-hidden">
            <div className="flex divide-x divide-[#1a1a1f]">
              <PulseStat label="Canon Entries" value={loaded ? (data.status?.canon_entries ?? 0) : "\u2014"} accent="#a855f7" />
              <PulseStat label="Open Threads" value={loaded ? threads : "\u2014"} accent="#888" />
              <PulseStat
                label="Orphan Designs"
                value={loaded ? orphans : "\u2014"}
                warn={orphans > 0}
              />
            </div>
            <div className="flex-1 px-2">
              {loaded && data.status?.current_chapter && (
                <CurrentChapter chapter={data.status.current_chapter} />
              )}
            </div>
          </div>
        </section>

        {/* Project Cards */}
        <section className="mb-12">
          <h2 className="text-[#444] text-[10px] font-semibold tracking-wider mb-4">
            PROJECTS
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PROJECTS.map((p, i) => (
              <div
                key={p.id}
                className={
                  PROJECTS.length % 2 === 1 && i === PROJECTS.length - 1
                    ? "sm:col-span-2"
                    : ""
                }
              >
                <ProjectCard project={p} stats={statsMap[p.id]} />
              </div>
            ))}
          </div>
        </section>

        {/* Tools */}
        <section>
          <h2 className="text-[#444] text-[10px] font-semibold tracking-wider mb-4">
            TOOLS
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-4 rounded-lg border border-[#1a1a1f] bg-[#0a0a0b] p-4 transition-colors hover:border-[#2a2a2f]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a1f]">
                    <Icon
                      size={16}
                      className="text-[#555] group-hover:text-[#888] transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#ccc] group-hover:text-[#e8e8e8] transition-colors">
                      {link.label}
                    </p>
                    <p className="text-[11px] text-[#444]">
                      {link.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
