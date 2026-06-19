import type { SupabaseClient } from "@supabase/supabase-js";
import { REAL_FIXTURE_LAB_PREDICTION_TYPE } from "../prediction-engine/real-fixture-persistence";
import type { PredictionVersionRow } from "../../types/database";
import { isLaunchSafePublicMatch } from "./public-launch-filters";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_EXPORT_WINDOW_DAYS = 7;
const MAX_EXPORT_WINDOW_DAYS = 31;
const WORLD_CUP_COMPETITION_SLUG = "world-cup-2026";
const ALLOWED_RISK_LEVELS = new Set<PredictionVersionRow["risk_level"]>(["low", "medium", "high"]);

type JsonPrimitive = boolean | number | string | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type CompetitionRow = {
  id: string;
  slug: string;
  usage_scope: string;
};

type MatchRow = {
  id: string;
  external_id: string;
  slug: string;
  kickoff_at: string;
  stage: string | null;
  status: string | null;
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  access_scope: string;
};

type TeamRow = {
  id: string;
  name: string;
};

type PredictionVersionExportRow = {
  id: string;
  match_id: string;
  created_at: string;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  expected_home_goals: number | null;
  expected_away_goals: number | null;
  most_likely_score: string | null;
  top_scores_json: JsonValue;
  confidence_score: number | null;
  risk_level: PredictionVersionRow["risk_level"] | null;
};

type PredictionMarketExportRow = {
  prediction_version_id: string;
  market: string;
  selection: string;
  probability: number;
};

type TorneoProbabilityPair = {
  yesProbability: number;
  noProbability: number;
};

type TorneoGoals25Pair = {
  overProbability: number;
  underProbability: number;
};

export type TorneoExportFixture = {
  externalId: string;
  fixtureId: number | null;
  slug: string;
  ufoUrl: string;
  kickoffAt: string;
  stage: string | null;
  status: string | null;
  homeTeam: string;
  awayTeam: string;
  prediction: {
    homeWinProbability: number;
    drawProbability: number;
    awayWinProbability: number;
    confidenceScore: number | null;
    riskLevel: "low" | "medium" | "high" | null;
    mostLikelyScore: string | null;
    expectedGoals: { home: number; away: number } | null;
    topScorelines: Array<{ score: string; probability: number }>;
    bothTeamsToScore: TorneoProbabilityPair | null;
    totalGoals25: TorneoGoals25Pair | null;
  };
};

export type TorneoUfoExport = {
  schemaVersion: "torneo-ufo-export-v1";
  generatedAt: string;
  source: "ufo_predictor";
  sourceAppUrl: string;
  competition: "world-cup-2026";
  range: { from: string; to: string };
  displayGuidance: {
    defaultTeaser: "show_1x2_probabilities_and_link";
    exactScoreRecommendedReveal: "after_user_pick_or_pick_deadline";
    topScorelinesRecommendedReveal: "after_user_pick_or_pick_deadline";
    postMatchUse: "comparison_and_learning";
  };
  fixtures: TorneoExportFixture[];
};

export type TorneoExportRange = {
  from: string;
  to: string;
};

export function getDefaultTorneoExportRange(now: Date = new Date()): TorneoExportRange {
  const from = formatDateOnlyUtc(now);
  const to = formatDateOnlyUtc(new Date(now.getTime() + (DEFAULT_EXPORT_WINDOW_DAYS - 1) * DAY_MS));
  return { from, to };
}

export function parseTorneoExportRange(
  input: { from?: string | null; to?: string | null },
  now: Date = new Date(),
):
  | { status: "valid"; range: TorneoExportRange; fromStartIso: string; toEndIso: string }
  | { status: "invalid"; statusCode: 400; message: string } {
  const defaults = getDefaultTorneoExportRange(now);
  const from = input.from?.trim() || defaults.from;
  const to = input.to?.trim() || defaults.to;

  if (!isIsoDateOnly(from) || !isIsoDateOnly(to)) {
    return {
      status: "invalid",
      statusCode: 400,
      message: "Los parametros from y to deben usar el formato YYYY-MM-DD.",
    };
  }

  const fromStart = new Date(`${from}T00:00:00.000Z`);
  const toEnd = new Date(`${to}T23:59:59.999Z`);

  if (!Number.isFinite(fromStart.getTime()) || !Number.isFinite(toEnd.getTime())) {
    return {
      status: "invalid",
      statusCode: 400,
      message: "No fue posible interpretar el rango solicitado.",
    };
  }

  if (fromStart.getTime() > toEnd.getTime()) {
    return {
      status: "invalid",
      statusCode: 400,
      message: "El parametro from no puede ser posterior a to.",
    };
  }

  const inclusiveDays = Math.floor((toEnd.getTime() - fromStart.getTime()) / DAY_MS) + 1;
  if (inclusiveDays > MAX_EXPORT_WINDOW_DAYS) {
    return {
      status: "invalid",
      statusCode: 400,
      message: `El rango maximo permitido es de ${MAX_EXPORT_WINDOW_DAYS} dias.`,
    };
  }

  return {
    status: "valid",
    range: { from, to },
    fromStartIso: fromStart.toISOString(),
    toEndIso: toEnd.toISOString(),
  };
}

function isIsoDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatDateOnlyUtc(value: Date) {
  return value.toISOString().slice(0, 10);
}

function parseFixtureId(externalId: string) {
  const match = /^api-football:fixture:(\d+)$/.exec(externalId);
  return match ? Number(match[1]) : null;
}

function isLocalhostOrigin(origin: string) {
  return origin === "http://localhost:3000" || origin.startsWith("http://127.0.0.1:");
}

export function resolveTorneoExportOrigin(args: {
  explicitOrigin?: string;
  fallbackOrigin?: string;
  allowLocalhostOrigin?: boolean;
}) {
  const candidates = [args.explicitOrigin, process.env.NEXT_PUBLIC_APP_URL, args.fallbackOrigin];
  let resolvedOrigin: string | null = null;

  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.trim().length === 0) {
      continue;
    }

    try {
      resolvedOrigin = new URL(candidate).origin;
      break;
    } catch {
      continue;
    }
  }

  if (!resolvedOrigin) {
    throw new Error("Torneo export requires NEXT_PUBLIC_APP_URL or an explicit export origin.");
  }

  if (!args.allowLocalhostOrigin && isLocalhostOrigin(resolvedOrigin)) {
    throw new Error("Torneo export origin cannot fall back to localhost for production artifacts.");
  }

  return resolvedOrigin;
}

function toProbabilityDecimal(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  if (value <= 1) {
    return roundProbability(value);
  }

  if (value <= 100) {
    return roundProbability(value / 100);
  }

  return null;
}

function roundProbability(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function toRiskLevel(value: PredictionVersionRow["risk_level"] | null | undefined) {
  return value && ALLOWED_RISK_LEVELS.has(value) ? value : null;
}

function isJsonObject(value: JsonValue | undefined | null): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseProbabilityLike(value: unknown) {
  if (typeof value === "number") {
    return toProbabilityDecimal(value);
  }

  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    return toProbabilityDecimal(Number(value));
  }

  return null;
}

function parseTopScorelines(value: JsonValue): Array<{ score: string; probability: number }> {
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed: Array<{ score: string; probability: number }> = [];
  for (const entry of value) {
    if (!isJsonObject(entry)) {
      continue;
    }

    const score = typeof entry.score === "string" ? entry.score.trim() : "";
    const probability = parseProbabilityLike(entry.probability);

    if (!score || probability === null) {
      continue;
    }

    parsed.push({ score, probability });
    if (parsed.length >= 3) {
      break;
    }
  }

  return parsed;
}

function buildExpectedGoals(row: PredictionVersionExportRow): { home: number; away: number } | null {
  if (
    typeof row.expected_home_goals !== "number" ||
    !Number.isFinite(row.expected_home_goals) ||
    typeof row.expected_away_goals !== "number" ||
    !Number.isFinite(row.expected_away_goals)
  ) {
    return null;
  }

  return {
    home: roundProbability(row.expected_home_goals),
    away: roundProbability(row.expected_away_goals),
  };
}

function buildMarketsByPredictionVersionId(rows: PredictionMarketExportRow[]) {
  const marketsByPredictionVersionId = new Map<string, PredictionMarketExportRow[]>();

  for (const row of rows) {
    const current = marketsByPredictionVersionId.get(row.prediction_version_id) ?? [];
    current.push(row);
    marketsByPredictionVersionId.set(row.prediction_version_id, current);
  }

  return marketsByPredictionVersionId;
}

function pickMarketProbability(
  markets: PredictionMarketExportRow[],
  market: string,
  selection: string,
) {
  const row = markets.find((entry) => entry.market === market && entry.selection === selection);
  return parseProbabilityLike(row?.probability);
}

