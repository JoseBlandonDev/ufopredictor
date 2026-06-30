import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { WORLD_CUP_2026_TEAMS } from "../world-cup-2026/canonical-teams";
import {
  TASK2C2_PACKAGE_VERSION,
  applyTask2C2RatingsPlanToLocalState,
  buildDefaultTask2C2ArtifactsDir,
  buildTask2C2BaselineLocalStateFromSourceDir,
  buildTask2C2RatingsPackage,
  planTask2C2RatingsImport,
  writeTask2C2DryRunArtifacts,
} from "./task2c-ratings-import";

const cleanupPaths = new Set<string>();

function registerCleanup(targetPath: string) {
  cleanupPaths.add(targetPath);
  return targetPath;
}

afterEach(() => {
  for (const targetPath of cleanupPaths) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
  cleanupPaths.clear();
});

function createTempDir(label: string) {
  return registerCleanup(path.join(os.tmpdir(), `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`));
}

function sha256File(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function writeJson(filePath: string, payload: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function buildV3Teams() {
  return WORLD_CUP_2026_TEAMS.map((team, index) => ({
    team_key: team.teamKey,
    database_name_en: team.displayName,
    display_name_en: team.displayName,
    display_name_es: team.displayName,
    group: team.groupKey,
    fifa_rank: index + 1,
    fifa_points: 1800 - index,
    fifa_live_points_change: index % 4 === 0 ? null : Number((index / 10).toFixed(2)),
    fifa_source_name_es: team.displayName,
    elo_rank: index + 1,
    elo_rating: 2100 - index,
    elo_average_rank: index + 5,
    elo_average_rating: 2000 - index,
    elo_one_year_rank_change: index % 3,
    elo_one_year_rating_change: index,
    elo_source_name_en: team.displayName,
  }));
}

function buildV2Teams() {
  return WORLD_CUP_2026_TEAMS.map((team, index) => ({
    teamKey: team.teamKey,
    databaseNameEn: team.displayName,
    displayNameEn: team.displayName,
    displayNameEs: team.displayName,
    group: team.groupKey,
    fifa: {
      rank: index + 1,
      points: 1700 - index,
      pointsChange: index % 4 === 0 ? null : Number((index / 20).toFixed(2)),
      teamNameEs: team.displayName,
    },
    elo: {
      rank: index + 1,
      rating: 2000 - index,
      averageRank: index + 10,
      averageRating: 1900 - index,
      oneYearChangeRank: index % 5,
      oneYearChangeRating: index,
      teamNameEn: team.displayName,
    },
  }));
}

function createSyntheticV3SourceDir() {
  const sourceDir = createTempDir("task2c2-v3");
  const normalizedPath = path.join(sourceDir, "normalized", "ufo-national-team-ratings-source-refresh-2026-06-29-v3.json");
  const canonicalMapPath = path.join(sourceDir, "normalized", "ufo-team-canonical-map-2026-v1.json");
  const manifestPath = path.join(sourceDir, "reports", "ufo-signal-source-manifest-2026-06-29-v3.json");
  const qualityPath = path.join(sourceDir, "reports", "ufo-signal-source-quality-report-2026-06-29-v3.json");

  writeJson(normalizedPath, {
    schemaVersion: "ufo-national-team-ratings-source-refresh-v3",
    generatedAt: "2026-06-30T06:14:11.817749Z",
    snapshotDate: "2026-06-29",
    baselineCutoffDate: "2026-06-20",
    coverage: {
      canonicalTeamCount: 48,
      eloTeamCount: 48,
      fifaTeamCount: 48,
      missingTeams: [],
      state: "complete",
    },
    canonicalIdentity: {
      authority: "codex-inputs/signal-refresh/v2 canonical 48-team package",
      candidateKeysConfirmedExact: true,
      teamCount: 48,
    },
    sources: {
      elo: {
        effectiveDate: "2026-06-29",
        effectivePrecision: "date",
        rankTiePolicy: "allow_ties",
        state: "daily_ratings_table",
        url: "https://eloratings.net/",
      },
      fifa: {
        effectiveDate: "2026-06-29",
        effectivePrecision: "date",
        state: "live_unofficial",
        url: "https://inside.fifa.com/es/fifa-world-ranking/men",
        warning: "Do not label this capture as the fixed 11 June official publication.",
      },
    },
    teams: buildV3Teams(),
  });

  writeJson(manifestPath, {
    schemaVersion: "ufo-signal-source-manifest-v3",
    generatedAt: "2026-06-30T06:14:11.840933Z",
    snapshotDate: "2026-06-29",
    baselineCutoffDate: "2026-06-20",
    files: [
      {
        path: "normalized/ufo-ratings-elo-source-2026-06-29-v1.csv",
        sha256: "elo-file-sha",
        bytes: 100,
      },
      {
        path: "normalized/ufo-ratings-fifa-source-2026-06-29-v1.csv",
        sha256: "fifa-file-sha",
        bytes: 100,
      },
      {
        path: "normalized/ufo-national-team-ratings-source-refresh-2026-06-29-v3.json",
        sha256: sha256File(normalizedPath),
        bytes: fs.statSync(normalizedPath).size,
      },
    ],
  });

  writeJson(
    canonicalMapPath,
    WORLD_CUP_2026_TEAMS.map((team) => ({
      team_key: team.teamKey,
      database_name_en: team.displayName,
      display_name_en: team.displayName,
      display_name_es: team.displayName,
      aliases_json: JSON.stringify([team.displayName, ...team.aliases]),
    })),
  );

  writeJson(qualityPath, {
    schemaVersion: "ufo-signal-source-quality-report-v3",
    generatedAt: "2026-06-30T06:14:11.821457Z",
    verdict: "PASS_PREPARED_SOURCE_INPUTS",
    checks: {
      canonicalTeamCount: 48,
      missingEloTeams: [],
      missingFifaTeams: [],
    },
    sourceDisagreement: {
      explanation:
        "The FIFA live capture already shows Netherlands vs Morocco as final, while the Elo fixtures snapshot still lists it as upcoming.",
      status: "not_synchronized_intraday",
    },
  });

  return sourceDir;
}

function createSyntheticV2SourceDir() {
  const sourceDir = createTempDir("task2c2-v2");
  const normalizedPath = path.join(sourceDir, "normalized", "ufo-national-team-source-refresh-2026-06-19-v2.json");
  const displayMapPath = path.join(sourceDir, "normalized", "ufo-team-display-name-map-es-en-v1.json");
  const manifestPath = path.join(sourceDir, "reports", "ufo-signal-source-manifest-2026-06-19-v2.json");
  const qualityPath = path.join(sourceDir, "reports", "ufo-signal-source-quality-report-2026-06-19-v2.json");

  writeJson(normalizedPath, {
    schemaVersion: "ufo-national-team-source-refresh-v2",
    generatedAt: "2026-06-19T00:00:00Z",
    snapshotDate: "2026-06-19",
    latestIncludedResultDate: "2026-06-18",
    coverage: {
      canonicalTeamCount: 48,
    },
    languagePolicy: {
      canonicalIdentity: "teamKey",
    },
    teams: buildV2Teams(),
  });

  writeJson(manifestPath, {
    schemaVersion: "ufo-signal-source-manifest-v2",
    generatedAt: "2026-06-19T00:00:00Z",
    sources: [
      {
        filename: "ufo-national-team-source-refresh-2026-06-19-v2.json",
        sha256: sha256File(normalizedPath),
      },
    ],
  });

  writeJson(qualityPath, {
    schemaVersion: "ufo-signal-source-quality-report-v2",
    generatedAt: "2026-06-19T00:00:00Z",
    verdict: "PASS_SOURCE_REFRESH",
    checks: {
      canonicalTeamCount: 48,
      missingEloTeams: [],
      missingFifaCsvTeams: [],
    },
  });

  writeJson(displayMapPath, {
    schemaVersion: "ufo-team-display-name-map-v1",
    generatedAt: "2026-06-19T00:00:00Z",
    teams: WORLD_CUP_2026_TEAMS.map((team) => ({
      teamKey: team.teamKey,
      databaseNameEn: team.displayName,
      displayNameEs: team.displayName,
      aliases: [team.displayName, ...team.aliases],
    })),
  });

  return sourceDir;
}

describe("task2c ratings import", () => {
  it("builds deterministic rating datasets and separate fifa/elo source snapshots from a v3 source package", () => {
    const sourceDir = createSyntheticV3SourceDir();

    const first = buildTask2C2RatingsPackage({
      sourceDir,
      packageVersion: TASK2C2_PACKAGE_VERSION,
    });
    const second = buildTask2C2RatingsPackage({
      sourceDir,
      packageVersion: TASK2C2_PACKAGE_VERSION,
    });

    expect(first.manifest.semantic_package_sha256).toBe(second.manifest.semantic_package_sha256);
    expect(first.datasets.ratings_elo.teams).toHaveLength(48);
    expect(first.datasets.ratings_fifa.teams).toHaveLength(48);
    expect(first.datasets.ratings_elo.snapshot_id).not.toBe(first.datasets.ratings_fifa.snapshot_id);
    expect(first.datasets.ratings_elo.captured_at_utc).toBe("2026-06-29T23:59:59.000Z");
    expect(first.datasets.ratings_fifa.captured_at_utc).toBe("2026-06-30T06:14:11.817Z");
    expect(first.sourceSnapshots.elo.payload_hash).not.toBe(first.sourceSnapshots.fifa.payload_hash);
  });

  it("plans baseline-to-current inserts deterministically and reruns idempotently", () => {
    const baselineDir = createSyntheticV2SourceDir();
    const sourceDir = createSyntheticV3SourceDir();
    const ratingsPackage = buildTask2C2RatingsPackage({
      sourceDir,
      packageVersion: TASK2C2_PACKAGE_VERSION,
    });
    const baselineState = buildTask2C2BaselineLocalStateFromSourceDir(baselineDir);
    const artifactsDir = createTempDir("task2c2-artifacts");
    const packageDir = path.join(artifactsDir, "package");
    const written = writeTask2C2DryRunArtifacts({
      artifactsDir,
      ratingsPackage,
      plan: planTask2C2RatingsImport({
        ratingsPackage,
        currentState: baselineState,
        ratingsPackageManifestPath: path.join(packageDir, "task2c2-ratings-manifest.json"),
        ratingsPackageManifestSha256: "placeholder",
        sourceDir,
        baselineDir,
      }),
      rerunPlan: planTask2C2RatingsImport({
        ratingsPackage,
        currentState: baselineState,
        ratingsPackageManifestPath: path.join(packageDir, "task2c2-ratings-manifest.json"),
        ratingsPackageManifestSha256: "placeholder",
        sourceDir,
        baselineDir,
      }),
    });
    const plan = planTask2C2RatingsImport({
      ratingsPackage,
      currentState: baselineState,
      ratingsPackageManifestPath: written.ratingsPackageManifestPath,
      ratingsPackageManifestSha256: written.ratingsPackageManifestSha256,
      sourceDir,
      baselineDir,
    });

    expect(plan.summary.sourceSnapshots.insert).toBe(2);
    expect(plan.summary.teamRatingSnapshots.insert).toBe(96);
    expect(plan.summary.totals.conflict).toBe(0);
    expect(plan.summary.totals.invalid).toBe(0);

    const rerunState = applyTask2C2RatingsPlanToLocalState(baselineState, plan);
    const rerunPlan = planTask2C2RatingsImport({
      ratingsPackage,
      currentState: rerunState,
      ratingsPackageManifestPath: written.ratingsPackageManifestPath,
      ratingsPackageManifestSha256: written.ratingsPackageManifestSha256,
      sourceDir,
      baselineDir,
    });

    expect(rerunPlan.summary.sourceSnapshots.skip_identical).toBe(2);
    expect(rerunPlan.summary.teamRatingSnapshots.skip_identical).toBe(96);
    expect(rerunPlan.summary.totals.insert).toBe(0);
    expect(rerunPlan.summary.totals.conflict).toBe(0);
  });

  it("detects immutable payload conflicts for existing rating snapshots", () => {
    const sourceDir = createSyntheticV3SourceDir();
    const ratingsPackage = buildTask2C2RatingsPackage({
      sourceDir,
      packageVersion: TASK2C2_PACKAGE_VERSION,
    });
    const baselineState = buildTask2C2BaselineLocalStateFromSourceDir(createSyntheticV2SourceDir());
    const mutatedExistingState = {
      ...baselineState,
      teamRatingSnapshots: [
        ...baselineState.teamRatingSnapshots,
        {
          source_key: "elo" as const,
          effective_at: ratingsPackage.datasets.ratings_elo.effective_at_utc,
          captured_at: ratingsPackage.datasets.ratings_elo.captured_at_utc,
          canonical_team_key: WORLD_CUP_2026_TEAMS[0]!.teamKey,
          rank: 999,
          rating_or_points: 9999,
          source_snapshot_id: ratingsPackage.datasets.ratings_elo.snapshot_id,
          raw_values: { drift: true },
        },
      ],
    };

    const plan = planTask2C2RatingsImport({
      ratingsPackage,
      currentState: mutatedExistingState,
      ratingsPackageManifestPath: "D:\\task2c2\\task2c2-ratings-manifest.json",
      ratingsPackageManifestSha256: "manifest-sha",
      sourceDir,
      baselineDir: null,
    });

    expect(plan.summary.teamRatingSnapshots.conflict).toBe(1);
    expect(
      plan.teamRatingSnapshots.find(
        (row) => row.sourceKey === "elo" && row.canonicalTeamKey === WORLD_CUP_2026_TEAMS[0]!.teamKey,
      )?.action,
    ).toBe("conflict");
  });

  it("keeps dry-run artifacts inside the task2c-2 local-run path shape", () => {
    const defaultDir = buildDefaultTask2C2ArtifactsDir("D:\\Projects\\ufo-predictor");
    expect(defaultDir).toContain(path.join("artifacts", "prediction-intelligence-v2", "task2c-2", "local-run"));
  });
});
