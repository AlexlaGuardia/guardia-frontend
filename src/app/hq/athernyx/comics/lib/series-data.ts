import type { SeriesInfo, IssueInfo } from "./types";

export const SERIES: SeriesInfo[] = [
  {
    id: "voidbound",
    title: "Voidbound",
    tagline: "Past the mana barrier, into the black.",
    description:
      "The first crew to leave Athernyx behind. Four issues charting the maiden voyage past the planetary mana barrier.",
    accent: "#06b6d4",
    issueCount: 4,
  },
  {
    id: "aternas-edge",
    title: "Aterna\u2019s Edge",
    tagline: "Where peace ends and the frontier begins.",
    description:
      "Stories from the peacekeeping force stationed at the edge of known space.",
    accent: "#d4a843",
    issueCount: 3,
  },
  {
    id: "starfall-drifters",
    title: "Starfall Drifters",
    tagline: "Salvage. Secrets. Survival.",
    description:
      "Treasure hunters and ruin-crawlers chasing ancient tech through abandoned orbital stations.",
    accent: "#e2e0ea",
    issueCount: 3,
  },
];

export const ISSUES: Record<string, IssueInfo[]> = {
  voidbound: [
    {
      id: "voidbound-01",
      seriesId: "voidbound",
      number: 1,
      title: "The Departure",
      synopsis:
        "A crew of six volunteers boards the Reach \u2014 Athernyx\u2019s first deep-space vessel. The mana barrier looms.",
      pageCount: 24,
    },
    {
      id: "voidbound-02",
      seriesId: "voidbound",
      number: 2,
      title: "Hollow Signal",
      synopsis:
        "A distress beacon from a planet that shouldn\u2019t exist. The crew debates whether to answer.",
      pageCount: 24,
    },
    {
      id: "voidbound-03",
      seriesId: "voidbound",
      number: 3,
      title: "The Bloom",
      synopsis:
        "The planet is alive \u2014 a single organism spanning continents. And it noticed them.",
      pageCount: 24,
    },
    {
      id: "voidbound-04",
      seriesId: "voidbound",
      number: 4,
      title: "Return to Static",
      synopsis:
        "The journey home. But the barrier looks different from the outside.",
      pageCount: 24,
    },
  ],
  "aternas-edge": [
    {
      id: "aternas-edge-01",
      seriesId: "aternas-edge",
      number: 1,
      title: "Border Station",
      synopsis:
        "Station Kha-9 sits where the maps go blank. New officer Ren arrives to find half the crew missing.",
      pageCount: 22,
    },
    {
      id: "aternas-edge-02",
      seriesId: "aternas-edge",
      number: 2,
      title: "The Envoy",
      synopsis:
        "First contact. The visitor doesn\u2019t speak. It resonates.",
      pageCount: 22,
    },
    {
      id: "aternas-edge-03",
      seriesId: "aternas-edge",
      number: 3,
      title: "Fracture Protocol",
      synopsis:
        "The station receives an order it cannot follow. Ren makes a choice the Citadel will remember.",
      pageCount: 22,
    },
  ],
  "starfall-drifters": [
    {
      id: "starfall-drifters-01",
      seriesId: "starfall-drifters",
      number: 1,
      title: "Salvage Rights",
      synopsis:
        "Jyn\u2019s crew finds an orbital station that predates Athernian spaceflight. Someone built it. Someone left.",
      pageCount: 22,
    },
    {
      id: "starfall-drifters-02",
      seriesId: "starfall-drifters",
      number: 2,
      title: "The Locked Vault",
      synopsis:
        "Deep in the station, a vault sealed with runes that shouldn\u2019t exist this far from Athernyx.",
      pageCount: 22,
    },
    {
      id: "starfall-drifters-03",
      seriesId: "starfall-drifters",
      number: 3,
      title: "Dead Orbit",
      synopsis:
        "The station is moving. On its own. Toward something.",
      pageCount: 22,
    },
  ],
};

export function getSeriesById(id: string): SeriesInfo | undefined {
  return SERIES.find((s) => s.id === id);
}

export function getIssuesForSeries(seriesId: string): IssueInfo[] {
  return ISSUES[seriesId] || [];
}