function buildBttsFromMarkets(markets: PredictionMarketExportRow[]): TorneoProbabilityPair | null {
  const yesProbability = pickMarketProbability(markets, "btts", "yes");
  const noProbability = pickMarketProbability(markets, "btts", "no");

  if (yesProbability === null || noProbability === null) {
    return null;
  }

  return { yesProbability, noProbability };
}

function buildGoals25FromMarkets(markets: PredictionMarketExportRow[]): TorneoGoals25Pair | null {
  const overProbability = pickMarketProbability(markets, "over_2_5", "over");
  const underProbability = pickMarketProbability(markets, "over_2_5", "under");

  if (overProbability === null || underProbability === null) {
    return null;
  }

  return { overProbability, underProbability };
}

function buildPublicSafeModelDetail(
  row: PredictionVersionExportRow,
  markets: PredictionMarketExportRow[],
): {
  expectedGoals: { home: number; away: number } | null;
  topScorelines: Array<{ score: string; probability: number }>;
  bothTeamsToScore: TorneoProbabilityPair | null;
  totalGoals25: TorneoGoals25Pair | null;
} {
  return {
    expectedGoals: buildExpectedGoals(row),
    topScorelines: parseTopScorelines(row.top_scores_json),
    bothTeamsToScore: buildBttsFromMarkets(markets),
    totalGoals25: buildGoals25FromMarkets(markets),
  };
}

function buildLatestPredictionMap(rows: PredictionVersionExportRow[]) {
  const latestByMatchId = new Map<string, PredictionVersionExportRow>();

  for (const row of rows) {
    if (!latestByMatchId.has(row.match_id)) {
      latestByMatchId.set(row.match_id, row);
    }
  }

  return latestByMatchId;
}

export type TorneoExportClient = Pick<SupabaseClient, "from" | "rpc">;

