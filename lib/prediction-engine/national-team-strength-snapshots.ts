import type { TeamPredictionInput } from "./types";

export type NationalTeamSnapshotSignals = NonNullable<TeamPredictionInput["signals"]>;

export type NationalTeamStrengthSnapshot = {
  teamKey: string;
  aliases: string[];
  displayName: string;
  snapshotDate: string;
  sourceLabel: string;
  sourceNotes: string;
  fifaRank?: number;
  fifaPoints?: number;
  eloRating?: number;
  signals: NationalTeamSnapshotSignals;
};

const SNAPSHOT_DATE = "2026-06-12";
const SOURCE_LABEL = "MVP v0 curated national-team snapshot";
const SOURCE_NOTES =
  "Conservative normalized snapshot estimates based on public ranking/Elo-style references and recent-form review. Not an authoritative live feed.";
// TODO(E10C/E11): move snapshot data into DB-backed team_strength_snapshots once
// source cadence, provenance, and refresh workflow are defined. Keep this repo-local
// catalog as the MVP 1.5 bridge until that operational path exists.

const NEUTRAL_ENGINE_FIELDS = {
  marketScore: 50,
  lineupContextScore: 50,
} as const;

export const NATIONAL_TEAM_STRENGTH_SNAPSHOTS: NationalTeamStrengthSnapshot[] = [
  {
    teamKey: "argentina",
    aliases: ["argentina"],
    displayName: "Argentina",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes: SOURCE_NOTES,
    fifaRank: 1,
    fifaPoints: 1885,
    eloRating: 2140,
    signals: {
      ratingScore: 95,
      recentFormScore: 88,
      attackScore: 92,
      defenseScore: 89,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "iceland",
    aliases: ["iceland"],
    displayName: "Iceland",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes: SOURCE_NOTES,
    fifaRank: 72,
    fifaPoints: 1340,
    eloRating: 1710,
    signals: {
      ratingScore: 52,
      recentFormScore: 49,
      attackScore: 50,
      defenseScore: 53,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "chile",
    aliases: ["chile"],
    displayName: "Chile",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes: SOURCE_NOTES,
    fifaRank: 40,
    fifaPoints: 1495,
    eloRating: 1815,
    signals: {
      ratingScore: 74,
      recentFormScore: 68,
      attackScore: 72,
      defenseScore: 70,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "congo-dr",
    aliases: ["congo-dr", "dr-congo", "congo-rd"],
    displayName: "Congo DR",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes: SOURCE_NOTES,
    fifaRank: 61,
    fifaPoints: 1395,
    eloRating: 1735,
    signals: {
      ratingScore: 58,
      recentFormScore: 54,
      attackScore: 56,
      defenseScore: 55,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "hungary",
    aliases: ["hungary"],
    displayName: "Hungary",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes: SOURCE_NOTES,
    fifaRank: 27,
    fifaPoints: 1525,
    eloRating: 1860,
    signals: {
      ratingScore: 69,
      recentFormScore: 65,
      attackScore: 67,
      defenseScore: 66,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "kazakhstan",
    aliases: ["kazakhstan"],
    displayName: "Kazakhstan",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes: SOURCE_NOTES,
    fifaRank: 100,
    fifaPoints: 1205,
    eloRating: 1605,
    signals: {
      ratingScore: 46,
      recentFormScore: 44,
      attackScore: 45,
      defenseScore: 47,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "saudi-arabia",
    aliases: ["saudi-arabia"],
    displayName: "Saudi Arabia",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes: SOURCE_NOTES,
    fifaRank: 56,
    fifaPoints: 1410,
    eloRating: 1775,
    signals: {
      ratingScore: 62,
      recentFormScore: 58,
      attackScore: 60,
      defenseScore: 59,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "senegal",
    aliases: ["senegal"],
    displayName: "Senegal",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes: SOURCE_NOTES,
    fifaRank: 18,
    fifaPoints: 1630,
    eloRating: 1915,
    signals: {
      ratingScore: 84,
      recentFormScore: 79,
      attackScore: 82,
      defenseScore: 80,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "iraq",
    aliases: ["iraq"],
    displayName: "Iraq",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes: SOURCE_NOTES,
    fifaRank: 59,
    fifaPoints: 1400,
    eloRating: 1715,
    signals: {
      ratingScore: 55,
      recentFormScore: 52,
      attackScore: 53,
      defenseScore: 54,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "venezuela",
    aliases: ["venezuela"],
    displayName: "Venezuela",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes: SOURCE_NOTES,
    fifaRank: 47,
    fifaPoints: 1455,
    eloRating: 1785,
    signals: {
      ratingScore: 64,
      recentFormScore: 60,
      attackScore: 62,
      defenseScore: 61,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "mexico",
    aliases: ["mexico"],
    displayName: "Mexico",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes:
      "Curated launch-window estimate using public ranking/Elo-style references plus a modest attacking boost over the provisional fallback.",
    fifaRank: 15,
    fifaPoints: 1650,
    eloRating: 1875,
    signals: {
      ratingScore: 76,
      recentFormScore: 69,
      attackScore: 68,
      defenseScore: 66,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "south-africa",
    aliases: ["south-africa"],
    displayName: "South Africa",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes:
      "Curated launch-window estimate using public ranking/Elo-style references with conservative finishing and defense values.",
    fifaRank: 57,
    fifaPoints: 1405,
    eloRating: 1675,
    signals: {
      ratingScore: 52,
      recentFormScore: 54,
      attackScore: 50,
      defenseScore: 52,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "south-korea",
    aliases: ["south-korea", "korea-republic"],
    displayName: "South Korea",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes:
      "Curated launch-window estimate using public ranking/Elo-style references with a slight upward adjustment to attacking balance.",
    fifaRank: 21,
    fifaPoints: 1595,
    eloRating: 1840,
    signals: {
      ratingScore: 68,
      recentFormScore: 62,
      attackScore: 61,
      defenseScore: 58,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "czech-republic",
    aliases: ["czech-republic", "czechia"],
    displayName: "Czech Republic",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes:
      "Curated launch-window estimate using public ranking/Elo-style references with balanced but slightly lower defensive protection than Mexico/Paraguay tier teams.",
    fifaRank: 34,
    fifaPoints: 1510,
    eloRating: 1810,
    signals: {
      ratingScore: 66,
      recentFormScore: 60,
      attackScore: 58,
      defenseScore: 54,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "canada",
    aliases: ["canada"],
    displayName: "Canada",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes:
      "Curated launch-window estimate using public ranking/Elo-style references with a slightly stronger attack profile than the provisional fallback.",
    fifaRank: 31,
    fifaPoints: 1520,
    eloRating: 1830,
    signals: {
      ratingScore: 68,
      recentFormScore: 60,
      attackScore: 63,
      defenseScore: 58,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "bosnia-herzegovina",
    aliases: ["bosnia-herzegovina", "bosnia-and-herzegovina"],
    displayName: "Bosnia & Herzegovina",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes:
      "Curated launch-window estimate using public ranking/Elo-style references with attacking upside but softer defensive resilience.",
    fifaRank: 74,
    fifaPoints: 1330,
    eloRating: 1705,
    signals: {
      ratingScore: 55,
      recentFormScore: 52,
      attackScore: 58,
      defenseScore: 49,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "usa",
    aliases: ["usa", "united-states"],
    displayName: "USA",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes:
      "Curated launch-window estimate using public ranking/Elo-style references with stronger attack than defense, while keeping non-odds fields neutral.",
    fifaRank: 16,
    fifaPoints: 1640,
    eloRating: 1845,
    signals: {
      ratingScore: 70,
      recentFormScore: 58,
      attackScore: 67,
      defenseScore: 56,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "paraguay",
    aliases: ["paraguay"],
    displayName: "Paraguay",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: SOURCE_LABEL,
    sourceNotes:
      "Curated launch-window estimate using public ranking/Elo-style references with a conservative defense-first profile.",
    fifaRank: 32,
    fifaPoints: 1515,
    eloRating: 1825,
    signals: {
      ratingScore: 69,
      recentFormScore: 62,
      attackScore: 57,
      defenseScore: 68,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "colombia",
    aliases: ["colombia"],
    displayName: "Colombia",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: "MVP v0 curated national-team snapshot (seed/mock World Cup context)",
    sourceNotes:
      "Included because Colombia already appears in seeded/mock World Cup 2026 project data. Ratings remain curated MVP v0 estimates, not a live feed.",
    fifaRank: 12,
    fifaPoints: 1675,
    eloRating: 1858,
    signals: {
      ratingScore: 78,
      recentFormScore: 70,
      attackScore: 69,
      defenseScore: 68,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "portugal",
    aliases: ["portugal"],
    displayName: "Portugal",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: "MVP v0 curated national-team snapshot (seed/mock World Cup context)",
    sourceNotes:
      "Included because Portugal already appears in seeded/mock World Cup 2026 project data. Ratings remain curated MVP v0 estimates, not a live feed.",
    fifaRank: 6,
    fifaPoints: 1785,
    eloRating: 1939,
    signals: {
      ratingScore: 87,
      recentFormScore: 80,
      attackScore: 84,
      defenseScore: 82,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "japan",
    aliases: ["japan", "japon"],
    displayName: "Japan",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: "MVP v0 curated national-team snapshot (seed/mock World Cup context)",
    sourceNotes:
      "Included because Japan already appears in seeded/mock World Cup 2026 project data. Ratings remain curated MVP v0 estimates, not a live feed.",
    fifaRank: 18,
    fifaPoints: 1615,
    eloRating: 1794,
    signals: {
      ratingScore: 73,
      recentFormScore: 68,
      attackScore: 64,
      defenseScore: 66,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "germany",
    aliases: ["germany", "alemania"],
    displayName: "Germany",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: "MVP v0 curated national-team snapshot (mock World Cup app context)",
    sourceNotes:
      "Included because Germany already appears in mock World Cup product data. Ratings remain curated MVP v0 estimates, not a live feed.",
    fifaRank: 9,
    fifaPoints: 1720,
    eloRating: 1887,
    signals: {
      ratingScore: 81,
      recentFormScore: 74,
      attackScore: 76,
      defenseScore: 75,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
  {
    teamKey: "morocco",
    aliases: ["morocco", "marruecos"],
    displayName: "Morocco",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: "MVP v0 curated national-team snapshot (mock World Cup app context)",
    sourceNotes:
      "Included because Morocco already appears in mock World Cup product data. Ratings remain curated MVP v0 estimates, not a live feed.",
    fifaRank: 13,
    fifaPoints: 1665,
    eloRating: 1819,
    signals: {
      ratingScore: 77,
      recentFormScore: 71,
      attackScore: 67,
      defenseScore: 74,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  },
];

function normalizeNationalTeamKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const NATIONAL_TEAM_SNAPSHOT_LOOKUP = new Map(
  NATIONAL_TEAM_STRENGTH_SNAPSHOTS.flatMap((snapshot) =>
    snapshot.aliases.map((alias) => [normalizeNationalTeamKey(alias), snapshot] as const),
  ),
);

export function getNationalTeamSnapshotCoverage() {
  return NATIONAL_TEAM_STRENGTH_SNAPSHOTS.map((snapshot) => snapshot.displayName);
}

export function resolveNationalTeamStrengthSnapshot(team: Pick<TeamPredictionInput, "name">) {
  return NATIONAL_TEAM_SNAPSHOT_LOOKUP.get(normalizeNationalTeamKey(team.name));
}

export function resolveNationalTeamSnapshotSignals(team: Pick<TeamPredictionInput, "name">) {
  const snapshot = resolveNationalTeamStrengthSnapshot(team);

  if (!snapshot) {
    return undefined;
  }

  return {
    ...snapshot.signals,
  };
}
