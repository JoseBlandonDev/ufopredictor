import { loadEnvConfig } from "@next/env";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchApiFootballFixturesByLeague } from "@/lib/football-api/api-football-client";
import { createSupabaseScriptAdminClient } from "@/lib/supabase/script-admin";
import {
  applyWorldCupFixtureRegistryPlan,
  buildFixtureRegistrySelection,
  buildFixtureRegistryAllowlistManifest,
  getWorldCupFixtureDateRange,
  getWorldCupFixtures,
  planWorldCupFixtureRegistry,
  resolveFixtureRegistryApplyPlan,
  summarizeFixtureRegistryReport,
  withFixtureRegistrySelection,
  type FixtureRegistryAllowlistManifest,
  type FixtureRegistrySelectionInput,
  type WorldCupRegistryCompetitionRow,
  type WorldCupRegistryDatabaseSnapshot,
  type WorldCupRegistryMatchRow,
  type WorldCupRegistryPredictionVersionRow,
  type WorldCupRegistrySeasonRow,
  type WorldCupRegistryTeamRow,
  WORLD_CUP_COMPETITION_SLUG,
  WORLD_CUP_PROVIDER_LEAGUE_ID,
  WORLD_CUP_PROVIDER_SEASON,
} from "@/lib/world-cup-2026/fixture-registry";

type Args = {
  apply: boolean;
  artifactName: string | null;
  manifestOut: string | null;
  allowCanonicalFixtureIds: string[];
  allowApiFootballFixtureIds: number[];
  allowlistManifestPath: string | null;
  matchday: number | null;
  from: string | null;
  to: string | null;
};

function getArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function parseCsv(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function parseNumberCsv(value: string | null): number[] {
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
    allowCanonicalFixtureIds: parseCsv(getArg("--allow-canonical-fixture-ids")),
    allowApiFootballFixtureIds: parseNumberCsv(getArg("--allow-api-football-fixture-ids")),
    allowlistManifestPath: getArg("--allowlist-manifest"),
    matchday,
    from: getArg("--from"),
    to: getArg("--to"),
  };
}

async function readAllowlistManifest(
  manifestPath: string | null,
): Promise<FixtureRegistryAllowlistManifest | null> {
  if (!manifestPath) {
    return null;
  }

  const raw = await readFile(manifestPath, "utf8");
  return JSON.parse(raw) as FixtureRegistryAllowlistManifest;
}

