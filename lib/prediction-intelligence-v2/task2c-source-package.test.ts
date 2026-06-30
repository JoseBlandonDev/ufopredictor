import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  TASK2C_DATASET_FILE_BY_ROLE,
  TASK2C_MANIFEST_FILE,
  buildTask2CValidationContext,
  buildTeamTournamentStandingSnapshotInserts,
  createTask2CManifest,
  validateTask2CSourcePackage,
  writeTask2CSourcePackage,
  type Task2CCoverage,
  type Task2CRatingDataset,
  type Task2CRatingRow,
  type Task2CValidationContext,
  type Task2CWorldCupStandingsDataset,
} from "./task2c-source-package";

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

function createTempPackageDir() {
  return registerCleanup(path.join(os.tmpdir(), `task2c-source-package-${Date.now()}-${Math.random().toString(16).slice(2)}`));
}

function buildSmallContext(): Task2CValidationContext {
  return buildTask2CValidationContext({
    canonicalTeamKeys: ["alpha", "beta", "gamma", "delta"],
    canonicalGroupKeys: ["group-a"],
    teamGroupByKey: {
      alpha: "group-a",
      beta: "group-a",
      gamma: "group-a",
      delta: "group-a",
    },
    teamKeysByGroup: {
      "group-a": ["alpha", "beta", "gamma", "delta"],
    },
    allowedDatasetRoles: ["ratings_elo", "ratings_fifa", "world_cup_standings"],
    referenceTimeUtc: "2026-06-29T05:00:00Z",
    allowedClockSkewMs: 5 * 60 * 1000,
  });
}

function buildCoverage(missingTeamKeys: string[] = []): Task2CCoverage {
  return {
    status: missingTeamKeys.length === 0 ? "complete" : "partial",
    target_team_count: 4,
    missing_team_keys: [...missingTeamKeys],
  };
}

function buildRatingsRows(role: "ratings_elo" | "ratings_fifa"): Task2CRatingRow[] {
  const values = role === "ratings_elo" ? [1810, 1790, 1770, 1750] : [1660, 1640, 1620, 1600];
  return ["alpha", "beta", "gamma", "delta"].map((teamKey, index) => ({
    canonical_team_key: teamKey,
    rank: index + 1,
    rating_or_points: values[index]!,
    reliability: { source_count: 1, rank_tier: "full" },
    missing_data: { missing_team_stats: [] },
    disagreement: { flags: [] },
  }));
}

function buildRatingsDataset(role: "ratings_elo" | "ratings_fifa", overrides?: Partial<Task2CRatingDataset>): Task2CRatingDataset {
  const datasetKind = role === "ratings_elo" ? "team_ratings_elo" : "team_ratings_fifa";
  const sourceKey = role === "ratings_elo" ? "elo" : "fifa";
  return {
    schema_name: "prediction-intelligence-v2-rating-snapshot",
    schema_version: "1.0.0",
    dataset_role: role,
    dataset_kind: datasetKind,
    source_key: sourceKey,
    snapshot_id: `${sourceKey}-2026-06-29`,
    competition_key: "world-cup-2026",
    season_key: "2026",
    effective_at_utc: "2026-06-29T00:00:00Z",
    captured_at_utc: "2026-06-29T00:30:00Z",
    cutoff_at_utc: "2026-06-29T01:00:00Z",
    rank_tie_policy: "allow_ties",
    coverage: buildCoverage(),
    reliability: { source_count: 1 },
    missing_data: { missing_team_keys: [] },
    disagreement: { flags: [] },
    teams: buildRatingsRows(role),
    ...overrides,
  };
}

