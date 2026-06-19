import { loadEnvConfig } from "@next/env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchApiFootballFixtureById, fetchApiFootballFixturesByLeague } from "@/lib/football-api/api-football-client";
import { executeControlledFixtureWrite } from "@/lib/football-api/ingest/writer";
import { getTargetCompetitionByKey } from "@/lib/football-api/target-competitions";
import { buildRealFixturePredictionInput } from "@/lib/prediction-engine/real-fixture-adapter";
import { generatePrediction } from "@/lib/prediction-engine/generate-prediction";
import {
  REAL_FIXTURE_LAB_PREDICTION_TYPE,
  buildRealFixturePredictionMarketInserts,
  buildRealFixturePredictionVersionInsert,
} from "@/lib/prediction-engine/real-fixture-persistence";
import { buildPredictionReviewBundleFromOutput, buildPredictionReviewBundleFromVersion } from "@/lib/prediction-review/bundle";
import { SIGNAL_SOURCE_SNAPSHOT_ID } from "@/lib/prediction-review/constants";
import {
  buildPredictionMarketsFromReviewBundle,
  buildPublicPredictionVersionInsertFromReviewBundle,
} from "@/lib/prediction-review/persistence";
import { createSupabaseScriptAdminClient } from "@/lib/supabase/script-admin";
import {
  getDefaultTorneoExportRange,
  getTorneoUfoExportWithClient,
  parseTorneoExportRange,
} from "@/lib/supabase/torneo-export-core";
import type { MatchRow as DatabaseMatchRow, PredictionMarketRow, PredictionVersionRow } from "@/types/database";
import type { ProviderFixture } from "@/lib/football-api/api-football-types";
import {
  WORLD_CUP_GROUP_STAGE_2_ROUND,
  assertUniqueFixtureIds,
  decideMatchday2FixtureAction,
  filterProviderFixturesToSecondMatchday,
  getWorldCup2026SecondMatchdayWindow,
  validateFinalMatchday2Export,
} from "@/lib/world-cup-2026/matchday2-ops";

type MatchRow = {
  id: string;
  external_id: string;
  slug: string;
  kickoff_at: string;
  stage: string | null;
  status: DatabaseMatchRow["status"];
  access_scope: "public" | "premium" | "admin_only" | "lab_only";
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  intake_source: "mock" | "manual" | "csv_import" | "api_football";
};

type TeamRow = {
  id: string;
  name: string;
};

type PredictionRow = Pick<
  PredictionVersionRow,
  | "id"
  | "match_id"
  | "model_version_id"
  | "prediction_type"
  | "home_win_prob"
  | "draw_prob"
  | "away_win_prob"
  | "expected_home_goals"
  | "expected_away_goals"
  | "most_likely_score"
  | "top_scores_json"
  | "confidence_score"
  | "risk_level"
  | "run_scope"
  | "created_at"
>;

type MarketRow = Pick<PredictionMarketRow, "prediction_version_id" | "market" | "selection" | "probability">;

type InventoryRow = {
  fixtureId: number;
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  providerStatus: ProviderFixture["status"];
  providerStatusShort: string;
  providerRound: string | null;
  dbMatchId: string | null;
  accessScope: MatchRow["access_scope"] | null;
  latestInternalPredictionId: string | null;
  latestInternalPredictionCreatedAt: string | null;
  latestPublicPredictionId: string | null;
  latestPublicPredictionCreatedAt: string | null;
  presentInCurrentTorneoExport: boolean;
};

type LiveState = {
  competitionId: string;
  activeModelVersionId: string;
  activeModelVersionLabel: string;
  matchesByExternalId: Map<string, MatchRow>;
  teamsById: Map<string, TeamRow>;
  latestInternalPredictionByMatchId: Map<string, PredictionRow>;
  latestPublicPredictionByMatchId: Map<string, PredictionRow>;
  marketsByPredictionId: Map<string, MarketRow[]>;
};

const WRITE_MODE = process.argv.includes("--write");
const MODE_LABEL = WRITE_MODE ? "write" : "dry-run";

