import "server-only";

import {
  REAL_FIXTURE_LAB_PREDICTION_TYPE,
  REAL_FIXTURE_LAB_RUN_SCOPE,
} from "../prediction-engine/real-fixture-persistence";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CompetitionRow, MatchResultRow, MatchRow, TeamRow } from "@/types/database";

type RealFixtureLabMatch = Pick<
  MatchRow,
  | "id"
  | "external_id"
  | "slug"
  | "competition_id"
  | "home_team_id"
  | "away_team_id"
  | "kickoff_at"
  | "stage"
  | "status"
  | "access_scope"
  | "intake_source"
  | "source_note"
> & {
  external_id: string;
  access_scope: "admin_only" | "public";
  intake_source: "api_football";
};

type RealFixtureLabCompetition = Pick<CompetitionRow, "id" | "name">;
type RealFixtureLabTeam = Pick<TeamRow, "id" | "name">;

type RealFixtureLabResult = Pick<
  MatchResultRow,
  | "id"
  | "home_goals"
  | "away_goals"
  | "verification_status"
  | "intake_source"
  | "source_note"
  | "reviewed_at"
  | "reviewed_by"
>;

type RealFixtureLabSavedPrediction = {
  id: string;
  modelVersionId: string;
  modelVersionVersion: string | null;
  createdAt: string;
  predictionType: "pre_match_24h";
  runScope: "internal_lab";
};

type RealFixtureLabActiveModelVersion = {
  id: string;
  version: string;
};

type RealFixtureLabSavedEvaluation = {
  winnerCorrect: boolean | null;
  bttsCorrect: boolean | null;
  over25Correct: boolean | null;
  exactScoreCorrect: boolean | null;
  goalError: number | null;
  errorSummary: string | null;
  validatedAt: string;
};

type RealFixtureLabPublicProjectionRpcRow = {
  markets?: Array<{
    marketKey?: string;
    label?: string;
    selection?: string;
    probability?: number;
    confidence?: number | null;
  }> | null;
  model_detail?: {
    expected_goals?: {
      home?: number | null;
      away?: number | null;
    } | null;
    top_scorelines?:
      | Array<{
          score?: string | null;
          probability?: number | null;
        }>
      | null;
    both_teams_to_score?: {
      yes_probability?: number | null;
      no_probability?: number | null;
    } | null;
    total_goals_2_5?: {
      over_probability?: number | null;
      under_probability?: number | null;
    } | null;
  } | null;
};

export type RealFixtureLabFixtureView = {
  id: string;
  externalId: string;
  slug: string;
  competitionId: string;
  kickoffAt: string;
  stage: string | null;
  status: MatchRow["status"];
  accessScope: "admin_only" | "public";
  intakeSource: "api_football";
  sourceNote: string | null;
  competitionName: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  activeModelVersionId: string | null;
  activeModelVersion: string | null;
  activeModelSavedPredictionId: string | null;
  hasSavedPredictionForActiveModel: boolean;
  latestPublicPredictionId: string | null;
  latestPublicPredictionCreatedAt: string | null;
  latestPublicPredictionMarketCount: number;
  hasLatestPublicModelDetail: boolean;
  result: RealFixtureLabResult | null;
  savedPrediction: RealFixtureLabSavedPrediction | null;
  savedEvaluation: RealFixtureLabSavedEvaluation | null;
};

export type RealFixtureLabData =
  | {
      status: "ready";
      selectedExternalId: string | null;
      fixtures: RealFixtureLabFixtureView[];
      warnings: string[];
    }
  | {
      status: "unavailable";
      selectedExternalId: string | null;
      message: string;
    };

export type GetAdminRealFixtureLabDataOptions = {
  externalId?: string | null;
  includePublicExactMatch?: boolean;
};

function unavailable(selectedExternalId: string | null, message?: string): RealFixtureLabData {
  return {
    status: "unavailable",
    selectedExternalId,
    message: message ?? "No fue posible consultar los fixtures reales internos en este momento.",
  };
}