function buildStandingsDataset(overrides?: Partial<Task2CWorldCupStandingsDataset>): Task2CWorldCupStandingsDataset {
  return {
    schema_name: "prediction-intelligence-v2-world-cup-standings-snapshot",
    schema_version: "1.0.0",
    dataset_role: "world_cup_standings",
    dataset_kind: "team_tournament_standings",
    source_key: "fifa",
    snapshot_id: "standings-2026-06-29",
    competition_key: "world-cup-2026",
    season_key: "2026",
    stage_key: "group_stage",
    effective_at_utc: "2026-06-29T00:00:00Z",
    captured_at_utc: "2026-06-29T00:30:00Z",
    cutoff_at_utc: "2026-06-29T01:00:00Z",
    coverage: buildCoverage(),
    reliability: { source_count: 1, publication: "official" },
    missing_data: { missing_team_keys: [] },
    disagreement: { flags: [] },
    rows: [
      {
        canonical_team_key: "alpha",
        group_key: "group-a",
        position: 1,
        matches_played: 3,
        wins: 2,
        draws: 1,
        losses: 0,
        goals_for: 5,
        goals_against: 2,
        goal_difference: 3,
        points: 7,
        source_reported_qualification_status: "qualified",
        reliability: { source_count: 1 },
        missing_data: { fields: [] },
        disagreement: { flags: [] },
      },
      {
        canonical_team_key: "beta",
        group_key: "group-a",
        position: 2,
        matches_played: 3,
        wins: 1,
        draws: 1,
        losses: 1,
        goals_for: 4,
        goals_against: 4,
        goal_difference: 0,
        points: 4,
        source_reported_qualification_status: "qualified",
      },
      {
        canonical_team_key: "gamma",
        group_key: "group-a",
        position: 3,
        matches_played: 3,
        wins: 1,
        draws: 0,
        losses: 2,
        goals_for: 2,
        goals_against: 5,
        goal_difference: -3,
        points: 3,
        source_reported_qualification_status: null,
      },
      {
        canonical_team_key: "delta",
        group_key: "group-a",
        position: 4,
        matches_played: 3,
        wins: 0,
        draws: 0,
        losses: 3,
        goals_for: 1,
        goals_against: 6,
        goal_difference: -5,
        points: 0,
        source_reported_qualification_status: "eliminated",
      },
    ],
    ...overrides,
  };
}

function writeSyntheticPackage(overrides?: {
  packageCreatedAtUtc?: string | null;
  targetCanonicalTeamKeys?: string[];
  ratingsElo?: Task2CRatingDataset;
  ratingsFifa?: Task2CRatingDataset;
  standings?: Task2CWorldCupStandingsDataset;
}) {
  const packageDir = createTempPackageDir();
  writeTask2CSourcePackage(packageDir, {
    packageVersion: "1.0.0",
    packageCreatedAtUtc: overrides?.packageCreatedAtUtc ?? "2026-06-29T01:05:00Z",
    targetCanonicalTeamKeys: overrides?.targetCanonicalTeamKeys ?? ["alpha", "beta", "gamma", "delta"],
    ratingsElo: overrides?.ratingsElo ?? buildRatingsDataset("ratings_elo"),
    ratingsFifa: overrides?.ratingsFifa ?? buildRatingsDataset("ratings_fifa"),
    worldCupStandings: overrides?.standings ?? buildStandingsDataset(),
  });
  return packageDir;
}

function readManifest(packageDir: string) {
  return JSON.parse(fs.readFileSync(path.join(packageDir, TASK2C_MANIFEST_FILE), "utf8")) as Record<string, unknown>;
}

function writeManifest(packageDir: string, manifest: unknown) {
  fs.writeFileSync(path.join(packageDir, TASK2C_MANIFEST_FILE), JSON.stringify(manifest, null, 2), "utf8");
}

function sha256File(filePath: string) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function refreshManifestFileMetadata(packageDir: string, role: "ratings_elo" | "ratings_fifa" | "world_cup_standings") {
  const manifest = readManifest(packageDir);
  const fileName = TASK2C_DATASET_FILE_BY_ROLE[role];
  const filePath = path.join(packageDir, fileName);
  const fileEntry = (manifest.package_files as Array<Record<string, unknown>>).find((entry) => entry.role === role);
  if (fileEntry == null) {
    throw new Error(`Missing manifest package_files entry for ${role}`);
  }
  fileEntry.sha256 = sha256File(filePath);
  fileEntry.size_bytes = fs.statSync(filePath).size;
  writeManifest(packageDir, manifest);
}