async function loadDatabaseSnapshot(dateRange: { from: string; to: string }): Promise<WorldCupRegistryDatabaseSnapshot> {
  const supabase = createSupabaseScriptAdminClient();
  const { from, to } = dateRange;

  const { data: competitionData, error: competitionError } = await supabase
    .from("competitions")
    .select("id, slug, external_id, usage_scope")
    .eq("slug", WORLD_CUP_COMPETITION_SLUG);

  if (competitionError) {
    throw new Error(`Failed to read competitions: ${competitionError.message}`);
  }

  const competitions = (competitionData ?? []) as WorldCupRegistryCompetitionRow[];
  const competitionIds = competitions.map((competition) => competition.id);

  const { data: seasonData, error: seasonError } = await supabase
    .from("seasons")
    .select("id, competition_id, year")
    .in("competition_id", competitionIds.length > 0 ? competitionIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("year", WORLD_CUP_PROVIDER_SEASON);

  if (seasonError) {
    throw new Error(`Failed to read seasons: ${seasonError.message}`);
  }

  const seasons = (seasonData ?? []) as WorldCupRegistrySeasonRow[];
  const seasonIds = seasons.map((season) => season.id);

  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("id, slug, name");

  if (teamError) {
    throw new Error(`Failed to read teams: ${teamError.message}`);
  }

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("id, external_id, slug, competition_id, season_id, home_team_id, away_team_id, kickoff_at, stage, status, access_scope, intake_source, source_note")
    .in("season_id", seasonIds.length > 0 ? seasonIds : ["00000000-0000-0000-0000-000000000000"])
    .gte("kickoff_at", `${from}T00:00:00Z`)
    .lte("kickoff_at", `${to}T23:59:59Z`)
    .order("kickoff_at", { ascending: true });

  if (matchError) {
    throw new Error(`Failed to read matches: ${matchError.message}`);
  }

  const matches = (matchData ?? []) as WorldCupRegistryMatchRow[];
  const matchIds = matches.map((match) => match.id);

  const { data: predictionVersionData, error: predictionVersionError } = await supabase
    .from("prediction_versions")
    .select("id, match_id, run_scope")
    .in("match_id", matchIds.length > 0 ? matchIds : ["00000000-0000-0000-0000-000000000000"]);

  if (predictionVersionError) {
    throw new Error(`Failed to read prediction_versions: ${predictionVersionError.message}`);
  }

  return {
    competitions,
    seasons,
    teams: (teamData ?? []) as WorldCupRegistryTeamRow[],
    matches,
    predictionVersions: (predictionVersionData ?? []) as WorldCupRegistryPredictionVersionRow[],
  };
}

async function writeJsonFile(targetPath: string, value: unknown) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function buildArtifactPath(args: Args) {
  const artifactName =
    args.artifactName ??
    `world-cup-group-stage-fixture-registry-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  return path.join(process.cwd(), "artifacts", artifactName);
}

function buildSelectionInput(args: Args): FixtureRegistrySelectionInput {
  return {
    matchday: args.matchday ?? undefined,
    from: args.from ?? undefined,
    to: args.to ?? undefined,
  };
}

function resolveSelectedFixtures(args: Args) {
  if (args.matchday !== null) {
    return getWorldCupFixtures({ stage: "group_stage" }).filter((fixture) =>
      args.matchday === 1
        ? fixture.matchNumber <= 24
        : args.matchday === 2
          ? fixture.matchNumber >= 25 && fixture.matchNumber <= 48
          : fixture.matchNumber >= 49 && fixture.matchNumber <= 72,
    );
  }

  if (args.from || args.to) {
    return getWorldCupFixtures({
      from: args.from ?? undefined,
      to: args.to ?? undefined,
    });
  }

  return getWorldCupFixtures({ stage: "group_stage" });
}

async function run() {
  loadEnvConfig(process.cwd());
  const args = parseArgs();
  const allowlistManifest = await readAllowlistManifest(args.allowlistManifestPath);
  const artifactPath = buildArtifactPath(args);
  const selectedFixtures = resolveSelectedFixtures(args);
  const dateRange = getWorldCupFixtureDateRange(selectedFixtures);

  const [providerFixtures, databaseSnapshot] = await Promise.all([
    fetchApiFootballFixturesByLeague({
      leagueId: WORLD_CUP_PROVIDER_LEAGUE_ID,
      season: WORLD_CUP_PROVIDER_SEASON,
      from: dateRange.from,
      to: dateRange.to,
    }),
    loadDatabaseSnapshot(dateRange),
  ]);

  const baseReport = planWorldCupFixtureRegistry({
    providerFixtures,
    databaseSnapshot,
    canonicalFixtures: selectedFixtures,
  });
  const selection = buildSelectionInput(args);
  const selectedReport = withFixtureRegistrySelection(
    baseReport,
    buildFixtureRegistrySelection(baseReport, selection),
  );

  const reportPayload: Record<string, unknown> = {
    ...selectedReport,
  };

  if (args.manifestOut) {
    const manifest = buildFixtureRegistryAllowlistManifest(baseReport, selection);
    await writeJsonFile(args.manifestOut, manifest);
    reportPayload["allowlistManifestPath"] = args.manifestOut;
  }

  let applyCounts = null;
  if (args.apply) {
    const applyPlan = resolveFixtureRegistryApplyPlan(baseReport, {
      apply: true,
      allowCanonicalFixtureIds: args.allowCanonicalFixtureIds,
      allowApiFootballFixtureIds: args.allowApiFootballFixtureIds,
      allowlistManifest,
    });

    if (!applyPlan) {
      throw new Error("Apply mode did not resolve an exact allowlist.");
    }

    const supabase = createSupabaseScriptAdminClient();
    applyCounts = await applyWorldCupFixtureRegistryPlan({
      report: baseReport,
      databaseSnapshot,
      providerFixtures,
      applyPlan,
      canonicalFixtures: selectedFixtures,
      writeAdapter: {
        async insertMatch(payload) {
          const { data, error } = await supabase
            .from("matches")
            .insert(payload)
            .select("id")
            .single();

          if (error || !data?.id) {
            throw new Error(`Failed to insert match for ${payload.external_id}: ${error?.message ?? "missing row id"}`);
          }

          return { id: data.id as string };
        },
        async updateMatch(matchId, payload) {
          const { error } = await supabase
            .from("matches")
            .update(payload)
            .eq("id", matchId);

          if (error) {
            throw new Error(`Failed to update match ${matchId}: ${error.message}`);
          }
        },
      },
    });
    reportPayload["applyCounts"] = applyCounts;
  }

  await writeJsonFile(artifactPath, reportPayload);

  for (const line of summarizeFixtureRegistryReport(selectedReport, artifactPath)) {
    console.log(line);
  }

  if (args.manifestOut) {
    console.log(`manifest_path=${args.manifestOut}`);
  }

  if (applyCounts) {
    console.log(
      `apply_counts selected=${applyCounts.selected} created=${applyCounts.created} updated=${applyCounts.updated} already_stored=${applyCounts.alreadyStored} skipped=${applyCounts.skipped} conflicts=${applyCounts.conflicts} duplicates=${applyCounts.duplicates}`,
    );
  } else {
    console.log("zero_write_confirmation=true");
  }
}

void run().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`WORLD_CUP_GROUP_STAGE_FIXTURE_REGISTRY_FAILED message=${message}`);
  process.exitCode = 1;
});