export function mapRealFixtureLabFixtureView(args: {
  match: RealFixtureLabMatch;
  competition: RealFixtureLabCompetition | null;
  homeTeam: RealFixtureLabTeam | null;
  awayTeam: RealFixtureLabTeam | null;
  activeModelVersion: RealFixtureLabActiveModelVersion | null;
  activeModelSavedPredictionId: string | null;
  latestPublicPredictionId: string | null;
  latestPublicPredictionCreatedAt: string | null;
  latestPublicPredictionMarketCount: number;
  hasLatestPublicModelDetail: boolean;
  result: RealFixtureLabResult | null;
  savedPrediction: RealFixtureLabSavedPrediction | null;
  savedEvaluation: RealFixtureLabSavedEvaluation | null;
}): RealFixtureLabFixtureView {
  const {
    match,
    competition,
    homeTeam,
    awayTeam,
    activeModelVersion,
    activeModelSavedPredictionId,
    latestPublicPredictionId,
    latestPublicPredictionCreatedAt,
    latestPublicPredictionMarketCount,
    hasLatestPublicModelDetail,
    result,
    savedPrediction,
    savedEvaluation,
  } = args;

  return {
    id: match.id,
    externalId: match.external_id,
    slug: match.slug,
    competitionId: match.competition_id,
    kickoffAt: match.kickoff_at,
    stage: match.stage,
    status: match.status,
    accessScope: match.access_scope,
    intakeSource: match.intake_source,
    sourceNote: match.source_note,
    competitionName: competition?.name ?? "Competicion no disponible",
    homeTeamId: match.home_team_id,
    homeTeamName: homeTeam?.name ?? "Equipo local no disponible",
    awayTeamId: match.away_team_id,
    awayTeamName: awayTeam?.name ?? "Equipo visitante no disponible",
    activeModelVersionId: activeModelVersion?.id ?? null,
    activeModelVersion: activeModelVersion?.version ?? null,
    activeModelSavedPredictionId,
    hasSavedPredictionForActiveModel: activeModelSavedPredictionId !== null,
    latestPublicPredictionId,
    latestPublicPredictionCreatedAt,
    latestPublicPredictionMarketCount,
    hasLatestPublicModelDetail,
    result,
    savedPrediction,
    savedEvaluation,
  };
}

function hasPublicModelDetail(
  projection: RealFixtureLabPublicProjectionRpcRow | null,
): boolean {
  const modelDetail = projection?.model_detail;
  if (!modelDetail) {
    return false;
  }

  const hasExpectedGoals =
    typeof modelDetail.expected_goals?.home === "number" &&
    Number.isFinite(modelDetail.expected_goals.home) &&
    typeof modelDetail.expected_goals?.away === "number" &&
    Number.isFinite(modelDetail.expected_goals.away);
  const hasTopScorelines =
    Array.isArray(modelDetail.top_scorelines) && modelDetail.top_scorelines.length > 0;
  const hasBtts =
    typeof modelDetail.both_teams_to_score?.yes_probability === "number" &&
    Number.isFinite(modelDetail.both_teams_to_score.yes_probability) &&
    typeof modelDetail.both_teams_to_score?.no_probability === "number" &&
    Number.isFinite(modelDetail.both_teams_to_score.no_probability);
  const hasOverUnder25 =
    typeof modelDetail.total_goals_2_5?.over_probability === "number" &&
    Number.isFinite(modelDetail.total_goals_2_5.over_probability) &&
    typeof modelDetail.total_goals_2_5?.under_probability === "number" &&
    Number.isFinite(modelDetail.total_goals_2_5.under_probability);

  return hasExpectedGoals && hasTopScorelines && hasBtts && hasOverUnder25;
}

