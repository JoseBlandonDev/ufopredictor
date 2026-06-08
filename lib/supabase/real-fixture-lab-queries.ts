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
  access_scope: "admin_only";
  intake_source: "api_football";
};

type RealFixtureLabCompetition = Pick<CompetitionRow, "id" | "name">;
type RealFixtureLabTeam = Pick<TeamRow, "id" | "name">;

type RealFixtureLabResult = Pick<
  MatchResultRow,
  "home_goals" | "away_goals" | "verification_status" | "intake_source" | "source_note"
>;

type RealFixtureLabSavedPrediction = {
  id: string;
  modelVersionId: string;
  modelVersionVersion: string | null;
  createdAt: string;
  predictionType: "pre_match_24h";
  runScope: "internal_lab";
};

export type RealFixtureLabFixtureView = {
  id: string;
  externalId: string;
  slug: string;
  competitionId: string;
  kickoffAt: string;
  stage: string | null;
  status: MatchRow["status"];
  accessScope: "admin_only";
  intakeSource: "api_football";
  sourceNote: string | null;
  competitionName: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  result: RealFixtureLabResult | null;
  savedPrediction: RealFixtureLabSavedPrediction | null;
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
  result: RealFixtureLabResult | null;
  savedPrediction: RealFixtureLabSavedPrediction | null;
}): RealFixtureLabFixtureView {
  const { match, competition, homeTeam, awayTeam, result, savedPrediction } = args;

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
    result,
    savedPrediction,
  };
}

export async function getAdminRealFixtureLabData(
  options: GetAdminRealFixtureLabDataOptions = {},
): Promise<RealFixtureLabData> {
  const selectedExternalId = options.externalId?.trim() || null;
  const supabase = await createSupabaseServerClient();
  const matchSelect =
    "id, external_id, slug, competition_id, home_team_id, away_team_id, kickoff_at, stage, status, access_scope, intake_source, source_note";
  const matchQuery = supabase
    .from("matches")
    .select(matchSelect)
    .eq("access_scope", "admin_only")
    .eq("intake_source", "api_football");

  const { data: matchData, error: matchError } = selectedExternalId
    ? await matchQuery.eq("external_id", selectedExternalId).maybeSingle()
    : await matchQuery.order("kickoff_at");

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
  const fixtures = await Promise.all(
    matches.map(async (match) => {
      const [
        { data: competitionData, error: competitionError },
        { data: homeTeamData, error: homeTeamError },
        { data: awayTeamData, error: awayTeamError },
        { data: resultData, error: resultError },
        { data: savedPredictionData, error: savedPredictionError },
      ] = await Promise.all([
        supabase.from("competitions").select("id, name").eq("id", match.competition_id).maybeSingle(),
        supabase.from("teams").select("id, name").eq("id", match.home_team_id).maybeSingle(),
        supabase.from("teams").select("id, name").eq("id", match.away_team_id).maybeSingle(),
        supabase
          .from("match_results")
          .select("home_goals, away_goals, verification_status, intake_source, source_note")
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

      let savedPrediction: RealFixtureLabSavedPrediction | null = null;

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
      }

      return mapRealFixtureLabFixtureView({
        match,
        competition: (competitionData as RealFixtureLabCompetition | null) ?? null,
        homeTeam: (homeTeamData as RealFixtureLabTeam | null) ?? null,
        awayTeam: (awayTeamData as RealFixtureLabTeam | null) ?? null,
        result: (resultData as RealFixtureLabResult | null) ?? null,
        savedPrediction,
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
