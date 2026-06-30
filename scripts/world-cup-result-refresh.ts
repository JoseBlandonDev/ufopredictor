import { loadEnvConfig } from "@next/env";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchApiFootballFixtureById } from "@/lib/football-api/api-football-client";
import { createSupabaseScriptAdminClient } from "@/lib/supabase/script-admin";
import {
  applyWorldCupResultRefreshPlan,
  buildWorldCupResultRefreshAllowlistManifest,
  buildWorldCupResultRefreshSelection,
  planWorldCupResultRefresh,
  resolveWorldCupResultRefreshApplySelection,
  summarizeWorldCupResultRefreshReport,
  type WorldCupResultRefreshAllowlistManifest,
  type WorldCupResultRefreshDatabaseSnapshot,
  type WorldCupResultRefreshSelectionInput,
  WORLD_CUP_RESULT_REFRESH_COMPETITION_SLUG,
  WORLD_CUP_RESULT_REFRESH_PREDICTION_TYPE,
  WORLD_CUP_RESULT_REFRESH_RUN_SCOPE,
} from "@/lib/world-cup-2026/result-refresh";

type Args = {
  apply: boolean;
  artifactName: string | null;
  manifestOut: string | null;
  allowMatchIds: string[];
  allowExternalIds: string[];
  allowApiFootballFixtureIds: number[];
  allowlistManifestPath: string | null;
  from: string | null;
  to: string | null;
  matchday: number | null;
};

function getArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function parseCsv(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function parseNumberCsv(value: string | null) {
  return parseCsv(value)
    .map((part) => Number(part))
    .filter((part) => Number.isInteger(part) && part > 0);
}

function parseArgs(): Args {
  const matchdayRaw = getArg("--matchday");
  const matchday = matchdayRaw ? Number(matchdayRaw) : null;
  if (matchday !== null && ![1, 2, 3].includes(matchday)) {
    throw new Error("--matchday must be 1, 2, or 3.");
  }

  return {
    apply: process.argv.includes("--apply"),
    artifactName: getArg("--artifact-name"),
    manifestOut: getArg("--manifest-out"),
    allowMatchIds: parseCsv(getArg("--allow-match-ids")),
    allowExternalIds: parseCsv(getArg("--allow-external-ids")),
    allowApiFootballFixtureIds: parseNumberCsv(getArg("--allow-api-football-fixture-ids")),
    allowlistManifestPath: getArg("--allowlist-manifest"),
    from: getArg("--from"),
    to: getArg("--to"),
    matchday,
  };
}

async function readAllowlistManifest(
  manifestPath: string | null,
): Promise<WorldCupResultRefreshAllowlistManifest | null> {
  if (!manifestPath) {
    return null;
  }

  const raw = await readFile(manifestPath, "utf8");
  return JSON.parse(raw) as WorldCupResultRefreshAllowlistManifest;
}

async function writeJsonFile(targetPath: string, value: unknown) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function buildArtifactPath(args: Args) {
  const artifactName =
    args.artifactName ?? `world-cup-result-refresh-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  return path.join(process.cwd(), "artifacts", artifactName);
}

function buildSelectionInput(args: Args): WorldCupResultRefreshSelectionInput {
  return {
    from: args.from ?? undefined,
    to: args.to ?? undefined,
    matchday: args.matchday ?? undefined,
    matchIds: args.allowMatchIds,
    externalIds: args.allowExternalIds,
    apiFootballFixtureIds: args.allowApiFootballFixtureIds,
  };
}

function mergeSelectionInputWithManifest(
  input: WorldCupResultRefreshSelectionInput,
  manifest: WorldCupResultRefreshAllowlistManifest | null,
): WorldCupResultRefreshSelectionInput {
  if (!manifest) {
    return input;
  }

  return {
    ...input,
    matchIds: [...new Set([...(input.matchIds ?? []), ...manifest.allowlist.matchIds])],
    externalIds: [...new Set([...(input.externalIds ?? []), ...manifest.allowlist.externalIds])],
    apiFootballFixtureIds: [
      ...new Set([...(input.apiFootballFixtureIds ?? []), ...manifest.allowlist.apiFootballFixtureIds]),
    ],
  };
}

async function loadDatabaseSnapshot(): Promise<WorldCupResultRefreshDatabaseSnapshot> {
  const supabase = createSupabaseScriptAdminClient();

  const { data: competitionData, error: competitionError } = await supabase
    .from("competitions")
    .select("id, slug, name, usage_scope")
    .eq("slug", WORLD_CUP_RESULT_REFRESH_COMPETITION_SLUG);

  if (competitionError) {
    throw new Error(`Failed to read competitions: ${competitionError.message}`);
  }

  const competitions = (competitionData ?? []) as WorldCupResultRefreshDatabaseSnapshot["competitions"];
  const competitionIds = competitions.map((competition) => competition.id);

  const { data: seasonData, error: seasonError } = await supabase
    .from("seasons")
    .select("id, competition_id, year")
    .in("competition_id", competitionIds.length > 0 ? competitionIds : ["00000000-0000-0000-0000-000000000000"]);

  if (seasonError) {
    throw new Error(`Failed to read seasons: ${seasonError.message}`);
  }

  const { data: teamData, error: teamError } = await supabase.from("teams").select("id, name");
  if (teamError) {
    throw new Error(`Failed to read teams: ${teamError.message}`);
  }

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("id, external_id, slug, competition_id, season_id, home_team_id, away_team_id, kickoff_at, stage, status, access_scope, intake_source, source_note")
    .in("competition_id", competitionIds.length > 0 ? competitionIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("intake_source", "api_football")
    .order("kickoff_at", { ascending: true });

  if (matchError) {
    throw new Error(`Failed to read matches: ${matchError.message}`);
  }

  const matches = (matchData ?? []) as WorldCupResultRefreshDatabaseSnapshot["matches"];
  const matchIds = matches.map((match) => match.id);

  const [
    { data: resultData, error: resultError },
    { data: predictionVersionData, error: predictionVersionError },
  ] = await Promise.all([
    supabase
      .from("match_results")
      .select("id, match_id, home_goals, away_goals, decision_method, regulation_home_goals, regulation_away_goals, after_extra_time_home_goals, after_extra_time_away_goals, penalty_home_goals, penalty_away_goals, advancing_team_id, verification_status, intake_source, source_note, reviewed_at, reviewed_by, recorded_at")
      .in("match_id", matchIds.length > 0 ? matchIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("prediction_versions")
      .select("id, match_id, run_scope, prediction_type, created_at, home_win_prob, draw_prob, away_win_prob, most_likely_score, top_scores_json")
      .in("match_id", matchIds.length > 0 ? matchIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("run_scope", WORLD_CUP_RESULT_REFRESH_RUN_SCOPE)
      .eq("prediction_type", WORLD_CUP_RESULT_REFRESH_PREDICTION_TYPE)
      .order("created_at", { ascending: false }),
  ]);

  if (resultError) {
    throw new Error(`Failed to read match_results: ${resultError.message}`);
  }

  if (predictionVersionError) {
    throw new Error(`Failed to read prediction_versions: ${predictionVersionError.message}`);
  }

  const predictionVersions =
    (predictionVersionData ?? []) as WorldCupResultRefreshDatabaseSnapshot["predictionVersions"];
  const predictionVersionIds = predictionVersions.map((prediction) => prediction.id);

  const [
    { data: predictionMarketData, error: predictionMarketError },
    { data: predictionResultData, error: predictionResultError },
  ] = await Promise.all([
    supabase
      .from("prediction_markets")
      .select("prediction_version_id, market, selection, probability")
      .in(
        "prediction_version_id",
        predictionVersionIds.length > 0 ? predictionVersionIds : ["00000000-0000-0000-0000-000000000000"],
      )
      .in("market", ["btts", "over_2_5"]),
    supabase
      .from("prediction_results")
      .select("id, prediction_version_id, actual_home_goals, actual_away_goals, winner_correct, btts_correct, over_2_5_correct, exact_score_correct, goal_error, error_summary, validated_at")
      .in(
        "prediction_version_id",
        predictionVersionIds.length > 0 ? predictionVersionIds : ["00000000-0000-0000-0000-000000000000"],
      ),
  ]);

  if (predictionMarketError) {
    throw new Error(`Failed to read prediction_markets: ${predictionMarketError.message}`);
  }

  if (predictionResultError) {
    throw new Error(`Failed to read prediction_results: ${predictionResultError.message}`);
  }

  return {
    competitions,
    seasons: (seasonData ?? []) as WorldCupResultRefreshDatabaseSnapshot["seasons"],
    teams: (teamData ?? []) as WorldCupResultRefreshDatabaseSnapshot["teams"],
    matches,
    matchResults: (resultData ?? []) as WorldCupResultRefreshDatabaseSnapshot["matchResults"],
    predictionVersions,
    predictionMarkets:
      (predictionMarketData ?? []) as WorldCupResultRefreshDatabaseSnapshot["predictionMarkets"],
    predictionResults:
      (predictionResultData ?? []) as WorldCupResultRefreshDatabaseSnapshot["predictionResults"],
  };
}

async function fetchProviderFixtures(selection: ReturnType<typeof buildWorldCupResultRefreshSelection>) {
  const fixtureIds = selection.matches
    .flatMap((match) => {
      const parsed = /^api-football:fixture:(\d+)$/.exec(match.external_id ?? "");
      return parsed ? [Number(parsed[1])] : [];
    })
    .filter((fixtureId, index, collection) => collection.indexOf(fixtureId) === index);

  const providerFixtures = await Promise.all(fixtureIds.map((fixtureId) => fetchApiFootballFixtureById(fixtureId)));
  return providerFixtures.filter((fixture): fixture is NonNullable<typeof fixture> => fixture !== null);
}

async function run() {
  loadEnvConfig(process.cwd());
  const args = parseArgs();
  const generatedAt = new Date().toISOString();
  const allowlistManifest = await readAllowlistManifest(args.allowlistManifestPath);
  const artifactPath = buildArtifactPath(args);
  const snapshot = await loadDatabaseSnapshot();
  const selectionInput = mergeSelectionInputWithManifest(buildSelectionInput(args), allowlistManifest);
  const selection = buildWorldCupResultRefreshSelection(snapshot, selectionInput);
  const providerFixtures = await fetchProviderFixtures(selection);
  const report = planWorldCupResultRefresh({
    generatedAt,
    selection,
    snapshot,
    providerFixtures,
  });

  const artifactPayload: Record<string, unknown> = { ...report };

  if (args.manifestOut) {
    const manifest = buildWorldCupResultRefreshAllowlistManifest(selection.matches, selectionInput, generatedAt);
    await writeJsonFile(args.manifestOut, manifest);
    artifactPayload["allowlistManifestPath"] = args.manifestOut;
  }

  let applyCounts = null;
  if (args.apply) {
    const applySelection = resolveWorldCupResultRefreshApplySelection({
      selectedMatches: selection.matches,
      allowMatchIds: args.allowMatchIds,
      allowExternalIds: args.allowExternalIds,
      allowApiFootballFixtureIds: args.allowApiFootballFixtureIds,
      allowlistManifest,
    });
    const supabase = createSupabaseScriptAdminClient();
    const now = new Date().toISOString();
    applyCounts = await applyWorldCupResultRefreshPlan({
      report,
      snapshot,
      providerFixtures,
      applySelection,
      providerResponseAt: now,
      verifiedAt: now,
      writeAdapter: {
        async updateMatch(matchId, payload) {
          const { error } = await supabase.from("matches").update(payload).eq("id", matchId);
          if (error) {
            throw new Error(`Failed to update match ${matchId}: ${error.message}`);
          }
        },
        async insertMatchResult(payload) {
          const { data, error } = await supabase.from("match_results").insert(payload).select("id").single();
          if (error || !data?.id) {
            throw new Error(`Failed to insert match_result for ${payload.match_id}: ${error?.message ?? "missing row id"}`);
          }
          return { id: data.id as string };
        },
        async updateMatchResult(resultId, payload) {
          const { error } = await supabase.from("match_results").update(payload).eq("id", resultId);
          if (error) {
            throw new Error(`Failed to update match_result ${resultId}: ${error.message}`);
          }
        },
        async insertPredictionResult(payload) {
          const { data, error } = await supabase
            .from("prediction_results")
            .insert(payload)
            .select("id")
            .single();
          if (error || !data?.id) {
            throw new Error(
              `Failed to insert prediction_result for ${payload.prediction_version_id}: ${error?.message ?? "missing row id"}`,
            );
          }
          return { id: data.id as string };
        },
        async updatePredictionResult(predictionResultId, payload) {
          const { error } = await supabase
            .from("prediction_results")
            .update(payload)
            .eq("id", predictionResultId);
          if (error) {
            throw new Error(`Failed to update prediction_result ${predictionResultId}: ${error.message}`);
          }
        },
      },
    });
    artifactPayload["applyCounts"] = applyCounts;
  }

  await writeJsonFile(artifactPath, artifactPayload);

  for (const line of summarizeWorldCupResultRefreshReport(report, artifactPath)) {
    console.log(line);
  }

  if (args.manifestOut) {
    console.log(`manifest_path=${args.manifestOut}`);
  }

  if (applyCounts) {
    console.log(
      `apply_counts selected=${applyCounts.selected} statuses_updated=${applyCounts.statusesUpdated} results_created=${applyCounts.resultsCreated} results_updated=${applyCounts.resultsUpdated} results_verified=${applyCounts.resultsVerified} evaluations_created=${applyCounts.evaluationsCreated} evaluations_updated=${applyCounts.evaluationsUpdated} evaluations_already_stored=${applyCounts.evaluationsAlreadyStored} evaluations_ineligible=${applyCounts.evaluationsIneligible} exceptions_or_conflicts=${applyCounts.exceptionsOrConflicts} skipped=${applyCounts.skipped} evaluation_failures=${applyCounts.evaluationFailures}`,
    );
  } else {
    console.log("zero_write_confirmation=true");
  }
}

void run().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`WORLD_CUP_RESULT_REFRESH_FAILED message=${message}`);
  process.exitCode = 1;
});
