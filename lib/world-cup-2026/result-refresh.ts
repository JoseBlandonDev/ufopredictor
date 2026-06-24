import { evaluatePrediction } from "../model-evaluation";
import type { ProviderFixture } from "../football-api/api-football-types";
import { buildApiFootballFixtureExternalId } from "../football-api/ingest/external-ids";
import { arePredictionReviewTeamNamesEquivalent } from "../prediction-review/team-display-names";
import { WORLD_CUP_2026_FIXTURES, WORLD_CUP_2026_TEAMS } from "./index";

export const WORLD_CUP_RESULT_REFRESH_ARTIFACT_VERSION = 1 as const;
export const WORLD_CUP_RESULT_REFRESH_COMPETITION_SLUG = "world-cup-2026" as const;
export const WORLD_CUP_RESULT_REFRESH_PREDICTION_TYPE = "pre_match_24h" as const;
export const WORLD_CUP_RESULT_REFRESH_RUN_SCOPE = "internal_lab" as const;
export const WORLD_CUP_RESULT_REFRESH_VERIFICATION_METHOD = "trusted_provider_auto" as const;

type MatchStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled";
type MatchAccessScope = "admin_only" | "public" | "premium" | "lab_only";
type MatchIntakeSource = "mock" | "manual" | "csv_import" | "api_football";
type MatchResultVerificationStatus = "pending_review" | "verified" | "rejected";
type PredictionRunScope = "public_product" | "internal_lab";

type StoredMatchRow = {
  id: string;
  external_id: string | null;
  slug: string;
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  kickoff_at: string;
  stage: string | null;
  status: MatchStatus;
  access_scope: MatchAccessScope;
  intake_source: MatchIntakeSource;
  source_note: string | null;
};

type StoredTeamRow = {
  id: string;
  name: string;
};

type StoredCompetitionRow = {
  id: string;
  slug: string;
  name: string;
  usage_scope: string;
};

type StoredMatchResultRow = {
  id: string;
  match_id: string;
  home_goals: number;
  away_goals: number;
  verification_status: MatchResultVerificationStatus;
  intake_source: MatchIntakeSource;
  source_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  recorded_at: string;
};

type StoredPredictionVersionRow = {
  id: string;
  match_id: string;
  run_scope: PredictionRunScope;
  prediction_type: string;
  created_at: string;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  most_likely_score: string;
  top_scores_json: unknown;
};

type StoredPredictionMarketRow = {
  prediction_version_id: string;
  market: "btts" | "over_2_5" | "match_winner" | "exact_score";
  selection: string;
  probability: number;
};

type StoredPredictionResultRow = {
  id: string;
  prediction_version_id: string;
  actual_home_goals: number;
  actual_away_goals: number;
  winner_correct: boolean | null;
  btts_correct: boolean | null;
  over_2_5_correct: boolean | null;
  exact_score_correct: boolean | null;
  goal_error: number | null;
  error_summary: string | null;
  validated_at: string;
};

export type WorldCupResultRefreshDatabaseSnapshot = {
  competitions: StoredCompetitionRow[];
  teams: StoredTeamRow[];
  matches: StoredMatchRow[];
  matchResults: StoredMatchResultRow[];
  predictionVersions: StoredPredictionVersionRow[];
  predictionMarkets: StoredPredictionMarketRow[];
  predictionResults: StoredPredictionResultRow[];
};

export type WorldCupResultRefreshAllowlistManifest = {
  version: typeof WORLD_CUP_RESULT_REFRESH_ARTIFACT_VERSION;
  generatedAt: string;
  selection: {
    from: string | null;
    to: string | null;
    matchday: number | null;
  };
  allowlist: {
    matchIds: string[];
    externalIds: string[];
    apiFootballFixtureIds: number[];
  };
};

export type WorldCupResultRefreshSelectionInput = {
  from?: string;
  to?: string;
  matchday?: number;
  matchIds?: string[];
  externalIds?: string[];
  apiFootballFixtureIds?: number[];
};

export type WorldCupResultRefreshApplySelection = {
  matchIds: string[];
  externalIds: string[];
  apiFootballFixtureIds: number[];
};

type CanonicalResolution =
  | {
      status: "resolved";
      fixture: (typeof WORLD_CUP_2026_FIXTURES)[number];
    }
  | {
      status: "conflict";
      reason: string;
    };

type ResultAction =
  | "none"
  | "create_verified"
  | "update_to_verified"
  | "create_pending_review_exception"
  | "update_pending_review_exception"
  | "already_identical"
  | "already_pending_review_exception"
  | "verified_conflict"
  | "rejected_conflict";

type EvaluationAction = "none" | "create" | "update" | "already_stored" | "failure";
type MatchStatusAction = "none" | "update";

export type WorldCupResultRefreshRow = {
  matchId: string;
  externalId: string | null;
  apiFootballFixtureId: number | null;
  slug: string;
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string;
  storedStatus: MatchStatus;
  canonicalFixtureId: string | null;
  matchday: number | null;
  providerStatus: ProviderFixture["status"] | null;
  providerStatusShort: string | null;
  providerHomeGoals: number | null;
  providerAwayGoals: number | null;
  providerTerminalResult: boolean;
  trustedAutoVerifyEligible: boolean;
  statusAction: MatchStatusAction;
  nextStoredStatus: MatchStatus | null;
  resultAction: ResultAction;
  evaluationAction: EvaluationAction;
  exceptionReason: string | null;
  conflictSummary: string | null;
  evaluationFailureReason: string | null;
  resultAlreadyIdentical: boolean;
  evaluationAlreadyStored: boolean;
};

export type WorldCupResultRefreshReport = {
  version: typeof WORLD_CUP_RESULT_REFRESH_ARTIFACT_VERSION;
  generatedAt: string;
  selection: {
    label: string;
    from: string | null;
    to: string | null;
    matchday: number | null;
    matchIds: string[];
    externalIds: string[];
    apiFootballFixtureIds: number[];
  };
  summary: {
    selectedFixtures: number;
    providerTerminalResults: number;
    statusesUpdated: number;
    resultsCreated: number;
    resultsUpdated: number;
    resultsAlreadyIdentical: number;
    resultsVerified: number;
    evaluationsCreated: number;
    evaluationsUpdated: number;
    evaluationsAlreadyStored: number;
    exceptionsOrConflicts: number;
    skippedRows: number;
  };
  rows: WorldCupResultRefreshRow[];
};

