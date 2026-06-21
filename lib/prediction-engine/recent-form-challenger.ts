import { evaluatePrediction } from "../model-evaluation/evaluate-prediction";
import type { MatchResultInput, PredictionEvaluation } from "../model-evaluation/types";
import { WORLD_CUP_2026_TEAMS } from "../world-cup-2026";
import type { WorldCup2026Fixture } from "../world-cup-2026/types";
import { clamp, round } from "./normalize";
import { buildNationalTeamStrengthMetadata, type NationalTeamStrengthSnapshot } from "./national-team-strength-snapshots";
import type { MatchPredictionInput, PredictionEngineOutput } from "./types";

export const RECENT_FORM_CHALLENGER_VARIANTS = [
  { key: "recent_10", recentWeight: 0.1 },
  { key: "recent_20", recentWeight: 0.2 },
  { key: "recent_30", recentWeight: 0.3 },
  { key: "recent_40", recentWeight: 0.4 },
] as const;

export type RecentFormChallengerVariantKey = (typeof RECENT_FORM_CHALLENGER_VARIANTS)[number]["key"];

export type TrackedRecentMatch = {
  date: string;
  opponent: string;
  opponentKey: string;
  opponentIsCanonicalWorldCupTeam: boolean;
  venueSide: string;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  tournament: string;
  location: string;
};

export type TrackedSourceTeam = {
  teamKey: string;
  databaseNameEn: string;
  displayNameEn: string;
  aliases?: string[];
  recent: {
    last5: TrackedRecentMatch[];
    recentGoalsForPerMatch: number;
    recentGoalsAgainstPerMatch: number;
    recentPointsPerMatch: number;
    recentWorldCupMatchCount: number;
    sampleStartDate: string;
    sampleEndDate: string;
    sampleStatus: string;
  };
  runtimeSafeInputs: {
    fifaRank: number;
    fifaPoints: number;
    eloRank: number;
    eloRating: number;
    eloAverageRank: number;
    eloAverageRating: number;
    historicalGoalsForPerMatch: number;
    historicalGoalsAgainstPerMatch: number;
    recentMatchCount: number;
    recentGoalsForPerMatch: number;
    recentGoalsAgainstPerMatch: number;
    recentPointsPerMatch: number;
    recentWorldCupMatchCount?: number;
  };
};

export type TrackedSourceSnapshot = {
  snapshotDate: string;
  teams: TrackedSourceTeam[];
};

export type RecentFormChallengerMatchBreakdown = {
  date: string;
  opponent: string;
  opponentKey: string;
  recencyWeight: number;
  clippedGoalsFor: number;
  clippedGoalsAgainst: number;
  opponentAttackMultiplier: number;
  opponentDefenseMultiplier: number;
  adjustedGoalsFor: number;
  adjustedGoalsAgainst: number;
};

export type RecentFormChallengerTeamDiagnostics = {
  teamKey: string;
  displayName: string;
  sourceSnapshotDate: string;
  historicalAttackScore: number;
  historicalDefenseScore: number;
  recentAttackScore: number;
  recentDefenseScore: number;
  stabilizedRecentAttackScore: number;
  stabilizedRecentDefenseScore: number;
  sampleReliability: number;
  sampleReliabilityFactors: {
    countFactor: number;
    statusFactor: number;
    canonicalOpponentShare: number;
    worldCupOpponentShare: number;
  };
  opponentStrengthAdjustment: {
    supportedMatchCount: number;
    totalMatchCount: number;
    averageAttackMultiplier: number;
    averageDefenseMultiplier: number;
  };
  recentWindow: {
    sampleStatus: string;
    recentMatchCount: number;
    recentWorldCupMatchCount: number;
    weightedAdjustedGoalsForPerMatch: number;
    weightedAdjustedGoalsAgainstPerMatch: number;
    matches: RecentFormChallengerMatchBreakdown[];
  };
  variantSignals: Record<RecentFormChallengerVariantKey, {
    attackScore: number;
    defenseScore: number;
  }>;
};

export type TimeSafeEvaluationEligibility = {
  eligible: boolean;
  reasons: string[];
};

