"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { evaluatePrediction } from "@/lib/model-evaluation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const reviewLabFixtureSchema = z.object({
  matchId: z.string().uuid(),
  lab_status: z.enum(["candidate", "ready", "review", "needs_data", "archived"]),
  data_quality: z.enum(["unreviewed", "reviewed", "verified", "rejected"]),
  source_note: z
    .string()
    .trim()
    .max(500, "La nota no puede superar 500 caracteres."),
});

const goalSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN),
  z.number().int().min(0),
);

const saveLabMatchResultSchema = z.object({
  matchId: z.string().uuid(),
  home_goals: goalSchema,
  away_goals: goalSchema,
  verification_status: z.enum(["pending_review", "verified", "rejected"]),
  intake_source: z.enum(["mock", "manual", "csv_import"]),
  source_note: z
    .string()
    .trim()
    .max(500, "La nota no puede superar 500 caracteres."),
});

const persistLabEvaluationSchema = z.object({
  predictionVersionId: z.string().uuid(),
});

const topScorelinesSchema = z.array(
  z.object({
    score: z.string().regex(/^\d+-\d+$/),
    probability: z.number().min(0).max(100),
  }),
);

type StoredMarket = {
  market: "btts" | "over_2_5";
  selection: string;
  probability: number;
};