export async function getAdminRealFixtureLabData(
  options: GetAdminRealFixtureLabDataOptions = {},
): Promise<RealFixtureLabData> {
  const selectedExternalId = options.externalId?.trim() || null;
  const includePublicExactMatch = options.includePublicExactMatch === true && selectedExternalId !== null;
  const supabase = await createSupabaseServerClient();
  const matchSelect =
    "id, external_id, slug, competition_id, home_team_id, away_team_id, kickoff_at, stage, status, access_scope, intake_source, source_note";
  const { data: matchData, error: matchError } = selectedExternalId
    ? await (() => {
        const exactMatchQuery = supabase
          .from("matches")
          .select(matchSelect)
          .eq("external_id", selectedExternalId)
          .eq("intake_source", "api_football");

        return includePublicExactMatch
          ? exactMatchQuery.in("access_scope", ["admin_only", "public"]).maybeSingle()
          : exactMatchQuery.eq("access_scope", "admin_only").maybeSingle();
      })()
    : await supabase
        .from("matches")
        .select(matchSelect)
        .eq("intake_source", "api_football")
        .in("access_scope", ["admin_only", "public"])
        .order("kickoff_at");

  if (matchError) {
    return unavailable(selectedExternalId, `No fue posible consultar el fixture real seleccionado: ${matchError.message}`);
  }

  const matches = selectedExternalId
    ? matchData
      ? [matchData as RealFixtureLabMatch]
      : []
    : ((matchData ?? []) as RealFixtureLabMatch[]);

  if (matches.length === 0) {
    return {
      status: "ready",
      selectedExternalId,
      fixtures: [],
      warnings: [],
    };
  }
  const warnings: string[] = [];
  const { data: activeModelVersionData, error: activeModelVersionError } = await supabase
    .from("model_versions")
    .select("id, version, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeModelVersionError) {
    warnings.push(`No fue posible leer la version activa del modelo: ${activeModelVersionError.message}`);
  } else if (!activeModelVersionData) {
    warnings.push("No active model version is configured. Internal save stays blocked until one is activated.");
  }

  const activeModelVersion = activeModelVersionData
    ? ({
        id: activeModelVersionData.id,
        version: activeModelVersionData.version,
      } satisfies RealFixtureLabActiveModelVersion)
    : null;

  const fixtures = await Promise.all(
    matches.map(async (match) => {
      const [
        { data: competitionData, error: competitionError },
        { data: homeTeamData, error: homeTeamError },
        { data: awayTeamData, error: awayTeamError },
        { data: resultData, error: resultError },
        { data: savedPredictionData, error: savedPredictionError },
        { data: activeModelSavedPredictionData, error: activeModelSavedPredictionError },
        { data: latestPublicPredictionData, error: latestPublicPredictionError },
      ] = await Promise.all([
        supabase.from("competitions").select("id, name").eq("id", match.competition_id).maybeSingle(),
        supabase.from("teams").select("id, name").eq("id", match.home_team_id).maybeSingle(),
        supabase.from("teams").select("id, name").eq("id", match.away_team_id).maybeSingle(),
        supabase
          .from("match_results")
          .select("id, home_goals, away_goals, verification_status, intake_source, source_note, reviewed_at, reviewed_by")
          .eq("match_id", match.id)
          .maybeSingle(),
        supabase
          .from("prediction_versions")
          .select("id, model_version_id, created_at, prediction_type, run_scope")
          .eq("match_id", match.id)
          .eq("prediction_type", REAL_FIXTURE_LAB_PREDICTION_TYPE)
          .eq("run_scope", REAL_FIXTURE_LAB_RUN_SCOPE)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        activeModelVersion
          ? supabase
              .from("prediction_versions")
              .select("id")
              .eq("match_id", match.id)
              .eq("model_version_id", activeModelVersion.id)
              .eq("prediction_type", REAL_FIXTURE_LAB_PREDICTION_TYPE)
              .eq("run_scope", REAL_FIXTURE_LAB_RUN_SCOPE)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from("prediction_versions")
          .select("id, created_at")
          .eq("match_id", match.id)
          .eq("prediction_type", REAL_FIXTURE_LAB_PREDICTION_TYPE)
          .eq("run_scope", "public_product")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (competitionError) {
        warnings.push(`No fue posible leer la competencia del fixture ${match.external_id}: ${competitionError.message}`);
      }

      if (homeTeamError) {
        warnings.push(`No fue posible leer el equipo local del fixture ${match.external_id}: ${homeTeamError.message}`);
      }

      if (awayTeamError) {
        warnings.push(`No fue posible leer el equipo visitante del fixture ${match.external_id}: ${awayTeamError.message}`);
      }

      if (resultError) {
        warnings.push(`No fue posible leer el match_result del fixture ${match.external_id}: ${resultError.message}`);
      }

      if (savedPredictionError) {
        warnings.push(
          `No fue posible leer la prediccion interna guardada del fixture ${match.external_id}: ${savedPredictionError.message}`,
        );
      }

      if (activeModelSavedPredictionError) {
        warnings.push(
          `No fue posible leer la prediccion guardada para el modelo activo del fixture ${match.external_id}: ${activeModelSavedPredictionError.message}`,
        );
      }

      if (latestPublicPredictionError) {
        warnings.push(
          `No fue posible leer la prediccion publica mas reciente del fixture ${match.external_id}: ${latestPublicPredictionError.message}`,
        );
      }

      let savedPrediction: RealFixtureLabSavedPrediction | null = null;
      let savedEvaluation: RealFixtureLabSavedEvaluation | null = null;
      let latestPublicPredictionMarketCount = 0;
      let hasLatestPublicModelDetail = false;

      if (latestPublicPredictionData) {
        const { data: publicMarketRows, error: publicMarketRowsError } = await supabase
          .from("prediction_markets")
          .select("id")
          .eq("prediction_version_id", latestPublicPredictionData.id);

        if (publicMarketRowsError) {
          warnings.push(
            `No fue posible leer los mercados publicos del fixture ${match.external_id}: ${publicMarketRowsError.message}`,
          );
        } else {
          latestPublicPredictionMarketCount = publicMarketRows?.length ?? 0;
        }

        if (latestPublicPredictionMarketCount === 0) {
          const { data: publicProjectionData, error: publicProjectionError } = await supabase.rpc(
            "get_premium_match_projection",
            {
              p_match_id: match.id,
            },
          );

          if (publicProjectionError) {
            warnings.push(
              `No fue posible leer el detalle premium publico del fixture ${match.external_id}: ${publicProjectionError.message}`,
            );
          } else {
            latestPublicPredictionMarketCount =
              ((publicProjectionData as RealFixtureLabPublicProjectionRpcRow | null)?.markets ?? [])
                .length;
            hasLatestPublicModelDetail = hasPublicModelDetail(
              (publicProjectionData as RealFixtureLabPublicProjectionRpcRow | null) ?? null,
            );
          }
        }
      }

      if (savedPredictionData) {
        const { data: modelVersionData, error: modelVersionError } = await supabase
          .from("model_versions")
          .select("id, version")
          .eq("id", savedPredictionData.model_version_id)
          .maybeSingle();

        if (modelVersionError) {
          warnings.push(
            `No fue posible leer la version del modelo para el fixture ${match.external_id}: ${modelVersionError.message}`,
          );
        }

        savedPrediction = {
          id: savedPredictionData.id,
          modelVersionId: savedPredictionData.model_version_id,
          modelVersionVersion: modelVersionData?.version ?? null,
          createdAt: savedPredictionData.created_at,
          predictionType: savedPredictionData.prediction_type,
          runScope: savedPredictionData.run_scope,
        };

        const { data: savedEvaluationData, error: savedEvaluationError } = await supabase
          .from("prediction_results")
          .select(
            "winner_correct, btts_correct, over_2_5_correct, exact_score_correct, goal_error, error_summary, validated_at",
          )
          .eq("prediction_version_id", savedPredictionData.id)
          .maybeSingle();

        if (savedEvaluationError) {
          warnings.push(
            `No fue posible leer la evaluacion interna guardada del fixture ${match.external_id}: ${savedEvaluationError.message}`,
          );
        }

        if (savedEvaluationData) {
          savedEvaluation = {
            winnerCorrect: savedEvaluationData.winner_correct,
            bttsCorrect: savedEvaluationData.btts_correct,
            over25Correct: savedEvaluationData.over_2_5_correct,
            exactScoreCorrect: savedEvaluationData.exact_score_correct,
            goalError: savedEvaluationData.goal_error,
            errorSummary: savedEvaluationData.error_summary,
            validatedAt: savedEvaluationData.validated_at,
          };
        }
      }

      return mapRealFixtureLabFixtureView({
        match,
        competition: (competitionData as RealFixtureLabCompetition | null) ?? null,
        homeTeam: (homeTeamData as RealFixtureLabTeam | null) ?? null,
        awayTeam: (awayTeamData as RealFixtureLabTeam | null) ?? null,
        activeModelVersion,
        activeModelSavedPredictionId: activeModelSavedPredictionData?.id ?? null,
        latestPublicPredictionId: latestPublicPredictionData?.id ?? null,
        latestPublicPredictionCreatedAt: latestPublicPredictionData?.created_at ?? null,
        latestPublicPredictionMarketCount,
        hasLatestPublicModelDetail,
        result: (resultData as RealFixtureLabResult | null) ?? null,
        savedPrediction,
        savedEvaluation,
      });
    }),
  );

  return {
    status: "ready",
    selectedExternalId,
    fixtures,
    warnings,
  };
}