export type ChallengerVariantPerformanceSummary = {
  evaluatedFixtureCount: number;
  oneXTwoHitRate: number | null;
  brierScore: number | null;
  logLoss: number | null;
  exactScoreHitRate: number | null;
  totalGoalError: number | null;
  averageHomeXgAbsoluteError: number | null;
  averageAwayXgAbsoluteError: number | null;
  highConfidenceWrongPredictions: number;
  favoriteInversionAgainstElo: {
    count: number;
    total: number;
    rate: number | null;
  };
  calibrationBuckets: Array<{
    bucketLabel: string;
    fixtureCount: number;
    averageTopProbability: number | null;
    actualTopOutcomeHitRate: number | null;
  }>;
  regionalSlices: Array<{
    region: "CAF" | "AFC";
    fixtureCount: number;
    averageRegionTeamWinProbability: number | null;
    actualRegionTeamWinRate: number | null;
    underestimationGap: number | null;
  }>;
};

const TEAM_REGION_BY_KEY: Partial<Record<string, "CAF" | "AFC">> = {
  "south-africa": "CAF",
  morocco: "CAF",
  "cote-divoire": "CAF",
  tunisia: "CAF",
  egypt: "CAF",
  "cabo-verde": "CAF",
  senegal: "CAF",
  algeria: "CAF",
  "congo-dr": "CAF",
  ghana: "CAF",
  "south-korea": "AFC",
  qatar: "AFC",
  australia: "AFC",
  japan: "AFC",
  iran: "AFC",
  "saudi-arabia": "AFC",
  iraq: "AFC",
  jordan: "AFC",
  uzbekistan: "AFC",
};

const COMPLETE_RECENT_SAMPLE_TARGET = 5;
const MIN_RECENCY_WEIGHT = 0.6;
const MAX_CLIPPED_GOALS_PER_MATCH = 4;
const OPPONENT_ADJUSTMENT_RANGE = 400;
const OPPONENT_ADJUSTMENT_INFLUENCE = 0.12;
const OPERATOR_CONFIDENCE_THRESHOLD = 75;
const OPERATOR_TOP_OUTCOME_THRESHOLD = 50;
const OPERATOR_TOP_SCORELINE_THRESHOLD = 14;
const PROBABILITY_EPSILON = 1e-9;
const CALIBRATION_BUCKET_EDGES = [50, 60, 70, 80, 90, 101];

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function scale(value: number, min: number, max: number, options?: { invert?: boolean }) {
  if (max === min) {
    return 100;
  }

  const normalized = ((value - min) / (max - min)) * 100;
  return round(options?.invert ? 100 - normalized : normalized, 2);
}

function requireSignalScore(
  snapshot: NationalTeamStrengthSnapshot,
  signalKey: "attackScore" | "defenseScore",
) {
  const signalValue = snapshot.signals[signalKey];

  if (typeof signalValue !== "number") {
    throw new Error(`Missing baseline ${signalKey} for challenger catalog: ${snapshot.teamKey}`);
  }

  return signalValue;
}

function buildAliasLookup(sourceTeams: TrackedSourceTeam[]) {
  const lookup = new Map<string, TrackedSourceTeam>();

  for (const sourceTeam of sourceTeams) {
    const aliases = [
      sourceTeam.teamKey,
      sourceTeam.databaseNameEn,
      sourceTeam.displayNameEn,
      ...(sourceTeam.aliases ?? []),
    ];

    for (const alias of aliases) {
      const normalized = normalizeKey(alias);
      if (!normalized || lookup.has(normalized)) {
        continue;
      }

      lookup.set(normalized, sourceTeam);
    }
  }

  return lookup;
}