export type WorldCupResultRefreshApplyCounts = {
  selected: number;
  statusesUpdated: number;
  resultsCreated: number;
  resultsUpdated: number;
  resultsVerified: number;
  evaluationsCreated: number;
  evaluationsUpdated: number;
  evaluationsAlreadyStored: number;
  exceptionsOrConflicts: number;
  skipped: number;
  evaluationFailures: number;
};

type StoredPredictionEvaluationPayload = {
  actual_home_goals: number;
  actual_away_goals: number;
  winner_correct: boolean | null;
  btts_correct: boolean | null;
  over_2_5_correct: boolean | null;
  exact_score_correct: boolean | null;
  goal_error: number | null;
  error_summary: string | null;
};

export type WorldCupResultRefreshWriteAdapter = {
  updateMatch: (
    matchId: string,
    payload: Partial<Pick<StoredMatchRow, "status">>,
  ) => Promise<void>;
  insertMatchResult: (
    payload: Pick<
      StoredMatchResultRow,
      | "match_id"
      | "home_goals"
      | "away_goals"
      | "verification_status"
      | "intake_source"
      | "source_note"
      | "reviewed_at"
      | "reviewed_by"
      | "recorded_at"
    >,
  ) => Promise<{ id: string }>;
  updateMatchResult: (
    resultId: string,
    payload: Partial<
      Pick<
        StoredMatchResultRow,
        | "home_goals"
        | "away_goals"
        | "verification_status"
        | "intake_source"
        | "source_note"
        | "reviewed_at"
        | "reviewed_by"
        | "recorded_at"
      >
    >,
  ) => Promise<void>;
  insertPredictionResult: (
    payload: {
      prediction_version_id: string;
      actual_home_goals: number;
      actual_away_goals: number;
      winner_correct: boolean | null;
      btts_correct: boolean | null;
      over_2_5_correct: boolean | null;
      exact_score_correct: boolean | null;
      goal_error: number | null;
      error_summary: string | null;
      validated_at: string;
    },
  ) => Promise<{ id: string }>;
  updatePredictionResult: (
    predictionResultId: string,
    payload: {
      actual_home_goals: number;
      actual_away_goals: number;
      winner_correct: boolean | null;
      btts_correct: boolean | null;
      over_2_5_correct: boolean | null;
      exact_score_correct: boolean | null;
      goal_error: number | null;
      error_summary: string | null;
      validated_at: string;
    },
  ) => Promise<void>;
};

const TEAM_BY_KEY = new Map(WORLD_CUP_2026_TEAMS.map((team) => [team.teamKey, team]));

function parseApiFootballFixtureId(externalId: string | null) {
  if (!externalId) {
    return null;
  }

  const match = /^api-football:fixture:(\d+)$/.exec(externalId);
  return match ? Number(match[1]) : null;
}

function normalizeUtcInstant(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const time = Date.parse(value);
  if (!Number.isFinite(time)) {
    return null;
  }

  return new Date(time).toISOString();
}

