"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { generatePrediction } from "../../../lib/prediction-engine/generate-prediction";
import { buildRealFixturePredictionInput } from "../../../lib/prediction-engine/real-fixture-adapter";
import { createPredictionReviewAiProvider, discoverPredictionReviewAiAvailability, predictionReviewAiResponseSchema } from "../../../lib/prediction-review/ai";
import { buildPredictionReviewBundleFromOutput, buildPredictionReviewBundleFromSnapshot, buildPredictionReviewBundleFromVersion } from "../../../lib/prediction-review/bundle";
import { SIGNAL_SOURCE_SNAPSHOT_ID, PREDICTION_REFRESH_REVIEW_PATH } from "../../../lib/prediction-review/constants";
import { buildPredictionMarketsFromReviewBundle, buildPredictionReviewSnapshotInsert, buildPublicPredictionVersionInsertFromReviewBundle } from "../../../lib/prediction-review/persistence";
import { readPredictionReviewProviderState, validatePredictionReviewProviderFixture } from "../../../lib/prediction-review/provider";
import { buildReviewedXgPredictionBundle, normalizeAiReviewedXgDecision, validateReviewedXgBounds } from "../../../lib/prediction-review/reviewed-xg";
import { resolvePredictionReviewTeamDisplayNameEs } from "../../../lib/prediction-review/team-display-names";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const baseSchema = z.object({
  matchId: z.string().uuid(),
  externalId: z.string().trim().min(1),
  reason: z.string().trim().min(1).max(500).optional(),
});

const reviewedXgSchema = baseSchema.extend({
  homeXg: z.coerce.number(),
  awayXg: z.coerce.number(),
});

function redirectWithStatus(args: Record<string, string | undefined>): never {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(args)) {
    if (value) {
      params.set(key, value);
    }
  }
  redirect(`${PREDICTION_REFRESH_REVIEW_PATH}?${params.toString()}`);
}

