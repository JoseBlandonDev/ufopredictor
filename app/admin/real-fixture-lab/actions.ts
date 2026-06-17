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

const verifyRealFixtureResultSchema = z.object({
  externalId: z.string().trim().min(1),
  matchResultId: z.string().uuid(),
});

const publishPublicPredictionSchema = z.object({
  matchId: z.string().trim().min(1),
  matchSlug: z.string().trim().min(1),
  internalPredictionVersionId: z.string().uuid(),
});

const refreshPublicPredictionSchema = z.object({
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
type ResultVerificationStatus =
  | "verified"
  | "invalid"
  | "no_result"
  | "already_verified"
  | "rejected"
  | "not_found"
  | "error";
type PublishStatus =
  | "published"
  | "already_published"
  | "invalid"
  | "not_found"
  | "blocked"
  | "error";
type RefreshStatus = "refreshed" | "invalid" | "not_found" | "blocked" | "no_model" | "error";

type StoredEvaluationMarket = {
  market: "btts" | "over_2_5";
  selection: string;
  probability: number;
};

type ClonablePredictionMarket = {
  market: "match_winner" | "over_2_5" | "btts" | "exact_score";
  selection: string;
  probability: number;
  confidence: number | null;
  is_premium: boolean;
};

type RealFixtureLabProtectedMatch = {
  id: string;
  competition_id: string;
  external_id: string;
  access_scope: "admin_only" | "public" | "premium" | "lab_only";
  intake_source: "mock" | "manual" | "csv_import" | "api_football";
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
};

const DEFAULT_REAL_FIXTURE_LAB_RETURN_TO = "/admin/real-fixture-lab";
const ADMIN_REAL_FIXTURE_RETURN_PATHS = new Set([
  "/admin/real-fixture-lab",
  "/admin/real-fixture-publish-queue",
  "/admin/real-fixture-result-review-queue",
  "/admin/real-fixture-evaluation-queue",
]);

function normalizeAdminReturnTo(value: FormDataEntryValue | null, fallback = DEFAULT_REAL_FIXTURE_LAB_RETURN_TO) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return ADMIN_REAL_FIXTURE_RETURN_PATHS.has(trimmed) ? trimmed : fallback;
}

function buildAdminRouteStatusHref(args: {
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(args.params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `${args.basePath}?${query}` : args.basePath;
}

function redirectWithSaveStatus(
  status: SaveStatus,
  externalId: string,
  returnTo = DEFAULT_REAL_FIXTURE_LAB_RETURN_TO,
): never {
  redirect(
    buildAdminRouteStatusHref({
      basePath: returnTo,
      params: {
        externalId,
        save: status,
      },
    }),
  );
}

function redirectWithEvaluationStatus(
  status: EvaluationStatus,
  externalId: string,
  returnTo = DEFAULT_REAL_FIXTURE_LAB_RETURN_TO,
): never {
  redirect(
    buildAdminRouteStatusHref({
      basePath: returnTo,
      params: {
        externalId,
        evaluation: status,
      },
    }),
  );
}

function redirectWithResultStatus(
  status: ResultVerificationStatus,
  externalId: string,
  returnTo = DEFAULT_REAL_FIXTURE_LAB_RETURN_TO,
): never {
  redirect(
    buildAdminRouteStatusHref({
      basePath: returnTo,
      params: {
        externalId,
        result: status,
      },
    }),
  );
}

function redirectWithPublishStatus(
  status: PublishStatus,
  args: {
    returnTo?: string;
    externalId?: string;
  } = {},
): never {
  redirect(
    buildAdminRouteStatusHref({
      basePath: args.returnTo ?? DEFAULT_REAL_FIXTURE_LAB_RETURN_TO,
      params: {
        publish: status,
        externalId: args.externalId,
      },
    }),
  );
}

function redirectWithRefreshStatus(status: RefreshStatus, externalId: string): never {
  redirect(`/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&refresh=${status}`);
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

function canRefreshPublicRealFixture(fixture: {
  accessScope: string;
  intakeSource: string;
  status: string;
}) {
  return (
    fixture.accessScope === "public" &&
    fixture.intakeSource === "api_football" &&
    (fixture.status === "scheduled" || fixture.status === "finished")
  );
}

async function getActiveModelVersionOrRedirect(args: {
  externalId: string;
  onMissingModel: (externalId: string) => never;
}) {
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
    args.onMissingModel(args.externalId);
  }

  return { supabase, activeModelVersion };
}

function toPublicPredictionVersionPayload(predictionVersionInsert: ReturnType<typeof buildRealFixturePredictionVersionInsert>) {
  return {
    match_id: predictionVersionInsert.match_id,
    model_version_id: predictionVersionInsert.model_version_id,
    prediction_type: predictionVersionInsert.prediction_type,
    home_win_prob: predictionVersionInsert.home_win_prob,
    draw_prob: predictionVersionInsert.draw_prob,
    away_win_prob: predictionVersionInsert.away_win_prob,
    expected_home_goals: predictionVersionInsert.expected_home_goals,
    expected_away_goals: predictionVersionInsert.expected_away_goals,
    most_likely_score: predictionVersionInsert.most_likely_score,
    top_scores_json: predictionVersionInsert.top_scores_json,
    confidence_score: predictionVersionInsert.confidence_score,
    risk_level: predictionVersionInsert.risk_level,
    run_scope: "public_product" as const,
  };
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

async function clonePredictionMarketsToPublicVersion(args: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  sourcePredictionVersionId: string;
  targetPredictionVersionId: string;
  selectOperation: string;
  insertOperation: string;
  onFailure: () => never;
}) {
  const { data: sourceMarkets, error: sourceMarketsError } = await args.supabase
    .from("prediction_markets")
    .select("market, selection, probability, confidence, is_premium")
    .eq("prediction_version_id", args.sourcePredictionVersionId);

  if (sourceMarketsError) {
    logRealFixtureLabSupabaseError({
      operation: args.selectOperation,
      table: "prediction_markets",
      error: sourceMarketsError,
    });
    args.onFailure();
  }

  const publicMarketInserts = ((sourceMarkets ?? []) as ClonablePredictionMarket[]).map((market) => ({
    prediction_version_id: args.targetPredictionVersionId,
    market: market.market,
    selection: market.selection,
    probability: market.probability,
    confidence: market.confidence,
    is_premium: market.is_premium,
  }));

  if (publicMarketInserts.length === 0) {
    return;
  }

  const { error: insertPublicMarketsError } = await args.supabase
    .from("prediction_markets")
    .insert(publicMarketInserts);

  if (insertPublicMarketsError) {
    logRealFixtureLabSupabaseError({
      operation: args.insertOperation,
      table: "prediction_markets",
      error: insertPublicMarketsError,
    });
    args.onFailure();
  }
}

async function canAccessRealFixtureLabProtectedMatch(args: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  match: RealFixtureLabProtectedMatch;
  competitionOperation: string;
  onCompetitionError: (externalId: string) => never;
}): Promise<boolean> {
  if (args.match.intake_source !== "api_football") {
    return false;
  }

  if (args.match.access_scope === "admin_only") {
    return true;
  }

  if (args.match.access_scope !== "public" || args.match.status !== "finished") {
    return false;
  }

  const { data: competition, error: competitionError } = await args.supabase
    .from("competitions")
    .select("id, usage_scope")
    .eq("id", args.match.competition_id)
    .maybeSingle();

  if (competitionError) {
    logRealFixtureLabSupabaseError({
      operation: args.competitionOperation,
      table: "competitions",
      error: competitionError,
    });
    args.onCompetitionError(args.match.external_id);
  }

  return competition?.usage_scope === "public_product";
}

export async function saveRealFixturePredictionAction(formData: FormData) {
  const input = saveRealFixturePredictionSchema.safeParse({
    externalId: formData.get("externalId"),
  });

  if (!input.success) {
    redirect(`/admin/real-fixture-lab?save=invalid`);
  }

  const externalId = input.data.externalId;
  const returnTo = normalizeAdminReturnTo(formData.get("returnTo"));
  await requireAdmin(returnTo);

  const fixtureData = await getAdminRealFixtureLabData({ externalId });

  if (fixtureData.status !== "ready") {
    redirectWithSaveStatus("error", externalId, returnTo);
  }

  const fixture = fixtureData.fixtures[0];

  if (!fixture) {
    redirectWithSaveStatus("not_found", externalId, returnTo);
  }

  if (fixture.accessScope !== "admin_only" || fixture.intakeSource !== "api_football") {
    redirectWithSaveStatus("error", externalId, returnTo);
  }

  const predictionInput = buildRealFixturePredictionInput(fixture);
  const predictionOutput = generatePrediction(predictionInput);
  const { supabase, activeModelVersion } = await getActiveModelVersionOrRedirect({
    externalId,
    onMissingModel: (targetExternalId) => redirectWithSaveStatus("no_model", targetExternalId, returnTo),
  });

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
    redirectWithSaveStatus("error", externalId, returnTo);
  }

  if (existingPrediction) {
    redirectWithSaveStatus("duplicate", externalId, returnTo);
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
    redirectWithSaveStatus("error", externalId, returnTo);
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
    redirectWithSaveStatus("error", externalId, returnTo);
  }

  revalidatePath("/admin/real-fixture-lab");
  revalidatePath("/admin/real-fixture-publish-queue");
  redirectWithSaveStatus("saved", externalId, returnTo);
}

export async function refreshPublishedRealFixturePredictionAction(formData: FormData) {
  const input = refreshPublicPredictionSchema.safeParse({
    externalId: formData.get("externalId"),
  });

  if (!input.success) {
    redirect(`/admin/real-fixture-lab?refresh=invalid`);
  }

  const externalId = input.data.externalId;
  await requireAdmin("/admin/real-fixture-lab");

  const fixtureData = await getAdminRealFixtureLabData({
    externalId,
    includePublicExactMatch: true,
  });

  if (fixtureData.status !== "ready") {
    redirectWithRefreshStatus("error", externalId);
  }

  const fixture = fixtureData.fixtures[0];

  if (!fixture) {
    redirectWithRefreshStatus("not_found", externalId);
  }

  if (!canRefreshPublicRealFixture(fixture)) {
    redirectWithRefreshStatus("blocked", externalId);
  }

  const predictionInput = buildRealFixturePredictionInput(fixture);
  const predictionOutput = generatePrediction(predictionInput);
  const { supabase, activeModelVersion } = await getActiveModelVersionOrRedirect({
    externalId,
    onMissingModel: (targetExternalId) => redirectWithRefreshStatus("no_model", targetExternalId),
  });

  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .select("id, usage_scope")
    .eq("id", fixture.competitionId)
    .maybeSingle();

  if (competitionError) {
    logRealFixtureLabSupabaseError({
      operation: "select_competition_for_public_refresh",
      table: "competitions",
      error: competitionError,
    });
    redirectWithRefreshStatus("error", externalId);
  }

  if (!competition || competition.usage_scope !== "public_product") {
    redirectWithRefreshStatus("blocked", externalId);
  }

  const { data: existingPublicPrediction, error: existingPublicPredictionError } = await supabase
    .from("prediction_versions")
    .select("id")
    .eq("match_id", fixture.id)
    .eq("prediction_type", REAL_FIXTURE_LAB_PREDICTION_TYPE)
    .eq("run_scope", "public_product")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPublicPredictionError) {
    logRealFixtureLabSupabaseError({
      operation: "select_existing_public_prediction_for_refresh",
      table: "prediction_versions",
      error: existingPublicPredictionError,
    });
    redirectWithRefreshStatus("error", externalId);
  }

  if (!existingPublicPrediction) {
    redirectWithRefreshStatus("not_found", externalId);
  }

  const predictionVersionInsert = buildRealFixturePredictionVersionInsert({
    matchId: fixture.id,
    modelVersionId: activeModelVersion.id,
    predictionOutput,
  });

  const { data: insertedInternalPrediction, error: insertedInternalPredictionError } = await supabase
    .from("prediction_versions")
    .insert(predictionVersionInsert)
    .select("id")
    .maybeSingle();

  if (insertedInternalPredictionError || !insertedInternalPrediction) {
    if (insertedInternalPredictionError) {
      logRealFixtureLabSupabaseError({
        operation: "insert_internal_prediction_version_for_refresh",
        table: "prediction_versions",
        error: insertedInternalPredictionError,
      });
    } else {
      console.error("real_fixture_lab_refresh_error", {
        operation: "insert_internal_prediction_version_for_refresh",
        table: "prediction_versions",
        message: "Insert returned no internal prediction_version row.",
      });
    }
    redirectWithRefreshStatus("error", externalId);
  }

  const predictionMarketInserts = buildRealFixturePredictionMarketInserts({
    predictionVersionId: insertedInternalPrediction.id,
    predictionOutput,
  });

  const { error: insertedPredictionMarketsError } = await supabase
    .from("prediction_markets")
    .insert(predictionMarketInserts);

  if (insertedPredictionMarketsError) {
    logRealFixtureLabSupabaseError({
      operation: "insert_internal_prediction_markets_for_refresh",
      table: "prediction_markets",
      error: insertedPredictionMarketsError,
    });
    redirectWithRefreshStatus("error", externalId);
  }

  const publicPredictionInsert = toPublicPredictionVersionPayload(predictionVersionInsert);
  const { data: insertedPublicPrediction, error: insertedPublicPredictionError } = await supabase
    .from("prediction_versions")
    .insert(publicPredictionInsert)
    .select("id")
    .maybeSingle();

  if (insertedPublicPredictionError || !insertedPublicPrediction) {
    if (insertedPublicPredictionError) {
      logRealFixtureLabSupabaseError({
        operation: "insert_replacement_public_prediction_version",
        table: "prediction_versions",
        error: insertedPublicPredictionError,
      });
    } else {
      console.error("real_fixture_lab_refresh_error", {
        operation: "insert_replacement_public_prediction_version",
        table: "prediction_versions",
        message: "Insert returned no replacement public prediction_version row.",
      });
    }
    redirectWithRefreshStatus("error", externalId);
  }

  await clonePredictionMarketsToPublicVersion({
    supabase,
    sourcePredictionVersionId: insertedInternalPrediction.id,
    targetPredictionVersionId: insertedPublicPrediction.id,
    selectOperation: "select_internal_prediction_markets_for_public_refresh",
    insertOperation: "insert_public_prediction_markets_for_refresh",
    onFailure: () => redirectWithRefreshStatus("error", externalId),
  });

  revalidatePath("/admin/real-fixture-lab");
  revalidatePath("/predictions");
  revalidatePath(`/matches/${fixture.slug}`);
  redirectWithRefreshStatus("refreshed", externalId);
}