function sameUtcInstant(left: string | null | undefined, right: string | null | undefined) {
  const normalizedLeft = normalizeUtcInstant(left);
  const normalizedRight = normalizeUtcInstant(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return normalizedLeft === normalizedRight;
}

function dateOnly(value: string) {
  return value.slice(0, 10);
}

function inferMatchday(matchNumber: number) {
  if (matchNumber >= 1 && matchNumber <= 24) {
    return 1;
  }

  if (matchNumber >= 25 && matchNumber <= 48) {
    return 2;
  }

  if (matchNumber >= 49 && matchNumber <= 72) {
    return 3;
  }

  return null;
}

function getCanonicalTeamName(teamKey: (typeof WORLD_CUP_2026_TEAMS)[number]["teamKey"]) {
  const team = TEAM_BY_KEY.get(teamKey);
  if (!team) {
    throw new Error(`Unknown canonical World Cup team key: ${teamKey}`);
  }

  return team.displayName;
}

function resolveCanonicalFixture(args: {
  storedKickoffAt: string;
  storedHomeTeamName: string;
  storedAwayTeamName: string;
  providerFixture: ProviderFixture | null;
}): CanonicalResolution {
  const { storedKickoffAt, storedHomeTeamName, storedAwayTeamName, providerFixture } = args;

  if (providerFixture) {
    const byProviderId = WORLD_CUP_2026_FIXTURES.filter(
      (fixture) => fixture.apiFootballFixtureId === providerFixture.providerFixtureId,
    );

    if (byProviderId.length === 1) {
      const fixture = byProviderId[0]!;
      const canonicalHome = getCanonicalTeamName(fixture.homeTeamKey);
      const canonicalAway = getCanonicalTeamName(fixture.awayTeamKey);

      if (
        !arePredictionReviewTeamNamesEquivalent(canonicalHome, providerFixture.homeTeam.name) ||
        !arePredictionReviewTeamNamesEquivalent(canonicalAway, providerFixture.awayTeam.name)
      ) {
        return {
          status: "conflict",
          reason: `Provider fixture ${providerFixture.providerFixtureId} does not match canonical home/away team order.`,
        };
      }

      return {
        status: "resolved",
        fixture,
      };
    }

    if (byProviderId.length > 1) {
      return {
        status: "conflict",
        reason: `Provider fixture ${providerFixture.providerFixtureId} resolves to multiple canonical fixtures.`,
      };
    }
  }

  const matches = WORLD_CUP_2026_FIXTURES.filter((fixture) => {
    const canonicalHome = getCanonicalTeamName(fixture.homeTeamKey);
    const canonicalAway = getCanonicalTeamName(fixture.awayTeamKey);
    return (
      sameUtcInstant(fixture.kickoffAt, storedKickoffAt) &&
      arePredictionReviewTeamNamesEquivalent(canonicalHome, storedHomeTeamName) &&
      arePredictionReviewTeamNamesEquivalent(canonicalAway, storedAwayTeamName)
    );
  });

  if (matches.length === 1) {
    return {
      status: "resolved",
      fixture: matches[0]!,
    };
  }

  if (matches.length > 1) {
    return {
      status: "conflict",
      reason: `Stored fixture ${storedHomeTeamName} vs ${storedAwayTeamName} matches multiple canonical World Cup fixtures.`,
    };
  }

  return {
    status: "conflict",
    reason: `Stored fixture ${storedHomeTeamName} vs ${storedAwayTeamName} does not resolve to a canonical World Cup fixture.`,
  };
}

function mapProviderStatusShortToStoredStatus(statusShort: string): MatchStatus | null {
  switch (statusShort) {
    case "NS":
    case "TBD":
      return "scheduled";
    case "PST":
      return "postponed";
    case "1H":
    case "2H":
    case "ET":
    case "P":
    case "BT":
    case "HT":
    case "LIVE":
      return "live";
    case "FT":
    case "AET":
    case "PEN":
      return "finished";
    case "CANC":
    case "AWD":
    case "WO":
      return "cancelled";
    case "SUSP":
    case "INT":
    case "ABD":
    default:
      return null;
  }
}

function isSupportedTrustedTerminalStatus(args: {
  canonicalFixture: (typeof WORLD_CUP_2026_FIXTURES)[number];
  providerFixture: ProviderFixture;
}) {
  if (args.canonicalFixture.stage === "group_stage") {
    return args.providerFixture.statusShort === "FT";
  }

  return false;
}

function buildSelectionLabel(input: WorldCupResultRefreshSelectionInput) {
  const parts: string[] = [];

  if (input.matchIds?.length) {
    parts.push(`match_ids_${input.matchIds.length}`);
  }

  if (input.externalIds?.length) {
    parts.push(`external_ids_${input.externalIds.length}`);
  }

  if (input.apiFootballFixtureIds?.length) {
    parts.push(`provider_ids_${input.apiFootballFixtureIds.length}`);
  }

  if (typeof input.matchday === "number") {
    parts.push(`matchday_${input.matchday}`);
  }

  if (input.from || input.to) {
    parts.push(`range_${input.from ?? "start"}_${input.to ?? "end"}`);
  }

  return parts.join("_") || "bounded_selection";
}

function buildVerifiedResultSourceNote(args: {
  providerFixtureId: number;
  providerStatusShort: string;
  providerResponseAt: string;
}) {
  return [
    "world_cup_result_refresh",
    "provider=api_football",
    `provider_fixture_id=${args.providerFixtureId}`,
    `verification_method=${WORLD_CUP_RESULT_REFRESH_VERIFICATION_METHOD}`,
    `provider_status_short=${args.providerStatusShort}`,
    `provider_response_at=${args.providerResponseAt}`,
  ].join(" ");
}

function buildPendingReviewExceptionSourceNote(args: {
  providerFixtureId: number;
  providerStatusShort: string;
  reason: string;
}) {
  return [
    "world_cup_result_refresh_exception",
    "provider=api_football",
    `provider_fixture_id=${args.providerFixtureId}`,
    `provider_status_short=${args.providerStatusShort}`,
    `reason=${args.reason}`,
  ].join(" ");
}

function isPredictionTopScoresArray(value: unknown): value is Array<{ score: string; probability: number }> {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        typeof (entry as { score?: unknown }).score === "string" &&
        typeof (entry as { probability?: unknown }).probability === "number",
    )
  );
}

function resolveEvaluationMarkets(markets: StoredPredictionMarketRow[]) {
  const probabilities = new Map<string, number>();
  const expectedKeys = ["btts:yes", "btts:no", "over_2_5:over", "over_2_5:under"];

  for (const market of markets) {
    if (market.market !== "btts" && market.market !== "over_2_5") {
      continue;
    }

    const key = `${market.market}:${market.selection}`;
    if (expectedKeys.includes(key) && !probabilities.has(key)) {
      probabilities.set(key, market.probability);
    }
  }

  if (!expectedKeys.every((key) => probabilities.has(key))) {
    return null;
  }

  return {
    btts: {
      yes: probabilities.get("btts:yes")!,
      no: probabilities.get("btts:no")!,
    },
    overUnder25: {
      over: probabilities.get("over_2_5:over")!,
      under: probabilities.get("over_2_5:under")!,
    },
  };
}

function buildEvaluationPayload(args: {
  prediction: StoredPredictionVersionRow;
  markets: StoredPredictionMarketRow[];
  result: {
    matchId: string;
    homeGoals: number;
    awayGoals: number;
  };
}): { status: "ready"; payload: StoredPredictionEvaluationPayload } | { status: "failure"; reason: string } {
  const topScores = isPredictionTopScoresArray(args.prediction.top_scores_json)
    ? args.prediction.top_scores_json
    : null;
  const resolvedMarkets = resolveEvaluationMarkets(args.markets);

  if (!topScores || !resolvedMarkets) {
    return {
      status: "failure",
      reason: "prediction_markets_incomplete",
    };
  }

  const evaluation = evaluatePrediction(
    {
      predictionVersionId: args.prediction.id,
      matchId: args.prediction.match_id,
      probabilities: {
        oneXTwo: {
          homeWin: args.prediction.home_win_prob,
          draw: args.prediction.draw_prob,
          awayWin: args.prediction.away_win_prob,
        },
        btts: resolvedMarkets.btts,
        overUnder25: resolvedMarkets.overUnder25,
      },
      mostLikelyScore: args.prediction.most_likely_score,
      topScorelines: topScores,
    },
    {
      matchId: args.result.matchId,
      homeGoals: args.result.homeGoals,
      awayGoals: args.result.awayGoals,
      verificationStatus: "verified",
    },
  );

  if (evaluation.status !== "evaluable" || !evaluation.predictionResultsPayload) {
    return {
      status: "failure",
      reason: evaluation.reason ?? "evaluation_not_evaluable",
    };
  }

  const { prediction_version_id, ...payload } = evaluation.predictionResultsPayload;
  void prediction_version_id;

  return {
    status: "ready",
    payload,
  };
}

