"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { evaluatePrediction } from "@/lib/model-evaluation";
import { generatePrediction } from "@/lib/prediction-engine/generate-prediction";
import { buildRealFixturePredictionInput } from "@/lib/prediction-engine/real-fixture-adapter";
import { getAdminRealFixtureLabData } from "@/lib/supabase/real-fixture-lab-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildRealFixturePredictionMarketInserts,
  buildRealFixturePredictionVersionInsert,
  REAL_FIXTURE_LAB_PREDICTION_TYPE,
  REAL_FIXTURE_LAB_RUN_SCOPE,
} from "../../../lib/prediction-engine/real-fixture-persistence";

const saveRealFixturePredictionSchema = z.object({
  externalId: z.string().trim().min(1),
});

const persistRealFixtureEvaluationSchema = z.object({
  predictionVersionId: z.string().uuid(),
  externalId: z.string().trim().min(1),
});

const topScorelinesSchema = z.array(
  z.object({
    score: z.string().regex(/^\d+-\d+$/),
    probability: z.number().min(0).max(100),
  }),
);

type SaveStatus = "saved" | "invalid" | "not_found" | "duplicate" | "no_model" | "error";
type EvaluationStatus =
  | "saved"
  | "refreshed"
  | "invalid"
  | "not_found"
  | "no_result"
  | "unverified"
  | "incomplete"
  | "not_evaluable"
  | "error";

type StoredEvaluationMarket = {
  market: "btts" | "over_2_5";
  selection: string;
  probability: number;
};

function redirectWithSaveStatus(status: SaveStatus, externalId: string): never {
  redirect(`/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&save=${status}`);
}

function redirectWithEvaluationStatus(status: EvaluationStatus, externalId: string): never {
  redirect(`/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&evaluation=${status}`);
}

function logRealFixtureLabSupabaseError(args: {
  operation: string;
  table: string;
  error: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  } | null;
}) {
  console.error("real_fixture_lab_save_error", {
    operation: args.operation,
    table: args.table,
    code: args.error?.code ?? null,
    message: args.error?.message ?? null,
    details: args.error?.details ?? null,
    hint: args.error?.hint ?? null,
  });
}

