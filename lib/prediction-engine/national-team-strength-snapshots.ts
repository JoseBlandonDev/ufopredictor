import { WORLD_CUP_2026_TEAMS } from "../world-cup-2026";
import {
  REAL_SIGNAL_PACK_CANONICAL_SNAPSHOT_SEEDS,
  REAL_SIGNAL_PACK_SNAPSHOT_DATE,
  REAL_SIGNAL_PACK_SOURCE_LABEL,
  REAL_SIGNAL_PACK_SOURCE_NOTES,
} from "./national-team-strength-signal-pack";
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
  fifaScore?: number;
  fifaSourceTeamName?: string;
  fifaSourceFile?: string;
  eloRank?: number;
  eloRating?: number;
  eloAverageRank?: number;
  eloAverageRating?: number;
  eloSourceTeamName?: string;
  eloSourceFile?: string;
  historicalGoalsForPerMatch?: number;
  historicalGoalsAgainstPerMatch?: number;
  recentMatchCount?: number;
  signals: NationalTeamSnapshotSignals;
};

export type CanonicalSnapshotSeed = {
  aliases?: string[];
  sourceNotes?: string;
  fifaRank?: number;
  fifaPoints?: number;
  fifaScore?: number;
  fifaSourceTeamName?: string;
  fifaSourceFile?: string;
  eloRank?: number;
  eloRating?: number;
  eloAverageRank?: number;
  eloAverageRating?: number;
  eloSourceTeamName?: string;
  eloSourceFile?: string;
  historicalGoalsForPerMatch?: number;
  historicalGoalsAgainstPerMatch?: number;
  recentMatchCount?: number;
  signals: Omit<NationalTeamSnapshotSignals, "marketScore" | "lineupContextScore">;
};

const LEGACY_SOURCE_LABEL = "MVP v0 curated national-team snapshot (legacy test coverage)";
const LEGACY_SOURCE_NOTES =
  "Curated MVP v0 estimate retained for non-canonical legacy/test coverage. Not an authoritative live feed.";
// TODO(E11): move snapshot data into DB-backed team_strength_snapshots once
// source cadence, provenance, and refresh workflow are defined. Keep this repo-local
// catalog as the bridge until that operational path exists.

const NEUTRAL_ENGINE_FIELDS = {
  marketScore: 50,
  lineupContextScore: 50,
} as const;

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
    snapshotDate: REAL_SIGNAL_PACK_SNAPSHOT_DATE,
    sourceLabel: LEGACY_SOURCE_LABEL,
    sourceNotes: LEGACY_SOURCE_NOTES,
    fifaRank: 72,
    fifaPoints: 1340,
    eloRank: 71,
    eloRating: 1710,
    recentMatchCount: 0,
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
    snapshotDate: REAL_SIGNAL_PACK_SNAPSHOT_DATE,
    sourceLabel: LEGACY_SOURCE_LABEL,
    sourceNotes: LEGACY_SOURCE_NOTES,
    fifaRank: 40,
    fifaPoints: 1495,
    eloRank: 40,
    eloRating: 1815,
    recentMatchCount: 0,
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
    snapshotDate: REAL_SIGNAL_PACK_SNAPSHOT_DATE,
    sourceLabel: LEGACY_SOURCE_LABEL,
    sourceNotes: LEGACY_SOURCE_NOTES,
    fifaRank: 27,
    fifaPoints: 1525,
    eloRank: 27,
    eloRating: 1860,
    recentMatchCount: 0,
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
    snapshotDate: REAL_SIGNAL_PACK_SNAPSHOT_DATE,
    sourceLabel: LEGACY_SOURCE_LABEL,
    sourceNotes: LEGACY_SOURCE_NOTES,
    fifaRank: 100,
    fifaPoints: 1205,
    eloRank: 100,
    eloRating: 1605,
    recentMatchCount: 0,
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
    snapshotDate: REAL_SIGNAL_PACK_SNAPSHOT_DATE,
    sourceLabel: LEGACY_SOURCE_LABEL,
    sourceNotes: LEGACY_SOURCE_NOTES,
    fifaRank: 47,
    fifaPoints: 1455,
    eloRank: 47,
    eloRating: 1785,
    recentMatchCount: 0,
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

function buildCanonicalSnapshot(teamKey: string, seed: CanonicalSnapshotSeed): NationalTeamStrengthSnapshot {
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
    snapshotDate: REAL_SIGNAL_PACK_SNAPSHOT_DATE,
    sourceLabel: REAL_SIGNAL_PACK_SOURCE_LABEL,
    sourceNotes: seed.sourceNotes ?? REAL_SIGNAL_PACK_SOURCE_NOTES,
    fifaRank: seed.fifaRank,
    fifaPoints: seed.fifaPoints,
    fifaScore: seed.fifaScore,
    fifaSourceTeamName: seed.fifaSourceTeamName,
    fifaSourceFile: seed.fifaSourceFile,
    eloRank: seed.eloRank,
    eloRating: seed.eloRating,
    eloAverageRank: seed.eloAverageRank,
    eloAverageRating: seed.eloAverageRating,
    eloSourceTeamName: seed.eloSourceTeamName,
    eloSourceFile: seed.eloSourceFile,
    historicalGoalsForPerMatch: seed.historicalGoalsForPerMatch,
    historicalGoalsAgainstPerMatch: seed.historicalGoalsAgainstPerMatch,
    recentMatchCount: seed.recentMatchCount,
    signals: {
      ...seed.signals,
      ...NEUTRAL_ENGINE_FIELDS,
    },
  };
}

export const CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS: NationalTeamStrengthSnapshot[] = WORLD_CUP_2026_TEAMS.map(
  (team) => {
    const seed = REAL_SIGNAL_PACK_CANONICAL_SNAPSHOT_SEEDS[team.teamKey];

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