export async function getTorneoUfoExportWithClient(
  supabase: TorneoExportClient,
  args: {
    range: TorneoExportRange;
    fromStartIso: string;
    toEndIso: string;
    fallbackOrigin?: string;
    explicitOrigin?: string;
    excludeFinished?: boolean;
    allowedMatchExternalIds?: string[];
    allowLocalhostOrigin?: boolean;
  },
): Promise<TorneoUfoExport> {
  const {
    range,
    fromStartIso,
    toEndIso,
    fallbackOrigin,
    explicitOrigin,
    excludeFinished = false,
    allowedMatchExternalIds,
    allowLocalhostOrigin = false,
  } = args;
  const allowedExternalIdSet =
    allowedMatchExternalIds && allowedMatchExternalIds.length > 0
      ? new Set(allowedMatchExternalIds)
      : null;
  const sourceAppUrl = resolveTorneoExportOrigin({
    explicitOrigin,
    fallbackOrigin,
    allowLocalhostOrigin,
  });

  const { data: competitionData, error: competitionError } = await supabase
    .from("competitions")
    .select("id, slug, usage_scope")
    .eq("slug", WORLD_CUP_COMPETITION_SLUG)
    .eq("usage_scope", "public_product")
    .maybeSingle();

  if (competitionError || !competitionData) {
    throw new Error("No fue posible identificar la competencia publica del Mundial 2026.");
  }

  const competition = competitionData as CompetitionRow;

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("id, external_id, slug, kickoff_at, stage, status, competition_id, home_team_id, away_team_id, access_scope")
    .eq("competition_id", competition.id)
    .eq("access_scope", "public")
    .gte("kickoff_at", fromStartIso)
    .lte("kickoff_at", toEndIso)
    .order("kickoff_at", { ascending: true });

  if (matchError) {
    throw new Error(`No fue posible consultar los fixtures publicos del rango: ${matchError.message}`);
  }

  const matches = ((matchData ?? []) as MatchRow[])
    .filter((match) => isLaunchSafePublicMatch(match.slug, competition.slug))
    .filter((match) => !excludeFinished || match.status !== "finished")
    .filter((match) => (allowedExternalIdSet ? allowedExternalIdSet.has(match.external_id) : true));

  if (matches.length === 0) {
    return {
      schemaVersion: "torneo-ufo-export-v1",
      generatedAt: new Date().toISOString(),
      source: "ufo_predictor",
      sourceAppUrl,
      competition: "world-cup-2026",
      range,
      displayGuidance: {
        defaultTeaser: "show_1x2_probabilities_and_link",
        exactScoreRecommendedReveal: "after_user_pick_or_pick_deadline",
        topScorelinesRecommendedReveal: "after_user_pick_or_pick_deadline",
        postMatchUse: "comparison_and_learning",
      },
      fixtures: [],
    };
  }

  const teamIds = [...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))];
  const matchIds = matches.map((match) => match.id);

  const [{ data: teamData, error: teamError }, { data: predictionData, error: predictionError }] =
    await Promise.all([
      supabase.from("teams").select("id, name").in("id", teamIds),
      supabase
        .from("prediction_versions")
        .select(
          "id, match_id, created_at, home_win_prob, draw_prob, away_win_prob, expected_home_goals, expected_away_goals, most_likely_score, top_scores_json, confidence_score, risk_level",
        )
        .in("match_id", matchIds)
        .eq("run_scope", "public_product")
        .eq("prediction_type", REAL_FIXTURE_LAB_PREDICTION_TYPE)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }),
    ]);

  if (teamError) {
    throw new Error(`No fue posible consultar los equipos del export TM01: ${teamError.message}`);
  }

  if (predictionError) {
    throw new Error(`No fue posible consultar las predicciones publicas del export TM01: ${predictionError.message}`);
  }

  const latestPredictionByMatchId = buildLatestPredictionMap(
    (predictionData ?? []) as PredictionVersionExportRow[],
  );
  const selectedPredictionVersionIds = [...new Set([...latestPredictionByMatchId.values()].map((row) => row.id))];
  const { data: marketData, error: marketError } =
    selectedPredictionVersionIds.length > 0
      ? await supabase
          .from("prediction_markets")
          .select("prediction_version_id, market, selection, probability")
          .in("prediction_version_id", selectedPredictionVersionIds)
      : { data: [], error: null };

  if (marketError) {
    throw new Error(`No fue posible consultar los mercados de predicciones publicas del export TM01: ${marketError.message}`);
  }

  const marketsByPredictionVersionId = buildMarketsByPredictionVersionId(
    (marketData ?? []) as PredictionMarketExportRow[],
  );
  const teamById = new Map(((teamData ?? []) as TeamRow[]).map((team) => [team.id, team.name]));

  const fixtures: TorneoExportFixture[] = matches
    .map((match) => {
      const prediction = latestPredictionByMatchId.get(match.id);
      if (!prediction) {
        return null;
      }

      const homeWinProbability = toProbabilityDecimal(prediction.home_win_prob);
      const drawProbability = toProbabilityDecimal(prediction.draw_prob);
      const awayWinProbability = toProbabilityDecimal(prediction.away_win_prob);

      if (
        homeWinProbability === null ||
        drawProbability === null ||
        awayWinProbability === null
      ) {
        return null;
      }

      const modelDetail = buildPublicSafeModelDetail(
        prediction,
        marketsByPredictionVersionId.get(prediction.id) ?? [],
      );

      return {
        externalId: match.external_id,
        fixtureId: parseFixtureId(match.external_id),
        slug: match.slug,
        ufoUrl: new URL(`/matches/${match.slug}`, sourceAppUrl).toString(),
        kickoffAt: match.kickoff_at,
        stage: match.stage,
        status: match.status,
        homeTeam: teamById.get(match.home_team_id) ?? "Equipo local no disponible",
        awayTeam: teamById.get(match.away_team_id) ?? "Equipo visitante no disponible",
        prediction: {
          homeWinProbability,
          drawProbability,
          awayWinProbability,
          confidenceScore:
            typeof prediction.confidence_score === "number" && Number.isFinite(prediction.confidence_score)
              ? prediction.confidence_score
              : null,
          riskLevel: toRiskLevel(prediction.risk_level),
          mostLikelyScore:
            typeof prediction.most_likely_score === "string" && prediction.most_likely_score.trim()
              ? prediction.most_likely_score.trim()
              : null,
          expectedGoals: modelDetail.expectedGoals,
          topScorelines: modelDetail.topScorelines,
          bothTeamsToScore: modelDetail.bothTeamsToScore,
          totalGoals25: modelDetail.totalGoals25,
        },
      };
    })
    .filter((fixture): fixture is TorneoExportFixture => fixture !== null)
    .sort((left, right) => new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime());

  return {
    schemaVersion: "torneo-ufo-export-v1",
    generatedAt: new Date().toISOString(),
    source: "ufo_predictor",
    sourceAppUrl,
    competition: "world-cup-2026",
    range,
    displayGuidance: {
      defaultTeaser: "show_1x2_probabilities_and_link",
      exactScoreRecommendedReveal: "after_user_pick_or_pick_deadline",
      topScorelinesRecommendedReveal: "after_user_pick_or_pick_deadline",
      postMatchUse: "comparison_and_learning",
    },
    fixtures,
  };
}
