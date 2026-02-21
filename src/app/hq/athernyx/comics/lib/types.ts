// Comic production pipeline types

export type PageStatus =
  | "empty"
  | "summarized"
  | "drafted"
  | "approved"
  | "illustrated"
  | "published";

export type PanelLayout = "full" | "half" | "third" | "quarter" | "hero-strip";

export type DialogueStyle = "normal" | "whisper" | "shout" | "thought" | "caption";

export interface DialogueLine {
  speaker: string;
  text: string;
  style: DialogueStyle;
}

export interface ComicPanel {
  panelNumber: number;
  layout: PanelLayout;
  artDirection: string;
  dialogue: DialogueLine[];
}

export interface ComicPage {
  pageNumber: number;
  summary: string;
  panels: ComicPanel[];
  illustrationUrl?: string;
  status: PageStatus;
}

export interface IssueScript {
  seriesId: string;
  issueNumber: number;
  title: string;
  synopsis: string;
  pages: ComicPage[];
  metadata: {
    lastEdited: string;
    totalPanels: number;
  };
}

export interface SeriesInfo {
  id: string;
  title: string;
  tagline: string;
  description: string;
  accent: string;
  issueCount: number;
}

export interface IssueInfo {
  id: string;
  seriesId: string;
  number: number;
  title: string;
  synopsis: string;
  pageCount: number;
}

export interface IssueSummary {
  seriesId: string;
  issueNumber: number;
  title: string;
  totalPages: number;
  statusCounts: Record<PageStatus, number>;
  lastEdited: string | null;
}
