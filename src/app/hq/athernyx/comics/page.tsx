"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { SERIES, ISSUES } from "./lib/series-data";
import type { IssueSummary } from "./lib/types";

const API_BASE = "https://api.guardiacontent.com";

export default function ComicsLandingPage() {
  const [issueSummaries, setIssueSummaries] = useState<IssueSummary[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/hq/athernyx/comics/issues`)
      .then((r) => r.json())
      .then((d) => setIssueSummaries(d.issues || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e8e8e8]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="mb-10">
          <Link
            href="/hq/athernyx"
            className="text-[#555] text-xs hover:text-[#888] transition-colors mb-2 block"
          >
            &larr; Writers Hub
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <h1
              className="text-sm font-semibold tracking-wider"
              style={{ color: "#06b6d4" }}
            >
              EXPANSION COMICS
            </h1>
          </div>
          <p className="text-[#555] text-sm max-w-lg">
            Short story comics set in the ~700s. Pick a series and start
            writing.
          </p>
        </header>

        {/* Series cards */}
        <div className="space-y-6">
          {SERIES.map((series) => {
            const issues = ISSUES[series.id] || [];
            return (
              <div
                key={series.id}
                className="rounded-xl border overflow-hidden"
                style={{
                  borderColor: `${series.accent}20`,
                  background: "#0d0d0e",
                }}
              >
                {/* Accent line */}
                <div
                  className="h-[2px] w-full"
                  style={{
                    background: `linear-gradient(90deg, ${series.accent}60, transparent)`,
                  }}
                />

                <div className="p-6">
                  {/* Series header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${series.accent}15` }}
                      >
                        <BookOpen
                          size={18}
                          style={{ color: series.accent }}
                        />
                      </div>
                      <div>
                        <h2 className="text-[15px] font-semibold text-[#e8e8e8]">
                          {series.title}
                        </h2>
                        <p className="text-[11px] text-[#555]">
                          {series.tagline}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-semibold tracking-wider"
                      style={{ color: `${series.accent}80` }}
                    >
                      {issues.length} ISSUES
                    </span>
                  </div>

                  <p className="text-[12px] leading-relaxed text-[#666] mb-5">
                    {series.description}
                  </p>

                  {/* Issue grid */}
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {issues.map((issue) => {
                      const summary = issueSummaries.find(
                        (s) =>
                          s.seriesId === series.id &&
                          s.issueNumber === issue.number
                      );
                      const totalDone = summary
                        ? (summary.statusCounts.illustrated || 0) +
                          (summary.statusCounts.published || 0)
                        : 0;
                      const totalPages = summary?.totalPages || issue.pageCount;
                      const hasProgress = totalDone > 0;

                      return (
                        <Link
                          key={issue.id}
                          href={`/hq/athernyx/comics/${series.id}?issue=${issue.number}`}
                          className="group rounded-lg border border-[#1a1a1f] bg-[#0a0a0b] p-3 hover:border-[#2a2a2f] transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-[11px] font-semibold"
                              style={{ color: series.accent }}
                            >
                              #{issue.number}
                            </span>
                            <ChevronRight
                              size={12}
                              className="text-[#333] group-hover:text-[#555] transition-colors"
                            />
                          </div>
                          <p className="text-[12px] text-[#ccc] font-medium mb-1">
                            {issue.title}
                          </p>
                          <p className="text-[10px] text-[#444] line-clamp-2 mb-2">
                            {issue.synopsis}
                          </p>
                          {/* Progress bar */}
                          <div className="w-full bg-[#1a1a1f] rounded-full h-1">
                            <div
                              className="h-1 rounded-full transition-all duration-500"
                              style={{
                                width: `${totalPages > 0 ? (totalDone / totalPages) * 100 : 0}%`,
                                backgroundColor: hasProgress
                                  ? series.accent
                                  : "transparent",
                              }}
                            />
                          </div>
                          <p className="text-[9px] text-[#333] mt-1">
                            {totalDone}/{totalPages} pages
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