function resolveEvaluationMarkets(markets: StoredEvaluationMarket[]) {
  const expectedKeys = new Set(["btts:yes", "btts:no", "over_2_5:over", "over_2_5:under"]);
  const probabilities = new Map<string, number>();

  for (const market of markets) {
    const key = `${market.market}:${market.selection}`;

    if (!expectedKeys.has(key) || probabilities.has(key)) {
      return null;
    }

    probabilities.set(key, market.probability);
  }

  if (probabilities.size !== expectedKeys.size) {
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

export async function saveRealFixturePredictionAction(formData: FormData) {
  const input = saveRealFixturePredictionSchema.safeParse({
    externalId: formData.get("externalId"),
  });

  if (!input.success) {
    redirect(`/admin/real-fixture-lab?save=invalid`);
  }

  const externalId = input.data.externalId;
  await requireAdmin("/admin/real-fixture-lab");

  const fixtureData = await getAdminRealFixtureLabData({ externalId });

  if (fixtureData.status !== "ready") {
    redirectWithSaveStatus("error", externalId);
  }

  const fixture = fixtureData.fixtures[0];

  if (!fixture) {
    redirectWithSaveStatus("not_found", externalId);
  }

  if (fixture.accessScope !== "admin_only" || fixture.intakeSource !== "api_football") {
    redirectWithSaveStatus("error", externalId);
  }

  const predictionInput = buildRealFixturePredictionInput(fixture);
  const predictionOutput = generatePrediction(predictionInput);
  const supabase = await createSupabaseServerClient();

  const { data: activeModelVersion, error: activeModelVersionError } = await supabase
    .from("model_versions")
    .select("id, version, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeModelVersionError || !activeModelVersion) {
    if (activeModelVersionError) {
      logRealFixtureLabSupabaseError({
        operation: "select_active_model_version",
        table: "model_versions",
        error: activeModelVersionError,
      });
    }
    redirectWithSaveStatus("no_model", externalId);
  }

  const { data: existingPrediction, error: existingPredictionError } = await supabase
    .from("prediction_versions")
    .select("id")
    .eq("match_id", fixture.id)
    .eq("model_version_id", activeModelVersion.id)
    .eq("prediction_type", REAL_FIXTURE_LAB_PREDICTION_TYPE)
    .eq("run_scope", REAL_FIXTURE_LAB_RUN_SCOPE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPredictionError) {
    logRealFixtureLabSupabaseError({
      operation: "select_existing_prediction_version",
      table: "prediction_versions",
      error: existingPredictionError,
    });
    redirectWithSaveStatus("error", externalId);
  }

  if (existingPrediction) {
    redirectWithSaveStatus("duplicate", externalId);
  }

  const predictionVersionInsert = buildRealFixturePredictionVersionInsert({
    matchId: fixture.id,
    modelVersionId: activeModelVersion.id,
    predictionOutput,
  });

  const { data: insertedPredictionVersion, error: insertedPredictionVersionError } = await supabase
    .from("prediction_versions")
    .insert(predictionVersionInsert)
    .select("id")
    .maybeSingle();

  if (insertedPredictionVersionError || !insertedPredictionVersion) {
    if (insertedPredictionVersionError) {
      logRealFixtureLabSupabaseError({
        operation: "insert_prediction_version",
        table: "prediction_versions",
        error: insertedPredictionVersionError,
      });
    } else {
      console.error("real_fixture_lab_save_error", {
        operation: "insert_prediction_version",
        table: "prediction_versions",
        message: "Insert returned no prediction_version row.",
      });
    }
    redirectWithSaveStatus("error", externalId);
  }

  const predictionMarketInserts = buildRealFixturePredictionMarketInserts({
    predictionVersionId: insertedPredictionVersion.id,
    predictionOutput,
  });

  const { error: insertedPredictionMarketsError } = await supabase
    .from("prediction_markets")
    .insert(predictionMarketInserts);

  if (insertedPredictionMarketsError) {
    logRealFixtureLabSupabaseError({
      operation: "insert_prediction_markets",
      table: "prediction_markets",
      error: insertedPredictionMarketsError,
    });
    redirectWithSaveStatus("error", externalId);
  }

  revalidatePath("/admin/real-fixture-lab");
  redirectWithSaveStatus("saved", externalId);
}

export async function persistRealFixtureEvaluationAction(formData: FormData) {
  const input = persistRealFixtureEvaluationSchema.safeParse({
    predictionVersionId: formData.get("predictionVersionId"),
    externalId: formData.get("externalId"),
  });

  if (!input.success) {
    redirect(`/admin/real-fixture-lab?evaluation=invalid`);
  }

  const { predictionVersionId, externalId } = input.data;
  await requireAdmin("/admin/real-fixture-lab");
  const supabase = await createSupabaseServerClient();

  const { data: prediction, error: predictionError } = await supabase
    .from("prediction_versions")
    .select(
      "id, match_id, run_scope, prediction_type, home_win_prob, draw_prob, away_win_prob, most_likely_score, top_scores_json",
    )
    .eq("id", predictionVersionId)
    .eq("run_scope", REAL_FIXTURE_LAB_RUN_SCOPE)
    .eq("prediction_type", REAL_FIXTURE_LAB_PREDICTION_TYPE)
    .maybeSingle();

  if (predictionError) {
    logRealFixtureLabSupabaseError({
      operation: "select_prediction_version_for_evaluation",
      table: "prediction_versions",
      error: predictionError,
    });
    redirectWithEvaluationStatus("error", externalId);
  }

  if (!prediction) {
    redirectWithEvaluationStatus("not_found", externalId);
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, external_id, access_scope, intake_source")
    .eq("id", prediction.match_id)
    .eq("external_id", externalId)
    .eq("access_scope", "admin_only")
    .eq("intake_source", "api_football")
    .maybeSingle();

  if (matchError) {
    logRealFixtureLabSupabaseError({
      operation: "select_match_for_evaluation",
      table: "matches",
      error: matchError,
    });
    redirectWithEvaluationStatus("error", externalId);
  }

  if (!match) {
    redirectWithEvaluationStatus("not_found", externalId);
  }

  const [
    { data: result, error: resultError },
    { data: marketData, error: marketError },
    { data: existingEvaluation, error: existingEvaluationError },
  ] = await Promise.all([
    supabase
      .from("match_results")
      .select("match_id, home_goals, away_goals, verification_status")
      .eq("match_id", match.id)
      .maybeSingle(),
    supabase
      .from("prediction_markets")
      .select("market, selection, probability")
      .eq("prediction_version_id", prediction.id)
      .in("market", ["btts", "over_2_5"]),
    supabase
      .from("prediction_results")
      .select("id")
      .eq("prediction_version_id", prediction.id)
      .maybeSingle(),
  ]);

  if (resultError) {
    logRealFixtureLabSupabaseError({
      operation: "select_match_result_for_evaluation",
      table: "match_results",
      error: resultError,
    });
    redirectWithEvaluationStatus("error", externalId);
  }

  if (marketError) {
    logRealFixtureLabSupabaseError({
      operation: "select_prediction_markets_for_evaluation",
      table: "prediction_markets",
      error: marketError,
    });
    redirectWithEvaluationStatus("error", externalId);
  }

  if (existingEvaluationError) {
    logRealFixtureLabSupabaseError({
      operation: "select_prediction_result_for_evaluation",
      table: "prediction_results",
      error: existingEvaluationError,
    });
    redirectWithEvaluationStatus("error", externalId);
  }

  if (!result) {
    redirectWithEvaluationStatus("no_result", externalId);
  }

  if (result.verification_status !== "verified") {
    redirectWithEvaluationStatus("unverified", externalId);
  }

  const markets = resolveEvaluationMarkets((marketData ?? []) as StoredEvaluationMarket[]);
  const topScorelines = topScorelinesSchema.safeParse(prediction.top_scores_json);

  if (!markets || !topScorelines.success) {
    redirectWithEvaluationStatus("incomplete", externalId);
  }

  const evaluation = evaluatePrediction(
    {
      predictionVersionId: prediction.id,
      matchId: prediction.match_id,
      probabilities: {
        oneXTwo: {
          homeWin: prediction.home_win_prob,
          draw: prediction.draw_prob,
          awayWin: prediction.away_win_prob,
        },
        btts: markets.btts,
        overUnder25: markets.overUnder25,
      },
      mostLikelyScore: prediction.most_likely_score,
      topScorelines: topScorelines.data,
    },
    {
      matchId: result.match_id,
      homeGoals: result.home_goals,
      awayGoals: result.away_goals,
      verificationStatus: result.verification_status,
    },
  );

  if (evaluation.status !== "evaluable") {
    redirectWithEvaluationStatus("not_evaluable", externalId);
  }

  const { prediction_version_id, ...evaluationFields } = evaluation.predictionResultsPayload;
  const persistedFields = {
    ...evaluationFields,
    validated_at: new Date().toISOString(),
  };

  const mutation = existingEvaluation
    ? supabase
        .from("prediction_results")
        .update(persistedFields)
        .eq("id", existingEvaluation.id)
        .eq("prediction_version_id", prediction_version_id)
        .select("id")
        .maybeSingle()
    : supabase
        .from("prediction_results")
        .insert({
          prediction_version_id,
          ...persistedFields,
        })
        .select("id")
        .maybeSingle();

  const { data, error } = await mutation;

  if (error || !data) {
    if (error) {
      logRealFixtureLabSupabaseError({
        operation: existingEvaluation ? "update_prediction_result" : "insert_prediction_result",
        table: "prediction_results",
        error,
      });
    } else {
      console.error("real_fixture_lab_evaluation_error", {
        operation: existingEvaluation ? "update_prediction_result" : "insert_prediction_result",
        table: "prediction_results",
        message: "Mutation returned no prediction_result row.",
      });
    }
    redirectWithEvaluationStatus("error", externalId);
  }

  revalidatePath("/admin/real-fixture-lab");
  redirectWithEvaluationStatus(existingEvaluation ? "refreshed" : "saved", externalId);
}
