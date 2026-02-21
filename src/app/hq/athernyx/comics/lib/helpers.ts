import type { ComicPage, ComicPanel, IssueScript, IssueInfo } from "./types";

export function createEmptyPanel(n: number): ComicPanel {
  return {
    panelNumber: n,
    layout: "full",
    artDirection: "",
    dialogue: [],
  };
}

export function createEmptyPage(n: number): ComicPage {
  return {
    pageNumber: n,
    summary: "",
    panels: [],
    status: "empty",
  };
}

export function createEmptyScript(
  seriesId: string,
  issue: IssueInfo
): IssueScript {
  return {
    seriesId,
    issueNumber: issue.number,
    title: issue.title,
    synopsis: issue.synopsis,
    pages: Array.from({ length: issue.pageCount }, (_, i) =>
      createEmptyPage(i + 1)
    ),
    metadata: {
      lastEdited: new Date().toISOString(),
      totalPanels: 0,
    },
  };
}

export function createEmptyDialogue() {
  return { speaker: "", text: "", style: "normal" as const };
}

export function countPanels(pages: ComicPage[]): number {
  return pages.reduce((sum, p) => sum + p.panels.length, 0);
}

export function statusColor(status: string): string {
  switch (status) {
    case "empty":
      return "#333";
    case "summarized":
      return "#555";
    case "drafted":
      return "#f59e0b";
    case "approved":
      return "#06b6d4";
    case "illustrated":
      return "#a855f7";
    case "published":
      return "#10b981";
    default:
      return "#333";
  }
}