function resolveCanonicalSourceTeam(
  canonicalTeamKey: string,
  aliasLookup: Map<string, TrackedSourceTeam>,
) {
  const team = WORLD_CUP_2026_TEAMS.find((entry) => entry.teamKey === canonicalTeamKey);
  const candidates = [
    canonicalTeamKey,
    team?.displayName,
    team?.fifaOfficialName,
    team?.country,
    ...(team?.aliases ?? []),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const resolved = aliasLookup.get(normalizeKey(candidate));
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function buildRecencyWeights(matches: TrackedRecentMatch[]) {
  if (matches.length <= 1) {
    return matches.map(() => 1);
  }

  const step = (1 - MIN_RECENCY_WEIGHT) / (matches.length - 1);
  return matches.map((_, index) => round(1 - index * step, 4));
}

function sortMatchesDescending(matches: TrackedRecentMatch[]) {
  return [...matches].sort((left, right) => right.date.localeCompare(left.date));
}

function clipGoalsPerMatch(goals: number) {
  return clamp(goals, 0, MAX_CLIPPED_GOALS_PER_MATCH);
}

function resolveOpponentNormalizedStrength(
  opponent: TrackedSourceTeam | null,
  averageEloRating: number,
) {
  if (!opponent) {
    return null;
  }

  return clamp((opponent.runtimeSafeInputs.eloRating - averageEloRating) / OPPONENT_ADJUSTMENT_RANGE, -1, 1);
}

function classifySampleStatusFactor(sampleStatus: string) {
  if (sampleStatus === "complete") {
    return 1;
  }

  if (sampleStatus === "partial_source_window") {
    return 0.82;
  }

  return 0.72;
}

function probabilityToUnit(value: number) {
  return clamp(value / 100, 0, 1);
}

function determineFixtureOutcome(homeGoals: number, awayGoals: number) {
  if (homeGoals > awayGoals) {
    return "home";
  }

  if (awayGoals > homeGoals) {
    return "away";
  }

  return "draw";
}

function determineRegionForTeam(teamKey: string) {
  return TEAM_REGION_BY_KEY[teamKey] ?? null;
}

function topOutcomeSelection(output: PredictionEngineOutput) {
  const options = [
    { selection: "home" as const, probability: output.probabilities.oneXTwo.homeWin },
    { selection: "draw" as const, probability: output.probabilities.oneXTwo.draw },
    { selection: "away" as const, probability: output.probabilities.oneXTwo.awayWin },
  ].sort((left, right) => right.probability - left.probability);

  return options[0] ?? null;
}

function eloFavoriteSelection(fixture: WorldCup2026Fixture, homeSnapshot: NationalTeamStrengthSnapshot, awaySnapshot: NationalTeamStrengthSnapshot) {
  const homeElo = homeSnapshot.eloRating;
  const awayElo = awaySnapshot.eloRating;

  if (typeof homeElo !== "number" || typeof awayElo !== "number" || homeElo === awayElo) {
    return null;
  }

  return homeElo > awayElo ? "home" : "away";
}

function buildCalibrationBuckets(rows: Array<{ topProbability: number; wasCorrect: boolean }>) {
  return CALIBRATION_BUCKET_EDGES.slice(0, -1).map((start, index) => {
    const end = CALIBRATION_BUCKET_EDGES[index + 1] ?? 101;
    const bucketRows = rows.filter((row) => row.topProbability >= start && row.topProbability < end);
    const hitCount = bucketRows.filter((row) => row.wasCorrect).length;

    return {
      bucketLabel: `${start}-${end - 1}%`,
      fixtureCount: bucketRows.length,
      averageTopProbability:
        bucketRows.length === 0
          ? null
          : round(bucketRows.reduce((total, row) => total + row.topProbability, 0) / bucketRows.length, 2),
      actualTopOutcomeHitRate:
        bucketRows.length === 0
          ? null
          : round((hitCount / bucketRows.length) * 100, 2),
    };
  });
}

function buildRegionalSlices(rows: Array<{
  region: "CAF" | "AFC";
  regionTeamWon: boolean;
  regionTeamWinProbability: number;
}>) {
  return (["CAF", "AFC"] as const).map((region) => {
    const regionRows = rows.filter((row) => row.region === region);
    const winCount = regionRows.filter((row) => row.regionTeamWon).length;

    return {
      region,
      fixtureCount: regionRows.length,
      averageRegionTeamWinProbability:
        regionRows.length === 0
          ? null
          : round(regionRows.reduce((total, row) => total + row.regionTeamWinProbability, 0) / regionRows.length, 2),
      actualRegionTeamWinRate:
        regionRows.length === 0
          ? null
          : round((winCount / regionRows.length) * 100, 2),
      underestimationGap:
        regionRows.length === 0
          ? null
          : round((winCount / regionRows.length) * 100 - regionRows.reduce((total, row) => total + row.regionTeamWinProbability, 0) / regionRows.length, 2),
    };
  });
}

export function buildRecentFormChallengerCatalog(args: {
  sourceSnapshot: TrackedSourceSnapshot;
  baselineSnapshots: NationalTeamStrengthSnapshot[];
}): Map<string, RecentFormChallengerTeamDiagnostics> {
  const aliasLookup = buildAliasLookup(args.sourceSnapshot.teams);
  const baselineByTeamKey = new Map(args.baselineSnapshots.map((snapshot) => [snapshot.teamKey, snapshot]));
  const sourceByTeamKey = new Map<string, TrackedSourceTeam>();

  for (const team of WORLD_CUP_2026_TEAMS) {
    const sourceTeam = resolveCanonicalSourceTeam(team.teamKey, aliasLookup);
    if (sourceTeam) {
      sourceByTeamKey.set(team.teamKey, sourceTeam);
    }
  }

  const averageEloRating =
    args.sourceSnapshot.teams.reduce((total, team) => total + team.runtimeSafeInputs.eloRating, 0) /
    args.sourceSnapshot.teams.length;

  const rawTeamDiagnostics = WORLD_CUP_2026_TEAMS.map((team) => {
    const baselineSnapshot = baselineByTeamKey.get(team.teamKey);
    const sourceTeam = sourceByTeamKey.get(team.teamKey);

    if (!baselineSnapshot || !sourceTeam) {
      throw new Error(`Missing baseline or tracked source team for challenger catalog: ${team.teamKey}`);
    }

    const sortedMatches = sortMatchesDescending(sourceTeam.recent.last5 ?? []);
    const recencyWeights = buildRecencyWeights(sortedMatches);
    const weightedBreakdown = sortedMatches.map((match, index) => {
      const opponentTeam =
        match.opponentIsCanonicalWorldCupTeam
          ? resolveCanonicalSourceTeam(match.opponentKey.replace(/^external:/, ""), aliasLookup)
          : null;
      const normalizedStrength = resolveOpponentNormalizedStrength(opponentTeam, averageEloRating);
      const opponentAttackMultiplier =
        normalizedStrength === null ? 1 : round(clamp(1 + normalizedStrength * OPPONENT_ADJUSTMENT_INFLUENCE, 0.88, 1.12), 4);
      const opponentDefenseMultiplier =
        normalizedStrength === null ? 1 : round(clamp(1 - normalizedStrength * OPPONENT_ADJUSTMENT_INFLUENCE, 0.88, 1.12), 4);
      const clippedGoalsFor = clipGoalsPerMatch(match.goalsFor);
      const clippedGoalsAgainst = clipGoalsPerMatch(match.goalsAgainst);

      return {
        date: match.date,
        opponent: match.opponent,
        opponentKey: match.opponentKey,
        recencyWeight: recencyWeights[index] ?? 1,
        clippedGoalsFor,
        clippedGoalsAgainst,
        opponentAttackMultiplier,
        opponentDefenseMultiplier,
        adjustedGoalsFor: round(clippedGoalsFor * opponentAttackMultiplier, 4),
        adjustedGoalsAgainst: round(clippedGoalsAgainst * opponentDefenseMultiplier, 4),
      } satisfies RecentFormChallengerMatchBreakdown;
    });

    const totalWeight = weightedBreakdown.reduce((total, match) => total + match.recencyWeight, 0) || 1;
    const weightedAdjustedGoalsForPerMatch = round(
      weightedBreakdown.reduce((total, match) => total + match.adjustedGoalsFor * match.recencyWeight, 0) / totalWeight,
      4,
    );
    const weightedAdjustedGoalsAgainstPerMatch = round(
      weightedBreakdown.reduce((total, match) => total + match.adjustedGoalsAgainst * match.recencyWeight, 0) / totalWeight,
      4,
    );
    const canonicalOpponentMatches = weightedBreakdown.filter((match) => !match.opponentKey.startsWith("external:"));
    const canonicalOpponentShare =
      weightedBreakdown.length === 0 ? 0 : canonicalOpponentMatches.length / weightedBreakdown.length;
    const worldCupOpponentShare =
      weightedBreakdown.length === 0
        ? 0
        : clamp((sourceTeam.runtimeSafeInputs.recentWorldCupMatchCount ?? sourceTeam.recent.recentWorldCupMatchCount) / weightedBreakdown.length, 0, 1);
    const countFactor = clamp(sourceTeam.runtimeSafeInputs.recentMatchCount / COMPLETE_RECENT_SAMPLE_TARGET, 0, 1);
    const statusFactor = classifySampleStatusFactor(sourceTeam.recent.sampleStatus);
    const sampleReliability = round(
      clamp(
        countFactor *
          statusFactor *
          (0.75 + canonicalOpponentShare * 0.25) *
          (0.9 + worldCupOpponentShare * 0.1),
        0.3,
        1,
      ),
      4,
    );

    return {
      team,
      baselineSnapshot,
      sourceTeam,
      weightedAdjustedGoalsForPerMatch,
      weightedAdjustedGoalsAgainstPerMatch,
      sampleReliability,
      sampleReliabilityFactors: {
        countFactor: round(countFactor, 4),
        statusFactor: round(statusFactor, 4),
        canonicalOpponentShare: round(canonicalOpponentShare, 4),
        worldCupOpponentShare: round(worldCupOpponentShare, 4),
      },
      weightedBreakdown,
      supportedOpponentAdjustments: weightedBreakdown.filter(
        (match) => match.opponentAttackMultiplier !== 1 || match.opponentDefenseMultiplier !== 1,
      ),
    };
  });

  const attackBounds = {
    min: Math.min(...rawTeamDiagnostics.map((team) => team.weightedAdjustedGoalsForPerMatch)),
    max: Math.max(...rawTeamDiagnostics.map((team) => team.weightedAdjustedGoalsForPerMatch)),
  };
  const defenseBounds = {
    min: Math.min(...rawTeamDiagnostics.map((team) => team.weightedAdjustedGoalsAgainstPerMatch)),
    max: Math.max(...rawTeamDiagnostics.map((team) => team.weightedAdjustedGoalsAgainstPerMatch)),
  };

  const diagnostics = rawTeamDiagnostics.map((entry) => {
    const recentAttackScore = scale(entry.weightedAdjustedGoalsForPerMatch, attackBounds.min, attackBounds.max);
    const recentDefenseScore = scale(
      entry.weightedAdjustedGoalsAgainstPerMatch,
      defenseBounds.min,
      defenseBounds.max,
      { invert: true },
    );
    const historicalAttackScore = requireSignalScore(entry.baselineSnapshot, "attackScore");
    const historicalDefenseScore = requireSignalScore(entry.baselineSnapshot, "defenseScore");
    const stabilizedRecentAttackScore = round(
      historicalAttackScore * (1 - entry.sampleReliability) + recentAttackScore * entry.sampleReliability,
      2,
    );
    const stabilizedRecentDefenseScore = round(
      historicalDefenseScore * (1 - entry.sampleReliability) + recentDefenseScore * entry.sampleReliability,
      2,
    );
    const variantSignals = Object.fromEntries(
      RECENT_FORM_CHALLENGER_VARIANTS.map((variant) => [
        variant.key,
        {
          attackScore: round(
            historicalAttackScore * (1 - variant.recentWeight) + stabilizedRecentAttackScore * variant.recentWeight,
            2,
          ),
          defenseScore: round(
            historicalDefenseScore * (1 - variant.recentWeight) + stabilizedRecentDefenseScore * variant.recentWeight,
            2,
          ),
        },
      ]),
    ) as RecentFormChallengerTeamDiagnostics["variantSignals"];

    return {
      teamKey: entry.team.teamKey,
      displayName: entry.team.displayName,
      sourceSnapshotDate: args.sourceSnapshot.snapshotDate,
      historicalAttackScore,
      historicalDefenseScore,
      recentAttackScore,
      recentDefenseScore,
      stabilizedRecentAttackScore,
      stabilizedRecentDefenseScore,
      sampleReliability: round(entry.sampleReliability * 100, 2),
      sampleReliabilityFactors: entry.sampleReliabilityFactors,
      opponentStrengthAdjustment: {
        supportedMatchCount: entry.supportedOpponentAdjustments.length,
        totalMatchCount: entry.weightedBreakdown.length,
        averageAttackMultiplier:
          entry.weightedBreakdown.length === 0
            ? 1
            : round(
              entry.weightedBreakdown.reduce((total, match) => total + match.opponentAttackMultiplier * match.recencyWeight, 0) /
                entry.weightedBreakdown.reduce((total, match) => total + match.recencyWeight, 0),
              4,
            ),
        averageDefenseMultiplier:
          entry.weightedBreakdown.length === 0
            ? 1
            : round(
              entry.weightedBreakdown.reduce((total, match) => total + match.opponentDefenseMultiplier * match.recencyWeight, 0) /
                entry.weightedBreakdown.reduce((total, match) => total + match.recencyWeight, 0),
              4,
            ),
      },
      recentWindow: {
        sampleStatus: entry.sourceTeam.recent.sampleStatus,
        recentMatchCount: entry.sourceTeam.runtimeSafeInputs.recentMatchCount,
        recentWorldCupMatchCount: entry.sourceTeam.runtimeSafeInputs.recentWorldCupMatchCount ?? entry.sourceTeam.recent.recentWorldCupMatchCount,
        weightedAdjustedGoalsForPerMatch: entry.weightedAdjustedGoalsForPerMatch,
        weightedAdjustedGoalsAgainstPerMatch: entry.weightedAdjustedGoalsAgainstPerMatch,
        matches: entry.weightedBreakdown,
      },
      variantSignals,
    } satisfies RecentFormChallengerTeamDiagnostics;
  });

  return new Map(diagnostics.map((entry) => [entry.teamKey, entry]));
}

export function buildRecentFormChallengerPredictionInput(args: {
  fixture: WorldCup2026Fixture;
  homeBaselineSnapshot: NationalTeamStrengthSnapshot;
  awayBaselineSnapshot: NationalTeamStrengthSnapshot;
  homeDiagnostics: RecentFormChallengerTeamDiagnostics;
  awayDiagnostics: RecentFormChallengerTeamDiagnostics;
  variantKey: RecentFormChallengerVariantKey;
}) {
  const homeVariant = args.homeDiagnostics.variantSignals[args.variantKey];
  const awayVariant = args.awayDiagnostics.variantSignals[args.variantKey];

  return {
    matchId: args.fixture.fixtureKey,
    homeTeam: {
      id: args.fixture.homeTeamKey,
      name: args.homeBaselineSnapshot.displayName,
      signals: {
        ...args.homeBaselineSnapshot.signals,
        attackScore: homeVariant.attackScore,
        defenseScore: homeVariant.defenseScore,
      },
      metadata: buildNationalTeamStrengthMetadata(args.homeBaselineSnapshot),
    },
    awayTeam: {
      id: args.fixture.awayTeamKey,
      name: args.awayBaselineSnapshot.displayName,
      signals: {
        ...args.awayBaselineSnapshot.signals,
        attackScore: awayVariant.attackScore,
        defenseScore: awayVariant.defenseScore,
      },
      metadata: buildNationalTeamStrengthMetadata(args.awayBaselineSnapshot),
    },
    context: {
      neutralVenue: false,
    },
    runScope: "internal_lab",
    predictionType: "pre_match_24h",
  } satisfies MatchPredictionInput;
}

export function buildBaselinePredictionInput(args: {
  fixture: WorldCup2026Fixture;
  homeBaselineSnapshot: NationalTeamStrengthSnapshot;
  awayBaselineSnapshot: NationalTeamStrengthSnapshot;
}) {
  return {
    matchId: args.fixture.fixtureKey,
    homeTeam: {
      id: args.fixture.homeTeamKey,
      name: args.homeBaselineSnapshot.displayName,
      signals: {
        ...args.homeBaselineSnapshot.signals,
      },
      metadata: buildNationalTeamStrengthMetadata(args.homeBaselineSnapshot),
    },
    awayTeam: {
      id: args.fixture.awayTeamKey,
      name: args.awayBaselineSnapshot.displayName,
      signals: {
        ...args.awayBaselineSnapshot.signals,
      },
      metadata: buildNationalTeamStrengthMetadata(args.awayBaselineSnapshot),
    },
    context: {
      neutralVenue: false,
    },
    runScope: "internal_lab",
    predictionType: "pre_match_24h",
  } satisfies MatchPredictionInput;
}

export function isFutureShadowEligibleFixture(fixture: Pick<WorldCup2026Fixture, "kickoffAt">, asOfIso: string) {
  return fixture.kickoffAt > asOfIso;
}

export function assessTimeSafeHistoricalEvaluation(args: {
  kickoffAt: string;
  sourceSnapshotDate: string | null;
  predictionCreatedAt: string | null;
}) {
  const reasons: string[] = [];

  if (!args.sourceSnapshotDate) {
    reasons.push("missing_source_snapshot_date");
  } else if (args.sourceSnapshotDate >= args.kickoffAt.slice(0, 10)) {
    reasons.push("source_snapshot_not_provably_pre_kickoff");
  }

  if (!args.predictionCreatedAt) {
    reasons.push("missing_prediction_created_at");
  } else if (args.predictionCreatedAt >= args.kickoffAt) {
    reasons.push("prediction_created_at_not_pre_kickoff");
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  } satisfies TimeSafeEvaluationEligibility;
}

export function findConfidenceSupportWarning(output: PredictionEngineOutput) {
  const topOutcome = topOutcomeSelection(output);
  const topScorelineProbability = output.topScorelines[0]?.probability ?? 0;

  if (!topOutcome) {
    return null;
  }

  if (
    output.confidence >= OPERATOR_CONFIDENCE_THRESHOLD &&
    (topOutcome.probability < OPERATOR_TOP_OUTCOME_THRESHOLD || topScorelineProbability < OPERATOR_TOP_SCORELINE_THRESHOLD)
  ) {
    return {
      confidenceScore: output.confidence,
      topOutcomeProbability: topOutcome.probability,
      topScorelineProbability,
      reason:
        "Confidence is high while either the top 1X2 probability or the modal-score concentration stays below the challenger support threshold.",
    };
  }

  return null;
}

export function evaluateChallengerVariantPerformance(args: {
  rows: Array<{
    fixture: WorldCup2026Fixture;
    output: PredictionEngineOutput;
    homeSnapshot: NationalTeamStrengthSnapshot;
    awaySnapshot: NationalTeamStrengthSnapshot;
    result: MatchResultInput;
    eligibility: TimeSafeEvaluationEligibility;
    predictionCreatedAt: string | null;
  }>;
}) {
  const evaluableRows = args.rows.filter((row) => row.eligibility.eligible);
  const evaluations: Array<{
    row: (typeof evaluableRows)[number];
    evaluation: PredictionEvaluation;
  }> = evaluableRows.map((row) => ({
    row,
    evaluation: evaluatePrediction(
      {
        predictionVersionId: `${row.fixture.fixtureKey}:shadow`,
        matchId: row.output.matchId,
        probabilities: row.output.probabilities,
        mostLikelyScore: row.output.mostLikelyScore,
        topScorelines: row.output.topScorelines,
      },
      row.result,
    ),
  }));

  const scored = evaluations.filter(
    (entry): entry is typeof entry & { evaluation: Extract<PredictionEvaluation, { status: "evaluable" }> } =>
      entry.evaluation.status === "evaluable",
  );

  const brierScores: number[] = [];
  const logLosses: number[] = [];
  const totalGoalErrors: number[] = [];
  const homeXgErrors: number[] = [];
  const awayXgErrors: number[] = [];
  const calibrationRows: Array<{ topProbability: number; wasCorrect: boolean }> = [];
  const regionalRows: Array<{
    region: "CAF" | "AFC";
    regionTeamWon: boolean;
    regionTeamWinProbability: number;
  }> = [];
  let highConfidenceWrongPredictions = 0;
  let favoriteInversionCount = 0;

  for (const entry of scored) {
    const actualOutcome = determineFixtureOutcome(entry.row.result.homeGoals, entry.row.result.awayGoals);
    const homeProbability = probabilityToUnit(entry.row.output.probabilities.oneXTwo.homeWin);
    const drawProbability = probabilityToUnit(entry.row.output.probabilities.oneXTwo.draw);
    const awayProbability = probabilityToUnit(entry.row.output.probabilities.oneXTwo.awayWin);
    const outcomeVector =
      actualOutcome === "home" ? [1, 0, 0]
      : actualOutcome === "draw" ? [0, 1, 0]
      : [0, 0, 1];
    const probabilities = [homeProbability, drawProbability, awayProbability];

    brierScores.push(
      round(
        probabilities.reduce((total, probability, index) => total + (probability - outcomeVector[index]!) ** 2, 0) / probabilities.length,
        6,
      ),
    );
    const actualProbability =
      actualOutcome === "home" ? homeProbability
      : actualOutcome === "draw" ? drawProbability
      : awayProbability;
    logLosses.push(round(-Math.log(Math.max(actualProbability, PROBABILITY_EPSILON)), 6));
    totalGoalErrors.push(round(Math.abs(entry.row.output.expectedGoals.home + entry.row.output.expectedGoals.away - (entry.row.result.homeGoals + entry.row.result.awayGoals)), 6));
    homeXgErrors.push(round(Math.abs(entry.row.output.expectedGoals.home - entry.row.result.homeGoals), 6));
    awayXgErrors.push(round(Math.abs(entry.row.output.expectedGoals.away - entry.row.result.awayGoals), 6));

    const topOutcome = topOutcomeSelection(entry.row.output);
    if (topOutcome) {
      calibrationRows.push({
        topProbability: topOutcome.probability,
        wasCorrect: topOutcome.selection === actualOutcome,
      });

      if (
        entry.row.output.confidence >= OPERATOR_CONFIDENCE_THRESHOLD &&
        topOutcome.selection !== actualOutcome
      ) {
        highConfidenceWrongPredictions += 1;
      }
    }

    const eloFavorite = eloFavoriteSelection(entry.row.fixture, entry.row.homeSnapshot, entry.row.awaySnapshot);
    if (eloFavorite && topOutcome && topOutcome.selection !== "draw" && topOutcome.selection !== eloFavorite) {
      favoriteInversionCount += 1;
    }

    const homeRegion = determineRegionForTeam(entry.row.fixture.homeTeamKey);
    const awayRegion = determineRegionForTeam(entry.row.fixture.awayTeamKey);

    if (homeRegion) {
      regionalRows.push({
        region: homeRegion,
        regionTeamWon: actualOutcome === "home",
        regionTeamWinProbability: entry.row.output.probabilities.oneXTwo.homeWin,
      });
    }

    if (awayRegion) {
      regionalRows.push({
        region: awayRegion,
        regionTeamWon: actualOutcome === "away",
        regionTeamWinProbability: entry.row.output.probabilities.oneXTwo.awayWin,
      });
    }
  }

  const average = (values: number[]) => values.length === 0 ? null : round(values.reduce((total, value) => total + value, 0) / values.length, 6);
  const exactScoreCorrectCount = scored.filter((entry) => entry.evaluation.metrics.exactScoreCorrect).length;
  const oneXTwoCorrectCount = scored.filter((entry) => entry.evaluation.metrics.winnerCorrect === true).length;

  return {
    evaluatedFixtureCount: scored.length,
    oneXTwoHitRate: scored.length === 0 ? null : round((oneXTwoCorrectCount / scored.length) * 100, 2),
    brierScore: average(brierScores),
    logLoss: average(logLosses),
    exactScoreHitRate: scored.length === 0 ? null : round((exactScoreCorrectCount / scored.length) * 100, 2),
    totalGoalError: average(totalGoalErrors),
    averageHomeXgAbsoluteError: average(homeXgErrors),
    averageAwayXgAbsoluteError: average(awayXgErrors),
    highConfidenceWrongPredictions,
    favoriteInversionAgainstElo: {
      count: favoriteInversionCount,
      total: scored.length,
      rate: scored.length === 0 ? null : round((favoriteInversionCount / scored.length) * 100, 2),
    },
    calibrationBuckets: buildCalibrationBuckets(calibrationRows),
    regionalSlices: buildRegionalSlices(regionalRows),
  } satisfies ChallengerVariantPerformanceSummary;
}