function sameResultScore(
  existingResult: Pick<StoredMatchResultRow, "home_goals" | "away_goals"> | null,
  homeGoals: number,
  awayGoals: number,
) {
  return !!existingResult && existingResult.home_goals === homeGoals && existingResult.away_goals === awayGoals;
}

function sameEvaluationPayload(
  existing: StoredPredictionResultRow | null,
  payload: StoredPredictionEvaluationPayload,
) {
  return !!existing &&
    existing.actual_home_goals === payload.actual_home_goals &&
    existing.actual_away_goals === payload.actual_away_goals &&
    existing.winner_correct === payload.winner_correct &&
    existing.btts_correct === payload.btts_correct &&
    existing.over_2_5_correct === payload.over_2_5_correct &&
    existing.exact_score_correct === payload.exact_score_correct &&
    existing.goal_error === payload.goal_error &&
    existing.error_summary === payload.error_summary;
}

function summarizeRowOutcome(row: WorldCupResultRefreshRow) {
  const isException = !!row.exceptionReason || !!row.conflictSummary;
  const isSkipped =
    row.resultAction === "none" &&
    row.statusAction === "none" &&
    row.evaluationAction === "none" &&
    !isException &&
    !row.resultAlreadyIdentical &&
    !row.evaluationAlreadyStored;

  return { isException, isSkipped };
}

export function buildWorldCupResultRefreshSelection(
  snapshot: WorldCupResultRefreshDatabaseSnapshot,
  input: WorldCupResultRefreshSelectionInput,
) {
  const explicitMatchIds = new Set(input.matchIds ?? []);
  const explicitExternalIds = new Set(input.externalIds ?? []);
  const explicitProviderIds = new Set(input.apiFootballFixtureIds ?? []);
  const requireExplicitBounds =
    explicitMatchIds.size > 0 ||
    explicitExternalIds.size > 0 ||
    explicitProviderIds.size > 0 ||
    typeof input.matchday === "number" ||
    typeof input.from === "string" ||
    typeof input.to === "string";

  if (!requireExplicitBounds) {
    throw new Error(
      "Result refresh requires an explicit bounded selection via exact fixture ids, date range, or matchday.",
    );
  }

  const teamById = new Map(snapshot.teams.map((team) => [team.id, team]));
  const selectedMatches = snapshot.matches.filter((match) => {
    const providerFixtureId = parseApiFootballFixtureId(match.external_id);
    const homeTeamName = teamById.get(match.home_team_id)?.name ?? "";
    const awayTeamName = teamById.get(match.away_team_id)?.name ?? "";
    const canonicalResolution = resolveCanonicalFixture({
      storedKickoffAt: match.kickoff_at,
      storedHomeTeamName: homeTeamName,
      storedAwayTeamName: awayTeamName,
      providerFixture: null,
    });
    const matchday =
      canonicalResolution.status === "resolved" ? inferMatchday(canonicalResolution.fixture.matchNumber) : null;

    const explicitMatch =
      explicitMatchIds.has(match.id) ||
      (match.external_id ? explicitExternalIds.has(match.external_id) : false) ||
      (providerFixtureId !== null && explicitProviderIds.has(providerFixtureId));
    const dateMatch =
      (!input.from || dateOnly(match.kickoff_at) >= input.from) &&
      (!input.to || dateOnly(match.kickoff_at) <= input.to);
    const matchdayMatch = typeof input.matchday !== "number" || matchday === input.matchday;
    const hasExplicitSelector = explicitMatchIds.size > 0 || explicitExternalIds.size > 0 || explicitProviderIds.size > 0;

    return (hasExplicitSelector ? explicitMatch : true) && dateMatch && matchdayMatch;
  });

  return {
    label: buildSelectionLabel(input),
    from: input.from ?? null,
    to: input.to ?? null,
    matchday: input.matchday ?? null,
    matches: selectedMatches.sort((left, right) => left.kickoff_at.localeCompare(right.kickoff_at)),
  };
}

export function buildWorldCupResultRefreshAllowlistManifest(
  selectedMatches: StoredMatchRow[],
  input: WorldCupResultRefreshSelectionInput,
  generatedAt: string,
): WorldCupResultRefreshAllowlistManifest {
  const externalIds = selectedMatches.flatMap((match) => (match.external_id ? [match.external_id] : []));
  const apiFootballFixtureIds = externalIds
    .map((externalId) => parseApiFootballFixtureId(externalId))
    .filter((fixtureId): fixtureId is number => fixtureId !== null);

  return {
    version: WORLD_CUP_RESULT_REFRESH_ARTIFACT_VERSION,
    generatedAt,
    selection: {
      from: input.from ?? null,
      to: input.to ?? null,
      matchday: input.matchday ?? null,
    },
    allowlist: {
      matchIds: selectedMatches.map((match) => match.id),
      externalIds,
      apiFootballFixtureIds,
    },
  };
}

export function resolveWorldCupResultRefreshApplySelection(args: {
  selectedMatches: StoredMatchRow[];
  allowMatchIds?: string[];
  allowExternalIds?: string[];
  allowApiFootballFixtureIds?: number[];
  allowlistManifest?: WorldCupResultRefreshAllowlistManifest | null;
}) {
  const matchIds = new Set(args.allowMatchIds ?? []);
  const externalIds = new Set(args.allowExternalIds ?? []);
  const apiFootballFixtureIds = new Set(args.allowApiFootballFixtureIds ?? []);

  for (const matchId of args.allowlistManifest?.allowlist.matchIds ?? []) {
    matchIds.add(matchId);
  }

  for (const externalId of args.allowlistManifest?.allowlist.externalIds ?? []) {
    externalIds.add(externalId);
  }

  for (const fixtureId of args.allowlistManifest?.allowlist.apiFootballFixtureIds ?? []) {
    apiFootballFixtureIds.add(fixtureId);
  }

  if (matchIds.size === 0 && externalIds.size === 0 && apiFootballFixtureIds.size === 0) {
    throw new Error(
      "Apply mode requires an exact allowlist via match ids, external ids, API-Football fixture ids, or an allowlist manifest.",
    );
  }

  const allowedMatches = args.selectedMatches.filter((match) => {
    if (matchIds.has(match.id)) {
      return true;
    }

    if (match.external_id && externalIds.has(match.external_id)) {
      return true;
    }

    const providerFixtureId = parseApiFootballFixtureId(match.external_id);
    return providerFixtureId !== null && apiFootballFixtureIds.has(providerFixtureId);
  });

  return {
    matchIds: allowedMatches.map((match) => match.id),
    externalIds: allowedMatches.flatMap((match) => (match.external_id ? [match.external_id] : [])),
    apiFootballFixtureIds: allowedMatches
      .flatMap((match) => {
        const fixtureId = parseApiFootballFixtureId(match.external_id);
        return fixtureId === null ? [] : [fixtureId];
      })
      .sort((left, right) => left - right),
  } satisfies WorldCupResultRefreshApplySelection;
}