describe("task2c source package", () => {
  it("accepts a valid package, preserves disagreement metadata, and builds deterministic inserts", () => {
    const packageDir = writeSyntheticPackage({
      standings: buildStandingsDataset({
        rows: [
          {
            canonical_team_key: "delta",
            group_key: "group-a",
            position: 4,
            matches_played: 3,
            wins: 0,
            draws: 0,
            losses: 3,
            goals_for: 1,
            goals_against: 6,
            goal_difference: -5,
            points: 0,
            source_reported_qualification_status: "eliminated",
            disagreement: { flags: ["source-footnote"] },
          },
          ...buildStandingsDataset().rows.slice(0, 3),
        ],
      }),
    });

    const result = validateTask2CSourcePackage(packageDir, buildSmallContext());

    expect(result.status).toBe("verified");
    expect(result.findings).toEqual([]);
    expect(result.validatedPackage?.manifest.target_canonical_team_keys).toEqual(["alpha", "beta", "delta", "gamma"]);

    const inserts = buildTeamTournamentStandingSnapshotInserts(result.validatedPackage!, {
      competitionId: "competition-world-cup-2026",
      seasonId: "season-world-cup-2026",
    });

    expect(inserts.map((row) => row.canonical_team_key)).toEqual(["alpha", "beta", "gamma", "delta"]);
    expect(inserts[0]).toMatchObject({
      source_snapshot_id: "standings-2026-06-29",
      matches_played: 3,
      source_reported_qualification_status: "qualified",
    });
    expect(inserts.at(-1)?.disagreement_json).toEqual({ flags: ["source-footnote"] });
  });

  it("recomputes semantic checksums deterministically across key order, target order, manifest entry order, and semantically unordered row order", () => {
    const alpha = buildRatingsDataset("ratings_elo");
    const beta = buildRatingsDataset("ratings_elo", {
      teams: [...buildRatingsDataset("ratings_elo").teams].reverse().map((row) =>
        row.canonical_team_key === "alpha"
          ? { disagreement: row.disagreement, missing_data: row.missing_data, reliability: row.reliability, rating_or_points: row.rating_or_points, rank: row.rank, canonical_team_key: row.canonical_team_key }
          : row,
      ),
    });
    const standingsA = buildStandingsDataset();
    const standingsB = buildStandingsDataset({
      rows: [...buildStandingsDataset().rows].reverse().map((row) => ({ ...row })),
    });

    const manifestA = createTask2CManifest({
      packageVersion: "1.0.0",
      packageCreatedAtUtc: "2026-06-29T01:05:00Z",
      targetCanonicalTeamKeys: ["alpha", "beta", "gamma", "delta"],
      ratingsElo: alpha,
      ratingsFifa: buildRatingsDataset("ratings_fifa"),
      worldCupStandings: standingsA,
    });
    const manifestB = createTask2CManifest({
      packageVersion: "1.0.0",
      packageCreatedAtUtc: "2026-06-29T01:05:00Z",
      targetCanonicalTeamKeys: ["delta", "gamma", "beta", "alpha"],
      ratingsElo: beta,
      ratingsFifa: buildRatingsDataset("ratings_fifa", { teams: [...buildRatingsDataset("ratings_fifa").teams].reverse() }),
      worldCupStandings: standingsB,
    });

    expect(manifestA.semantic_package_sha256).toBe(manifestB.semantic_package_sha256);
  });

  it("rejects malformed manifests, checksum drift, and stored semantic checksum drift", () => {
    const malformedDir = writeSyntheticPackage();
    const malformedManifest = readManifest(malformedDir);
    delete malformedManifest.package_id;
    writeManifest(malformedDir, malformedManifest);
    expect(validateTask2CSourcePackage(malformedDir, buildSmallContext()).findings.some((finding) => finding.code === "manifest_invalid_shape")).toBe(true);

    const checksumDir = writeSyntheticPackage();
    const ratingsPath = path.join(checksumDir, TASK2C_DATASET_FILE_BY_ROLE.ratings_elo);
    const checksumDataset = JSON.parse(fs.readFileSync(ratingsPath, "utf8")) as Task2CRatingDataset;
    checksumDataset.teams[0] = { ...checksumDataset.teams[0]!, rating_or_points: 1999 };
    fs.writeFileSync(ratingsPath, JSON.stringify(checksumDataset), "utf8");
    expect(validateTask2CSourcePackage(checksumDir, buildSmallContext()).findings.some((finding) => finding.code === "manifest_dataset_checksum_mismatch")).toBe(true);

    const semanticDir = writeSyntheticPackage();
    const semanticManifest = readManifest(semanticDir);
    semanticManifest.semantic_package_sha256 = "deadbeef";
    writeManifest(semanticDir, semanticManifest);
    expect(validateTask2CSourcePackage(semanticDir, buildSmallContext()).findings.some((finding) => finding.code === "manifest_semantic_checksum_mismatch")).toBe(true);
  });

  it("rejects duplicate roles, duplicate filenames, wrong dataset kinds, and role substitutions", () => {
    const packageDir = writeSyntheticPackage();
    const manifest = readManifest(packageDir);
    const datasets = manifest.datasets as Array<Record<string, unknown>>;
    const packageFiles = manifest.package_files as Array<Record<string, unknown>>;
    datasets.push({ ...datasets[0]! });
    packageFiles[1] = { ...packageFiles[0]!, role: "ratings_fifa" };
    datasets[2] = { ...datasets[2]!, dataset_kind: "team_ratings_fifa" };
    writeManifest(packageDir, manifest);

    const result = validateTask2CSourcePackage(packageDir, buildSmallContext());

    expect(result.status).toBe("blocked");
    expect(result.findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining(["manifest_duplicate_role", "manifest_duplicate_filename", "manifest_dataset_kind_mismatch"]),
    );
  });

  it("rejects missing files, path traversal, absolute paths, separators, and resolved-path escape", () => {
    const missingDir = writeSyntheticPackage();
    fs.rmSync(path.join(missingDir, TASK2C_DATASET_FILE_BY_ROLE.ratings_fifa));
    expect(validateTask2CSourcePackage(missingDir, buildSmallContext()).findings.some((finding) => finding.code === "dataset_missing")).toBe(true);

    for (const unsafeName of ["..\\ratings-elo.json", "../ratings-elo.json", "C:\\temp\\ratings-elo.json", "/tmp/ratings-elo.json", "nested/ratings-elo.json"]) {
      const packageDir = writeSyntheticPackage();
      const manifest = readManifest(packageDir);
      (manifest.package_files as Array<Record<string, unknown>>)[0]!.file_name = unsafeName;
      (manifest.datasets as Array<Record<string, unknown>>)[0]!.file_name = unsafeName;
      writeManifest(packageDir, manifest);
      expect(validateTask2CSourcePackage(packageDir, buildSmallContext()).findings.some((finding) => finding.code === "manifest_unsafe_filename" || finding.code === "manifest_path_escape")).toBe(true);
    }

    const escapeDir = writeSyntheticPackage();
    const targetFile = registerCleanup(path.join(os.tmpdir(), `task2c-escape-${Date.now()}.json`));
    fs.writeFileSync(targetFile, fs.readFileSync(path.join(escapeDir, TASK2C_DATASET_FILE_BY_ROLE.ratings_elo)));
    const symlinkPath = path.join(escapeDir, TASK2C_DATASET_FILE_BY_ROLE.ratings_elo);
    fs.rmSync(symlinkPath);
    try {
      fs.symlinkSync(targetFile, symlinkPath);
      expect(validateTask2CSourcePackage(escapeDir, buildSmallContext()).findings.some((finding) => finding.code === "manifest_path_escape")).toBe(true);
    } catch {
      fs.writeFileSync(symlinkPath, fs.readFileSync(targetFile));
      expect(validateTask2CSourcePackage(escapeDir, buildSmallContext()).status).toBe("verified");
    }
  });

  it("enforces explicit-offset timestamp rules, represented-instant comparisons, skew, and ordering", () => {
    const validDir = writeSyntheticPackage({
      packageCreatedAtUtc: "2026-06-29T01:05:00Z",
      ratingsElo: buildRatingsDataset("ratings_elo", {
        effective_at_utc: "2026-06-29T00:00:00Z",
        captured_at_utc: "2026-06-28T19:00:00-05:00",
        cutoff_at_utc: "2026-06-29T01:00:00Z",
      }),
    });
    expect(validateTask2CSourcePackage(validDir, buildSmallContext()).status).toBe("verified");

    const noOffsetDir = writeSyntheticPackage({
      ratingsElo: buildRatingsDataset("ratings_elo", { effective_at_utc: "2026-06-29T00:00:00" }),
    });
    expect(validateTask2CSourcePackage(noOffsetDir, buildSmallContext()).findings.some((finding) => finding.code === "dataset_timestamp_invalid")).toBe(true);

    const badOrderingDir = writeSyntheticPackage({
      standings: buildStandingsDataset({
        effective_at_utc: "2026-06-29T01:10:00Z",
        captured_at_utc: "2026-06-29T01:00:00Z",
      }),
    });
    expect(validateTask2CSourcePackage(badOrderingDir, buildSmallContext()).findings.some((finding) => finding.code === "dataset_timestamp_order_invalid")).toBe(true);

    const futureDir = writeSyntheticPackage({
      standings: buildStandingsDataset({
        captured_at_utc: "2026-06-29T05:10:00Z",
      }),
    });
    expect(validateTask2CSourcePackage(futureDir, buildSmallContext()).findings.some((finding) => finding.code === "dataset_timestamp_future_skew")).toBe(true);

    const packageCreatedDir = writeSyntheticPackage({
      packageCreatedAtUtc: "2026-06-29T00:59:59Z",
    });
    expect(validateTask2CSourcePackage(packageCreatedDir, buildSmallContext()).findings.some((finding) => finding.code === "dataset_timestamp_order_invalid")).toBe(true);
  });

  it("enforces canonical identity and exact coverage reconciliation for complete, partial, missing, and unexpected teams", () => {
    expect(validateTask2CSourcePackage(writeSyntheticPackage(), buildSmallContext()).status).toBe("verified");

    const partialPackage = writeSyntheticPackage({
      ratingsElo: buildRatingsDataset("ratings_elo", {
        coverage: buildCoverage(["delta"]),
        teams: buildRatingsDataset("ratings_elo").teams.slice(0, 3),
      }),
      ratingsFifa: buildRatingsDataset("ratings_fifa", {
        coverage: buildCoverage(["delta"]),
        teams: buildRatingsDataset("ratings_fifa").teams.slice(0, 3),
      }),
      standings: buildStandingsDataset({
        coverage: buildCoverage(["delta"]),
        rows: buildStandingsDataset().rows.slice(0, 3),
      }),
    });
    expect(validateTask2CSourcePackage(partialPackage, buildSmallContext()).status).toBe("verified");

    const undeclaredMissing = writeSyntheticPackage({
      standings: buildStandingsDataset({
        rows: buildStandingsDataset().rows.slice(0, 3),
      }),
    });
    expect(validateTask2CSourcePackage(undeclaredMissing, buildSmallContext()).findings.some((finding) => finding.code === "dataset_coverage_mismatch")).toBe(true);

    const declaredPresent = writeSyntheticPackage({
      standings: buildStandingsDataset({
        coverage: buildCoverage(["delta"]),
      }),
    });
    expect(validateTask2CSourcePackage(declaredPresent, buildSmallContext()).findings.some((finding) => finding.code === "dataset_coverage_mismatch")).toBe(true);

    const unexpectedTeam = writeSyntheticPackage({
      ratingsElo: buildRatingsDataset("ratings_elo", {
        teams: [
          ...buildRatingsDataset("ratings_elo").teams.slice(0, 3),
          { canonical_team_key: "omega", rank: 4, rating_or_points: 1700 },
        ],
      }),
    });
    expect(validateTask2CSourcePackage(unexpectedTeam, buildSmallContext()).findings.some((finding) => finding.code === "dataset_unknown_team" || finding.code === "dataset_unexpected_team")).toBe(true);
  });

  it("supports a smaller injected registry and rejects duplicate manifest targets and duplicate dataset teams", () => {
    const smallContext = buildTask2CValidationContext({
      canonicalTeamKeys: ["red", "blue"],
      canonicalGroupKeys: ["group-z"],
      teamGroupByKey: { red: "group-z", blue: "group-z" },
      teamKeysByGroup: { "group-z": ["red", "blue"] },
      allowedDatasetRoles: ["ratings_elo", "ratings_fifa", "world_cup_standings"],
      referenceTimeUtc: "2026-06-29T05:00:00Z",
      allowedClockSkewMs: 5 * 60 * 1000,
    });
    const packageDir = createTempPackageDir();
    writeTask2CSourcePackage(packageDir, {
      packageVersion: "1.0.0",
      packageCreatedAtUtc: "2026-06-29T01:05:00Z",
      targetCanonicalTeamKeys: ["red", "blue"],
      ratingsElo: buildRatingsDataset("ratings_elo", {
        competition_key: "mini-cup",
        season_key: "mini-2026",
        coverage: { status: "complete", target_team_count: 2, missing_team_keys: [] },
        teams: [
          { canonical_team_key: "red", rank: 1, rating_or_points: 1800 },
          { canonical_team_key: "blue", rank: 2, rating_or_points: 1700 },
        ],
      }),
      ratingsFifa: buildRatingsDataset("ratings_fifa", {
        competition_key: "mini-cup",
        season_key: "mini-2026",
        coverage: { status: "complete", target_team_count: 2, missing_team_keys: [] },
        teams: [
          { canonical_team_key: "red", rank: 1, rating_or_points: 1600 },
          { canonical_team_key: "blue", rank: 2, rating_or_points: 1500 },
        ],
      }),
      worldCupStandings: buildStandingsDataset({
        competition_key: "mini-cup",
        season_key: "mini-2026",
        coverage: { status: "complete", target_team_count: 2, missing_team_keys: [] },
        rows: [
          {
            canonical_team_key: "red",
            group_key: "group-z",
            position: 1,
            matches_played: 1,
            wins: 1,
            draws: 0,
            losses: 0,
            goals_for: 2,
            goals_against: 1,
            goal_difference: 1,
            points: 3,
            source_reported_qualification_status: null,
          },
          {
            canonical_team_key: "blue",
            group_key: "group-z",
            position: 2,
            matches_played: 1,
            wins: 0,
            draws: 0,
            losses: 1,
            goals_for: 1,
            goals_against: 2,
            goal_difference: -1,
            points: 0,
            source_reported_qualification_status: null,
          },
        ],
      }),
    });
    expect(validateTask2CSourcePackage(packageDir, smallContext).status).toBe("verified");

    const duplicateTargetDir = writeSyntheticPackage({
      targetCanonicalTeamKeys: ["alpha", "beta", "gamma", "gamma"],
    });
    expect(validateTask2CSourcePackage(duplicateTargetDir, buildSmallContext()).findings.some((finding) => finding.code === "manifest_duplicate_target_team")).toBe(true);

    const duplicateDatasetTeamDir = writeSyntheticPackage({
      ratingsFifa: buildRatingsDataset("ratings_fifa", {
        teams: [
          ...buildRatingsDataset("ratings_fifa").teams.slice(0, 3),
          { canonical_team_key: "gamma", rank: 4, rating_or_points: 1500 },
        ],
      }),
    });
    expect(validateTask2CSourcePackage(duplicateDatasetTeamDir, buildSmallContext()).findings.some((finding) => finding.code === "dataset_duplicate_team")).toBe(true);
  });

  it("enforces elo and fifa value rules, including explicit rank-tie policy", () => {
    const allowedTieDir = writeSyntheticPackage({
      ratingsElo: buildRatingsDataset("ratings_elo", {
        teams: [
          { canonical_team_key: "alpha", rank: 1, rating_or_points: 1800 },
          { canonical_team_key: "beta", rank: 1, rating_or_points: 1790 },
          { canonical_team_key: "gamma", rank: 3, rating_or_points: 1780 },
          { canonical_team_key: "delta", rank: 4, rating_or_points: 1770 },
        ],
      }),
    });
    expect(validateTask2CSourcePackage(allowedTieDir, buildSmallContext()).status).toBe("verified");

    const forbiddenTieDir = writeSyntheticPackage({
      ratingsFifa: buildRatingsDataset("ratings_fifa", {
        rank_tie_policy: "forbid_ties",
        teams: [
          { canonical_team_key: "alpha", rank: 1, rating_or_points: 1600 },
          { canonical_team_key: "beta", rank: 1, rating_or_points: 1590 },
          { canonical_team_key: "gamma", rank: 3, rating_or_points: 1580 },
          { canonical_team_key: "delta", rank: 4, rating_or_points: 1570 },
        ],
      }),
    });
    expect(validateTask2CSourcePackage(forbiddenTieDir, buildSmallContext()).findings.some((finding) => finding.code === "dataset_rank_tie_forbidden")).toBe(true);

    const invalidValueDir = writeSyntheticPackage();
    const eloPath = path.join(invalidValueDir, TASK2C_DATASET_FILE_BY_ROLE.ratings_elo);
    const eloText = fs.readFileSync(eloPath, "utf8")
      .replace('"rank":1', '"rank":0')
      .replace('"rating_or_points":1810', '"rating_or_points":1e309')
      .replace('"rank":2', '"rank":2.5')
      .replace('"rating_or_points":1790', '"rating_or_points":-1e309');
    fs.writeFileSync(eloPath, eloText, "utf8");
    refreshManifestFileMetadata(invalidValueDir, "ratings_elo");

    const fifaPath = path.join(invalidValueDir, TASK2C_DATASET_FILE_BY_ROLE.ratings_fifa);
    const fifaText = fs.readFileSync(fifaPath, "utf8").replace('"rating_or_points":1660', '"rating_or_points":-1');
    fs.writeFileSync(fifaPath, fifaText, "utf8");
    refreshManifestFileMetadata(invalidValueDir, "ratings_fifa");

    const invalidValueResult = validateTask2CSourcePackage(invalidValueDir, buildSmallContext());
    expect(invalidValueResult.findings.some((finding) => finding.code === "dataset_rank_invalid")).toBe(true);
    expect(invalidValueResult.findings.some((finding) => finding.code === "dataset_value_invalid")).toBe(true);
  });

  it("enforces standings arithmetic, group membership, qualification semantics, and rejects derived fields", () => {
    const invalidStandingsDir = writeSyntheticPackage();
    const standingsPath = path.join(invalidStandingsDir, TASK2C_DATASET_FILE_BY_ROLE.world_cup_standings);
    const standings = JSON.parse(fs.readFileSync(standingsPath, "utf8")) as Task2CWorldCupStandingsDataset;
    const [alpha, beta, gamma, delta] = standings.rows;
    standings.rows = [
      { ...alpha!, wins: 1, draws: 1, losses: 1, goal_difference: 4, points: 99 },
      { ...beta!, group_key: "group-b", position: 1, source_reported_qualification_status: "unknown" as never, pressure_state: "high" } as never,
      { ...gamma!, matches_played: -1, recent_form: "WWW" } as never,
      { ...delta!, position: 3, opponent_quality: "high", remaining_matches: 0 } as never,
    ];
    fs.writeFileSync(standingsPath, JSON.stringify(standings), "utf8");
    refreshManifestFileMetadata(invalidStandingsDir, "world_cup_standings");

    const result = validateTask2CSourcePackage(invalidStandingsDir, buildSmallContext());

    expect(result.findings.some((finding) => finding.code === "dataset_played_mismatch")).toBe(true);
    expect(result.findings.some((finding) => finding.code === "dataset_goal_difference_mismatch")).toBe(true);
    expect(result.findings.some((finding) => finding.code === "dataset_points_mismatch")).toBe(true);
    expect(result.findings.some((finding) => finding.code === "dataset_group_mismatch")).toBe(true);
    expect(result.findings.some((finding) => finding.code === "dataset_duplicate_group_position")).toBe(true);
    expect(result.findings.some((finding) => finding.code === "dataset_qualification_status_invalid")).toBe(true);
    expect(result.findings.filter((finding) => finding.message.includes("Derived field")).length).toBeGreaterThanOrEqual(3);
  });

  it("orders findings deterministically", () => {
    const packageDir = writeSyntheticPackage({
      targetCanonicalTeamKeys: ["alpha", "alpha", "gamma", "omega"],
      ratingsElo: buildRatingsDataset("ratings_elo", {
        teams: [
          { canonical_team_key: "omega", rank: 0, rating_or_points: 1700 },
          { canonical_team_key: "gamma", rank: 2, rating_or_points: 1690 },
          { canonical_team_key: "gamma", rank: 3, rating_or_points: 1680 },
          { canonical_team_key: "delta", rank: 4, rating_or_points: 1670 },
        ],
      }),
    });

    const first = validateTask2CSourcePackage(packageDir, buildSmallContext()).findings.map((finding) => `${finding.code}:${finding.path}:${finding.rowIdentity ?? ""}`);
    const second = validateTask2CSourcePackage(packageDir, buildSmallContext()).findings.map((finding) => `${finding.code}:${finding.path}:${finding.rowIdentity ?? ""}`);

    expect(first).toEqual(second);
  });
});
