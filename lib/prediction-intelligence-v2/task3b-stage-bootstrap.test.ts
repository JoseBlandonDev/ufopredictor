import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  type RemoteState,
  assertStageBootstrapAuthorization,
  planStageBootstrap,
  verifyPreparedSources,
} from "./task3b-stage-bootstrap";
import { resolveDefaultPreparedPaths } from "./task1";

const repoRoot = process.cwd();
const defaults = resolveDefaultPreparedPaths(repoRoot, path.join("local-run", "task3b-test"));
const cleanupPaths = new Set<string>();
const originalEnv = { ...process.env };

function registerCleanup(targetPath: string) {
  cleanupPaths.add(targetPath);
  return targetPath;
}

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(originalEnv)) {
    if (value == null) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function makePreparedCopy(): string {
  const target = registerCleanup(path.join(os.tmpdir(), `task3b-stage-bootstrap-${Date.now()}-${Math.random().toString(16).slice(2)}`));
  fs.cpSync(defaults.preparedDir, target, { recursive: true });
  return target;
}

function buildEmptyRemoteState(): RemoteState {
  return {
    tableCounts: {
      competitions: 0,
      seasons: 0,
      teams: 0,
      venues: 0,
      matches: 0,
      source_snapshots: 0,
      canonical_team_aliases: 0,
      canonical_team_localizations: 0,
      canonical_team_links: 0,
      team_rating_snapshots: 0,
      historical_match_facts: 0,
      schedule_snapshots: 0,
      world_cup_venue_catalog: 0,
      official_schedule_matches: 0,
      official_schedule_match_links: 0,
    },
    competitions: [],
    seasons: [],
    teams: [],
    venues: [],
    matches: [],
    sourceSnapshots: [],
    canonicalTeamAliases: [],
    canonicalTeamLocalizations: [],
    canonicalTeamLinks: [],
    teamRatingSnapshots: [],
    historicalMatchFacts: [],
    scheduleSnapshots: [],
    worldCupVenueCatalog: [],
    officialScheduleMatches: [],
    officialScheduleMatchLinks: [],
    authUsers: [{ id: "user-1", email: "ufopredictor@gmail.com" }],
    profiles: [{ id: "user-1", email: "ufopredictor@gmail.com", role: "admin" }],
    migrationHistory: {
      status: "verified_count",
      count: 2,
      externallyVerifiedExpectedCount: 46,
      detail: "test",
    },
  };
}

afterEach(() => {
  restoreEnv();
  for (const targetPath of cleanupPaths) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
  cleanupPaths.clear();
});

describe("task3b stage bootstrap", () => {
  it("accepts the stage project and development dry-run authorization", () => {
    process.env.PREDICTION_INTELLIGENCE_TARGET = "development";
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "false";

    const authorization = assertStageBootstrapAuthorization({
      projectRef: "yfmklapgjrupctgxaako",
      denyProjectRef: "gcpdffkgsdomzyoenalg",
      expectedMigrationCount: 46,
      acceptExternalMigrationVerification: false,
      dryRun: true,
      apply: false,
      supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
    });

    expect(authorization.mode).toBe("dry_run");
    expect(authorization.productionDenied).toBe(true);
    expect(authorization.supabaseUrlHost).toBe("yfmklapgjrupctgxaako.supabase.co");
  });

  it("denies production refs, unknown refs, and URL/ref mismatches", () => {
    process.env.PREDICTION_INTELLIGENCE_TARGET = "development";
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "false";

    expect(() =>
      assertStageBootstrapAuthorization({
        projectRef: "gcpdffkgsdomzyoenalg",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        expectedMigrationCount: 46,
        acceptExternalMigrationVerification: false,
        dryRun: true,
        apply: false,
        supabaseUrl: "https://gcpdffkgsdomzyoenalg.supabase.co",
      }),
    ).toThrow();

    expect(() =>
      assertStageBootstrapAuthorization({
        projectRef: "unknown-project",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        expectedMigrationCount: 46,
        acceptExternalMigrationVerification: false,
        dryRun: true,
        apply: false,
        supabaseUrl: "https://unknown-project.supabase.co",
      }),
    ).toThrow();

    expect(() =>
      assertStageBootstrapAuthorization({
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        expectedMigrationCount: 46,
        acceptExternalMigrationVerification: false,
        dryRun: true,
        apply: false,
        supabaseUrl: "https://different-project.supabase.co",
      }),
    ).toThrow();
  });

  it("blocks missing files and checksum mismatches from the prepared manifest", () => {
    const missingCopy = makePreparedCopy();
    fs.rmSync(path.join(missingCopy, "reference", "team-aliases.csv"));
    const missingResult = verifyPreparedSources(missingCopy);
    expect(missingResult.status).toBe("blocked");

    const mismatchCopy = makePreparedCopy();
    fs.appendFileSync(path.join(mismatchCopy, "reference", "team-aliases.csv"), "\nAlias Injected,alias_injected,Injected,manual,resolved\n", "utf8");
    const mismatchResult = verifyPreparedSources(mismatchCopy);
    expect(mismatchResult.status).toBe("blocked");
  });

  it("builds deterministic insert, update, and skip planning without writing auth or migration records", () => {
    const verified = verifyPreparedSources(defaults.preparedDir);
    const remote = buildEmptyRemoteState();

    remote.competitions.push({
      id: "competition-1",
      external_id: "api-football:league:1",
      slug: "world-cup-2026",
      name: "World Cup 2026",
      country: null,
      type: "international",
      usage_scope: "public_product",
    });
    remote.tableCounts.competitions = 1;
    remote.teams.push({
      id: "team-1",
      external_id: null,
      slug: "mexico",
      name: "Mexico Changed",
      country: "Mexico",
    });
    remote.tableCounts.teams = 1;

    const plan = planStageBootstrap({
      preparedDir: defaults.preparedDir,
      remoteState: remote,
      manifestStatus: verified.status,
      registry: verified.registry,
      files: verified.files,
    });

    const competitionPlan = plan.tables.find((table) => table.table === "competitions");
    const teamPlan = plan.tables.find((table) => table.table === "teams");
    const ratingsPlan = plan.tables.find((table) => table.table === "team_rating_snapshots");

    expect(competitionPlan?.deterministicSkips).toBe(1);
    expect(teamPlan?.plannedUpdates).toBeGreaterThan(0);
    expect(ratingsPlan?.plannedInserts).toBeGreaterThan(0);
    expect(plan.tables.some((table) => table.table === ("profiles" as never))).toBe(false);
    expect(plan.preservation.authUserCount).toBe(1);
    expect(plan.preservation.profileCount).toBe(1);
    expect(plan.preservation.migrationHistory.status).toBe("verified_count");
    expect(plan.applyEligible).toBe(true);
  });

  it("collapses equivalent alias unicode and spelling variants deterministically with all rows accounted for", () => {
    const verified = verifyPreparedSources(defaults.preparedDir);
    const plan = planStageBootstrap({
      preparedDir: defaults.preparedDir,
      remoteState: buildEmptyRemoteState(),
      manifestStatus: verified.status,
      registry: verified.registry,
      files: verified.files,
    });

    const aliasPlan = plan.tables.find((table) => table.table === "canonical_team_aliases");
    expect(aliasPlan).toBeDefined();
    expect(aliasPlan?.sourceRowCount).toBe(312);
    expect(aliasPlan?.plannedInserts).toBe(309);
    expect(aliasPlan?.plannedUpdates).toBe(0);
    expect(aliasPlan?.deterministicSkips).toBe(3);
    expect(aliasPlan?.rejectedOrUnmapped).toBe(0);
    expect(aliasPlan?.conflictKeyCount).toBe(0);
    expect(aliasPlan?.conflictRowCount).toBe(0);
    expect(aliasPlan?.balancedAccounting.isBalanced).toBe(true);

    const bosniaRows = aliasPlan?.rows.filter((row) => row.key === "bosnia herzegovina|multi_source") ?? [];
    expect(bosniaRows.map((row) => row.action)).toEqual(["insert", "skip"]);
    expect(bosniaRows[0]?.sourceEvidence[0]).toMatchObject({ sourceLine: 9, sourceRowIndex: 8 });
    expect(bosniaRows[1]?.sourceEvidence[0]).toMatchObject({ sourceLine: 10, sourceRowIndex: 9 });
    expect(bosniaRows.flatMap((row) => row.sourceEvidence).map((evidence) => evidence.payload.alias)).toEqual([
      "Bosnia & Herzegovina",
      "Bosnia-Herzegovina",
    ]);
  });

  it("keeps conflicting canonical alias targets as blockers and separates conflict keys from conflict rows", () => {
    const preparedCopy = makePreparedCopy();
    const aliasFile = path.join(preparedCopy, "reference", "team-aliases.csv");
    fs.appendFileSync(aliasFile, "\nBosnia & Herzegovina,bosnia_conflict,Bosnia Conflict,multi_source,resolved\n", "utf8");

    const verified = verifyPreparedSources(preparedCopy);
    const plan = planStageBootstrap({
      preparedDir: preparedCopy,
      remoteState: buildEmptyRemoteState(),
      manifestStatus: verified.status,
      registry: verified.registry,
      files: verified.files,
    });

    const aliasPlan = plan.tables.find((table) => table.table === "canonical_team_aliases");
    expect(aliasPlan?.conflictKeyCount).toBeGreaterThan(0);
    expect(aliasPlan?.conflictRowCount).toBeGreaterThan(aliasPlan?.conflictKeyCount ?? 0);
    expect(aliasPlan?.balancedAccounting.isBalanced).toBe(true);
  });

  it("accepts explicit external migration attestation only when the importer read path is unavailable", () => {
    const verified = verifyPreparedSources(defaults.preparedDir);
    const remote = buildEmptyRemoteState();
    remote.migrationHistory = {
      status: "query_error",
      count: null,
      externallyVerifiedExpectedCount: 46,
      detail: "Invalid schema: supabase_migrations",
    };

    const deniedPlan = planStageBootstrap({
      preparedDir: defaults.preparedDir,
      remoteState: remote,
      manifestStatus: verified.status,
      registry: verified.registry,
      files: verified.files,
      authorization: {
        expectedMigrationCount: 46,
        acceptExternalMigrationVerification: false,
      },
    });
    expect(deniedPlan.applyEligible).toBe(false);
    expect(deniedPlan.applyEligibilityReasons.some((reason) => reason.includes("no explicit external attestation"))).toBe(
      true,
    );

    const acceptedPlan = planStageBootstrap({
      preparedDir: defaults.preparedDir,
      remoteState: remote,
      manifestStatus: verified.status,
      registry: verified.registry,
      files: verified.files,
      authorization: {
        expectedMigrationCount: 46,
        acceptExternalMigrationVerification: true,
      },
    });
    expect(acceptedPlan.applyEligible).toBe(true);
    expect(acceptedPlan.preservation.migrationHistory.importerIndependentlyVerified).toBe(false);
    expect(acceptedPlan.preservation.migrationHistory.externalOperatorAttestationAccepted).toBe(true);
    expect(acceptedPlan.preservation.migrationHistory.verificationMode).toBe("external_operator_attestation");
  });

  it("records the API-Football sentinel outside file-backed source snapshots", () => {
    const verified = verifyPreparedSources(defaults.preparedDir);
    const plan = planStageBootstrap({
      preparedDir: defaults.preparedDir,
      remoteState: buildEmptyRemoteState(),
      manifestStatus: verified.status,
      registry: verified.registry,
      files: verified.files,
    });

    const sourceSnapshotPlan = plan.tables.find((table) => table.table === "source_snapshots");
    expect(sourceSnapshotPlan?.sourceRowCount).toBe(8);
    expect(plan.sourceSnapshotSentinels).toEqual([
      expect.objectContaining({
        sourceKey: "api_football",
        snapshotId: "api-football-provider-linkage-reference-none",
        treatment: "omitted_non_file_backed_sentinel",
      }),
    ]);
  });

  it("reports unmapped schedule/runtime identity blockers and preserves cutoff provenance", () => {
    const preparedCopy = makePreparedCopy();
    const schedulePath = path.join(preparedCopy, "reference", "world-cup-2026-schedule.json");
    const schedule = JSON.parse(fs.readFileSync(schedulePath, "utf8")) as Array<Record<string, unknown>>;
    schedule[0] = {
      ...schedule[0],
      home_team_key: "nonexistent_team_key",
    };
    fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2) + "\n", "utf8");

    const verified = verifyPreparedSources(preparedCopy);
    const plan = planStageBootstrap({
      preparedDir: preparedCopy,
      remoteState: buildEmptyRemoteState(),
      manifestStatus: verified.status,
      registry: verified.registry,
      files: verified.files,
    });

    expect(plan.blockers.some((blocker) => blocker.includes("Unmapped runtime teams"))).toBe(true);
    expect(plan.freshness.retainedSnapshots.some((entry) => entry.includes("2026-06-20"))).toBe(true);
    expect(plan.tables.find((table) => table.table === "source_snapshots")?.sourceCutoff).toBe("2026-06-20");
  });
});