export function planWorldCupResultRefresh(args: {
  generatedAt: string;
  selection: ReturnType<typeof buildWorldCupResultRefreshSelection>;
  snapshot: WorldCupResultRefreshDatabaseSnapshot;
  providerFixtures: ProviderFixture[];
}): WorldCupResultRefreshReport {
  const competitionById = new Map(args.snapshot.competitions.map((competition) => [competition.id, competition]));
  const teamById = new Map(args.snapshot.teams.map((team) => [team.id, team]));
  const resultByMatchId = new Map(args.snapshot.matchResults.map((result) => [result.match_id, result]));
  const predictionVersionsByMatchId = new Map<string, StoredPredictionVersionRow[]>();
  const predictionMarketsByPredictionId = new Map<string, StoredPredictionMarketRow[]>();
  const predictionResultsByPredictionId = new Map(
    args.snapshot.predictionResults.map((result) => [result.prediction_version_id, result]),
  );

  for (const prediction of args.snapshot.predictionVersions) {
    const collection = predictionVersionsByMatchId.get(prediction.match_id) ?? [];
    collection.push(prediction);
    predictionVersionsByMatchId.set(prediction.match_id, collection);
  }

  for (const market of args.snapshot.predictionMarkets) {
    const collection = predictionMarketsByPredictionId.get(market.prediction_version_id) ?? [];
    collection.push(market);
    predictionMarketsByPredictionId.set(market.prediction_version_id, collection);
  }

  for (const collection of predictionVersionsByMatchId.values()) {
    collection.sort((left, right) => right.created_at.localeCompare(left.created_at));
  }

  const providerFixtureById = new Map(args.providerFixtures.map((fixture) => [fixture.providerFixtureId, fixture]));
  const rows = args.selection.matches.map((match) => {
    const homeTeamName = teamById.get(match.home_team_id)?.name ?? "Unknown home team";
    const awayTeamName = teamById.get(match.away_team_id)?.name ?? "Unknown away team";
    const providerFixtureId = parseApiFootballFixtureId(match.external_id);
    const providerFixture = providerFixtureId === null ? null : providerFixtureById.get(providerFixtureId) ?? null;
    const canonicalResolution = resolveCanonicalFixture({
      storedKickoffAt: match.kickoff_at,
      storedHomeTeamName: homeTeamName,
      storedAwayTeamName: awayTeamName,
      providerFixture,
    });
    const canonicalFixture = canonicalResolution.status === "resolved" ? canonicalResolution.fixture : null;
    const existingResult = resultByMatchId.get(match.id) ?? null;
    const competitionName = competitionById.get(match.competition_id)?.name ?? "Unknown competition";
    const providerStatus = providerFixture?.status ?? null;
    const providerStatusShort = providerFixture?.statusShort ?? null;
    const providerHomeGoals = providerFixture?.goals.home ?? null;
    const providerAwayGoals = providerFixture?.goals.away ?? null;
    const providerTerminalResult =
      providerFixture !== null &&
      providerFixture.status === "finished" &&
      typeof providerHomeGoals === "number" &&
      typeof providerAwayGoals === "number";
    const nextStoredStatus = providerStatusShort ? mapProviderStatusShortToStoredStatus(providerStatusShort) : null;
    const statusAction =
      nextStoredStatus !== null && nextStoredStatus !== match.status ? ("update" as const) : ("none" as const);

    let trustedAutoVerifyEligible = false;
    let resultAction: ResultAction = "none";
    let evaluationAction: EvaluationAction = "none";
    let exceptionReason: string | null = null;
    let conflictSummary: string | null = null;
    let evaluationFailureReason: string | null = null;
    let resultAlreadyIdentical = false;
    let evaluationAlreadyStored = false;

    if (match.intake_source !== "api_football") {
      exceptionReason = "stored_fixture_not_api_football";
    } else if (providerFixtureId === null || !match.external_id) {
      exceptionReason = "stored_fixture_missing_api_football_link";
    } else if (!providerFixture) {
      exceptionReason = "provider_fixture_not_found";
    } else if (canonicalResolution.status === "conflict") {
      conflictSummary = canonicalResolution.reason;
    } else {
      const canonicalFixtureResolved = canonicalResolution.fixture;
      const providerIdentityMatchesCanonical =
        arePredictionReviewTeamNamesEquivalent(
          getCanonicalTeamName(canonicalFixtureResolved.homeTeamKey),
          providerFixture.homeTeam.name,
        ) &&
        arePredictionReviewTeamNamesEquivalent(
          getCanonicalTeamName(canonicalFixtureResolved.awayTeamKey),
          providerFixture.awayTeam.name,
        ) &&
        sameUtcInstant(canonicalFixtureResolved.kickoffAt, providerFixture.kickoffAt);
      const providerScoresPresent =
        typeof providerHomeGoals === "number" && typeof providerAwayGoals === "number";
      trustedAutoVerifyEligible =
        providerIdentityMatchesCanonical &&
        providerFixture.status === "finished" &&
        providerScoresPresent &&
        isSupportedTrustedTerminalStatus({
          canonicalFixture: canonicalFixtureResolved,
          providerFixture,
        });

      if (!providerIdentityMatchesCanonical) {
        conflictSummary = "provider_fixture_identity_mismatch";
      } else if (trustedAutoVerifyEligible) {
        if (existingResult?.verification_status === "verified") {
          if (sameResultScore(existingResult, providerHomeGoals!, providerAwayGoals!)) {
            resultAction = "already_identical";
            resultAlreadyIdentical = true;
          } else {
            resultAction = "verified_conflict";
            conflictSummary = `stored_verified_score=${existingResult.home_goals}-${existingResult.away_goals} provider_score=${providerHomeGoals}-${providerAwayGoals}`;
          }
        } else if (existingResult?.verification_status === "rejected") {
          resultAction = "rejected_conflict";
          conflictSummary = `existing_result_rejected provider_score=${providerHomeGoals}-${providerAwayGoals}`;
        } else if (existingResult?.verification_status === "pending_review") {
          resultAction = "update_to_verified";
        } else {
          resultAction = "create_verified";
        }
      } else if (providerFixture.status === "finished" && providerScoresPresent) {
        exceptionReason =
          providerFixture.statusShort === "FT"
            ? "auto_verify_blocked_by_conflict"
            : "unsupported_terminal_status_for_group_stage";

        if (existingResult?.verification_status === "verified") {
          if (!sameResultScore(existingResult, providerHomeGoals!, providerAwayGoals!)) {
            resultAction = "verified_conflict";
            conflictSummary = `stored_verified_score=${existingResult.home_goals}-${existingResult.away_goals} provider_score=${providerHomeGoals}-${providerAwayGoals}`;
          } else {
            resultAction = "already_identical";
            resultAlreadyIdentical = true;
          }
        } else if (existingResult?.verification_status === "rejected") {
          resultAction = "rejected_conflict";
        } else if (existingResult?.verification_status === "pending_review") {
          if (
            sameResultScore(existingResult, providerHomeGoals!, providerAwayGoals!) &&
            existingResult.intake_source === "api_football"
          ) {
            resultAction = "already_pending_review_exception";
          } else {
            resultAction = "update_pending_review_exception";
          }
        } else {
          resultAction = "create_pending_review_exception";
        }
      } else if (providerFixture.status === "finished" && !providerScoresPresent) {
        exceptionReason = "provider_finished_missing_score";
      } else if (providerFixture.status === "cancelled") {
        exceptionReason = "provider_cancelled";
      } else if (providerFixture.status === "abandoned") {
        exceptionReason = "provider_abandoned_or_suspended";
      } else if (providerFixture.status === "unknown") {
        exceptionReason = "provider_status_unknown";
      }

      const verifiedResultScore =
        trustedAutoVerifyEligible &&
        !conflictSummary &&
        providerScoresPresent &&
        (resultAction === "create_verified" ||
          resultAction === "update_to_verified" ||
          resultAction === "already_identical")
          ? {
              matchId: match.id,
              homeGoals: providerHomeGoals!,
              awayGoals: providerAwayGoals!,
            }
          : existingResult?.verification_status === "verified"
            ? {
                matchId: match.id,
                homeGoals: existingResult.home_goals,
                awayGoals: existingResult.away_goals,
              }
            : null;

      if (verifiedResultScore) {
        const latestInternalPrediction = (predictionVersionsByMatchId.get(match.id) ?? []).find(
          (prediction) =>
            prediction.run_scope === WORLD_CUP_RESULT_REFRESH_RUN_SCOPE &&
            prediction.prediction_type === WORLD_CUP_RESULT_REFRESH_PREDICTION_TYPE,
        );

        if (latestInternalPrediction) {
          const evaluationPayload = buildEvaluationPayload({
            prediction: latestInternalPrediction,
            markets: predictionMarketsByPredictionId.get(latestInternalPrediction.id) ?? [],
            result: verifiedResultScore,
          });

          if (evaluationPayload.status === "failure") {
            evaluationAction = "failure";
            evaluationFailureReason = evaluationPayload.reason;
          } else {
            const existingEvaluation = predictionResultsByPredictionId.get(latestInternalPrediction.id) ?? null;

            if (sameEvaluationPayload(existingEvaluation, evaluationPayload.payload)) {
              evaluationAction = "already_stored";
              evaluationAlreadyStored = true;
            } else if (existingEvaluation) {
              evaluationAction = "update";
            } else {
              evaluationAction = "create";
            }
          }
        }
      }
    }

    return {
      matchId: match.id,
      externalId: match.external_id,
      apiFootballFixtureId: providerFixtureId,
      slug: match.slug,
      competitionName,
      homeTeamName,
      awayTeamName,
      kickoffAt: match.kickoff_at,
      storedStatus: match.status,
      canonicalFixtureId: canonicalFixture?.fixtureKey ?? null,
      matchday: canonicalFixture ? inferMatchday(canonicalFixture.matchNumber) : null,
      providerStatus,
      providerStatusShort,
      providerHomeGoals,
      providerAwayGoals,
      providerTerminalResult,
      trustedAutoVerifyEligible,
      statusAction,
      nextStoredStatus,
      resultAction,
      evaluationAction,
      exceptionReason,
      conflictSummary,
      evaluationFailureReason,
      resultAlreadyIdentical,
      evaluationAlreadyStored,
    } satisfies WorldCupResultRefreshRow;
  });

  const summary = {
    selectedFixtures: rows.length,
    providerTerminalResults: rows.filter((row) => row.providerTerminalResult).length,
    statusesUpdated: rows.filter((row) => row.statusAction === "update").length,
    resultsCreated: rows.filter(
      (row) =>
        row.resultAction === "create_verified" || row.resultAction === "create_pending_review_exception",
    ).length,
    resultsUpdated: rows.filter(
      (row) =>
        row.resultAction === "update_to_verified" || row.resultAction === "update_pending_review_exception",
    ).length,
    resultsAlreadyIdentical: rows.filter((row) => row.resultAlreadyIdentical).length,
    resultsVerified: rows.filter(
      (row) =>
        row.resultAction === "create_verified" ||
        row.resultAction === "update_to_verified" ||
        row.resultAction === "already_identical",
    ).length,
    evaluationsCreated: rows.filter((row) => row.evaluationAction === "create").length,
    evaluationsUpdated: rows.filter((row) => row.evaluationAction === "update").length,
    evaluationsAlreadyStored: rows.filter((row) => row.evaluationAlreadyStored).length,
    exceptionsOrConflicts: rows.filter((row) => summarizeRowOutcome(row).isException).length,
    skippedRows: rows.filter((row) => summarizeRowOutcome(row).isSkipped).length,
  };

  return {
    version: WORLD_CUP_RESULT_REFRESH_ARTIFACT_VERSION,
    generatedAt: args.generatedAt,
    selection: {
      label: args.selection.label,
      from: args.selection.from,
      to: args.selection.to,
      matchday: args.selection.matchday,
      matchIds: args.selection.matches.map((match) => match.id),
      externalIds: args.selection.matches.flatMap((match) => (match.external_id ? [match.external_id] : [])),
      apiFootballFixtureIds: args.selection.matches
        .flatMap((match) => {
          const fixtureId = parseApiFootballFixtureId(match.external_id);
          return fixtureId === null ? [] : [fixtureId];
        })
        .sort((left, right) => left - right),
    },
    summary,
    rows,
  };
}