function resolveEvaluationMarkets(markets: StoredMarket[]) {
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

function redirectWithStatus(status: "saved" | "invalid" | "error"): never {
  redirect(`/admin/beta-lab?review=${status}`);
}

function redirectWithResultStatus(status: "saved" | "invalid" | "error"): never {
  redirect(`/admin/beta-lab?result=${status}`);
}

function redirectWithEvaluationStatus(
  status: "saved" | "invalid" | "unverified" | "incomplete" | "not_evaluable" | "error",
): never {
  redirect(`/admin/beta-lab?evaluation=${status}`);
}

export async function reviewLabFixtureAction(formData: FormData) {
  const input = reviewLabFixtureSchema.safeParse({
    matchId: formData.get("matchId"),
    lab_status: formData.get("lab_status"),
    data_quality: formData.get("data_quality"),
    source_note: formData.get("source_note") ?? "",
  });

  if (!input.success) {
    redirectWithStatus("invalid");
  }

  const { user } = await requireAdmin("/admin/beta-lab");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("matches")
    .update({
      lab_status: input.data.lab_status,
      data_quality: input.data.data_quality,
      source_note: input.data.source_note || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", input.data.matchId)
    .eq("access_scope", "lab_only")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirectWithStatus("error");
  }

  revalidatePath("/admin/beta-lab");
  redirectWithStatus("saved");
}

export async function saveLabMatchResultAction(formData: FormData) {
  const input = saveLabMatchResultSchema.safeParse({
    matchId: formData.get("matchId"),
    home_goals: formData.get("home_goals"),
    away_goals: formData.get("away_goals"),
    verification_status: formData.get("verification_status"),
    intake_source: formData.get("intake_source"),
    source_note: formData.get("source_note") ?? "",
  });

  if (!input.success) {
    redirectWithResultStatus("invalid");
  }

  const { user } = await requireAdmin("/admin/beta-lab");
  const supabase = await createSupabaseServerClient();
  const { data: labMatch, error: labMatchError } = await supabase
    .from("matches")
    .select("id")
    .eq("id", input.data.matchId)
    .eq("access_scope", "lab_only")
    .maybeSingle();

  if (labMatchError || !labMatch) {
    redirectWithResultStatus("error");
  }

  const { data: existingResult, error: existingResultError } = await supabase
    .from("match_results")
    .select("id")
    .eq("match_id", input.data.matchId)
    .maybeSingle();

  if (existingResultError) {
    redirectWithResultStatus("error");
  }

  const resultFields = {
    home_goals: input.data.home_goals,
    away_goals: input.data.away_goals,
    verification_status: input.data.verification_status,
    intake_source: input.data.intake_source,
    source_note: input.data.source_note || null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  };

  const mutation = existingResult
    ? supabase
        .from("match_results")
        .update(resultFields)
        .eq("id", existingResult.id)
        .eq("match_id", input.data.matchId)
        .select("id")
        .maybeSingle()
    : supabase
        .from("match_results")
        .insert({
          match_id: input.data.matchId,
          ...resultFields,
        })
        .select("id")
        .maybeSingle();

  const { data, error } = await mutation;

  if (error || !data) {
    redirectWithResultStatus("error");
  }

  revalidatePath("/admin/beta-lab");
  redirectWithResultStatus("saved");
}

export async function persistLabEvaluationAction(formData: FormData) {
  const input = persistLabEvaluationSchema.safeParse({
    predictionVersionId: formData.get("predictionVersionId"),
  });

  if (!input.success) {
    redirectWithEvaluationStatus("invalid");
  }

  await requireAdmin("/admin/beta-lab");
  const supabase = await createSupabaseServerClient();
  const { data: prediction, error: predictionError } = await supabase
    .from("prediction_versions")
    .select(
      "id, match_id, run_scope, home_win_prob, draw_prob, away_win_prob, most_likely_score, top_scores_json",
    )
    .eq("id", input.data.predictionVersionId)
    .eq("run_scope", "internal_lab")
    .maybeSingle();

  if (predictionError || !prediction) {
    redirectWithEvaluationStatus("error");
  }

  const { data: labMatch, error: labMatchError } = await supabase
    .from("matches")
    .select("id, competition_id")
    .eq("id", prediction.match_id)
    .eq("access_scope", "lab_only")
    .maybeSingle();

  if (labMatchError || !labMatch) {
    redirectWithEvaluationStatus("error");
  }

  const { data: labCompetition, error: labCompetitionError } = await supabase
    .from("competitions")
    .select("id")
    .eq("id", labMatch.competition_id)
    .eq("usage_scope", "internal_lab")
    .maybeSingle();

  if (labCompetitionError || !labCompetition) {
    redirectWithEvaluationStatus("error");
  }

  const [
    { data: result, error: resultError },
    { data: marketData, error: marketError },
  ] = await Promise.all([
    supabase
      .from("match_results")
      .select("match_id, home_goals, away_goals, decision_method, verification_status")
      .eq("match_id", labMatch.id)
      .maybeSingle(),
    supabase
      .from("prediction_markets")
      .select("market, selection, probability")
      .eq("prediction_version_id", prediction.id)
      .in("market", ["btts", "over_2_5"]),
  ]);

  if (resultError || marketError) {
    redirectWithEvaluationStatus("error");
  }

  if (!result || result.verification_status !== "verified") {
    redirectWithEvaluationStatus("unverified");
  }

  if (result.decision_method === "aet" || result.decision_method === "pen") {
    redirectWithEvaluationStatus("not_evaluable");
  }

  const markets = resolveEvaluationMarkets((marketData ?? []) as StoredMarket[]);
  const topScorelines = topScorelinesSchema.safeParse(prediction.top_scores_json);

  if (!markets || !topScorelines.success) {
    redirectWithEvaluationStatus("incomplete");
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
      decisionMethod: result.decision_method,
      verificationStatus: result.verification_status,
    },
  );

  if (evaluation.status !== "evaluable") {
    redirectWithEvaluationStatus("not_evaluable");
  }

  const { prediction_version_id, ...evaluationFields } = evaluation.predictionResultsPayload;
  const persistedFields = {
    ...evaluationFields,
    validated_at: new Date().toISOString(),
  };
  const { data: existingEvaluation, error: existingEvaluationError } = await supabase
    .from("prediction_results")
    .select("id")
    .eq("prediction_version_id", prediction_version_id)
    .maybeSingle();

  if (existingEvaluationError) {
    redirectWithEvaluationStatus("error");
  }

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
    redirectWithEvaluationStatus("error");
  }

  revalidatePath("/admin/beta-lab");
  redirectWithEvaluationStatus("saved");
}
