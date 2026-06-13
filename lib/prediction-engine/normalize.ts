import type {
  MatchPredictionInput,
  NormalizedMatchInput,
  NormalizedTeamInput,
  PredictionEngineConfig,
  TeamStrengthMetadata,
  TeamPredictionInput,
  TeamSignalKey,
} from "./types";

export const TEAM_SIGNAL_KEYS: TeamSignalKey[] = [
  "ratingScore",
  "recentFormScore",
  "attackScore",
  "defenseScore",
  "marketScore",
  "lineupContextScore",
];

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function round(value: number, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function isUsableNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeMetadata(metadata: TeamPredictionInput["metadata"]): TeamStrengthMetadata | undefined {
  if (!metadata) {
    return undefined;
  }

  const normalized: TeamStrengthMetadata = {};

  if (isUsableNumber(metadata.fifaRank)) {
    normalized.fifaRank = Math.max(1, metadata.fifaRank);
  }

  if (isUsableNumber(metadata.fifaPoints)) {
    normalized.fifaPoints = Math.max(0, metadata.fifaPoints);
  }

  if (isUsableNumber(metadata.eloRank)) {
    normalized.eloRank = Math.max(1, metadata.eloRank);
  }

  if (isUsableNumber(metadata.eloRating)) {
    normalized.eloRating = Math.max(0, metadata.eloRating);
  }

  if (isUsableNumber(metadata.eloAverageRank)) {
    normalized.eloAverageRank = Math.max(1, metadata.eloAverageRank);
  }

  if (isUsableNumber(metadata.eloAverageRating)) {
    normalized.eloAverageRating = Math.max(0, metadata.eloAverageRating);
  }

  if (isUsableNumber(metadata.historicalGoalsForPerMatch)) {
    normalized.historicalGoalsForPerMatch = Math.max(0, metadata.historicalGoalsForPerMatch);
  }

  if (isUsableNumber(metadata.historicalGoalsAgainstPerMatch)) {
    normalized.historicalGoalsAgainstPerMatch = Math.max(0, metadata.historicalGoalsAgainstPerMatch);
  }

  if (isUsableNumber(metadata.recentMatchCount)) {
    normalized.recentMatchCount = Math.max(0, metadata.recentMatchCount);
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeTeam(team: TeamPredictionInput, config: PredictionEngineConfig): NormalizedTeamInput {
  const providedSignals: TeamSignalKey[] = [];
  const defaultedSignals: TeamSignalKey[] = [];
  const signals = {} as Record<TeamSignalKey, number>;

  for (const key of TEAM_SIGNAL_KEYS) {
    const candidate = team.signals?.[key];

    if (isUsableNumber(candidate)) {
      signals[key] = clamp(candidate, 0, 100);
      providedSignals.push(key);
    } else {
      signals[key] = config.defaultSignalScore;
      defaultedSignals.push(key);
    }
  }

  return {
    id: team.id,
    name: team.name,
    signals,
    metadata: normalizeMetadata(team.metadata),
    providedSignals,
    defaultedSignals,
  };
}

export function normalizeInput(input: MatchPredictionInput, config: PredictionEngineConfig): NormalizedMatchInput {
  const homeTeam = normalizeTeam(input.homeTeam, config);
  const awayTeam = normalizeTeam(input.awayTeam, config);
  const neutralVenue = input.context?.neutralVenue ?? false;
  const rawHomeAdvantage = input.context?.homeAdvantageScore;
  const homeAdvantageScore = neutralVenue
    ? 50
    : isUsableNumber(rawHomeAdvantage)
      ? clamp(rawHomeAdvantage, 0, 100)
      : config.defaultHomeAdvantageScore;
  const suppliedCount = homeTeam.providedSignals.length + awayTeam.providedSignals.length;
  const dataCompleteness = round(suppliedCount / (TEAM_SIGNAL_KEYS.length * 2));
  const notes: string[] = [];

  if (homeTeam.defaultedSignals.length > 0) {
    notes.push(`Default signals used for ${homeTeam.name}: ${homeTeam.defaultedSignals.join(", ")}.`);
  }

  if (awayTeam.defaultedSignals.length > 0) {
    notes.push(`Default signals used for ${awayTeam.name}: ${awayTeam.defaultedSignals.join(", ")}.`);
  }

  if (homeTeam.defaultedSignals.includes("marketScore") || awayTeam.defaultedSignals.includes("marketScore")) {
    notes.push("Market score is neutral when no market signal is supplied; no real odds are consumed.");
  }

  return {
    matchId: input.matchId,
    homeTeam,
    awayTeam,
    context: {
      neutralVenue,
      homeAdvantageScore,
    },
    runScope: input.runScope ?? "internal_lab",
    predictionType: input.predictionType ?? "pre_match_24h",
    dataCompleteness,
    notes,
  };
}