export async function applyWorldCupResultRefreshPlan(args: {
  report: WorldCupResultRefreshReport;
  snapshot: WorldCupResultRefreshDatabaseSnapshot;
  providerFixtures: ProviderFixture[];
  applySelection: WorldCupResultRefreshApplySelection;
  writeAdapter: WorldCupResultRefreshWriteAdapter;
  providerResponseAt: string;
  verifiedAt: string;
}): Promise<WorldCupResultRefreshApplyCounts> {
  const selectedMatchIds = new Set(args.applySelection.matchIds);
  const matchById = new Map(args.snapshot.matches.map((match) => [match.id, match]));
  const resultByMatchId = new Map(args.snapshot.matchResults.map((result) => [result.match_id, result]));
  const predictionVersionsByMatchId = new Map<string, StoredPredictionVersionRow[]>();
  const predictionMarketsByPredictionId = new Map<string, StoredPredictionMarketRow[]>();
  const predictionResultsByPredictionId = new Map(
    args.snapshot.predictionResults.map((result) => [result.prediction_version_id, result]),
  );
  const providerFixtureById = new Map(args.providerFixtures.map((fixture) => [fixture.providerFixtureId, fixture]));

  for (const prediction of args.snapshot.predictionVersions) {
    const collection = predictionVersionsByMatchId.get(prediction.match_id) ?? [];
    collection.push(prediction);
    predictionVersionsByMatchId.set(prediction.match_id, collection);
  }

  for (const market of args.snapshot.predictionMarkets) {
    const collection = predictionMarketsByPredictionId.get(market.prediction_version_id) ?? [];
    collection.push(market);
    predictionMarketsByPredictionId.set(market.prediction_version_id, collection);
  }

  const counts: WorldCupResultRefreshApplyCounts = {
    selected: 0,
    statusesUpdated: 0,
    resultsCreated: 0,
    resultsUpdated: 0,
    resultsVerified: 0,
    evaluationsCreated: 0,
    evaluationsUpdated: 0,
    evaluationsAlreadyStored: 0,
    exceptionsOrConflicts: 0,
    skipped: 0,
    evaluationFailures: 0,
  };

  for (const row of args.report.rows) {
    if (!selectedMatchIds.has(row.matchId)) {
      continue;
    }

    counts.selected += 1;

    const rowOutcome = summarizeRowOutcome(row);
    if (rowOutcome.isException) {
      counts.exceptionsOrConflicts += 1;
    }
    if (rowOutcome.isSkipped) {
      counts.skipped += 1;
    }

    const storedMatch = matchById.get(row.matchId);
    if (!storedMatch) {
      throw new Error(`Selected match ${row.matchId} is missing from the apply snapshot.`);
    }

    if (row.statusAction === "update" && row.nextStoredStatus) {
      await args.writeAdapter.updateMatch(row.matchId, {
        status: row.nextStoredStatus,
      });
      counts.statusesUpdated += 1;
      storedMatch.status = row.nextStoredStatus;
    }

    const existingResult = resultByMatchId.get(row.matchId) ?? null;
    const providerFixture =
      row.apiFootballFixtureId === null ? null : providerFixtureById.get(row.apiFootballFixtureId) ?? null;
    const providerHomeGoals = providerFixture?.goals.home ?? row.providerHomeGoals;
    const providerAwayGoals = providerFixture?.goals.away ?? row.providerAwayGoals;

    if (
      providerFixture &&
      typeof providerHomeGoals === "number" &&
      typeof providerAwayGoals === "number" &&
      (row.resultAction === "create_verified" || row.resultAction === "update_to_verified")
    ) {
      const sourceNote = buildVerifiedResultSourceNote({
        providerFixtureId: providerFixture.providerFixtureId,
        providerStatusShort: providerFixture.statusShort,
        providerResponseAt: args.providerResponseAt,
      });
      const payload = {
        home_goals: providerHomeGoals,
        away_goals: providerAwayGoals,
        verification_status: "verified" as const,
        intake_source: "api_football" as const,
        source_note: sourceNote,
        reviewed_at: args.verifiedAt,
        reviewed_by: null,
        recorded_at: existingResult?.recorded_at ?? args.providerResponseAt,
      };

      if (row.resultAction === "create_verified") {
        const inserted = await args.writeAdapter.insertMatchResult({
          match_id: row.matchId,
          ...payload,
        });
        resultByMatchId.set(row.matchId, { id: inserted.id, match_id: row.matchId, ...payload });
        counts.resultsCreated += 1;
      } else if (existingResult) {
        await args.writeAdapter.updateMatchResult(existingResult.id, payload);
        existingResult.home_goals = payload.home_goals;
        existingResult.away_goals = payload.away_goals;
        existingResult.verification_status = payload.verification_status;
        existingResult.intake_source = payload.intake_source;
        existingResult.source_note = payload.source_note;
        existingResult.reviewed_at = payload.reviewed_at;
        existingResult.reviewed_by = payload.reviewed_by;
        existingResult.recorded_at = payload.recorded_at;
        counts.resultsUpdated += 1;
      }

      counts.resultsVerified += 1;
    } else if (
      providerFixture &&
      typeof providerHomeGoals === "number" &&
      typeof providerAwayGoals === "number" &&
      (row.resultAction === "create_pending_review_exception" ||
        row.resultAction === "update_pending_review_exception")
    ) {
      const sourceNote = buildPendingReviewExceptionSourceNote({
        providerFixtureId: providerFixture.providerFixtureId,
        providerStatusShort: providerFixture.statusShort,
        reason: row.exceptionReason ?? "exception",
      });
      const payload = {
        home_goals: providerHomeGoals,
        away_goals: providerAwayGoals,
        verification_status: "pending_review" as const,
        intake_source: "api_football" as const,
        source_note: sourceNote,
        reviewed_at: null,
        reviewed_by: null,
        recorded_at: existingResult?.recorded_at ?? args.providerResponseAt,
      };

      if (row.resultAction === "create_pending_review_exception") {
        const inserted = await args.writeAdapter.insertMatchResult({
          match_id: row.matchId,
          ...payload,
        });
        resultByMatchId.set(row.matchId, { id: inserted.id, match_id: row.matchId, ...payload });
        counts.resultsCreated += 1;
      } else if (existingResult) {
        await args.writeAdapter.updateMatchResult(existingResult.id, payload);
        existingResult.home_goals = payload.home_goals;
        existingResult.away_goals = payload.away_goals;
        existingResult.verification_status = payload.verification_status;
        existingResult.intake_source = payload.intake_source;
        existingResult.source_note = payload.source_note;
        existingResult.reviewed_at = payload.reviewed_at;
        existingResult.reviewed_by = payload.reviewed_by;
        existingResult.recorded_at = payload.recorded_at;
        counts.resultsUpdated += 1;
      }
    }

    if (row.evaluationAction === "already_stored") {
      counts.evaluationsAlreadyStored += 1;
      continue;
    }

    if (row.evaluationAction === "failure") {
      counts.evaluationFailures += 1;
      continue;
    }

    if (row.evaluationAction !== "create" && row.evaluationAction !== "update") {
      continue;
    }

    const prediction = (predictionVersionsByMatchId.get(row.matchId) ?? []).find(
      (candidate) =>
        candidate.run_scope === WORLD_CUP_RESULT_REFRESH_RUN_SCOPE &&
        candidate.prediction_type === WORLD_CUP_RESULT_REFRESH_PREDICTION_TYPE,
    );

    const verifiedResult = resultByMatchId.get(row.matchId) ?? null;
    if (!prediction || !verifiedResult || verifiedResult.verification_status !== "verified") {
      counts.evaluationFailures += 1;
      continue;
    }

    const evaluation = buildEvaluationPayload({
      prediction,
      markets: predictionMarketsByPredictionId.get(prediction.id) ?? [],
      result: {
        matchId: row.matchId,
        homeGoals: verifiedResult.home_goals,
        awayGoals: verifiedResult.away_goals,
      },
    });

    if (evaluation.status === "failure") {
      counts.evaluationFailures += 1;
      continue;
    }

    const existingEvaluation = predictionResultsByPredictionId.get(prediction.id) ?? null;
    if (sameEvaluationPayload(existingEvaluation, evaluation.payload)) {
      counts.evaluationsAlreadyStored += 1;
      continue;
    }

    const payload = {
      prediction_version_id: prediction.id,
      ...evaluation.payload,
      validated_at: args.verifiedAt,
    };

    if (!existingEvaluation) {
      const inserted = await args.writeAdapter.insertPredictionResult(payload);
      predictionResultsByPredictionId.set(prediction.id, {
        id: inserted.id,
        prediction_version_id: prediction.id,
        ...evaluation.payload,
        validated_at: args.verifiedAt,
      });
      counts.evaluationsCreated += 1;
    } else {
      await args.writeAdapter.updatePredictionResult(existingEvaluation.id, {
        ...evaluation.payload,
        validated_at: args.verifiedAt,
      });
      existingEvaluation.actual_home_goals = evaluation.payload.actual_home_goals;
      existingEvaluation.actual_away_goals = evaluation.payload.actual_away_goals;
      existingEvaluation.winner_correct = evaluation.payload.winner_correct;
      existingEvaluation.btts_correct = evaluation.payload.btts_correct;
      existingEvaluation.over_2_5_correct = evaluation.payload.over_2_5_correct;
      existingEvaluation.exact_score_correct = evaluation.payload.exact_score_correct;
      existingEvaluation.goal_error = evaluation.payload.goal_error;
      existingEvaluation.error_summary = evaluation.payload.error_summary;
      existingEvaluation.validated_at = args.verifiedAt;
      counts.evaluationsUpdated += 1;
    }
  }

  return counts;
}

