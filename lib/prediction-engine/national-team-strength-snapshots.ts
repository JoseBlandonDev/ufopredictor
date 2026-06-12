import { WORLD_CUP_2026_TEAMS } from "../world-cup-2026";
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

type SnapshotSeed = {
  aliases?: string[];
  sourceNotes?: string;
  fifaRank?: number;
  fifaPoints?: number;
  eloRating?: number;
  signals: Omit<NationalTeamSnapshotSignals, "marketScore" | "lineupContextScore">;
};

const SNAPSHOT_DATE = "2026-06-12";
const CANONICAL_SOURCE_LABEL = "MVP v0 curated national-team snapshot (World Cup 2026 canonical catalog)";
const LEGACY_SOURCE_LABEL = "MVP v0 curated national-team snapshot (legacy test coverage)";
const CANONICAL_SOURCE_NOTES =
  "Curated MVP v0 estimate aligned to the repo-local FIFA-derived World Cup 2026 catalog. Uses conservative ranking, Elo-style, form, and team-balance heuristics. Not an authoritative live feed.";
const LEGACY_SOURCE_NOTES =
  "Curated MVP v0 estimate retained for non-canonical legacy/test coverage. Not an authoritative live feed.";
// TODO(E10C/E11): move snapshot data into DB-backed team_strength_snapshots once
// source cadence, provenance, and refresh workflow are defined. Keep this repo-local
// catalog as the MVP 1.5 bridge until that operational path exists.

const NEUTRAL_ENGINE_FIELDS = {
  marketScore: 50,
  lineupContextScore: 50,
} as const;