export async function persistRealFixtureEvaluationAction(formData: FormData) {
  const returnTo = normalizeAdminReturnTo(formData.get("returnTo"));
  const input = persistRealFixtureEvaluationSchema.safeParse({
    predictionVersionId: formData.get("predictionVersionId"),
    externalId: formData.get("externalId"),
  });

  if (!input.success) {
    redirect(
      buildAdminRouteStatusHref({
        basePath: returnTo,
        params: {
          evaluation: "invalid",
        },
      }),
    );
  }

  const { predictionVersionId, externalId } = input.data;
  await requireAdmin(returnTo);
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
    redirectWithEvaluationStatus("error", externalId, returnTo);
  }

  if (!prediction) {
    redirectWithEvaluationStatus("not_found", externalId, returnTo);
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, competition_id, external_id, access_scope, intake_source, status")
    .eq("id", prediction.match_id)
    .eq("external_id", externalId)
    .maybeSingle();

  if (matchError) {
    logRealFixtureLabSupabaseError({
      operation: "select_match_for_evaluation",
      table: "matches",
      error: matchError,
    });
    redirectWithEvaluationStatus("error", externalId, returnTo);
  }

  if (!match) {
    redirectWithEvaluationStatus("not_found", externalId, returnTo);
  }

  const canAccessMatch = await canAccessRealFixtureLabProtectedMatch({
    supabase,
    match,
    competitionOperation: "select_competition_for_evaluation",
    onCompetitionError: (targetExternalId) => redirectWithEvaluationStatus("error", targetExternalId, returnTo),
  });

  if (!canAccessMatch) {
    redirectWithEvaluationStatus("not_found", externalId, returnTo);
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
    redirectWithEvaluationStatus("error", externalId, returnTo);
  }

  if (marketError) {
    logRealFixtureLabSupabaseError({
      operation: "select_prediction_markets_for_evaluation",
      table: "prediction_markets",
      error: marketError,
    });
    redirectWithEvaluationStatus("error", externalId, returnTo);
  }

  if (existingEvaluationError) {
    logRealFixtureLabSupabaseError({
      operation: "select_prediction_result_for_evaluation",
      table: "prediction_results",
      error: existingEvaluationError,
    });
    redirectWithEvaluationStatus("error", externalId, returnTo);
  }

  if (!result) {
    redirectWithEvaluationStatus("no_result", externalId, returnTo);
  }

  if (result.verification_status !== "verified") {
    redirectWithEvaluationStatus("unverified", externalId, returnTo);
  }

  const markets = resolveEvaluationMarkets((marketData ?? []) as StoredEvaluationMarket[]);
  const topScorelines = topScorelinesSchema.safeParse(prediction.top_scores_json);

  if (!markets || !topScorelines.success) {
    redirectWithEvaluationStatus("incomplete", externalId, returnTo);
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
    redirectWithEvaluationStatus("not_evaluable", externalId, returnTo);
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
    redirectWithEvaluationStatus("error", externalId, returnTo);
  }

  revalidatePath("/admin/real-fixture-lab");
  revalidatePath("/admin/real-fixture-evaluation-queue");
  redirectWithEvaluationStatus(existingEvaluation ? "refreshed" : "saved", externalId, returnTo);
}