export function summarizeWorldCupResultRefreshReport(report: WorldCupResultRefreshReport, artifactPath: string) {
  return [
    `artifact_path=${artifactPath}`,
    `selected_fixtures=${report.summary.selectedFixtures}`,
    `provider_terminal_results=${report.summary.providerTerminalResults}`,
    `statuses_updated=${report.summary.statusesUpdated}`,
    `results_created=${report.summary.resultsCreated}`,
    `results_updated=${report.summary.resultsUpdated}`,
    `results_already_identical=${report.summary.resultsAlreadyIdentical}`,
    `results_verified=${report.summary.resultsVerified}`,
    `evaluations_created=${report.summary.evaluationsCreated}`,
    `evaluations_updated=${report.summary.evaluationsUpdated}`,
    `evaluations_already_stored=${report.summary.evaluationsAlreadyStored}`,
    `exceptions_or_conflicts=${report.summary.exceptionsOrConflicts}`,
    `skipped_rows=${report.summary.skippedRows}`,
  ];
}

export function buildWorldCupResultRefreshProviderExternalIds(selection: StoredMatchRow[]) {
  return selection.flatMap((match) => {
    const fixtureId = parseApiFootballFixtureId(match.external_id);
    return fixtureId === null ? [] : [buildApiFootballFixtureExternalId(fixtureId)];
  });
}