async function loadMatchContext(matchId: string, externalId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, external_id, slug, competition_id, home_team_id, away_team_id, kickoff_at, status, access_scope, intake_source")
    .eq("id", matchId)
    .eq("external_id", externalId)
    .maybeSingle();

  if (matchError || !match) {
    redirectWithStatus({ externalId, action: "error", message: "match_not_found" });
  }

  const [{ data: competition }, { data: teams }, { data: currentPrediction }, { data: activeModelVersion }] = await Promise.all([
    supabase.from("competitions").select("id, usage_scope").eq("id", match.competition_id).maybeSingle(),
    supabase.from("teams").select("id, name").in("id", [match.home_team_id, match.away_team_id]),
    supabase
      .from("prediction_versions")
      .select("id, match_id, model_version_id, prediction_type, home_win_prob, draw_prob, away_win_prob, expected_home_goals, expected_away_goals, most_likely_score, top_scores_json, confidence_score, risk_level, run_scope, created_at")
      .eq("match_id", match.id)
      .eq("prediction_type", "pre_match_24h")
      .in("run_scope", ["public_product", "internal_lab"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("model_versions").select("id, version").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!competition || competition.usage_scope !== "public_product") {
    redirectWithStatus({ externalId, action: "blocked", message: "competition_not_public_product" });
  }

  const homeTeam = teams?.find((team) => team.id === match.home_team_id);
  const awayTeam = teams?.find((team) => team.id === match.away_team_id);
  if (!homeTeam || !awayTeam) {
    redirectWithStatus({ externalId, action: "error", message: "team_lookup_failed" });
  }

  const providerState = await readPredictionReviewProviderState(externalId);
  const providerGuard = validatePredictionReviewProviderFixture(
    {
      externalId,
      expectedKickoffAt: match.kickoff_at,
      expectedHomeTeamName: homeTeam.name,
      expectedAwayTeamName: awayTeam.name,
    },
    providerState,
  );
  if (!providerGuard.allowed) {
    redirectWithStatus({ externalId, action: "blocked", message: providerGuard.reason ?? "provider_blocked" });
  }

  const { data: currentMarkets } = currentPrediction
    ? await supabase
        .from("prediction_markets")
        .select("prediction_version_id, market, selection, probability")
        .eq("prediction_version_id", currentPrediction.id)
    : { data: [] };

  return {
    supabase,
    match,
    homeTeam,
    awayTeam,
    homeTeamDisplayNameEs: resolvePredictionReviewTeamDisplayNameEs(homeTeam.name),
    awayTeamDisplayNameEs: resolvePredictionReviewTeamDisplayNameEs(awayTeam.name),
    currentPrediction,
    currentPredictionBundle: currentPrediction
      ? buildPredictionReviewBundleFromVersion({
          kind: "current_reference",
          predictionVersion: currentPrediction,
          markets: currentMarkets ?? [],
          sourceSnapshotId: SIGNAL_SOURCE_SNAPSHOT_ID,
          provenanceLabel: currentPrediction.run_scope === "public_product" ? "Current public prediction" : "Current internal prediction",
          modelVersionLabel: activeModelVersion?.version ?? null,
        })
      : null,
    activeModelVersion,
  };
}

async function getOrCreateReviewCase(args: {
  matchId: string;
  externalId: string;
  currentPredictionVersionId?: string | null;
  homeTeamNameEn: string;
  awayTeamNameEn: string;
  homeTeamDisplayNameEs: string;
  awayTeamDisplayNameEs: string;
  modelVersionId?: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: existingCase } = await supabase
    .from("prediction_review_cases")
    .select("*")
    .eq("match_id", args.matchId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingCase) {
    return existingCase;
  }

  const { data: createdCase, error } = await supabase
    .from("prediction_review_cases")
    .insert({
      match_id: args.matchId,
      current_prediction_version_id: args.currentPredictionVersionId ?? null,
      source_snapshot_id: SIGNAL_SOURCE_SNAPSHOT_ID,
      home_team_name_en: args.homeTeamNameEn,
      away_team_name_en: args.awayTeamNameEn,
      home_team_display_name_es: args.homeTeamDisplayNameEs,
      away_team_display_name_es: args.awayTeamDisplayNameEs,
      model_version_id: args.modelVersionId ?? null,
    })
    .select("*")
    .maybeSingle();

  if (error || !createdCase) {
    redirectWithStatus({ externalId: args.externalId, action: "error", message: "review_case_create_failed" });
  }

  return createdCase;
}

export async function generatePredictionRefreshShadowAction(formData: FormData) {
  const input = baseSchema.safeParse({
    matchId: formData.get("matchId"),
    externalId: formData.get("externalId"),
  });
  if (!input.success) {
    redirectWithStatus({ action: "invalid" });
  }

  const { user } = await requireAdmin(PREDICTION_REFRESH_REVIEW_PATH);
  const context = await loadMatchContext(input.data.matchId, input.data.externalId);

  if (!context.activeModelVersion) {
    redirectWithStatus({ externalId: input.data.externalId, action: "blocked", message: "no_active_model" });
  }

  const predictionInput = buildRealFixturePredictionInput({
    id: context.match.id,
    externalId: context.match.external_id,
    slug: context.match.slug,
    competitionId: context.match.competition_id,
    kickoffAt: context.match.kickoff_at,
    stage: null,
    status: context.match.status,
    accessScope: context.match.access_scope,
    intakeSource: context.match.intake_source,
    sourceNote: null,
    competitionName: "World Cup",
    homeTeamId: context.homeTeam.id,
    homeTeamName: context.homeTeam.name,
    awayTeamId: context.awayTeam.id,
    awayTeamName: context.awayTeam.name,
    activeModelVersionId: context.activeModelVersion.id,
    activeModelVersion: context.activeModelVersion.version,
    activeModelSavedPredictionId: null,
    hasSavedPredictionForActiveModel: false,
    latestPublicPredictionId: null,
    latestPublicPredictionCreatedAt: null,
    latestPublicPredictionMarketCount: 0,
    hasLatestPublicModelDetail: false,
    result: null,
    savedPrediction: null,
    savedEvaluation: null,
  });

  const output = generatePrediction(predictionInput);
  const reviewCase = await getOrCreateReviewCase({
    matchId: context.match.id,
    externalId: input.data.externalId,
    currentPredictionVersionId: context.currentPrediction?.id ?? null,
    homeTeamNameEn: context.homeTeam.name,
    awayTeamNameEn: context.awayTeam.name,
    homeTeamDisplayNameEs: context.homeTeamDisplayNameEs,
    awayTeamDisplayNameEs: context.awayTeamDisplayNameEs,
    modelVersionId: context.activeModelVersion.id,
  });

  const bundle = buildPredictionReviewBundleFromOutput({
    output,
    kind: "shadow_refresh",
    sourceSnapshotId: SIGNAL_SOURCE_SNAPSHOT_ID,
    provenanceLabel: "Shadow refresh prediction",
    modelVersionId: context.activeModelVersion.id,
    modelVersionLabel: context.activeModelVersion.version,
  });

  const { data: snapshot, error: snapshotError } = await context.supabase
    .from("prediction_review_snapshots")
    .insert(
      buildPredictionReviewSnapshotInsert({
        reviewCaseId: reviewCase.id,
        snapshotKind: "shadow_refresh",
        sourcePredictionVersionId: context.currentPrediction?.id ?? null,
        sourceSnapshotId: SIGNAL_SOURCE_SNAPSHOT_ID,
        modelVersionId: context.activeModelVersion.id,
        bundle,
        createdBy: user.id,
      }),
    )
    .select("*")
    .maybeSingle();

  if (snapshotError || !snapshot) {
    redirectWithStatus({ externalId: input.data.externalId, action: "error", message: "shadow_snapshot_insert_failed" });
  }

  await context.supabase
    .from("prediction_review_cases")
    .update({
      latest_shadow_snapshot_id: snapshot.id,
      current_prediction_version_id: context.currentPrediction?.id ?? null,
      model_version_id: context.activeModelVersion.id,
    })
    .eq("id", reviewCase.id);

  revalidatePath(PREDICTION_REFRESH_REVIEW_PATH);
  redirectWithStatus({ externalId: input.data.externalId, action: "shadow_generated" });
}

export async function analyzePredictionRefreshWithAiAction(formData: FormData) {
  const input = baseSchema.safeParse({
    matchId: formData.get("matchId"),
    externalId: formData.get("externalId"),
  });
  if (!input.success) {
    redirectWithStatus({ action: "invalid" });
  }

  const { user } = await requireAdmin(PREDICTION_REFRESH_REVIEW_PATH);
  const context = await loadMatchContext(input.data.matchId, input.data.externalId);
  const reviewCase = await getOrCreateReviewCase({
    matchId: context.match.id,
    externalId: input.data.externalId,
    currentPredictionVersionId: context.currentPrediction?.id ?? null,
    homeTeamNameEn: context.homeTeam.name,
    awayTeamNameEn: context.awayTeam.name,
    homeTeamDisplayNameEs: context.homeTeamDisplayNameEs,
    awayTeamDisplayNameEs: context.awayTeamDisplayNameEs,
    modelVersionId: context.activeModelVersion?.id ?? null,
  });

  const availability = discoverPredictionReviewAiAvailability();
  if (availability.status !== "available") {
    redirectWithStatus({ externalId: input.data.externalId, action: "ai_unavailable" });
  }

  const provider = createPredictionReviewAiProvider();
  if (!provider) {
    redirectWithStatus({ externalId: input.data.externalId, action: "ai_unavailable" });
  }

  try {
    const response = await provider.runReview({
      prompt: "prediction-refresh-review",
      context: {
        matchId: context.match.id,
        externalId: context.match.external_id,
        currentPrediction: context.currentPredictionBundle,
      },
    });
    const parsed = normalizeAiReviewedXgDecision({
      response: predictionReviewAiResponseSchema.parse(response),
      baseline: context.currentPredictionBundle,
    });

    const { data: execution, error: executionError } = await context.supabase
      .from("prediction_review_ai_executions")
      .insert({
        review_case_id: reviewCase.id,
        provider: provider.provider,
        model: availability.model,
        status: "succeeded",
        request_json: {
          matchId: context.match.id,
          externalId: context.match.external_id,
        },
        response_json: parsed,
        created_by: user.id,
      })
      .select("*")
      .maybeSingle();

    if (executionError || !execution) {
      redirectWithStatus({ externalId: input.data.externalId, action: "error", message: "ai_audit_insert_failed" });
    }

    await context.supabase.from("prediction_review_cases").update({
      latest_ai_execution_id: execution.id,
    }).eq("id", reviewCase.id);
    revalidatePath(PREDICTION_REFRESH_REVIEW_PATH);
    redirectWithStatus({ externalId: input.data.externalId, action: "ai_analyzed" });
  } catch (error) {
    await context.supabase.from("prediction_review_ai_executions").insert({
      review_case_id: reviewCase.id,
      provider: provider.provider,
      model: availability.model,
      status: "failed",
      request_json: {
        matchId: context.match.id,
        externalId: context.match.external_id,
      },
      error_message: error instanceof Error ? error.message : "AI review failed.",
      created_by: user.id,
    });
    redirectWithStatus({ externalId: input.data.externalId, action: "ai_failed" });
  }
}

async function saveDecision(args: {
  matchId: string;
  externalId: string;
  decision: "KEEP_CURRENT" | "PUBLISH_REFRESHED" | "HOLD";
  reason: string;
  selectedSnapshotId?: string | null;
  publishedPredictionVersionId?: string | null;
}) {
  const { user } = await requireAdmin(PREDICTION_REFRESH_REVIEW_PATH);
  const context = await loadMatchContext(args.matchId, args.externalId);
  const reviewCase = await getOrCreateReviewCase({
    matchId: context.match.id,
    externalId: args.externalId,
    currentPredictionVersionId: context.currentPrediction?.id ?? null,
    homeTeamNameEn: context.homeTeam.name,
    awayTeamNameEn: context.awayTeam.name,
    homeTeamDisplayNameEs: context.homeTeamDisplayNameEs,
    awayTeamDisplayNameEs: context.awayTeamDisplayNameEs,
    modelVersionId: context.activeModelVersion?.id ?? null,
  });

  const { data: decision, error } = await context.supabase
    .from("prediction_review_decisions")
    .insert({
      review_case_id: reviewCase.id,
      selected_snapshot_id: args.selectedSnapshotId ?? null,
      published_prediction_version_id: args.publishedPredictionVersionId ?? null,
      decision: args.decision,
      reason: args.reason,
      evidence_used_json: [],
      contradictions_json: [],
      warnings_json: [],
      human_approval_required: true,
      created_by: user.id,
    })
    .select("*")
    .maybeSingle();

  if (error || !decision) {
    redirectWithStatus({ externalId: args.externalId, action: "error", message: "decision_insert_failed" });
  }

  await context.supabase.from("prediction_review_cases").update({
    latest_decision_id: decision.id,
    status:
      args.decision === "KEEP_CURRENT"
        ? "kept_current"
        : args.decision === "PUBLISH_REFRESHED"
          ? "published_refreshed"
          : "held",
  }).eq("id", reviewCase.id);

  revalidatePath(PREDICTION_REFRESH_REVIEW_PATH);
  return { context, reviewCase, decision };
}

export async function keepCurrentPredictionRefreshAction(formData: FormData) {
  const input = baseSchema.extend({ reason: z.string().trim().min(1) }).safeParse({
    matchId: formData.get("matchId"),
    externalId: formData.get("externalId"),
    reason: formData.get("reason"),
  });
  if (!input.success) {
    redirectWithStatus({ action: "invalid" });
  }

  await saveDecision({
    matchId: input.data.matchId,
    externalId: input.data.externalId,
    decision: "KEEP_CURRENT",
    reason: input.data.reason,
  });
  redirectWithStatus({ externalId: input.data.externalId, action: "kept_current" });
}

export async function holdPredictionRefreshAction(formData: FormData) {
  const input = baseSchema.extend({ reason: z.string().trim().min(1) }).safeParse({
    matchId: formData.get("matchId"),
    externalId: formData.get("externalId"),
    reason: formData.get("reason"),
  });
  if (!input.success) {
    redirectWithStatus({ action: "invalid" });
  }

  await saveDecision({
    matchId: input.data.matchId,
    externalId: input.data.externalId,
    decision: "HOLD",
    reason: input.data.reason,
  });
  redirectWithStatus({ externalId: input.data.externalId, action: "held" });
}

export async function previewReviewedXgAction(formData: FormData) {
  const input = reviewedXgSchema.safeParse({
    matchId: formData.get("matchId"),
    externalId: formData.get("externalId"),
    homeXg: formData.get("homeXg"),
    awayXg: formData.get("awayXg"),
  });
  if (!input.success) {
    redirectWithStatus({ action: "invalid" });
  }

  const { user } = await requireAdmin(PREDICTION_REFRESH_REVIEW_PATH);
  const context = await loadMatchContext(input.data.matchId, input.data.externalId);
  const reviewCase = await getOrCreateReviewCase({
    matchId: context.match.id,
    externalId: input.data.externalId,
    currentPredictionVersionId: context.currentPrediction?.id ?? null,
    homeTeamNameEn: context.homeTeam.name,
    awayTeamNameEn: context.awayTeam.name,
    homeTeamDisplayNameEs: context.homeTeamDisplayNameEs,
    awayTeamDisplayNameEs: context.awayTeamDisplayNameEs,
    modelVersionId: context.activeModelVersion?.id ?? null,
  });

  const { data: latestShadowSnapshot } = reviewCase.latest_shadow_snapshot_id
    ? await context.supabase
        .from("prediction_review_snapshots")
        .select("*")
        .eq("id", reviewCase.latest_shadow_snapshot_id)
        .maybeSingle()
    : { data: null };

  const reviewedXgBaseline =
    latestShadowSnapshot
      ? buildPredictionReviewBundleFromSnapshot({
          snapshot: latestShadowSnapshot,
          provenanceLabel: "Shadow refresh prediction",
          modelVersionLabel: context.activeModelVersion?.version ?? null,
        })
      : context.currentPredictionBundle;

  if (!reviewedXgBaseline) {
    redirectWithStatus({ externalId: input.data.externalId, action: "blocked", message: "no_review_baseline" });
  }

  const validation = validateReviewedXgBounds({
    homeXg: input.data.homeXg,
    awayXg: input.data.awayXg,
    baseline: reviewedXgBaseline,
  });
  if (!validation.valid) {
    redirectWithStatus({ externalId: input.data.externalId, action: "reviewed_xg_invalid", message: validation.violations.join(" | ") });
  }

  const reviewedBundle = buildReviewedXgPredictionBundle({
    input: buildRealFixturePredictionInput({
      id: context.match.id,
      externalId: context.match.external_id,
      slug: context.match.slug,
      competitionId: context.match.competition_id,
      kickoffAt: context.match.kickoff_at,
      stage: null,
      status: context.match.status,
      accessScope: context.match.access_scope,
      intakeSource: context.match.intake_source,
      sourceNote: null,
      competitionName: "World Cup",
      homeTeamId: context.homeTeam.id,
      homeTeamName: context.homeTeam.name,
      awayTeamId: context.awayTeam.id,
      awayTeamName: context.awayTeam.name,
      activeModelVersionId: context.activeModelVersion?.id ?? null,
      activeModelVersion: context.activeModelVersion?.version ?? null,
      activeModelSavedPredictionId: null,
      hasSavedPredictionForActiveModel: false,
      latestPublicPredictionId: null,
      latestPublicPredictionCreatedAt: null,
      latestPublicPredictionMarketCount: 0,
      hasLatestPublicModelDetail: false,
      result: null,
      savedPrediction: null,
      savedEvaluation: null,
    }),
    homeXg: input.data.homeXg,
    awayXg: input.data.awayXg,
    provenanceLabel: "Reviewed xG preview",
  });

  const { data: snapshot, error: snapshotError } = await context.supabase
    .from("prediction_review_snapshots")
    .insert(
      buildPredictionReviewSnapshotInsert({
        reviewCaseId: reviewCase.id,
        snapshotKind: "reviewed_xg_preview",
        sourcePredictionVersionId: context.currentPrediction?.id ?? null,
        sourceSnapshotId: SIGNAL_SOURCE_SNAPSHOT_ID,
        modelVersionId: context.activeModelVersion?.id ?? null,
        bundle: reviewedBundle,
        createdBy: user.id,
      }),
    )
    .select("*")
    .maybeSingle();

  if (snapshotError || !snapshot) {
    redirectWithStatus({ externalId: input.data.externalId, action: "error", message: "reviewed_xg_snapshot_failed" });
  }

  await context.supabase.from("prediction_review_cases").update({
    latest_reviewed_xg_snapshot_id: snapshot.id,
  }).eq("id", reviewCase.id);

  revalidatePath(PREDICTION_REFRESH_REVIEW_PATH);
  redirectWithStatus({ externalId: input.data.externalId, action: "reviewed_xg_preview_saved" });
}

export async function publishRefreshedPredictionReviewAction(formData: FormData) {
  const input = baseSchema.extend({ reason: z.string().trim().min(1) }).safeParse({
    matchId: formData.get("matchId"),
    externalId: formData.get("externalId"),
    reason: formData.get("reason"),
  });
  if (!input.success) {
    redirectWithStatus({ action: "invalid" });
  }

  const { user } = await requireAdmin(PREDICTION_REFRESH_REVIEW_PATH);
  const context = await loadMatchContext(input.data.matchId, input.data.externalId);
  if (context.match.access_scope !== "admin_only") {
    redirectWithStatus({ externalId: input.data.externalId, action: "blocked", message: "publish_requires_admin_only_fixture" });
  }
  if (!context.activeModelVersion) {
    redirectWithStatus({ externalId: input.data.externalId, action: "blocked", message: "no_active_model" });
  }

  const { data: reviewCase } = await context.supabase
    .from("prediction_review_cases")
    .select("*")
    .eq("match_id", context.match.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reviewCase?.latest_shadow_snapshot_id) {
    redirectWithStatus({ externalId: input.data.externalId, action: "blocked", message: "no_shadow_snapshot" });
  }

  const { data: existingPublishedDecision } = await context.supabase
    .from("prediction_review_decisions")
    .select("id, published_prediction_version_id")
    .eq("review_case_id", reviewCase.id)
    .eq("decision", "PUBLISH_REFRESHED")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPublishedDecision?.published_prediction_version_id) {
    redirectWithStatus({ externalId: input.data.externalId, action: "already_published" });
  }

  const { data: shadowSnapshot } = await context.supabase
    .from("prediction_review_snapshots")
    .select("*")
    .eq("id", reviewCase.latest_shadow_snapshot_id)
    .maybeSingle();

  if (!shadowSnapshot) {
    redirectWithStatus({ externalId: input.data.externalId, action: "blocked", message: "shadow_snapshot_missing" });
  }

  const bundle = buildPredictionReviewBundleFromSnapshot({
    snapshot: shadowSnapshot,
    provenanceLabel: "Shadow refresh prediction",
    modelVersionLabel: context.activeModelVersion.version,
  });

  const { data: insertedPrediction, error: insertedPredictionError } = await context.supabase
    .from("prediction_versions")
    .insert(
      buildPublicPredictionVersionInsertFromReviewBundle({
        matchId: context.match.id,
        modelVersionId: context.activeModelVersion.id,
        bundle,
      }),
    )
    .select("id")
    .maybeSingle();

  if (insertedPredictionError || !insertedPrediction) {
    redirectWithStatus({ externalId: input.data.externalId, action: "error", message: "public_prediction_insert_failed" });
  }

  await context.supabase.from("prediction_markets").insert(
    buildPredictionMarketsFromReviewBundle({
      predictionVersionId: insertedPrediction.id,
      bundle,
    }),
  );

  if (context.match.access_scope === "admin_only") {
    await context.supabase.rpc("publish_real_fixture_match_access_scope", {
      target_match_id: context.match.id,
      target_match_slug: context.match.slug,
    });
  }

  const { decision } = await saveDecision({
    matchId: input.data.matchId,
    externalId: input.data.externalId,
    decision: "PUBLISH_REFRESHED",
    reason: input.data.reason,
    selectedSnapshotId: shadowSnapshot.id,
    publishedPredictionVersionId: insertedPrediction.id,
  });

  await context.supabase.from("prediction_review_snapshots").insert(
    buildPredictionReviewSnapshotInsert({
      reviewCaseId: reviewCase.id,
      snapshotKind: "published_output",
      sourcePredictionVersionId: insertedPrediction.id,
      sourceSnapshotId: SIGNAL_SOURCE_SNAPSHOT_ID,
      modelVersionId: context.activeModelVersion.id,
      bundle,
      createdBy: user.id,
    }),
  );

  await context.supabase.from("prediction_review_cases").update({
    latest_decision_id: decision.id,
    status: "published_refreshed",
  }).eq("id", reviewCase.id);

  revalidatePath(PREDICTION_REFRESH_REVIEW_PATH);
  redirectWithStatus({ externalId: input.data.externalId, action: "published_refreshed" });
}