export async function verifyRealFixtureResultAction(formData: FormData) {
  const input = verifyRealFixtureResultSchema.safeParse({
    externalId: formData.get("externalId"),
    matchResultId: formData.get("matchResultId"),
  });

  if (!input.success) {
    redirect(`/admin/real-fixture-lab?result=invalid`);
  }

  const { externalId, matchResultId } = input.data;
  const returnTo = normalizeAdminReturnTo(formData.get("returnTo"));
  const { user } = await requireAdmin(returnTo);
  const supabase = await createSupabaseServerClient();

  const { data: result, error: resultError } = await supabase
    .from("match_results")
    .select("id, match_id, verification_status")
    .eq("id", matchResultId)
    .maybeSingle();

  if (resultError) {
    logRealFixtureLabSupabaseError({
      operation: "select_match_result_for_verification",
      table: "match_results",
      error: resultError,
    });
    redirectWithResultStatus("error", externalId, returnTo);
  }

  if (!result) {
    redirectWithResultStatus("no_result", externalId, returnTo);
  }

  if (result.verification_status === "verified") {
    redirectWithResultStatus("already_verified", externalId, returnTo);
  }

  if (result.verification_status === "rejected") {
    redirectWithResultStatus("rejected", externalId, returnTo);
  }

  if (result.verification_status !== "pending_review") {
    redirectWithResultStatus("error", externalId, returnTo);
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, competition_id, external_id, access_scope, intake_source, status")
    .eq("id", result.match_id)
    .eq("external_id", externalId)
    .maybeSingle();

  if (matchError) {
    logRealFixtureLabSupabaseError({
      operation: "select_match_for_result_verification",
      table: "matches",
      error: matchError,
    });
    redirectWithResultStatus("error", externalId, returnTo);
  }

  if (!match) {
    redirectWithResultStatus("not_found", externalId, returnTo);
  }

  const canAccessMatch = await canAccessRealFixtureLabProtectedMatch({
    supabase,
    match,
    competitionOperation: "select_competition_for_result_verification",
    onCompetitionError: (targetExternalId) => redirectWithResultStatus("error", targetExternalId, returnTo),
  });

  if (!canAccessMatch) {
    redirectWithResultStatus("not_found", externalId, returnTo);
  }

  const verificationUpdate = {
    verification_status: "verified" as const,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  };

  const { data: updatedResult, error: updateError } = await supabase
    .from("match_results")
    .update(verificationUpdate)
    .eq("id", result.id)
    .eq("match_id", result.match_id)
    .eq("verification_status", "pending_review")
    .select("id")
    .maybeSingle();

  if (updateError || !updatedResult) {
    if (updateError) {
      logRealFixtureLabSupabaseError({
        operation: "update_match_result_verification",
        table: "match_results",
        error: updateError,
      });
    } else {
      console.error("real_fixture_lab_result_verification_error", {
        operation: "update_match_result_verification",
        table: "match_results",
        message: "Update returned no match_result row.",
      });
    }
    redirectWithResultStatus("error", externalId, returnTo);
  }

  revalidatePath("/admin/real-fixture-lab");
  revalidatePath("/admin/real-fixture-result-review-queue");
  redirectWithResultStatus("verified", externalId, returnTo);
}

export async function publishRealFixturePredictionAction(formData: FormData) {
  const input = publishPublicPredictionSchema.safeParse({
    matchId: formData.get("matchId"),
    matchSlug: formData.get("matchSlug"),
    internalPredictionVersionId: formData.get("internalPredictionVersionId"),
  });

  if (!input.success) {
    redirectWithPublishStatus("invalid");
  }

  const { matchId, matchSlug, internalPredictionVersionId } = input.data;
  const returnTo = normalizeAdminReturnTo(formData.get("returnTo"));
  const externalIdValue = formData.get("externalId");
  const externalId = typeof externalIdValue === "string" && externalIdValue.trim() ? externalIdValue.trim() : undefined;
  await requireAdmin(returnTo);
  const supabase = await createSupabaseServerClient();

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, slug, competition_id, status, access_scope, intake_source")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) {
    logRealFixtureLabSupabaseError({
      operation: "select_match_for_publication",
      table: "matches",
      error: matchError,
    });
    redirectWithPublishStatus("error", { returnTo, externalId });
  }

  if (!match || match.slug !== matchSlug) {
    redirectWithPublishStatus("not_found", { returnTo, externalId });
  }

  if (
    match.access_scope !== "admin_only" ||
    match.intake_source !== "api_football" ||
    match.status !== "scheduled"
  ) {
    redirectWithPublishStatus("blocked", { returnTo, externalId });
  }

  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .select("id, usage_scope")
    .eq("id", match.competition_id)
    .maybeSingle();

  if (competitionError) {
    logRealFixtureLabSupabaseError({
      operation: "select_competition_for_publication",
      table: "competitions",
      error: competitionError,
    });
    redirectWithPublishStatus("error", { returnTo, externalId });
  }

  if (!competition || competition.usage_scope !== "public_product") {
    redirectWithPublishStatus("blocked", { returnTo, externalId });
  }

  const { data: internalPrediction, error: internalPredictionError } = await supabase
    .from("prediction_versions")
    .select(
      "id, match_id, model_version_id, prediction_type, home_win_prob, draw_prob, away_win_prob, expected_home_goals, expected_away_goals, most_likely_score, top_scores_json, confidence_score, risk_level, run_scope",
    )
    .eq("id", internalPredictionVersionId)
    .maybeSingle();

  if (internalPredictionError) {
    logRealFixtureLabSupabaseError({
      operation: "select_internal_prediction_for_publication",
      table: "prediction_versions",
      error: internalPredictionError,
    });
    redirectWithPublishStatus("error", { returnTo, externalId });
  }

  if (
    !internalPrediction ||
    internalPrediction.match_id !== match.id ||
    internalPrediction.run_scope !== REAL_FIXTURE_LAB_RUN_SCOPE ||
    internalPrediction.prediction_type !== REAL_FIXTURE_LAB_PREDICTION_TYPE
  ) {
    redirectWithPublishStatus("blocked", { returnTo, externalId });
  }

  const { data: existingPublicPrediction, error: existingPublicPredictionError } = await supabase
    .from("prediction_versions")
    .select("id")
    .eq("match_id", match.id)
    .eq("prediction_type", internalPrediction.prediction_type)
    .eq("run_scope", "public_product")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPublicPredictionError) {
    logRealFixtureLabSupabaseError({
      operation: "select_existing_public_prediction_for_publication",
      table: "prediction_versions",
      error: existingPublicPredictionError,
    });
    redirectWithPublishStatus("error", { returnTo, externalId });
  }

  if (!existingPublicPrediction) {
    const { data: insertedPublicPrediction, error: insertedPublicPredictionError } = await supabase
      .from("prediction_versions")
      .insert({
        match_id: internalPrediction.match_id,
        model_version_id: internalPrediction.model_version_id,
        prediction_type: internalPrediction.prediction_type,
        home_win_prob: internalPrediction.home_win_prob,
        draw_prob: internalPrediction.draw_prob,
        away_win_prob: internalPrediction.away_win_prob,
        expected_home_goals: internalPrediction.expected_home_goals,
        expected_away_goals: internalPrediction.expected_away_goals,
        most_likely_score: internalPrediction.most_likely_score,
        top_scores_json: internalPrediction.top_scores_json,
        confidence_score: internalPrediction.confidence_score,
        risk_level: internalPrediction.risk_level,
        run_scope: "public_product",
      })
      .select("id")
      .maybeSingle();

    if (insertedPublicPredictionError || !insertedPublicPrediction) {
      if (insertedPublicPredictionError) {
        logRealFixtureLabSupabaseError({
          operation: "insert_public_prediction_version",
          table: "prediction_versions",
          error: insertedPublicPredictionError,
        });
      } else {
        console.error("real_fixture_lab_publication_error", {
          operation: "insert_public_prediction_version",
          table: "prediction_versions",
          message: "Insert returned no public prediction_version row.",
        });
      }
      redirectWithPublishStatus("error", { returnTo, externalId });
    }

    await clonePredictionMarketsToPublicVersion({
      supabase,
      sourcePredictionVersionId: internalPrediction.id,
      targetPredictionVersionId: insertedPublicPrediction.id,
      selectOperation: "select_internal_prediction_markets_for_publication",
      insertOperation: "insert_public_prediction_markets_for_publication",
      onFailure: () => redirectWithPublishStatus("error", { returnTo, externalId }),
    });
  }

  const { data: updatedMatchId, error: updatedMatchError } = await supabase.rpc(
    "publish_real_fixture_match_access_scope",
    {
      target_match_id: match.id,
      target_match_slug: match.slug,
    },
  );

  if (updatedMatchError || updatedMatchId !== match.id) {
    logRealFixtureLabSupabaseError({
      operation: "update_match_access_scope_for_publication",
      table: "matches",
      error: updatedMatchError,
    });
    redirectWithPublishStatus("error", { returnTo, externalId });
  }

  revalidatePath("/admin/real-fixture-lab");
  revalidatePath("/admin/real-fixture-publish-queue");
  revalidatePath("/predictions");
  revalidatePath(`/matches/${matchSlug}`);
  redirectWithPublishStatus(existingPublicPrediction ? "already_published" : "published", {
    returnTo,
    externalId,
  });
}