function toExternalId(fixtureId: number) {
  return `api-football:fixture:${fixtureId}`;
}

function getLatestByMatchId(rows: PredictionRow[]) {
  const latest = new Map<string, PredictionRow>();
  for (const row of rows) {
    if (!latest.has(row.match_id)) {
      latest.set(row.match_id, row);
    }
  }
  return latest;
}

function getMarketsByPredictionId(rows: MarketRow[]) {
  const map = new Map<string, MarketRow[]>();
  for (const row of rows) {
    const collection = map.get(row.prediction_version_id) ?? [];
    collection.push(row);
    map.set(row.prediction_version_id, collection);
  }
  return map;
}

async function loadLiveState(externalIds: string[]): Promise<LiveState> {
  const supabase = createSupabaseScriptAdminClient();

  const { data: competitionData, error: competitionError } = await supabase
    .from("competitions")
    .select("id, slug, usage_scope")
    .eq("slug", "world-cup-2026")
    .eq("usage_scope", "public_product")
    .maybeSingle();

  if (competitionError || !competitionData) {
    throw new Error("World Cup 2026 public competition is unavailable in the database.");
  }

  const { data: activeModelVersionData, error: activeModelVersionError } = await supabase
    .from("model_versions")
    .select("id, version, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeModelVersionError || !activeModelVersionData) {
    throw new Error("No active model version is available for matchday-2 publication.");
  }

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("id, external_id, slug, kickoff_at, stage, status, access_scope, competition_id, home_team_id, away_team_id, intake_source")
    .eq("competition_id", competitionData.id)
    .in("external_id", externalIds);

  if (matchError) {
    throw new Error(`Failed to load World Cup match inventory: ${matchError.message}`);
  }

  const matches = (matchData ?? []) as MatchRow[];
  const matchIds = matches.map((match) => match.id);
  const teamIds = [...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))];

  const [{ data: teamData, error: teamError }, { data: predictionData, error: predictionError }] =
    await Promise.all([
      teamIds.length > 0 ? supabase.from("teams").select("id, name").in("id", teamIds) : Promise.resolve({ data: [], error: null }),
      matchIds.length > 0
        ? supabase
            .from("prediction_versions")
            .select(
              "id, match_id, model_version_id, prediction_type, home_win_prob, draw_prob, away_win_prob, expected_home_goals, expected_away_goals, most_likely_score, top_scores_json, confidence_score, risk_level, run_scope, created_at",
            )
            .in("match_id", matchIds)
            .eq("prediction_type", REAL_FIXTURE_LAB_PREDICTION_TYPE)
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (teamError) {
    throw new Error(`Failed to load team inventory: ${teamError.message}`);
  }

  if (predictionError) {
    throw new Error(`Failed to load prediction inventory: ${predictionError.message}`);
  }

  const predictions = (predictionData ?? []) as PredictionRow[];
  const predictionIds = predictions.map((prediction) => prediction.id);
  const { data: marketData, error: marketError } =
    predictionIds.length > 0
      ? await supabase
          .from("prediction_markets")
          .select("prediction_version_id, market, selection, probability")
          .in("prediction_version_id", predictionIds)
      : { data: [], error: null };

  if (marketError) {
    throw new Error(`Failed to load prediction market inventory: ${marketError.message}`);
  }

  return {
    competitionId: competitionData.id,
    activeModelVersionId: activeModelVersionData.id,
    activeModelVersionLabel: activeModelVersionData.version,
    matchesByExternalId: new Map(matches.map((match) => [match.external_id, match])),
    teamsById: new Map(((teamData ?? []) as TeamRow[]).map((team) => [team.id, team])),
    latestInternalPredictionByMatchId: getLatestByMatchId(
      predictions.filter((prediction) => prediction.run_scope === "internal_lab"),
    ),
    latestPublicPredictionByMatchId: getLatestByMatchId(
      predictions.filter((prediction) => prediction.run_scope === "public_product"),
    ),
    marketsByPredictionId: getMarketsByPredictionId((marketData ?? []) as MarketRow[]),
  };
}

async function getCurrentPreviewExportFixtureIds() {
  const supabase = createSupabaseScriptAdminClient();
  const range = getDefaultTorneoExportRange(new Date());
  const parsedRange = parseTorneoExportRange(range, new Date());
  if (parsedRange.status === "invalid") {
    throw new Error(parsedRange.message);
  }

  const payload = await getTorneoUfoExportWithClient(supabase as never, {
    range: parsedRange.range,
    fromStartIso: parsedRange.fromStartIso,
    toEndIso: parsedRange.toEndIso,
    fallbackOrigin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    excludeFinished: true,
  });

  return new Set(payload.fixtures.map((fixture) => fixture.externalId));
}

function buildInventoryRow(args: {
  fixture: ProviderFixture;
  liveState: LiveState;
  currentPreviewExportIds: Set<string>;
}): InventoryRow {
  const externalId = toExternalId(args.fixture.providerFixtureId);
  const match = args.liveState.matchesByExternalId.get(externalId) ?? null;
  const latestInternalPrediction = match
    ? args.liveState.latestInternalPredictionByMatchId.get(match.id) ?? null
    : null;
  const latestPublicPrediction = match
    ? args.liveState.latestPublicPredictionByMatchId.get(match.id) ?? null
    : null;

  return {
    fixtureId: args.fixture.providerFixtureId,
    externalId,
    homeTeam: args.fixture.homeTeam.name,
    awayTeam: args.fixture.awayTeam.name,
    kickoffAt: args.fixture.kickoffAt,
    providerStatus: args.fixture.status,
    providerStatusShort: args.fixture.statusShort,
    providerRound: args.fixture.competition.round,
    dbMatchId: match?.id ?? null,
    accessScope: match?.access_scope ?? null,
    latestInternalPredictionId: latestInternalPrediction?.id ?? null,
    latestInternalPredictionCreatedAt: latestInternalPrediction?.created_at ?? null,
    latestPublicPredictionId: latestPublicPrediction?.id ?? null,
    latestPublicPredictionCreatedAt: latestPublicPrediction?.created_at ?? null,
    presentInCurrentTorneoExport: args.currentPreviewExportIds.has(externalId),
  };
}

function logInventory(rows: InventoryRow[]) {
  console.log(`INVENTORY mode=${MODE_LABEL} fixtures=${rows.length}`);
  for (const row of rows) {
    console.log(
      [
        `fixtureId=${row.fixtureId}`,
        `teams=${row.homeTeam} vs ${row.awayTeam}`,
        `kickoff=${row.kickoffAt}`,
        `provider_status=${row.providerStatus}(${row.providerStatusShort})`,
        `db_match_id=${row.dbMatchId ?? "-"}`,
        `access_scope=${row.accessScope ?? "-"}`,
        `internal=${row.latestInternalPredictionId ?? "-"}@${row.latestInternalPredictionCreatedAt ?? "-"}`,
        `public=${row.latestPublicPredictionId ?? "-"}@${row.latestPublicPredictionCreatedAt ?? "-"}`,
        `in_preview_export=${row.presentInCurrentTorneoExport}`,
      ].join(" | "),
    );
  }
}

async function ingestMissingFixtures(fixtures: ProviderFixture[]) {
  if (fixtures.length === 0) {
    return;
  }

  const target = getTargetCompetitionByKey("world-cup");
  if (!target) {
    throw new Error("World Cup target competition configuration is unavailable.");
  }

  for (const fixture of fixtures) {
    console.log(`INGEST fixtureId=${fixture.providerFixtureId} mode=${MODE_LABEL}`);
    if (!WRITE_MODE) {
      continue;
    }

    await executeControlledFixtureWrite({
      target,
      fixtures: [fixture],
      apply: true,
      from: fixture.kickoffAt.slice(0, 10),
      to: fixture.kickoffAt.slice(0, 10),
      limit: 1,
      fixtureId: fixture.providerFixtureId,
    });
  }
}

function buildPredictionSummary(prediction: PredictionRow | null, marketsByPredictionId: Map<string, MarketRow[]>) {
  if (!prediction) {
    return null;
  }

  const markets = marketsByPredictionId.get(prediction.id) ?? [];
  const topScorelineCount = Array.isArray(prediction.top_scores_json) ? prediction.top_scores_json.length : 0;

  return {
    id: prediction.id,
    createdAt: prediction.created_at,
    marketSelections: markets.map((market) => ({ market: market.market, selection: market.selection })),
    topScorelineCount,
  };
}

function toPredictionInputAccessScope(accessScope: MatchRow["access_scope"]) {
  if (accessScope === "public" || accessScope === "admin_only") {
    return accessScope;
  }

  throw new Error(`Unsupported match access_scope for pre-match generation: ${accessScope}`);
}

function toPredictionInputIntakeSource(intakeSource: MatchRow["intake_source"]) {
  if (intakeSource === "api_football") {
    return intakeSource;
  }

  throw new Error(`Unsupported match intake_source for pre-match generation: ${intakeSource}`);
}

async function publishFromExistingInternalPrediction(args: {
  fixture: ProviderFixture;
  match: MatchRow;
  liveState: LiveState;
}) {
  const supabase = createSupabaseScriptAdminClient();
  const internalPrediction = args.liveState.latestInternalPredictionByMatchId.get(args.match.id);
  if (!internalPrediction) {
    throw new Error(`Missing internal prediction for ${args.fixture.providerFixtureId}.`);
  }

  const bundle = buildPredictionReviewBundleFromVersion({
    kind: "shadow_refresh",
    predictionVersion: internalPrediction,
    markets: args.liveState.marketsByPredictionId.get(internalPrediction.id) ?? [],
    sourceSnapshotId: SIGNAL_SOURCE_SNAPSHOT_ID,
    provenanceLabel: "Batch-published V2 internal prediction",
    modelVersionLabel: args.liveState.activeModelVersionLabel,
  });

  if (!WRITE_MODE) {
    return null;
  }

  const { data: insertedPrediction, error: insertedPredictionError } = await supabase
    .from("prediction_versions")
    .insert(
      buildPublicPredictionVersionInsertFromReviewBundle({
        matchId: args.match.id,
        modelVersionId: args.liveState.activeModelVersionId,
        bundle,
      }),
    )
    .select("id")
    .maybeSingle();

  if (insertedPredictionError || !insertedPrediction) {
    throw new Error(`Failed to publish internal V2 prediction for ${args.fixture.providerFixtureId}.`);
  }

  await supabase.from("prediction_markets").insert(
    buildPredictionMarketsFromReviewBundle({
      predictionVersionId: insertedPrediction.id,
      bundle,
    }),
  );

  return insertedPrediction.id;
}

async function generateAndPublishV2Prediction(args: {
  fixture: ProviderFixture;
  match: MatchRow;
  liveState: LiveState;
}) {
  const supabase = createSupabaseScriptAdminClient();
  const homeTeam = args.liveState.teamsById.get(args.match.home_team_id);
  const awayTeam = args.liveState.teamsById.get(args.match.away_team_id);
  if (!homeTeam || !awayTeam) {
    throw new Error(`Team lookup failed for fixture ${args.fixture.providerFixtureId}.`);
  }

  const predictionInput = buildRealFixturePredictionInput({
    id: args.match.id,
    externalId: args.match.external_id,
    slug: args.match.slug,
    competitionId: args.match.competition_id,
    kickoffAt: args.match.kickoff_at,
    stage: args.match.stage,
    status: args.match.status,
    accessScope: toPredictionInputAccessScope(args.match.access_scope),
    intakeSource: toPredictionInputIntakeSource(args.match.intake_source),
    sourceNote: null,
    competitionName: "World Cup",
    homeTeamId: homeTeam.id,
    homeTeamName: homeTeam.name,
    awayTeamId: awayTeam.id,
    awayTeamName: awayTeam.name,
    activeModelVersionId: args.liveState.activeModelVersionId,
    activeModelVersion: args.liveState.activeModelVersionLabel,
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
  const bundle = buildPredictionReviewBundleFromOutput({
    output,
    kind: "shadow_refresh",
    sourceSnapshotId: SIGNAL_SOURCE_SNAPSHOT_ID,
    provenanceLabel: "Batch-generated V2 public prediction",
    modelVersionId: args.liveState.activeModelVersionId,
    modelVersionLabel: args.liveState.activeModelVersionLabel,
  });

  if (!WRITE_MODE) {
    return null;
  }

  const { data: internalPrediction, error: internalPredictionError } = await supabase
    .from("prediction_versions")
    .insert(
      buildRealFixturePredictionVersionInsert({
        matchId: args.match.id,
        modelVersionId: args.liveState.activeModelVersionId,
        predictionOutput: output,
      }),
    )
    .select("id")
    .maybeSingle();

  if (internalPredictionError || !internalPrediction) {
    throw new Error(`Failed to insert regenerated internal prediction for ${args.fixture.providerFixtureId}.`);
  }

  await supabase.from("prediction_markets").insert(
    buildRealFixturePredictionMarketInserts({
      predictionVersionId: internalPrediction.id,
      predictionOutput: output,
    }),
  );

  const { data: publicPrediction, error: publicPredictionError } = await supabase
    .from("prediction_versions")
    .insert(
      buildPublicPredictionVersionInsertFromReviewBundle({
        matchId: args.match.id,
        modelVersionId: args.liveState.activeModelVersionId,
        bundle,
      }),
    )
    .select("id")
    .maybeSingle();

  if (publicPredictionError || !publicPrediction) {
    throw new Error(`Failed to insert regenerated public prediction for ${args.fixture.providerFixtureId}.`);
  }

  await supabase.from("prediction_markets").insert(
    buildPredictionMarketsFromReviewBundle({
      predictionVersionId: publicPrediction.id,
      bundle,
    }),
  );

  return publicPrediction.id;
}

async function publishMatchAccessScopeIfNeeded(args: {
  match: MatchRow;
  liveState: LiveState;
}) {
  if (args.match.access_scope !== "admin_only") {
    return false;
  }

  const supabase = createSupabaseScriptAdminClient();
  if (!WRITE_MODE) {
    return true;
  }

  const { data: updatedMatch, error } = await supabase
    .from("matches")
    .update({ access_scope: "public" })
    .eq("id", args.match.id)
    .eq("slug", args.match.slug)
    .eq("access_scope", "admin_only")
    .eq("status", "scheduled")
    .eq("intake_source", "api_football")
    .eq("competition_id", args.liveState.competitionId)
    .select("id")
    .maybeSingle();

  if (error || !updatedMatch) {
    throw new Error(`Failed to transition match ${args.match.external_id} from admin_only to public.`);
  }

  return true;
}

async function writeFinalExport(args: {
  externalIds: string[];
  range: { from: string; to: string };
  requireCompleteCoverage: boolean;
}) {
  const supabase = createSupabaseScriptAdminClient();
  const parsedRange = parseTorneoExportRange(args.range, new Date(`${args.range.from}T00:00:00.000Z`));
  if (parsedRange.status === "invalid") {
    throw new Error(parsedRange.message);
  }

  const payload = await getTorneoUfoExportWithClient(supabase as never, {
    range: parsedRange.range,
    fromStartIso: parsedRange.fromStartIso,
    toEndIso: parsedRange.toEndIso,
    fallbackOrigin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    excludeFinished: false,
    allowedMatchExternalIds: args.externalIds,
  });

  if (args.requireCompleteCoverage) {
    validateFinalMatchday2Export({
      payload,
      expectedExternalIds: args.externalIds,
    });
  } else {
    console.log(`CURRENT_EXACT_PUBLIC_EXPORT_COUNT count=${payload.fixtures.length}`);
  }

  if (!WRITE_MODE) {
    return payload;
  }

  const artifactDirectory = path.join(process.cwd(), "artifacts");
  await mkdir(artifactDirectory, { recursive: true });
  const artifactPath = path.join(
    artifactDirectory,
    "torneo-ufo-export-world-cup-2026-matchday2-final.json",
  );
  await writeFile(artifactPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`FINAL_EXPORT path=${artifactPath} fixtures=${payload.fixtures.length}`);
  return payload;
}

async function run() {
  loadEnvConfig(process.cwd());

  const range = getWorldCup2026SecondMatchdayWindow();
  const providerFixtures = await fetchApiFootballFixturesByLeague({
    leagueId: 1,
    season: 2026,
    from: range.from,
    to: range.to,
  });
  const secondMatchdayFixtures = filterProviderFixturesToSecondMatchday(providerFixtures);
  assertUniqueFixtureIds(secondMatchdayFixtures);

  if (secondMatchdayFixtures.length !== 24) {
    throw new Error(`Expected exactly 24 Group Stage - 2 fixtures from API-Football, received ${secondMatchdayFixtures.length}.`);
  }

  const externalIds = secondMatchdayFixtures.map((fixture) => toExternalId(fixture.providerFixtureId));
  const currentPreviewExportIds = await getCurrentPreviewExportFixtureIds();
  let liveState = await loadLiveState(externalIds);

  const inventoryBefore = secondMatchdayFixtures.map((fixture) =>
    buildInventoryRow({ fixture, liveState, currentPreviewExportIds }),
  );
  logInventory(inventoryBefore);

  const knownAdminOnlyIds = new Set([
    "api-football:fixture:1489393",
    "api-football:fixture:1489392",
    "api-football:fixture:1489395",
    "api-football:fixture:1539017",
    "api-football:fixture:1489404",
    "api-football:fixture:1539008",
  ]);
  const missingThree = inventoryBefore.filter(
    (row) => !row.presentInCurrentTorneoExport && !knownAdminOnlyIds.has(row.externalId),
  );
  console.log(`MISSING_THREE count=${missingThree.length}`);
  missingThree.forEach((row) => console.log(`missing_three fixtureId=${row.fixtureId} teams=${row.homeTeam} vs ${row.awayTeam}`));

  const missingDbFixtures = secondMatchdayFixtures.filter(
    (fixture) => !liveState.matchesByExternalId.has(toExternalId(fixture.providerFixtureId)),
  );
  console.log(`DB_COUNT_BEFORE count=${liveState.matchesByExternalId.size}`);
  console.log(`MISSING_DB_FIXTURES count=${missingDbFixtures.length}`);
  missingDbFixtures.forEach((fixture) => console.log(`missing_db fixtureId=${fixture.providerFixtureId} teams=${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`));

  await ingestMissingFixtures(missingDbFixtures);

  liveState = await loadLiveState(externalIds);
  console.log(`DB_COUNT_AFTER count=${liveState.matchesByExternalId.size}`);

  const publicVersionsCreated: string[] = [];
  const regeneratedFixtureIds: number[] = [];
  const reusedFixtureIds: number[] = [];
  const frozenFixtureIds: number[] = [];

  for (const fixture of secondMatchdayFixtures) {
    const externalId = toExternalId(fixture.providerFixtureId);
    const match = liveState.matchesByExternalId.get(externalId);
    if (!match) {
      throw new Error(`Fixture ${fixture.providerFixtureId} is still missing from the database after ingest.`);
    }

    const latestInternalPrediction = liveState.latestInternalPredictionByMatchId.get(match.id) ?? null;
    const latestPublicPrediction = liveState.latestPublicPredictionByMatchId.get(match.id) ?? null;
    const latestPublicPredictionSummary = buildPredictionSummary(latestPublicPrediction, liveState.marketsByPredictionId);
    const action = decideMatchday2FixtureAction({
      kickoffAt: fixture.kickoffAt,
      providerStatus: fixture.status,
      latestInternalPrediction: buildPredictionSummary(latestInternalPrediction, liveState.marketsByPredictionId),
      latestPublicPrediction: latestPublicPredictionSummary,
      now: new Date(),
    });
    const needsAccessScopePublication =
      match.access_scope === "admin_only" &&
      latestPublicPredictionSummary !== null &&
      fixture.status === "scheduled";

    console.log(
      `ACTION fixtureId=${fixture.providerFixtureId} action=${
        needsAccessScopePublication && action === "reuse_current_public_v2"
          ? "publish_match_scope_only"
          : action
      }`,
    );

    if (action === "freeze_keep_public") {
      frozenFixtureIds.push(fixture.providerFixtureId);
      continue;
    }

    if (action === "block_frozen_without_public") {
      throw new Error(`Frozen fixture ${fixture.providerFixtureId} has no public prediction and cannot be regenerated post-kickoff.`);
    }

    if (action === "reuse_current_public_v2") {
      if (needsAccessScopePublication) {
        await publishMatchAccessScopeIfNeeded({
          match,
          liveState,
        });
        liveState = await loadLiveState(externalIds);
      }
      reusedFixtureIds.push(fixture.providerFixtureId);
      continue;
    }

    const revalidatedFixture = WRITE_MODE
      ? await fetchApiFootballFixtureById(fixture.providerFixtureId)
      : fixture;

    if (!revalidatedFixture) {
      throw new Error(`Provider revalidation failed for fixture ${fixture.providerFixtureId}.`);
    }

    if (revalidatedFixture.competition.round !== WORLD_CUP_GROUP_STAGE_2_ROUND) {
      throw new Error(`Fixture ${fixture.providerFixtureId} moved outside Group Stage - 2 during revalidation.`);
    }

    if (decideMatchday2FixtureAction({
      kickoffAt: revalidatedFixture.kickoffAt,
      providerStatus: revalidatedFixture.status,
      latestInternalPrediction: buildPredictionSummary(latestInternalPrediction, liveState.marketsByPredictionId),
      latestPublicPrediction: buildPredictionSummary(latestPublicPrediction, liveState.marketsByPredictionId),
      now: new Date(),
    }) !== action) {
      throw new Error(`Fixture ${fixture.providerFixtureId} changed state during provider revalidation; aborting write.`);
    }

    if (action === "publish_from_internal_v2") {
      const createdPublicVersionId = await publishFromExistingInternalPrediction({
        fixture: revalidatedFixture,
        match,
        liveState,
      });
      await publishMatchAccessScopeIfNeeded({
        match,
        liveState,
      });
      if (createdPublicVersionId) {
        publicVersionsCreated.push(createdPublicVersionId);
      }
      liveState = await loadLiveState(externalIds);
      continue;
    }

    const createdPublicVersionId = await generateAndPublishV2Prediction({
      fixture: revalidatedFixture,
      match,
      liveState,
    });
    regeneratedFixtureIds.push(revalidatedFixture.providerFixtureId);
    if (createdPublicVersionId) {
      publicVersionsCreated.push(createdPublicVersionId);
    }
    liveState = await loadLiveState(externalIds);
  }

  console.log(`FROZEN_FIXTURES count=${frozenFixtureIds.length} ids=${frozenFixtureIds.join(",") || "-"}`);
  console.log(`REGENERATED_FIXTURES count=${regeneratedFixtureIds.length} ids=${regeneratedFixtureIds.join(",") || "-"}`);
  console.log(`REUSED_V2_FIXTURES count=${reusedFixtureIds.length} ids=${reusedFixtureIds.join(",") || "-"}`);
  console.log(`PUBLIC_VERSIONS_CREATED count=${publicVersionsCreated.length} ids=${publicVersionsCreated.join(",") || "-"}`);

  const finalPayload = await writeFinalExport({
    externalIds,
    range,
    requireCompleteCoverage: WRITE_MODE,
  });
  console.log(`FINAL_EXPORT_COUNT count=${finalPayload.fixtures.length}`);
}

void run().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`MATCHDAY2_OPS_FAILED mode=${MODE_LABEL} message=${message}`);
  process.exitCode = 1;
});
