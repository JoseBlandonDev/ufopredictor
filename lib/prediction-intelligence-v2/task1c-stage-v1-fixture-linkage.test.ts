import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { ApiFootballFixtureLookupDetailedResult } from "../football-api/api-football-client";
import type { ProviderFixture } from "../football-api/api-football-types";
import {
  assertTask1cStageV1LinkageAuthorization,
  applyTask1cStageV1FixtureLinkagePlan,
  planTask1cStageV1FixtureLinkage,
  runTask1cStageV1FixtureLinkage,
  validateTask1cStageV1FixtureLinkageManifest,
  type Task1cStageDatabaseSnapshot,
  type Task1cStageMatchRow,
} from "./task1c-stage-v1-fixture-linkage";
import type { FrozenSourceManifest } from "./task1c-frozen-v1-source-package";

const cleanupPaths = new Set<string>();
const APPROVED_ARTIFACT_DIR = path.join(
  process.cwd(),
  "artifacts",
  "prediction-intelligence-v2",
  "task1c",
  "2026-06-26",
  "2026-06-26T10-59-46-686Z",
);

function registerCleanup(targetPath: string): string {
  cleanupPaths.add(targetPath);
  return targetPath;
}

function sha256File(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableValue(entry));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    return Object.fromEntries(entries.map(([key, entry]) => [key, stableValue(entry)]));
  }

  return value;
}

