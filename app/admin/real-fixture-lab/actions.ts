"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
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

type SaveStatus = "saved" | "invalid" | "not_found" | "duplicate" | "no_model" | "error";

function redirectWithSaveStatus(status: SaveStatus, externalId: string): never {
  redirect(`/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&save=${status}`);
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
    redirectWithSaveStatus("error", externalId);
  }

  revalidatePath("/admin/real-fixture-lab");
  redirectWithSaveStatus("saved", externalId);
}
