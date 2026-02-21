"use client";

import Link from "next/link";
import { BookOpen, Scroll, Sparkles, Database, PenTool } from "lucide-react";

// ---------------------------------------------------------------------------
// Project definitions
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
  stats?: { label: string; value: string }[];
}

const PROJECTS: WritingProject[] = [
  {
    id: "comics",
    title: "Expansion Comics",
    subtitle: "3 Series \u00b7 10 Issues",
    description:
      "Short story comics set in the ~700s. Space travel budding, adventurers chasing danger beyond the Aterna. Voidbound, Aterna\u2019s Edge, Starfall Drifters.",
    href: "/hq/athernyx/comics",
    accent: "#06b6d4",
    icon: BookOpen,
    status: "active",
    stats: [
      { label: "Series", value: "3" },
      { label: "Issues", value: "10" },
      { label: "Scripts", value: "0/10" },
    ],
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
    status: "coming-soon",
    stats: [
      { label: "Books", value: "5 drafted" },
      { label: "Art", value: "0 pages" },
      { label: "Format", value: "32 pg" },
    ],
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
    stats: [
      { label: "Chapters", value: "4" },
      { label: "Expanded", value: "2" },
      { label: "Words", value: "22.8k" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Quick links — tools that already exist
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
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ProjectCard({ project }: { project: WritingProject }) {
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
        style={{ background: `linear-gradient(90deg, ${project.accent}60, transparent)` }}
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
            <span className="text-[9px] font-semibold tracking-widest uppercase rounded px-2 py-0.5"
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
        {project.stats && (
          <div className="flex gap-4">
            {project.stats.map((s) => (
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

export default function AthernyxHubPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e8e8e8]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="mb-10">
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

        {/* Project Cards */}
        <section className="mb-12">
          <h2 className="text-[#444] text-[10px] font-semibold tracking-wider mb-4">
            PROJECTS
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROJECTS.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-[#444] text-[10px] font-semibold tracking-wider mb-4">
            TOOLS
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-4 rounded-lg border border-[#1a1a1f] bg-[#0a0a0b] p-4 transition-colors hover:border-[#2a2a2f]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a1f]">
                    <Icon size={16} className="text-[#555] group-hover:text-[#888] transition-colors" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#ccc] group-hover:text-[#e8e8e8] transition-colors">
                      {link.label}
                    </p>
                    <p className="text-[11px] text-[#444]">{link.description}</p>
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