function buildStablePlanPayload(plan: {
  schemaName: string;
  schemaVersion: number;
  targetProjectRef: string;
  deniedProjectRef: string;
  sourceManifestPath: string;
  sourceManifestChecksum: string;
  canonicalPackageSha256: string;
  selectedFixtureCount: number;
  selectedMatchNumbers: number[];
  selectedSlugs: string[];
  selectedProviderFixtureIds: number[];
  providerRetrieval: unknown;
  summary: unknown;
  outOfScopeEvidence: unknown;
  rows: unknown;
}): unknown {
  return {
    schemaName: plan.schemaName,
    schemaVersion: plan.schemaVersion,
    targetProjectRef: plan.targetProjectRef,
    deniedProjectRef: plan.deniedProjectRef,
    sourceManifestPath: plan.sourceManifestPath,
    sourceManifestChecksum: plan.sourceManifestChecksum,
    canonicalPackageSha256: plan.canonicalPackageSha256,
    selectedFixtureCount: plan.selectedFixtureCount,
    selectedMatchNumbers: plan.selectedMatchNumbers,
    selectedSlugs: plan.selectedSlugs,
    selectedProviderFixtureIds: plan.selectedProviderFixtureIds,
    providerRetrieval: plan.providerRetrieval,
    summary: plan.summary,
    outOfScopeEvidence: plan.outOfScopeEvidence,
    rows: plan.rows,
  };
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

afterEach(() => {
  for (const targetPath of cleanupPaths) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
  cleanupPaths.clear();
});

function prepareManifestWorkspace(mutator?: (manifest: FrozenSourceManifest) => FrozenSourceManifest): {
  manifestPath: string;
  packageSha256: string;
  manifest: FrozenSourceManifest;
  workspaceDir: string;
} {
  const workspaceDir = registerCleanup(path.join(os.tmpdir(), `task1c-linkage-${Date.now()}-${Math.random().toString(16).slice(2)}`));
  fs.mkdirSync(workspaceDir, { recursive: true });

  const sourceManifestPath = path.join(APPROVED_ARTIFACT_DIR, "frozen-source-manifest.json");
  const sourcePackagePath = path.join(APPROVED_ARTIFACT_DIR, "ufo-frozen-v1-source-package-v1.json");
  const sourceChecksumsPath = path.join(APPROVED_ARTIFACT_DIR, "checksums.json");
  const manifestPath = path.join(workspaceDir, "frozen-source-manifest.json");
  const packagePath = path.join(workspaceDir, "ufo-frozen-v1-source-package-v1.json");
  const checksumsPath = path.join(workspaceDir, "checksums.json");

  const manifest = JSON.parse(fs.readFileSync(sourceManifestPath, "utf8")) as FrozenSourceManifest;
  const nextManifest = mutator ? mutator(manifest) : manifest;
  fs.writeFileSync(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, "utf8");
  fs.copyFileSync(sourcePackagePath, packagePath);
  fs.copyFileSync(sourceChecksumsPath, checksumsPath);

  if (mutator) {
    fs.rmSync(checksumsPath, { force: true });
  }

  return {
    manifestPath,
    packageSha256: sha256File(packagePath),
    manifest: nextManifest,
    workspaceDir,
  };
}

function buildSnapshot(manifest: FrozenSourceManifest, options?: {
  alreadyLinked?: boolean;
  duplicateFixtureSlug?: string | null;
  conflictingExternalSlug?: string | null;
  includeOutOfScopeColombia?: boolean;
}): Task1cStageDatabaseSnapshot {
  const competitionId = "competition-world-cup-2026";
  const seasonId = "season-world-cup-2026";
  const teamSlugSet = new Set<string>();
  for (const fixture of manifest.fixtures) {
    teamSlugSet.add(fixture.canonicalHomeTeamKey);
    teamSlugSet.add(fixture.canonicalAwayTeamKey);
  }
  if (options?.includeOutOfScopeColombia) {
    teamSlugSet.add("colombia");
    teamSlugSet.add("congo-dr");
  }

  const teams = [...teamSlugSet].sort().map((slug) => ({
    id: `team-${slug}`,
    slug,
    name: slug,
  }));

  const matches: Task1cStageMatchRow[] = manifest.fixtures.map((fixture) => ({
    id: `match-${fixture.matchNumber}`,
    external_id:
      options?.alreadyLinked
        ? `api-football:fixture:${fixture.apiFootballFixtureId}`
        : options?.conflictingExternalSlug === fixture.canonicalSlug
          ? "api-football:fixture:9999999"
          : null,
    slug: fixture.canonicalSlug,
    competition_id: competitionId,
    season_id: seasonId,
    home_team_id: `team-${fixture.canonicalHomeTeamKey}`,
    away_team_id: `team-${fixture.canonicalAwayTeamKey}`,
    kickoff_at: fixture.kickoffAt,
    stage: "Group Stage - 3",
    status: "scheduled",
    access_scope: "admin_only",
    lab_status: "ready",
    intake_source: options?.alreadyLinked ? "api_football" : "manual",
    data_quality: "verified",
    source_note: null,
  }));

  if (options?.duplicateFixtureSlug) {
    const duplicate = matches.find((match) => match.slug === options.duplicateFixtureSlug);
    if (duplicate) {
      matches.push({
        ...duplicate,
        id: `${duplicate.id}-duplicate`,
      });
    }
  }

  if (options?.includeOutOfScopeColombia) {
    matches.push({
      id: "match-colombia-congo-dr-1539008",
      external_id: null,
      slug: "world-cup-2026-colombia-vs-congo-dr-2026-06-24",
      competition_id: competitionId,
      season_id: seasonId,
      home_team_id: "team-colombia",
      away_team_id: "team-congo-dr",
      kickoff_at: "2026-06-24T01:00:00+00:00",
      stage: "Group Stage - 2",
      status: "scheduled",
      access_scope: "admin_only",
      lab_status: "ready",
      intake_source: "manual",
      data_quality: "verified",
      source_note: null,
    });
  }

  return {
    competitions: [{ id: competitionId, slug: "world-cup-2026" }],
    seasons: [{ id: seasonId, competition_id: competitionId, year: 2026 }],
    teams,
    matches,
  };
}

function buildProviderFixture(fixture: FrozenSourceManifest["fixtures"][number], overrides?: Partial<ProviderFixture>): ProviderFixture {
  return {
    provider: "api-football",
    providerFixtureId: overrides?.providerFixtureId ?? fixture.apiFootballFixtureId,
    kickoffAt: overrides?.kickoffAt ?? fixture.kickoffAt,
    timezone: overrides?.timezone ?? "UTC",
    status: overrides?.status ?? "scheduled",
    statusShort: overrides?.statusShort ?? "NS",
    elapsedMinutes: overrides?.elapsedMinutes ?? null,
    competition: {
      providerCompetitionId: overrides?.competition?.providerCompetitionId ?? 1,
      name: overrides?.competition?.name ?? "World Cup",
      country: overrides?.competition?.country ?? "World",
      season: overrides?.competition?.season ?? 2026,
      round: overrides?.competition?.round ?? "Group Stage - 3",
    },
    homeTeam: {
      providerTeamId: overrides?.homeTeam?.providerTeamId ?? fixture.matchNumber * 10 + 1,
      name: overrides?.homeTeam?.name ?? fixture.canonicalHomeTeamKey,
      winner: overrides?.homeTeam?.winner ?? null,
    },
    awayTeam: {
      providerTeamId: overrides?.awayTeam?.providerTeamId ?? fixture.matchNumber * 10 + 2,
      name: overrides?.awayTeam?.name ?? fixture.canonicalAwayTeamKey,
      winner: overrides?.awayTeam?.winner ?? null,
    },
    goals: {
      home: overrides?.goals?.home ?? null,
      away: overrides?.goals?.away ?? null,
    },
  };
}

function buildDetailedProviderResult(
  fixture: ProviderFixture | null,
  overrides?: Partial<ApiFootballFixtureLookupDetailedResult>,
): ApiFootballFixtureLookupDetailedResult {
  return {
    fixture,
    diagnostics: {
      endpoint: "/fixtures",
      query: fixture ? { id: String(fixture.providerFixtureId) } : {},
      results: fixture ? 1 : 0,
      errors: [],
      paging: null,
    },
    httpStatus: fixture ? 200 : 404,
    retryAfterSeconds: null,
    errorCode: null,
    errorMessage: null,
    failureKind: null,
    ...overrides,
  };
}

function buildProviderLookups(manifest: FrozenSourceManifest) {
  return manifest.fixtures.map((fixture) => ({
    fixtureId: fixture.apiFootballFixtureId,
    providerFixture: buildProviderFixture(fixture),
    evidence: {
      providerFixtureId: fixture.apiFootballFixtureId,
      verificationStatus: "provider_verified" as const,
      attemptCount: 1,
      finalHttpStatus: 200,
      retryClassification: "not_needed" as const,
      sanitizedErrorCode: null,
      sanitizedErrorMessage: null,
      retryAfterSeconds: null,
      fixtureIdentityReturned: true,
      kickoffAt: fixture.kickoffAt,
      round: "Group Stage - 3",
      homeTeamName: fixture.canonicalHomeTeamKey,
      awayTeamName: fixture.canonicalAwayTeamKey,
      status: "scheduled" as const,
      identityChecks: {
        fixtureReturned: true,
        homeIdentity: "match" as const,
        awayIdentity: "match" as const,
        kickoffIdentity: "match" as const,
        groupStageIdentity: "match" as const,
      },
    },
  }));
}

describe("task1c stage v1 fixture linkage", () => {
  it("accepts the explicit stage project and denies production identity reuse", () => {
    const authorization = assertTask1cStageV1LinkageAuthorization({
      projectRef: "yfmklapgjrupctgxaako",
      denyProjectRef: "gcpdffkgsdomzyoenalg",
      supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
      apply: false,
    });

    expect(authorization.mode).toBe("dry_run");
    expect(authorization.productionDenied).toBe(true);
    expect(authorization.supabaseUrlHost).toBe("yfmklapgjrupctgxaako.supabase.co");
  });

  it("rejects production ref reuse, URL mismatch, and missing target identity", () => {
    expect(() =>
      assertTask1cStageV1LinkageAuthorization({
        projectRef: "gcpdffkgsdomzyoenalg",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://gcpdffkgsdomzyoenalg.supabase.co",
        apply: false,
      }),
    ).toThrow(/unauthorized project ref/i);

    expect(() =>
      assertTask1cStageV1LinkageAuthorization({
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://gcpdffkgsdomzyoenalg.supabase.co",
        apply: false,
      }),
    ).toThrow(/mismatched --project-ref/i);

    expect(() =>
      assertTask1cStageV1LinkageAuthorization({
        projectRef: "",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        apply: false,
      }),
    ).toThrow(/requires --project-ref/i);
  });

  it("validates the exact 24-fixture manifest, match-number range, and approved package checksum", () => {
    const workspace = prepareManifestWorkspace();
    const validated = validateTask1cStageV1FixtureLinkageManifest({
      sourceManifestPath: workspace.manifestPath,
      packageSha256: workspace.packageSha256,
    });

    expect(validated.manifest.fixtures).toHaveLength(24);
    expect(validated.manifest.sourceScope.matchNumbers).toEqual(Array.from({ length: 24 }, (_, index) => index + 49));
    expect(validated.packageSha256).toBe(workspace.packageSha256);
  });

  it("rejects duplicate manifest identities and out-of-range selection drift", () => {
    const duplicateSlugWorkspace = prepareManifestWorkspace((manifest) => ({
      ...manifest,
      fixtures: [
        manifest.fixtures[0]!,
        { ...manifest.fixtures[1]!, canonicalSlug: manifest.fixtures[0]!.canonicalSlug },
        ...manifest.fixtures.slice(2),
      ],
    }));

    expect(() =>
      validateTask1cStageV1FixtureLinkageManifest({
        sourceManifestPath: duplicateSlugWorkspace.manifestPath,
        packageSha256: duplicateSlugWorkspace.packageSha256,
      }),
    ).toThrow(/duplicate canonical slug/i);

    const missingFixtureWorkspace = prepareManifestWorkspace((manifest) => ({
      ...manifest,
      fixtures: manifest.fixtures.slice(0, 23),
      sourceScope: {
        ...manifest.sourceScope,
        matchNumbers: manifest.sourceScope.matchNumbers.slice(0, 23),
      },
    }));

    expect(() =>
      validateTask1cStageV1FixtureLinkageManifest({
        sourceManifestPath: missingFixtureWorkspace.manifestPath,
        packageSha256: missingFixtureWorkspace.packageSha256,
      }),
    ).toThrow(/exact canonical Matchday 3 allowlist|exactly 24 fixtures/i);
  });

  it("produces 24 update_linkage actions on the first plan and excludes Colombia vs Congo DR from scope", () => {
    const workspace = prepareManifestWorkspace();
    const manifestValidation = validateTask1cStageV1FixtureLinkageManifest({
      sourceManifestPath: workspace.manifestPath,
      packageSha256: workspace.packageSha256,
    });
    const plan = planTask1cStageV1FixtureLinkage({
      authorization: assertTask1cStageV1LinkageAuthorization({
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        apply: false,
      }),
      manifestValidation,
      providerLookups: buildProviderLookups(manifestValidation.manifest),
      snapshot: buildSnapshot(manifestValidation.manifest, { includeOutOfScopeColombia: true }),
    });

    expect(plan.selectedFixtureCount).toBe(24);
    expect(plan.summary.updateLinkage).toBe(24);
    expect(plan.summary.alreadyLinked).toBe(0);
    expect(plan.summary.blockedConflict).toBe(0);
    expect(plan.summary.blockedMissing).toBe(0);
    expect(plan.summary.blockedDuplicate).toBe(0);
    expect(plan.summary.outOfScopeRows).toBe(1);
    expect(plan.selectedSlugs).not.toContain("world-cup-2026-colombia-vs-congo-dr-2026-06-24");
  });

  it("produces 24 already_linked actions on the second plan for idempotency", () => {
    const workspace = prepareManifestWorkspace();
    const manifestValidation = validateTask1cStageV1FixtureLinkageManifest({
      sourceManifestPath: workspace.manifestPath,
      packageSha256: workspace.packageSha256,
    });
    const plan = planTask1cStageV1FixtureLinkage({
      authorization: assertTask1cStageV1LinkageAuthorization({
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        apply: false,
      }),
      manifestValidation,
      providerLookups: buildProviderLookups(manifestValidation.manifest),
      snapshot: buildSnapshot(manifestValidation.manifest, { alreadyLinked: true }),
    });

    expect(plan.summary.updateLinkage).toBe(0);
    expect(plan.summary.alreadyLinked).toBe(24);
    expect(plan.rows.every((row) => row.action === "already_linked")).toBe(true);
  });

  it("rejects provider identity mismatches, missing rows, duplicate rows, and conflicting external ids without any create path", () => {
    const workspace = prepareManifestWorkspace();
    const manifestValidation = validateTask1cStageV1FixtureLinkageManifest({
      sourceManifestPath: workspace.manifestPath,
      packageSha256: workspace.packageSha256,
    });
    const firstFixture = manifestValidation.manifest.fixtures[0]!;
    const secondFixture = manifestValidation.manifest.fixtures[1]!;
    const thirdFixture = manifestValidation.manifest.fixtures[2]!;
    const fourthFixture = manifestValidation.manifest.fixtures[3]!;
    const snapshot = buildSnapshot(manifestValidation.manifest, {
      duplicateFixtureSlug: thirdFixture.canonicalSlug,
      conflictingExternalSlug: fourthFixture.canonicalSlug,
    });
    snapshot.matches = snapshot.matches.filter((match) => match.slug !== secondFixture.canonicalSlug);

    const providerLookups = buildProviderLookups(manifestValidation.manifest).map((lookup) =>
      lookup.fixtureId === firstFixture.apiFootballFixtureId
        ? {
            ...lookup,
            providerFixture: buildProviderFixture(firstFixture, {
              awayTeam: { providerTeamId: 999, name: "wrong-team", winner: null },
            }),
          }
        : lookup,
    );

    const plan = planTask1cStageV1FixtureLinkage({
      authorization: assertTask1cStageV1LinkageAuthorization({
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        apply: false,
      }),
      manifestValidation,
      providerLookups,
      snapshot,
    });

    expect(plan.rows.find((row) => row.slug === firstFixture.canonicalSlug)?.action).toBe("blocked_conflict");
    expect(plan.rows.find((row) => row.slug === secondFixture.canonicalSlug)?.action).toBe("blocked_missing");
    expect(plan.rows.find((row) => row.slug === thirdFixture.canonicalSlug)?.action).toBe("blocked_duplicate");
    expect(plan.rows.find((row) => row.slug === fourthFixture.canonicalSlug)?.action).toBe("blocked_conflict");
    expect(plan.summary.creates).toBe(0);
    expect(plan.summary.deletes).toBe(0);
  });

  it("writes a complete dry-run artifact with stable checksum and zero-write confirmation", async () => {
    const workspace = prepareManifestWorkspace();
    const artifactDir = registerCleanup(path.join(os.tmpdir(), `task1c-linkage-artifacts-${Date.now()}`));
    const result = await runTask1cStageV1FixtureLinkage(
      {
        repoRoot: process.cwd(),
        artifactsDir: artifactDir,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        sourceManifestPath: workspace.manifestPath,
        packageSha256: workspace.packageSha256,
      },
      {
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest, { includeOutOfScopeColombia: true });
          },
          async rereadMatchesByIds() {
            return [];
          },
          async applyMatchLinkageBatch() {
            throw new Error("dry-run should not write");
          },
        },
        providerReader: {
          async readFixtureById(fixtureId) {
            return buildDetailedProviderResult(
              buildProviderFixture(workspace.manifest.fixtures.find((fixture) => fixture.apiFootballFixtureId === fixtureId)!),
            );
          },
        },
      },
    );

    const artifact = JSON.parse(fs.readFileSync(result.artifactPath, "utf8")) as { stablePlanSha256: string; zeroWriteConfirmation: boolean; rows: unknown[] };
    expect(fs.existsSync(result.artifactPath)).toBe(true);
    expect(artifact.zeroWriteConfirmation).toBe(true);
    expect(artifact.rows).toHaveLength(24);
    expect(artifact.stablePlanSha256).toBe(result.plan.stablePlanSha256);
    expect(result.plan.rows[0]?.stageIdentityEvidence.observedFields?.labStatus).toBe("ready");
    expect(result.plan.rows[0]?.stageIdentityEvidence.observedFields?.dataQuality).toBe("verified");
    expect(result.plan.outOfScopeEvidence).toEqual([
      {
        slug: "world-cup-2026-colombia-vs-congo-dr-2026-06-24",
        providerFixtureId: 1539008,
        reason: "matchday_2_outside_task1c_scope",
        selected: false,
        actionEligible: false,
        applyEligible: false,
        patchPresent: false,
      },
    ]);
  });

  it("emits exactly one checksum-bound Task 1C out-of-scope boundary record without widening the 24-row plan", () => {
    const workspace = prepareManifestWorkspace();
    const manifestValidation = validateTask1cStageV1FixtureLinkageManifest({
      sourceManifestPath: workspace.manifestPath,
      packageSha256: workspace.packageSha256,
    });

    const plan = planTask1cStageV1FixtureLinkage({
      authorization: assertTask1cStageV1LinkageAuthorization({
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        apply: false,
      }),
      manifestValidation,
      providerLookups: buildProviderLookups(manifestValidation.manifest),
      snapshot: buildSnapshot(manifestValidation.manifest),
    });

    expect(plan.selectedFixtureCount).toBe(24);
    expect(plan.summary.updateLinkage).toBe(24);
    expect(plan.outOfScopeEvidence).toEqual([
      {
        slug: "world-cup-2026-colombia-vs-congo-dr-2026-06-24",
        providerFixtureId: 1539008,
        reason: "matchday_2_outside_task1c_scope",
        selected: false,
        actionEligible: false,
        applyEligible: false,
        patchPresent: false,
      },
    ]);
    expect(plan.selectedSlugs).not.toContain("world-cup-2026-colombia-vs-congo-dr-2026-06-24");
    expect(plan.selectedProviderFixtureIds).not.toContain(1539008);
    expect(plan.rows.some((row) => row.slug === "world-cup-2026-colombia-vs-congo-dr-2026-06-24")).toBe(false);
    expect(plan.rows.some((row) => row.providerFixtureId === 1539008)).toBe(false);
  });

  it("executes provider requests sequentially in deterministic match-number order with bounded concurrency one", async () => {
    const workspace = prepareManifestWorkspace();
    const requestedFixtureIds: number[] = [];
    let activeRequests = 0;
    let maxConcurrentRequests = 0;

    await runTask1cStageV1FixtureLinkage(
      {
        repoRoot: process.cwd(),
        artifactsDir: registerCleanup(path.join(os.tmpdir(), `task1c-linkage-order-${Date.now()}`)),
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        sourceManifestPath: workspace.manifestPath,
        packageSha256: workspace.packageSha256,
      },
      {
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds() {
            return [];
          },
          async applyMatchLinkageBatch() {
            throw new Error("not reached");
          },
        },
        providerReader: {
          async readFixtureById(fixtureId) {
            requestedFixtureIds.push(fixtureId);
            activeRequests += 1;
            maxConcurrentRequests = Math.max(maxConcurrentRequests, activeRequests);
            await Promise.resolve();
            activeRequests -= 1;
            return buildDetailedProviderResult(
              buildProviderFixture(workspace.manifest.fixtures.find((fixture) => fixture.apiFootballFixtureId === fixtureId)!),
            );
          },
        },
      },
    );

    expect(maxConcurrentRequests).toBe(1);
    expect(requestedFixtureIds).toEqual(workspace.manifest.fixtures.map((fixture) => fixture.apiFootballFixtureId));
    expect(requestedFixtureIds).not.toContain(1539008);
  });

  it("retries transient 429 responses and records typed provider evidence without leaking secrets", async () => {
    const workspace = prepareManifestWorkspace();
    let attemptCountForFixture49 = 0;
    const result = await runTask1cStageV1FixtureLinkage(
      {
        repoRoot: process.cwd(),
        artifactsDir: registerCleanup(path.join(os.tmpdir(), `task1c-linkage-429-${Date.now()}`)),
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        sourceManifestPath: workspace.manifestPath,
        packageSha256: workspace.packageSha256,
      },
      {
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds() {
            return [];
          },
          async applyMatchLinkageBatch() {
            throw new Error("not reached");
          },
        },
        providerReader: {
          async readFixtureById(fixtureId) {
            const fixture = workspace.manifest.fixtures.find((row) => row.apiFootballFixtureId === fixtureId)!;
            if (fixture.matchNumber === 49) {
              attemptCountForFixture49 += 1;
            }
            if (fixture.matchNumber === 49 && attemptCountForFixture49 === 1) {
              return buildDetailedProviderResult(null, {
                httpStatus: 429,
                retryAfterSeconds: 0,
                errorCode: "rate_limited",
                errorMessage: "too many requests token SECRET_TOKEN_ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                failureKind: "http_error",
                diagnostics: {
                  endpoint: "/fixtures",
                  query: { id: String(fixtureId) },
                  results: 0,
                  errors: ["too many requests"],
                  paging: null,
                },
              });
            }

            return buildDetailedProviderResult(buildProviderFixture(fixture));
          },
        },
      },
    );

    const row = result.plan.rows.find((entry) => entry.matchNumber === 49)!;
    expect(attemptCountForFixture49).toBe(2);
    expect(row.providerIdentityEvidence?.attemptCount).toBe(2);
    expect(row.providerIdentityEvidence?.verificationStatus).toBe("provider_verified");
    expect(JSON.stringify(result.plan)).not.toContain("SECRET_TOKEN");
  });

  it("classifies persistent transient failures, auth failures, not found, and invalid responses as blocked conflicts", async () => {
    const workspace = prepareManifestWorkspace();
    const result = await runTask1cStageV1FixtureLinkage(
      {
        repoRoot: process.cwd(),
        artifactsDir: registerCleanup(path.join(os.tmpdir(), `task1c-linkage-failures-${Date.now()}`)),
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        sourceManifestPath: workspace.manifestPath,
        packageSha256: workspace.packageSha256,
      },
      {
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds() {
            return [];
          },
          async applyMatchLinkageBatch() {
            throw new Error("not reached");
          },
        },
        providerReader: {
          async readFixtureById(fixtureId) {
            const fixture = workspace.manifest.fixtures.find((row) => row.apiFootballFixtureId === fixtureId)!;
            if (fixture.matchNumber === 49) {
              return buildDetailedProviderResult(null, {
                httpStatus: 429,
                errorCode: "rate_limited",
                errorMessage: "too many requests",
                failureKind: "http_error",
              });
            }
            if (fixture.matchNumber === 50) {
              return buildDetailedProviderResult(null, {
                httpStatus: 401,
                errorCode: "auth_failed",
                errorMessage: "invalid key",
                failureKind: "http_error",
              });
            }
            if (fixture.matchNumber === 51) {
              return buildDetailedProviderResult(null, {
                httpStatus: 404,
                errorCode: "not_found",
                errorMessage: "fixture not found",
                failureKind: "http_error",
              });
            }
            if (fixture.matchNumber === 52) {
              return buildDetailedProviderResult(null, {
                httpStatus: 200,
                errorCode: "response_invalid",
                errorMessage: "invalid payload",
                failureKind: "response_invalid",
              });
            }
            if (fixture.matchNumber === 53) {
              return buildDetailedProviderResult(null, {
                httpStatus: null,
                errorCode: "transport_error",
                errorMessage: "socket hang up",
                failureKind: "transport_error",
              });
            }
            if (fixture.matchNumber === 54) {
              return buildDetailedProviderResult(null, {
                httpStatus: 503,
                errorCode: "server_error",
                errorMessage: "service unavailable",
                failureKind: "http_error",
              });
            }

            return buildDetailedProviderResult(buildProviderFixture(fixture));
          },
        },
      },
    );

    expect(result.plan.rows.find((row) => row.matchNumber === 49)?.providerIdentityEvidence?.verificationStatus).toBe("provider_rate_limited");
    expect(result.plan.rows.find((row) => row.matchNumber === 50)?.providerIdentityEvidence?.verificationStatus).toBe("provider_auth_failed");
    expect(result.plan.rows.find((row) => row.matchNumber === 51)?.providerIdentityEvidence?.verificationStatus).toBe("provider_not_found");
    expect(result.plan.rows.find((row) => row.matchNumber === 52)?.providerIdentityEvidence?.verificationStatus).toBe("provider_response_invalid");
    expect(result.plan.rows.find((row) => row.matchNumber === 53)?.providerIdentityEvidence?.verificationStatus).toBe("provider_transport_failed");
    expect(result.plan.rows.find((row) => row.matchNumber === 54)?.providerIdentityEvidence?.verificationStatus).toBe("provider_server_failed");
    expect(result.plan.rows.slice(0, 6).every((row) => row.action === "blocked_conflict")).toBe(true);
  });

  it("requires a reviewed allowlist artifact before apply", async () => {
    const workspace = prepareManifestWorkspace();
    await expect(
      runTask1cStageV1FixtureLinkage(
        {
          repoRoot: process.cwd(),
          artifactsDir: registerCleanup(path.join(os.tmpdir(), `task1c-linkage-apply-${Date.now()}`)),
          projectRef: "yfmklapgjrupctgxaako",
          denyProjectRef: "gcpdffkgsdomzyoenalg",
          supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
          sourceManifestPath: workspace.manifestPath,
          packageSha256: workspace.packageSha256,
          apply: true,
        },
        {
          databaseAdapter: {
            async readSnapshot() {
              return buildSnapshot(workspace.manifest);
            },
            async rereadMatchesByIds() {
              return [];
            },
            async applyMatchLinkageBatch() {
              throw new Error("not reached");
            },
          },
          providerReader: {
            async readFixtureById(fixtureId) {
              return buildDetailedProviderResult(
                buildProviderFixture(workspace.manifest.fixtures.find((fixture) => fixture.apiFootballFixtureId === fixtureId)!),
              );
            },
          },
        },
      ),
    ).rejects.toThrow(/requires --allowlist-manifest/i);
  });

  it("rejects apply artifact tampering outside external_id and intake_source", async () => {
    const workspace = prepareManifestWorkspace();
    const dryRunDir = registerCleanup(path.join(os.tmpdir(), `task1c-linkage-dry-run-${Date.now()}`));
    const dryRun = await runTask1cStageV1FixtureLinkage(
      {
        repoRoot: process.cwd(),
        artifactsDir: dryRunDir,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        sourceManifestPath: workspace.manifestPath,
        packageSha256: workspace.packageSha256,
      },
      {
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds() {
            return [];
          },
          async applyMatchLinkageBatch() {
            throw new Error("not reached");
          },
        },
        providerReader: {
          async readFixtureById(fixtureId) {
            return buildDetailedProviderResult(
              buildProviderFixture(workspace.manifest.fixtures.find((fixture) => fixture.apiFootballFixtureId === fixtureId)!),
            );
          },
        },
      },
    );

    const tamperedArtifactPath = path.join(dryRunDir, "tampered-allowlist.json");
    const tampered = structuredClone(dryRun.plan);
    tampered.rows[0]!.exactProposedPatch = {
      ...tampered.rows[0]!.exactProposedPatch!,
      kickoff_at: "2026-06-24T22:05:00Z",
      stage: "Group Stage - 99",
      status: "live",
      source_note: "tampered",
      access_scope: "public",
      lab_status: "review",
      data_quality: "rejected",
    } as unknown as typeof tampered.rows[0]["exactProposedPatch"];
    fs.writeFileSync(tamperedArtifactPath, `${JSON.stringify(tampered, null, 2)}\n`, "utf8");

    await expect(
      applyTask1cStageV1FixtureLinkagePlan({
        authorization: assertTask1cStageV1LinkageAuthorization({
          projectRef: "yfmklapgjrupctgxaako",
          denyProjectRef: "gcpdffkgsdomzyoenalg",
          supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
          apply: true,
        }),
        currentPlan: {
          ...dryRun.plan,
          mode: "apply",
        },
        reviewArtifact: JSON.parse(fs.readFileSync(tamperedArtifactPath, "utf8")),
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds() {
            return [];
          },
          async applyMatchLinkageBatch() {
            throw new Error("not reached");
          },
        },
      }),
    ).rejects.toThrow(/may only contain external_id and intake_source/i);
  });

  it("revalidates exact pre-apply state and writes only reviewed linkage fields", async () => {
    const workspace = prepareManifestWorkspace();
    const dryRun = await runTask1cStageV1FixtureLinkage(
      {
        repoRoot: process.cwd(),
        artifactsDir: registerCleanup(path.join(os.tmpdir(), `task1c-linkage-review-${Date.now()}`)),
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        sourceManifestPath: workspace.manifestPath,
        packageSha256: workspace.packageSha256,
      },
      {
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds() {
            return [];
          },
          async applyMatchLinkageBatch() {
            throw new Error("not reached");
          },
        },
        providerReader: {
          async readFixtureById(fixtureId) {
            return buildDetailedProviderResult(
              buildProviderFixture(workspace.manifest.fixtures.find((fixture) => fixture.apiFootballFixtureId === fixtureId)!),
            );
          },
        },
      },
    );

    const reviewedArtifact = structuredClone(dryRun.plan);
    const driftedRow = buildSnapshot(workspace.manifest).matches.map((match) =>
      match.id === "match-49" ? { ...match, external_id: "api-football:fixture:9999000" } : match,
    );
    await expect(
      applyTask1cStageV1FixtureLinkagePlan({
        authorization: assertTask1cStageV1LinkageAuthorization({
          projectRef: "yfmklapgjrupctgxaako",
          denyProjectRef: "gcpdffkgsdomzyoenalg",
          supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
          apply: true,
        }),
        currentPlan: {
          ...dryRun.plan,
          mode: "apply",
        },
        reviewArtifact: reviewedArtifact,
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds() {
            return driftedRow;
          },
          async applyMatchLinkageBatch() {
            throw new Error("not reached");
          },
        },
      }),
    ).rejects.toThrow(/drifted before apply/i);

    const writes: Array<
      Array<{
        stageMatchId: string;
        expectedExternalId: string | null;
        expectedIntakeSource: string | null;
        patch: Record<string, unknown>;
      }>
    > = [];
    await applyTask1cStageV1FixtureLinkagePlan({
      authorization: assertTask1cStageV1LinkageAuthorization({
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        apply: true,
      }),
      currentPlan: {
        ...dryRun.plan,
        mode: "apply",
      },
      reviewArtifact: reviewedArtifact,
      databaseAdapter: {
        async readSnapshot() {
          return buildSnapshot(workspace.manifest);
        },
        async rereadMatchesByIds(matchIds) {
          return buildSnapshot(workspace.manifest).matches.filter((match) => matchIds.includes(match.id));
        },
        async applyMatchLinkageBatch(rows) {
          writes.push(rows);
          return {
            requestedCount: rows.length,
            updatedCount: rows.length,
          };
        },
      },
    });

    expect(writes).toHaveLength(1);
    expect(writes[0]).toHaveLength(24);
    expect(Object.keys(writes[0]![0]!.patch).sort()).toEqual(["external_id", "intake_source"]);
  });

  it("rejects reviewed artifact tampering when the out-of-scope evidence record is removed or altered", async () => {
    const workspace = prepareManifestWorkspace();
    const dryRun = await runTask1cStageV1FixtureLinkage(
      {
        repoRoot: process.cwd(),
        artifactsDir: registerCleanup(path.join(os.tmpdir(), `task1c-linkage-out-of-scope-${Date.now()}`)),
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        sourceManifestPath: workspace.manifestPath,
        packageSha256: workspace.packageSha256,
      },
      {
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds(matchIds) {
            return buildSnapshot(workspace.manifest).matches.filter((match) => matchIds.includes(match.id));
          },
          async applyMatchLinkageBatch() {
            throw new Error("not reached");
          },
        },
        providerReader: {
          async readFixtureById(fixtureId) {
            if (fixtureId === 1539008) {
              throw new Error("out-of-scope fixture must not be requested");
            }
            return buildDetailedProviderResult(
              buildProviderFixture(workspace.manifest.fixtures.find((fixture) => fixture.apiFootballFixtureId === fixtureId)!),
            );
          },
        },
      },
    );

    const makeTamperedArtifact = (
      mutate: (artifact: typeof dryRun.plan) => void,
    ): typeof dryRun.plan => {
      const artifact = structuredClone(dryRun.plan);
      mutate(artifact);
      return artifact;
    };

    const removedEvidence = makeTamperedArtifact((artifact) => {
      artifact.outOfScopeEvidence = [];
    });
    expect(sha256Json(buildStablePlanPayload(removedEvidence))).not.toBe(dryRun.plan.stablePlanSha256);
    await expect(
      applyTask1cStageV1FixtureLinkagePlan({
        authorization: assertTask1cStageV1LinkageAuthorization({
          projectRef: "yfmklapgjrupctgxaako",
          denyProjectRef: "gcpdffkgsdomzyoenalg",
          supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
          apply: true,
        }),
        currentPlan: {
          ...dryRun.plan,
          mode: "apply",
        },
        reviewArtifact: removedEvidence,
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds() {
            return [];
          },
          async applyMatchLinkageBatch() {
            throw new Error("not reached");
          },
        },
      }),
    ).rejects.toThrow(/stable plan checksum did not match its contents|out-of-scope evidence/i);

    const cases: Array<{
      label: string;
      mutate: (artifact: typeof dryRun.plan) => void;
      error: RegExp;
    }> = [
      {
        label: "tampering with slug is rejected",
        mutate: (artifact) => {
          artifact.outOfScopeEvidence[0]!.slug = "world-cup-2026-colombia-vs-brazil-2026-06-24";
        },
        error: /out-of-scope boundary evidence record was tampered|stable plan checksum did not match its contents/i,
      },
      {
        label: "tampering with provider fixture id is rejected",
        mutate: (artifact) => {
          artifact.outOfScopeEvidence[0]!.providerFixtureId = 9999999;
        },
        error: /out-of-scope boundary evidence record was tampered|stable plan checksum did not match its contents/i,
      },
      {
        label: "actionEligible true is rejected",
        mutate: (artifact) => {
          artifact.outOfScopeEvidence[0]!.actionEligible = true as false;
        },
        error: /out-of-scope boundary evidence record was tampered|stable plan checksum did not match its contents/i,
      },
      {
        label: "applyEligible true is rejected",
        mutate: (artifact) => {
          artifact.outOfScopeEvidence[0]!.applyEligible = true as false;
        },
        error: /out-of-scope boundary evidence record was tampered|stable plan checksum did not match its contents/i,
      },
      {
        label: "patchPresent true is rejected",
        mutate: (artifact) => {
          artifact.outOfScopeEvidence[0]!.patchPresent = true as false;
        },
        error: /out-of-scope boundary evidence record was tampered|stable plan checksum did not match its contents/i,
      },
      {
        label: "excluded slug cannot appear in selected fixtures",
        mutate: (artifact) => {
          artifact.selectedSlugs[0] = "world-cup-2026-colombia-vs-congo-dr-2026-06-24";
        },
        error: /excluded Matchday 2 slug appeared in selected slugs|stable plan checksum did not match its contents/i,
      },
      {
        label: "provider fixture 1539008 cannot appear in the Matchday 3 allowlist",
        mutate: (artifact) => {
          artifact.selectedProviderFixtureIds[0] = 1539008;
        },
        error: /excluded Matchday 2 provider fixture appeared in the Matchday 3 provider allowlist|stable plan checksum did not match its contents/i,
      },
    ];

    for (const testCase of cases) {
      const tampered = makeTamperedArtifact(testCase.mutate);
      await expect(
        applyTask1cStageV1FixtureLinkagePlan({
          authorization: assertTask1cStageV1LinkageAuthorization({
            projectRef: "yfmklapgjrupctgxaako",
            denyProjectRef: "gcpdffkgsdomzyoenalg",
            supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
            apply: true,
          }),
          currentPlan: {
            ...dryRun.plan,
            mode: "apply",
          },
          reviewArtifact: tampered,
          databaseAdapter: {
            async readSnapshot() {
              return buildSnapshot(workspace.manifest);
            },
            async rereadMatchesByIds() {
              return [];
            },
            async applyMatchLinkageBatch() {
              throw new Error("not reached");
            },
          },
        }),
        testCase.label,
      ).rejects.toThrow(testCase.error);
    }
  });

  it("treats an ambiguous atomic batch failure as recovered success when all rows reread as post-apply", async () => {
    const workspace = prepareManifestWorkspace();
    const dryRun = await runTask1cStageV1FixtureLinkage(
      {
        repoRoot: process.cwd(),
        artifactsDir: registerCleanup(path.join(os.tmpdir(), `task1c-linkage-atomic-success-${Date.now()}`)),
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        sourceManifestPath: workspace.manifestPath,
        packageSha256: workspace.packageSha256,
      },
      {
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds() {
            return [];
          },
          async applyMatchLinkageBatch() {
            throw new Error("not reached");
          },
        },
        providerReader: {
          async readFixtureById(fixtureId) {
            return buildDetailedProviderResult(
              buildProviderFixture(workspace.manifest.fixtures.find((fixture) => fixture.apiFootballFixtureId === fixtureId)!),
            );
          },
        },
      },
    );

    let rereadCount = 0;
    await expect(
      applyTask1cStageV1FixtureLinkagePlan({
        authorization: assertTask1cStageV1LinkageAuthorization({
          projectRef: "yfmklapgjrupctgxaako",
          denyProjectRef: "gcpdffkgsdomzyoenalg",
          supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
          apply: true,
        }),
        currentPlan: {
          ...dryRun.plan,
          mode: "apply",
        },
        reviewArtifact: structuredClone(dryRun.plan),
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds(matchIds) {
            rereadCount += 1;
            if (rereadCount === 1) {
              return buildSnapshot(workspace.manifest).matches.filter((match) => matchIds.includes(match.id));
            }

            return buildSnapshot(workspace.manifest, { alreadyLinked: true }).matches.filter((match) => matchIds.includes(match.id));
          },
          async applyMatchLinkageBatch() {
            throw new Error("simulated transport timeout");
          },
        },
      }),
    ).resolves.toBeUndefined();

    expect(rereadCount).toBe(2);
  });

  it("reports safe retry when an atomic batch failure leaves all rows in pre-apply state", async () => {
    const workspace = prepareManifestWorkspace();
    const dryRun = await runTask1cStageV1FixtureLinkage(
      {
        repoRoot: process.cwd(),
        artifactsDir: registerCleanup(path.join(os.tmpdir(), `task1c-linkage-atomic-pre-${Date.now()}`)),
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        sourceManifestPath: workspace.manifestPath,
        packageSha256: workspace.packageSha256,
      },
      {
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds() {
            return [];
          },
          async applyMatchLinkageBatch() {
            throw new Error("not reached");
          },
        },
        providerReader: {
          async readFixtureById(fixtureId) {
            return buildDetailedProviderResult(
              buildProviderFixture(workspace.manifest.fixtures.find((fixture) => fixture.apiFootballFixtureId === fixtureId)!),
            );
          },
        },
      },
    );

    await expect(
      applyTask1cStageV1FixtureLinkagePlan({
        authorization: assertTask1cStageV1LinkageAuthorization({
          projectRef: "yfmklapgjrupctgxaako",
          denyProjectRef: "gcpdffkgsdomzyoenalg",
          supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
          apply: true,
        }),
        currentPlan: {
          ...dryRun.plan,
          mode: "apply",
        },
        reviewArtifact: structuredClone(dryRun.plan),
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds(matchIds) {
            return buildSnapshot(workspace.manifest).matches.filter((match) => matchIds.includes(match.id));
          },
          async applyMatchLinkageBatch() {
            throw new Error("simulated transport timeout");
          },
        },
      }),
    ).rejects.toThrow(/safe to retry the same reviewed artifact/i);
  });

  it("fails closed when an atomic batch failure leaves a mixed reread state", async () => {
    const workspace = prepareManifestWorkspace();
    const dryRun = await runTask1cStageV1FixtureLinkage(
      {
        repoRoot: process.cwd(),
        artifactsDir: registerCleanup(path.join(os.tmpdir(), `task1c-linkage-atomic-mixed-${Date.now()}`)),
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        sourceManifestPath: workspace.manifestPath,
        packageSha256: workspace.packageSha256,
      },
      {
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds() {
            return [];
          },
          async applyMatchLinkageBatch() {
            throw new Error("not reached");
          },
        },
        providerReader: {
          async readFixtureById(fixtureId) {
            return buildDetailedProviderResult(
              buildProviderFixture(workspace.manifest.fixtures.find((fixture) => fixture.apiFootballFixtureId === fixtureId)!),
            );
          },
        },
      },
    );

    const mixedRows = buildSnapshot(workspace.manifest).matches.map((match, index) => {
      if (index === 0) {
        return {
          ...match,
          external_id: "api-football:fixture:1539009",
          intake_source: "api_football" as const,
        };
      }

      return match;
    });

    let rereadCount = 0;
    await expect(
      applyTask1cStageV1FixtureLinkagePlan({
        authorization: assertTask1cStageV1LinkageAuthorization({
          projectRef: "yfmklapgjrupctgxaako",
          denyProjectRef: "gcpdffkgsdomzyoenalg",
          supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
          apply: true,
        }),
        currentPlan: {
          ...dryRun.plan,
          mode: "apply",
        },
        reviewArtifact: structuredClone(dryRun.plan),
        databaseAdapter: {
          async readSnapshot() {
            return buildSnapshot(workspace.manifest);
          },
          async rereadMatchesByIds(matchIds) {
            rereadCount += 1;
            if (rereadCount === 1) {
              return buildSnapshot(workspace.manifest).matches.filter((match) => matchIds.includes(match.id));
            }

            return mixedRows.filter((match) => matchIds.includes(match.id));
          },
          async applyMatchLinkageBatch() {
            throw new Error("simulated transport timeout");
          },
        },
      }),
    ).rejects.toThrow(/manual reconciliation required before retry/i);
  });

  it("supports zero-update idempotent apply plans when the reviewed artifact is already_linked", async () => {
    const workspace = prepareManifestWorkspace();
    const manifestValidation = validateTask1cStageV1FixtureLinkageManifest({
      sourceManifestPath: workspace.manifestPath,
      packageSha256: workspace.packageSha256,
    });
    const alreadyLinkedPlan = planTask1cStageV1FixtureLinkage({
      authorization: assertTask1cStageV1LinkageAuthorization({
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        apply: false,
      }),
      manifestValidation,
      providerLookups: buildProviderLookups(manifestValidation.manifest),
      snapshot: buildSnapshot(manifestValidation.manifest, { alreadyLinked: true }),
    });

    const writes: unknown[] = [];
    await applyTask1cStageV1FixtureLinkagePlan({
      authorization: assertTask1cStageV1LinkageAuthorization({
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
        apply: true,
      }),
      currentPlan: {
        ...alreadyLinkedPlan,
        mode: "apply",
      },
      reviewArtifact: alreadyLinkedPlan,
      databaseAdapter: {
        async readSnapshot() {
          return buildSnapshot(manifestValidation.manifest, { alreadyLinked: true });
        },
        async rereadMatchesByIds() {
          return [];
        },
        async applyMatchLinkageBatch(rows) {
          writes.push(rows);
          return {
            requestedCount: rows.length,
            updatedCount: rows.length,
          };
        },
      },
    });

    expect(writes).toHaveLength(0);
  });
});