const CANONICAL_SNAPSHOT_SEEDS: Record<string, SnapshotSeed> = {
  argentina: {
    fifaRank: 1,
    fifaPoints: 1885,
    eloRating: 2140,
    signals: {
      ratingScore: 95,
      recentFormScore: 88,
      attackScore: 92,
      defenseScore: 89,
    },
  },
  algeria: {
    fifaRank: 36,
    fifaPoints: 1498,
    eloRating: 1790,
    signals: {
      ratingScore: 71,
      recentFormScore: 63,
      attackScore: 62,
      defenseScore: 64,
    },
  },
  australia: {
    fifaRank: 25,
    fifaPoints: 1555,
    eloRating: 1765,
    signals: {
      ratingScore: 63,
      recentFormScore: 58,
      attackScore: 57,
      defenseScore: 56,
    },
  },
  austria: {
    fifaRank: 22,
    fifaPoints: 1580,
    eloRating: 1865,
    signals: {
      ratingScore: 75,
      recentFormScore: 67,
      attackScore: 66,
      defenseScore: 69,
    },
  },
  belgium: {
    fifaRank: 8,
    fifaPoints: 1730,
    eloRating: 1890,
    signals: {
      ratingScore: 83,
      recentFormScore: 74,
      attackScore: 79,
      defenseScore: 73,
    },
  },
  "bosnia-herzegovina": {
    fifaRank: 74,
    fifaPoints: 1330,
    eloRating: 1705,
    signals: {
      ratingScore: 55,
      recentFormScore: 52,
      attackScore: 58,
      defenseScore: 49,
    },
    sourceNotes:
      "Curated MVP v0 estimate aligned to the FIFA-derived tournament catalog, with attacking upside but softer defensive resilience than the current launch leaders. Not an authoritative live feed.",
  },
  brazil: {
    fifaRank: 5,
    fifaPoints: 1780,
    eloRating: 2015,
    signals: {
      ratingScore: 90,
      recentFormScore: 82,
      attackScore: 86,
      defenseScore: 81,
    },
  },
  "cabo-verde": {
    fifaRank: 63,
    fifaPoints: 1385,
    eloRating: 1715,
    signals: {
      ratingScore: 57,
      recentFormScore: 55,
      attackScore: 53,
      defenseScore: 56,
    },
  },
  canada: {
    fifaRank: 31,
    fifaPoints: 1520,
    eloRating: 1830,
    signals: {
      ratingScore: 68,
      recentFormScore: 60,
      attackScore: 63,
      defenseScore: 58,
    },
    sourceNotes:
      "Curated MVP v0 estimate aligned to the FIFA-derived tournament catalog, with a slightly stronger attack profile than the provisional launch fallback. Not an authoritative live feed.",
  },
  chile: {
    fifaRank: 40,
    fifaPoints: 1495,
    eloRating: 1815,
    signals: {
      ratingScore: 74,
      recentFormScore: 68,
      attackScore: 72,
      defenseScore: 70,
    },
  },
  colombia: {
    fifaRank: 12,
    fifaPoints: 1675,
    eloRating: 1858,
    signals: {
      ratingScore: 78,
      recentFormScore: 70,
      attackScore: 69,
      defenseScore: 68,
    },
  },
  "congo-dr": {
    aliases: ["Congo RD"],
    fifaRank: 61,
    fifaPoints: 1395,
    eloRating: 1735,
    signals: {
      ratingScore: 58,
      recentFormScore: 54,
      attackScore: 56,
      defenseScore: 55,
    },
  },
  croatia: {
    fifaRank: 11,
    fifaPoints: 1680,
    eloRating: 1868,
    signals: {
      ratingScore: 78,
      recentFormScore: 69,
      attackScore: 73,
      defenseScore: 72,
    },
  },
  curacao: {
    aliases: ["Curacao national team"],
    fifaRank: 83,
    fifaPoints: 1285,
    eloRating: 1655,
    signals: {
      ratingScore: 50,
      recentFormScore: 48,
      attackScore: 49,
      defenseScore: 47,
    },
  },
  "czech-republic": {
    fifaRank: 34,
    fifaPoints: 1510,
    eloRating: 1810,
    signals: {
      ratingScore: 66,
      recentFormScore: 60,
      attackScore: 58,
      defenseScore: 54,
    },
    sourceNotes:
      "Curated MVP v0 estimate aligned to the FIFA-derived tournament catalog, with balanced but slightly lighter defensive protection than Mexico or Paraguay tier teams. Not an authoritative live feed.",
  },
  "cote-divoire": {
    aliases: ["Cote d'ivoire", "Côte d'Ivoire"],
    fifaRank: 41,
    fifaPoints: 1490,
    eloRating: 1805,
    signals: {
      ratingScore: 70,
      recentFormScore: 65,
      attackScore: 67,
      defenseScore: 63,
    },
  },
  ecuador: {
    fifaRank: 28,
    fifaPoints: 1540,
    eloRating: 1838,
    signals: {
      ratingScore: 73,
      recentFormScore: 66,
      attackScore: 65,
      defenseScore: 69,
    },
  },
  egypt: {
    fifaRank: 38,
    fifaPoints: 1490,
    eloRating: 1780,
    signals: {
      ratingScore: 67,
      recentFormScore: 60,
      attackScore: 61,
      defenseScore: 63,
    },
  },
  england: {
    fifaRank: 4,
    fifaPoints: 1790,
    eloRating: 2030,
    signals: {
      ratingScore: 90,
      recentFormScore: 82,
      attackScore: 84,
      defenseScore: 81,
    },
  },
  france: {
    fifaRank: 2,
    fifaPoints: 1850,
    eloRating: 2105,
    signals: {
      ratingScore: 92,
      recentFormScore: 83,
      attackScore: 87,
      defenseScore: 84,
    },
  },
  germany: {
    aliases: ["Alemania"],
    fifaRank: 9,
    fifaPoints: 1720,
    eloRating: 1887,
    signals: {
      ratingScore: 81,
      recentFormScore: 74,
      attackScore: 76,
      defenseScore: 75,
    },
  },
  ghana: {
    fifaRank: 62,
    fifaPoints: 1388,
    eloRating: 1720,
    signals: {
      ratingScore: 61,
      recentFormScore: 56,
      attackScore: 57,
      defenseScore: 55,
    },
  },
  haiti: {
    fifaRank: 91,
    fifaPoints: 1265,
    eloRating: 1610,
    signals: {
      ratingScore: 44,
      recentFormScore: 45,
      attackScore: 46,
      defenseScore: 43,
    },
  },
  iran: {
    fifaRank: 20,
    fifaPoints: 1600,
    eloRating: 1820,
    signals: {
      ratingScore: 69,
      recentFormScore: 64,
      attackScore: 60,
      defenseScore: 67,
    },
  },
  iraq: {
    fifaRank: 59,
    fifaPoints: 1400,
    eloRating: 1715,
    signals: {
      ratingScore: 55,
      recentFormScore: 52,
      attackScore: 53,
      defenseScore: 54,
    },
  },
  japan: {
    aliases: ["Japon"],
    fifaRank: 18,
    fifaPoints: 1615,
    eloRating: 1794,
    signals: {
      ratingScore: 73,
      recentFormScore: 68,
      attackScore: 64,
      defenseScore: 66,
    },
  },
  jordan: {
    fifaRank: 86,
    fifaPoints: 1275,
    eloRating: 1650,
    signals: {
      ratingScore: 49,
      recentFormScore: 47,
      attackScore: 48,
      defenseScore: 46,
    },
  },
  mexico: {
    fifaRank: 15,
    fifaPoints: 1650,
    eloRating: 1875,
    signals: {
      ratingScore: 76,
      recentFormScore: 69,
      attackScore: 68,
      defenseScore: 66,
    },
    sourceNotes:
      "Curated MVP v0 estimate aligned to the FIFA-derived tournament catalog, with a modest attacking boost over the provisional fallback. Not an authoritative live feed.",
  },
  morocco: {
    aliases: ["Marruecos"],
    fifaRank: 13,
    fifaPoints: 1665,
    eloRating: 1819,
    signals: {
      ratingScore: 77,
      recentFormScore: 71,
      attackScore: 67,
      defenseScore: 74,
    },
  },
  netherlands: {
    fifaRank: 7,
    fifaPoints: 1740,
    eloRating: 1960,
    signals: {
      ratingScore: 86,
      recentFormScore: 77,
      attackScore: 81,
      defenseScore: 76,
    },
  },
  "new-zealand": {
    fifaRank: 94,
    fifaPoints: 1240,
    eloRating: 1615,
    signals: {
      ratingScore: 51,
      recentFormScore: 49,
      attackScore: 47,
      defenseScore: 51,
    },
  },
  norway: {
    fifaRank: 33,
    fifaPoints: 1518,
    eloRating: 1840,
    signals: {
      ratingScore: 72,
      recentFormScore: 64,
      attackScore: 73,
      defenseScore: 58,
    },
  },
  panama: {
    fifaRank: 58,
    fifaPoints: 1408,
    eloRating: 1710,
    signals: {
      ratingScore: 56,
      recentFormScore: 53,
      attackScore: 52,
      defenseScore: 55,
    },
  },
  paraguay: {
    fifaRank: 32,
    fifaPoints: 1515,
    eloRating: 1825,
    signals: {
      ratingScore: 69,
      recentFormScore: 62,
      attackScore: 57,
      defenseScore: 68,
    },
    sourceNotes:
      "Curated MVP v0 estimate aligned to the FIFA-derived tournament catalog, with a conservative defense-first profile. Not an authoritative live feed.",
  },
  portugal: {
    fifaRank: 6,
    fifaPoints: 1785,
    eloRating: 1939,
    signals: {
      ratingScore: 87,
      recentFormScore: 80,
      attackScore: 84,
      defenseScore: 82,
    },
  },
  qatar: {
    fifaRank: 79,
    fifaPoints: 1300,
    eloRating: 1668,
    signals: {
      ratingScore: 54,
      recentFormScore: 51,
      attackScore: 52,
      defenseScore: 51,
    },
  },
  "saudi-arabia": {
    fifaRank: 56,
    fifaPoints: 1410,
    eloRating: 1775,
    signals: {
      ratingScore: 62,
      recentFormScore: 58,
      attackScore: 60,
      defenseScore: 59,
    },
  },
  scotland: {
    fifaRank: 45,
    fifaPoints: 1465,
    eloRating: 1780,
    signals: {
      ratingScore: 64,
      recentFormScore: 58,
      attackScore: 60,
      defenseScore: 57,
    },
  },
  senegal: {
    fifaRank: 18,
    fifaPoints: 1630,
    eloRating: 1915,
    signals: {
      ratingScore: 84,
      recentFormScore: 79,
      attackScore: 82,
      defenseScore: 80,
    },
  },
  "south-africa": {
    fifaRank: 57,
    fifaPoints: 1405,
    eloRating: 1675,
    signals: {
      ratingScore: 52,
      recentFormScore: 54,
      attackScore: 50,
      defenseScore: 52,
    },
    sourceNotes:
      "Curated MVP v0 estimate aligned to the FIFA-derived tournament catalog, with conservative finishing and defense values. Not an authoritative live feed.",
  },
  "south-korea": {
    fifaRank: 21,
    fifaPoints: 1595,
    eloRating: 1840,
    signals: {
      ratingScore: 68,
      recentFormScore: 62,
      attackScore: 61,
      defenseScore: 58,
    },
    sourceNotes:
      "Curated MVP v0 estimate aligned to the FIFA-derived tournament catalog, with a slight upward adjustment to attacking balance. Not an authoritative live feed.",
  },
  spain: {
    fifaRank: 3,
    fifaPoints: 1815,
    eloRating: 2050,
    signals: {
      ratingScore: 89,
      recentFormScore: 81,
      attackScore: 83,
      defenseScore: 82,
    },
  },
  sweden: {
    fifaRank: 29,
    fifaPoints: 1532,
    eloRating: 1825,
    signals: {
      ratingScore: 70,
      recentFormScore: 63,
      attackScore: 62,
      defenseScore: 67,
    },
  },
  switzerland: {
    fifaRank: 19,
    fifaPoints: 1610,
    eloRating: 1850,
    signals: {
      ratingScore: 75,
      recentFormScore: 67,
      attackScore: 68,
      defenseScore: 71,
    },
  },
  tunisia: {
    fifaRank: 41,
    fifaPoints: 1485,
    eloRating: 1765,
    signals: {
      ratingScore: 60,
      recentFormScore: 56,
      attackScore: 54,
      defenseScore: 60,
    },
  },
  turkiye: {
    fifaRank: 27,
    fifaPoints: 1545,
    eloRating: 1818,
    signals: {
      ratingScore: 71,
      recentFormScore: 64,
      attackScore: 66,
      defenseScore: 63,
    },
  },
  uruguay: {
    fifaRank: 10,
    fifaPoints: 1700,
    eloRating: 1925,
    signals: {
      ratingScore: 82,
      recentFormScore: 74,
      attackScore: 76,
      defenseScore: 79,
    },
  },
  usa: {
    fifaRank: 16,
    fifaPoints: 1640,
    eloRating: 1845,
    signals: {
      ratingScore: 70,
      recentFormScore: 58,
      attackScore: 67,
      defenseScore: 56,
    },
    sourceNotes:
      "Curated MVP v0 estimate aligned to the FIFA-derived tournament catalog, with stronger attack than defense while keeping non-odds fields neutral. Not an authoritative live feed.",
  },
  uzbekistan: {
    fifaRank: 65,
    fifaPoints: 1378,
    eloRating: 1712,
    signals: {
      ratingScore: 59,
      recentFormScore: 55,
      attackScore: 54,
      defenseScore: 57,
    },
  },
};

export const LEGACY_TEST_ONLY_TEAM_KEYS = [
  "iceland",
  "chile",
  "hungary",
  "kazakhstan",
  "venezuela",
] as const;

export const LEGACY_TEST_ONLY_SNAPSHOTS: NationalTeamStrengthSnapshot[] = [
  {
    teamKey: "iceland",
    aliases: ["iceland"],
    displayName: "Iceland",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: LEGACY_SOURCE_LABEL,
    sourceNotes: LEGACY_SOURCE_NOTES,
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
    sourceLabel: LEGACY_SOURCE_LABEL,
    sourceNotes: LEGACY_SOURCE_NOTES,
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
    teamKey: "hungary",
    aliases: ["hungary"],
    displayName: "Hungary",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: LEGACY_SOURCE_LABEL,
    sourceNotes: LEGACY_SOURCE_NOTES,
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
    sourceLabel: LEGACY_SOURCE_LABEL,
    sourceNotes: LEGACY_SOURCE_NOTES,
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
    teamKey: "venezuela",
    aliases: ["venezuela"],
    displayName: "Venezuela",
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: LEGACY_SOURCE_LABEL,
    sourceNotes: LEGACY_SOURCE_NOTES,
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

function buildSnapshotAliases(teamKey: string, aliases: string[]) {
  const seen = new Set<string>();

  return aliases.filter((alias) => {
    const normalized = normalizeNationalTeamKey(alias);

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function buildCanonicalSnapshot(teamKey: string, seed: SnapshotSeed): NationalTeamStrengthSnapshot {
  const team = WORLD_CUP_2026_TEAMS.find((entry) => entry.teamKey === teamKey);

  if (!team) {
    throw new Error(`Missing canonical World Cup team for snapshot seed: ${teamKey}`);
  }

  return {
    teamKey,
    aliases: buildSnapshotAliases(teamKey, [
      teamKey,
      team.slug,
      team.displayName,
      team.fifaOfficialName,
      team.country,
      ...team.aliases,
      ...(seed.aliases ?? []),
    ]),
    displayName: team.displayName,
    snapshotDate: SNAPSHOT_DATE,
    sourceLabel: CANONICAL_SOURCE_LABEL,
    sourceNotes: seed.sourceNotes ?? CANONICAL_SOURCE_NOTES,
    fifaRank: seed.fifaRank,
    fifaPoints: seed.fifaPoints,
    eloRating: seed.eloRating,
    signals: {
      ...seed.signals,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  };
}

export const CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS: NationalTeamStrengthSnapshot[] = WORLD_CUP_2026_TEAMS.map(
  (team) => {
    const seed = CANONICAL_SNAPSHOT_SEEDS[team.teamKey];

    if (!seed) {
      throw new Error(`Missing snapshot seed for canonical World Cup team: ${team.teamKey}`);
    }

    return buildCanonicalSnapshot(team.teamKey, seed);
  },
);

export const NATIONAL_TEAM_STRENGTH_SNAPSHOTS: NationalTeamStrengthSnapshot[] = [
  ...CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS,
  ...LEGACY_TEST_ONLY_SNAPSHOTS,
];

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
