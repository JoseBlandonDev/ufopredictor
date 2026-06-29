import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  applyTask2ASignalBaselinePlan,
  assertTask2AAuthorization,
  assertTask2ALocalRunPreflight,
  compareSignalRowsExact,
  evaluateTask2APlanEligibility,
  planTask2ASignalBaseline,
  resolveTask2ASignalBaselineDefaults,
  verifyPreparedSources,
  type PersistedSignalSnapshotRow,
  type Task2APlanState,
  type Task2ARemoteState,
} from "./task2a-signal-baseline";
import { loadTask1Datasets, type PreparedPaths } from "./task1";
import { buildTask2ACliSummaryLines, computeTask2ACliExitCode } from "../../scripts/prediction-intelligence-v2/run-task2a-signal-baseline";

const repoRoot = process.cwd();
const defaults = resolveTask2ASignalBaselineDefaults(repoRoot);
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
  const target = registerCleanup(path.join(os.tmpdir(), `task2a-signal-baseline-${Date.now()}-${Math.random().toString(16).slice(2)}`));
  fs.cpSync(defaults.preparedDir, target, { recursive: true });
  return target;
}

function buildPreparedPaths(preparedDir: string): PreparedPaths {
  return {
    repoRoot,
    preparedDir,
    rawSnapshotDir: path.resolve(preparedDir, ".."),
    artifactsDir: path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task2a", "local-run", "unit"),
  };
}

function buildRemoteStateFromDatasets(preparedDir = defaults.preparedDir): Task2ARemoteState {
  const datasets = loadTask1Datasets(buildPreparedPaths(preparedDir));
  const runtimeTeams = new Map([
    ["mexico", "mexico"],
    ["south_africa", "south-africa"],
    ["south_korea", "south-korea"],
    ["czechia", "czech-republic"],
    ["canada", "canada"],
    ["bosnia_and_herzegovina", "bosnia-herzegovina"],
    ["qatar", "qatar"],
    ["switzerland", "switzerland"],
    ["brazil", "brazil"],
    ["morocco", "morocco"],
    ["haiti", "haiti"],
    ["scotland", "scotland"],
    ["united_states", "usa"],
    ["paraguay", "paraguay"],
    ["australia", "australia"],
    ["turkiye", "turkiye"],
    ["germany", "germany"],
    ["curacao", "curacao"],
    ["ivory_coast", "cote-divoire"],
    ["ecuador", "ecuador"],
    ["netherlands", "netherlands"],
    ["japan", "japan"],
    ["sweden", "sweden"],
    ["tunisia", "tunisia"],
    ["belgium", "belgium"],
    ["egypt", "egypt"],
    ["iran", "iran"],
    ["new_zealand", "new-zealand"],
    ["spain", "spain"],
    ["cape_verde", "cabo-verde"],
    ["saudi_arabia", "saudi-arabia"],
    ["uruguay", "uruguay"],
    ["france", "france"],
    ["senegal", "senegal"],
    ["iraq", "iraq"],
    ["norway", "norway"],
    ["argentina", "argentina"],
    ["algeria", "algeria"],
    ["austria", "austria"],
    ["jordan", "jordan"],
    ["portugal", "portugal"],
    ["dr_congo", "congo-dr"],
    ["uzbekistan", "uzbekistan"],
    ["colombia", "colombia"],
    ["england", "england"],
    ["croatia", "croatia"],
    ["ghana", "ghana"],
    ["panama", "panama"],
  ]);

  const sourceSnapshotIds = Array.from(
    new Set([
      ...datasets.eloCurrent.map((row) => row.source_snapshot_id),
      ...datasets.eloStart2026.map((row) => row.source_snapshot_id),
      ...datasets.fifaRanking.map((row) => row.source_snapshot_id),
      ...datasets.historicalFacts.map((row) => row.source_snapshot_id),
      "fifa-fwc26-schedule-v17-2026-04-10",
      "world-cup-venues-2026-06-20",
    ]),
  ).sort();

  const signalRows: Task2ARemoteState["signalSnapshots"] = [];
  const scheduleRows = datasets.schedule
    .filter((row) => row.official_match_number <= 72)
    .map((row) => ({
      id: `schedule-${row.official_match_number}`,
      official_match_number: row.official_match_number,
      home_team_key: row.home_team_key,
      away_team_key: row.away_team_key,
      scheduled_at_utc: row.scheduled_at_utc,
    }));

  return {
    sourceSnapshots: sourceSnapshotIds.map((snapshotId) => ({
      snapshot_id: snapshotId,
      source_key: snapshotId,
      payload_hash: snapshotId,
    })),
    canonicalTeamLinks: Array.from(runtimeTeams.entries()).map(([canonicalTeamKey, runtimeTeamSlug], index) => ({
      id: `link-${index + 1}`,
      canonical_team_key: canonicalTeamKey,
      team_id: `team-${index + 1}`,
      api_football_team_id: null,
      runtime_team_slug: runtimeTeamSlug,
      link_status: "linked",
      metadata_json: {},
      created_at: "2026-06-27T00:00:00Z",
      updated_at: "2026-06-27T00:00:00Z",
    })),
    teams: Array.from(runtimeTeams.entries()).map(([canonicalTeamKey, runtimeTeamSlug], index) => ({
      id: `team-${index + 1}`,
      slug: runtimeTeamSlug,
      name: canonicalTeamKey,
    })),
    matches: scheduleRows.map((row) => ({
      id: `match-${row.official_match_number}`,
      slug: `match-${row.official_match_number}`,
      kickoff_at: row.scheduled_at_utc,
      stage: "group_stage",
      status: row.official_match_number <= 36 ? "completed" : "scheduled",
    })),
    officialScheduleMatches: scheduleRows,
    officialScheduleMatchLinks: scheduleRows.map((row) => ({
      official_schedule_match_id: row.id,
      match_id: `match-${row.official_match_number}`,
      api_football_fixture_id: row.official_match_number,
      link_status: "linked",
    })),
    signalSnapshots: signalRows,
  };
}

function toRemoteSignalRow(row: PersistedSignalSnapshotRow, id = "signal-1"): Task2ARemoteState["signalSnapshots"][number] {
  return {
    id,
    signal_version: row.signal_version,
    cutoff_at: row.cutoff_at,
    canonical_team_key: row.canonical_team_key,
    sample_sizes: row.sample_sizes,
    structural_strength: row.structural_strength,
    recent_form: row.recent_form,
    opponent_adjusted_form: row.opponent_adjusted_form,
    tournament_form: row.tournament_form,
    attack: row.attack,
    defense: row.defense,
    performance_vs_expectation: row.performance_vs_expectation,
    reliability: row.reliability,
    source_snapshot_ids: row.source_snapshot_ids,
    created_at: "2026-06-27T00:00:00Z",
  };
}

function makeAuthorization(mode: "dry_run" | "apply" = "dry_run") {
  return {
    mode,
    projectRef: "yfmklapgjrupctgxaako",
    denyProjectRef: "gcpdffkgsdomzyoenalg",
    supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
    targetEnvironment: "development",
    productionDenied: true as const,
    allowRemoteDevWrite: mode === "apply",
  };
}

class FakeDatabaseAdapter {
  public foundationState: Omit<Task2ARemoteState, "signalSnapshots">;

  public rows: Task2ARemoteState["signalSnapshots"];

  public failInsert = false;

  public concurrentWinnerRows: Task2ARemoteState["signalSnapshots"] = [];

  constructor(
    foundationState: Omit<Task2ARemoteState, "signalSnapshots"> = {
      sourceSnapshots: [],
      canonicalTeamLinks: [],
      teams: [],
      matches: [],
      officialScheduleMatches: [],
      officialScheduleMatchLinks: [],
    },
    initialRows: Task2ARemoteState["signalSnapshots"] = [],
  ) {
    this.foundationState = foundationState;
    this.rows = [...initialRows];
  }

  async readFoundationState() {
    return this.foundationState;
  }

  async readSignalSnapshots(signalVersion: string, cutoffAt: string) {
    return this.rows.filter(
      (row) =>
        row.signal_version === signalVersion &&
        compareSignalRowsExact(
          {
            signal_version: signalVersion,
            cutoff_at: cutoffAt,
            canonical_team_key: row.canonical_team_key,
            sample_sizes: row.sample_sizes as Record<string, unknown>,
            structural_strength: row.structural_strength as Record<string, unknown>,
            recent_form: row.recent_form as Record<string, unknown>,
            opponent_adjusted_form: row.opponent_adjusted_form as Record<string, unknown>,
            tournament_form: row.tournament_form as Record<string, unknown>,
            attack: row.attack as Record<string, unknown>,
            defense: row.defense as Record<string, unknown>,
            performance_vs_expectation: row.performance_vs_expectation as Record<string, unknown>,
            reliability: row.reliability as Record<string, unknown>,
            source_snapshot_ids: Array.isArray(row.source_snapshot_ids) ? row.source_snapshot_ids.map(String) : [],
          },
          {
            signal_version: row.signal_version,
            cutoff_at: row.cutoff_at,
            canonical_team_key: row.canonical_team_key,
            sample_sizes: row.sample_sizes as Record<string, unknown>,
            structural_strength: row.structural_strength as Record<string, unknown>,
            recent_form: row.recent_form as Record<string, unknown>,
            opponent_adjusted_form: row.opponent_adjusted_form as Record<string, unknown>,
            tournament_form: row.tournament_form as Record<string, unknown>,
            attack: row.attack as Record<string, unknown>,
            defense: row.defense as Record<string, unknown>,
            performance_vs_expectation: row.performance_vs_expectation as Record<string, unknown>,
            reliability: row.reliability as Record<string, unknown>,
            source_snapshot_ids: Array.isArray(row.source_snapshot_ids) ? row.source_snapshot_ids.map(String) : [],
          },
        ),
    );
  }

  async insertSignalSnapshots(rows: Array<Record<string, unknown>>) {
    if (this.failInsert) {
      throw new Error("insert failed");
    }
    if (this.concurrentWinnerRows.length > 0) {
      this.rows.push(...this.concurrentWinnerRows);
      this.concurrentWinnerRows = [];
      throw new Error('duplicate key value violates unique constraint "signal_snapshots_signal_version_cutoff_at_canonical_team_key_key"');
    }

    const existingKeys = new Set(this.rows.map((row) => `${row.signal_version}|${row.cutoff_at}|${row.canonical_team_key}`));
    const incomingRows = rows.map((row, index) => ({
      id: `signal-${this.rows.length + index + 1}`,
      signal_version: String(row.signal_version),
      cutoff_at: String(row.cutoff_at),
      canonical_team_key: String(row.canonical_team_key),
      sample_sizes: row.sample_sizes,
      structural_strength: row.structural_strength,
      recent_form: row.recent_form,
      opponent_adjusted_form: row.opponent_adjusted_form,
      tournament_form: row.tournament_form,
      attack: row.attack,
      defense: row.defense,
      performance_vs_expectation: row.performance_vs_expectation,
      reliability: row.reliability,
      source_snapshot_ids: row.source_snapshot_ids,
      created_at: "2026-06-27T00:00:00Z",
    }));
    const incomingKeys = new Set<string>();
    for (const row of incomingRows) {
      const key = `${row.signal_version}|${row.cutoff_at}|${row.canonical_team_key}`;
      if (existingKeys.has(key) || incomingKeys.has(key)) {
        throw new Error('duplicate key value violates unique constraint "signal_snapshots_signal_version_cutoff_at_canonical_team_key_key"');
      }
      incomingKeys.add(key);
    }

    this.rows.push(...incomingRows);
  }
}

afterEach(() => {
  restoreEnv();
  for (const targetPath of cleanupPaths) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
  cleanupPaths.clear();
});

describe("task2a signal baseline", () => {
  it("accepts the exact stage project and rejects production-like authorization drift", () => {
    process.env.PREDICTION_INTELLIGENCE_TARGET = "development";
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "false";

    const authorization = assertTask2AAuthorization({
      projectRef: "yfmklapgjrupctgxaako",
      denyProjectRef: "gcpdffkgsdomzyoenalg",
      dryRun: true,
      apply: false,
      verify: false,
      supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
    });

    expect(authorization.mode).toBe("dry_run");
    expect(() =>
      assertTask2AAuthorization({
        projectRef: "gcpdffkgsdomzyoenalg",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        supabaseUrl: "https://gcpdffkgsdomzyoenalg.supabase.co",
      }),
    ).toThrow();
  });

  it("requires artifacts inside the task2a local-run tree", () => {
    const allowed = path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task2a", "local-run", "2026-06-27", "unit");
    expect(() => assertTask2ALocalRunPreflight(repoRoot, allowed)).not.toThrow();
    expect(() => assertTask2ALocalRunPreflight(repoRoot, path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task2a", "scratch"))).toThrow();
  });

  it("rejects manifest checksum drift", () => {
    const preparedCopy = makePreparedCopy();
    fs.appendFileSync(path.join(preparedCopy, "reference", "team-aliases.csv"), "\nInjected,foo,Foo,manual,resolved\n", "utf8");
    const verified = verifyPreparedSources(preparedCopy);
    expect(verified.status).toBe("blocked");
  });

  it("accepts the root manifest without requiring a self-entry when its authoritative hash matches", () => {
    const verified = verifyPreparedSources(defaults.preparedDir);
    const rootManifest = verified.files.find((file) => file.relativePath === "package-manifest.json");
    const rootRegistry = verified.files.find((file) => file.relativePath === "source-registry.json");

    expect(rootManifest?.manifestStatus).toBe("verified");
    expect(rootRegistry?.manifestStatus).toBe("verified");
    expect(verified.status).toBe("verified");
  });

  it("blocks when the authoritative root manifest hash does not match the actual file", () => {
    const actualManifestSha = verifyPreparedSources(defaults.preparedDir).files.find((file) => file.relativePath === "package-manifest.json")?.sha256;
    if (!actualManifestSha) {
      throw new Error("missing root manifest sha");
    }

    const verified = verifyPreparedSources(defaults.preparedDir, {
      packageManifestSha256: "0".repeat(64),
      sourceRegistrySha256: verifyPreparedSources(defaults.preparedDir).files.find((file) => file.relativePath === "source-registry.json")?.sha256 ?? "0".repeat(64),
    });

    const rootManifest = verified.files.find((file) => file.relativePath === "package-manifest.json");
    expect(rootManifest?.manifestStatus).toBe("hash_mismatch");
    expect(verified.status).toBe("blocked");
  });

  it("blocks when a required non-root manifest entry is missing", () => {
    const preparedCopy = makePreparedCopy();
    const manifestPath = path.join(preparedCopy, "package-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      package_files: Array<{ path: string; sha256: string; size_bytes: number }>;
    };
    manifest.package_files = manifest.package_files.filter((entry) => entry.path !== "reference/team-aliases.csv");
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

    const verified = verifyPreparedSources(preparedCopy);
    const missingEntry = verified.files.find((file) => path.normalize(file.relativePath) === path.normalize("reference/team-aliases.csv"));
    expect(missingEntry?.manifestStatus).toBe("missing_from_manifest");
    expect(verified.status).toBe("blocked");
  });

  it("blocks when a required non-root manifest hash mismatches", () => {
    const preparedCopy = makePreparedCopy();
    const manifestPath = path.join(preparedCopy, "package-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      package_files: Array<{ path: string; sha256: string; size_bytes: number }>;
    };
    const entry = manifest.package_files.find((candidate) => candidate.path === "reference/team-aliases.csv");
    if (!entry) {
      throw new Error("missing team-aliases manifest entry");
    }
    entry.sha256 = "f".repeat(64);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

    const verified = verifyPreparedSources(preparedCopy);
    const mismatchedEntry = verified.files.find((file) => path.normalize(file.relativePath) === path.normalize("reference/team-aliases.csv"));
    expect(mismatchedEntry?.manifestStatus).toBe("hash_mismatch");
    expect(verified.status).toBe("blocked");
  });

  it("builds the full 48-team deterministic baseline at the canonical Task 1 cutoff", () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const authorization = makeAuthorization();

    const { plan, coverageRows } = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization,
      verifiedSources: verified,
    });

    expect(plan.expectedTeamKeys).toHaveLength(48);
    expect(plan.cutoffAt).toBe("2026-06-21T00:00:00Z");
    expect(plan.signalVersion).toBe("prediction-intelligence-v2-task1");
    expect(plan.summary.expectedSignalRowCount).toBe(48);
    expect(plan.expectedPriorState).toBe("fresh");
    expect(coverageRows).toHaveLength(72);
    expect(coverageRows.every((row) => row.baseline_signal_ready)).toBe(true);
    expect(coverageRows.every((row) => row.candidate_ready === false)).toBe(true);
    expect(new Set(coverageRows.map((row) => row.candidate_ready_reason))).toEqual(new Set(["requires_incremental_current_refresh"]));
  });

  it("preserves persisted mapping fields without duplicating localized display names", () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const authorization = makeAuthorization();

    const { plan } = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization,
      verifiedSources: verified,
    });

    const argentina = plan.rows.find((row) => row.canonicalTeamKey === "argentina");
    expect(argentina?.payload.signal_version).toBe("prediction-intelligence-v2-task1");
    expect(argentina?.payload.structural_strength).toHaveProperty("current_elo");
    expect(argentina?.payload.opponent_adjusted_form).toHaveProperty("recent_opponent_adjusted_form");
    expect(argentina?.payload.reliability).toHaveProperty("elo_resolution_method");
    expect(argentina?.payload.reliability).toMatchObject({
      missing_required_signals: [],
      contradiction_flags: [],
      elo_source_snapshot_ids: expect.any(Array),
    });
    expect(argentina?.reportOnly.displayNameEn).toBe("Argentina");
  });

  it("persists completeness and reliability metadata canonically in the row payload", () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);

    const { plan } = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    });

    const qatar = plan.rows.find((row) => row.canonicalTeamKey === "qatar");
    expect(qatar?.payload.reliability).toMatchObject({
      missing_required_signals: [],
      missing_optional_signals: expect.any(Array),
      contradiction_flags: [],
      elo_resolution_method: expect.any(String),
      elo_reliability: expect.any(Number),
      elo_source_snapshot_ids: expect.any(Array),
      sample_reliability: expect.any(Number),
      world_cup_sample_reliability: expect.any(Number),
    });
  });

  it("treats reordered metadata arrays and database-generated fields as semantically identical", () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const initialPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;

    const firstInsert = initialPlan.rows.find((row) => row.action === "insert");
    if (!firstInsert) {
      throw new Error("missing insert row");
    }
    const existingOptional = Array.isArray(firstInsert.payload.reliability.missing_optional_signals)
      ? firstInsert.payload.reliability.missing_optional_signals.map(String)
      : [];
    const existingEloSourceSnapshotIds = Array.isArray(firstInsert.payload.reliability.elo_source_snapshot_ids)
      ? firstInsert.payload.reliability.elo_source_snapshot_ids.map(String)
      : [];

    remoteState.signalSnapshots = [
      toRemoteSignalRow(
        {
          ...firstInsert.payload,
          reliability: {
            ...firstInsert.payload.reliability,
            missing_optional_signals:
              existingOptional.length > 0 ? [...existingOptional].reverse().concat(existingOptional[0]) : [],
            missing_required_signals: [],
            contradiction_flags: [],
            elo_source_snapshot_ids: [...existingEloSourceSnapshotIds].reverse(),
          },
          source_snapshot_ids: [...firstInsert.payload.source_snapshot_ids].reverse(),
        },
        "signal-equivalent",
      ),
    ].map((row) => ({ ...row, created_at: "2099-01-01T00:00:00Z" }));

    const reparsed = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;

    const matchingRow = reparsed.rows.find((row) => row.canonicalTeamKey === firstInsert.canonicalTeamKey);
    expect(matchingRow?.action).toBe("already_identical");
  });

  it("treats equivalent cutoff_at UTC timestamp encodings as semantically identical", () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const initialPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;

    const firstInsert = initialPlan.rows.find((row) => row.action === "insert");
    if (!firstInsert) {
      throw new Error("missing insert row");
    }

    remoteState.signalSnapshots = [toRemoteSignalRow({ ...firstInsert.payload, cutoff_at: "2026-06-21T00:00:00+00:00" }, "signal-equivalent-z-offset")];

    const reparsed = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;

    const matchingRow = reparsed.rows.find((row) => row.canonicalTeamKey === firstInsert.canonicalTeamKey);
    expect(matchingRow?.action).toBe("already_identical");
  });

  it("treats equivalent non-UTC-offset cutoff_at timestamp encodings as semantically identical", () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const initialPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;

    const firstInsert = initialPlan.rows.find((row) => row.action === "insert");
    if (!firstInsert) {
      throw new Error("missing insert row");
    }

    remoteState.signalSnapshots = [toRemoteSignalRow({ ...firstInsert.payload, cutoff_at: "2026-06-20T19:00:00-05:00" }, "signal-equivalent-offset")];

    const reparsed = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;

    const matchingRow = reparsed.rows.find((row) => row.canonicalTeamKey === firstInsert.canonicalTeamKey);
    expect(matchingRow?.action).toBe("already_identical");
  });

  it("keeps cutoff_at semantically bound by treating a one-second difference as a conflict", () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const initialPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;

    const firstInsert = initialPlan.rows.find((row) => row.action === "insert");
    if (!firstInsert) {
      throw new Error("missing insert row");
    }

    remoteState.signalSnapshots = [toRemoteSignalRow({ ...firstInsert.payload, cutoff_at: "2026-06-21T00:00:01Z" }, "signal-drifted-cutoff")];

    const reparsed = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;

    const driftRow = reparsed.rows.find((row) => row.canonicalTeamKey === firstInsert.canonicalTeamKey);
    expect(reparsed.expectedPriorState).toBe("partial_or_conflicting");
    expect(driftRow?.action).toBe("conflict");
  });

  it("fails closed when the expected cutoff_at timestamp is invalid", () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const initialPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;
    const firstInsert = initialPlan.rows.find((row) => row.action === "insert");
    if (!firstInsert) {
      throw new Error("missing insert row");
    }

    expect(() =>
      compareSignalRowsExact({ ...firstInsert.payload, cutoff_at: "not-a-timestamp" }, firstInsert.payload),
    ).toThrow(/Invalid semantic timestamp/);
  });

  it("fails closed when the persisted cutoff_at timestamp is invalid", () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const initialPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;
    const firstInsert = initialPlan.rows.find((row) => row.action === "insert");
    if (!firstInsert) {
      throw new Error("missing insert row");
    }

    expect(() =>
      compareSignalRowsExact(firstInsert.payload, { ...firstInsert.payload, cutoff_at: "not-a-timestamp" }),
    ).toThrow(/Invalid semantic timestamp/);
  });

  it("classifies all 48 correctly persisted rows as exact_complete when cutoff_at differs only by timezone representation", () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const freshPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;

    remoteState.signalSnapshots = freshPlan.rows
      .filter((row) => row.action === "insert")
      .map((row, index) =>
        toRemoteSignalRow(
          {
            ...row.payload,
            cutoff_at: index % 2 === 0 ? "2026-06-21T00:00:00+00:00" : "2026-06-20T19:00:00-05:00",
          },
          `signal-${index + 1}`,
        ),
      );

    const reparsed = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;

    expect(reparsed.expectedPriorState).toBe("exact_complete");
    expect(reparsed.summary.identicalCount).toBe(48);
    expect(reparsed.summary.insertCount).toBe(0);
    expect(reparsed.conflicts).toHaveLength(0);
  });

  it("excludes generated metadata and mode from the stable semantic checksum", () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const authorization = makeAuthorization();

    const first = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization,
      verifiedSources: verified,
    }).plan;
    const second = {
      ...first,
      generatedAt: "2099-01-01T00:00:00Z",
      mode: "verification" as const,
    };

    expect(first.stablePlanSha256).toBe(second.stablePlanSha256);
  });

  it("includes metadata changes in semantic checksum and exact-state conflict detection", () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const authorization = makeAuthorization();
    const initial = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization,
      verifiedSources: verified,
    }).plan;
    const firstInsert = initial.rows.find((row) => row.action === "insert");
    if (!firstInsert) {
      throw new Error("missing insert row");
    }

    remoteState.signalSnapshots = [
      toRemoteSignalRow(
        {
          ...firstInsert.payload,
          reliability: {
            ...firstInsert.payload.reliability,
            missing_optional_signals: ["fifa_points", "new_optional_gap"],
          },
        },
        "signal-drift",
      ),
    ];

    const reparsed = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization,
      verifiedSources: verified,
    }).plan;

    expect(reparsed.expectedPriorState).toBe("partial_or_conflicting");
    expect(reparsed.stablePlanSha256).not.toBe(initial.stablePlanSha256);
    const driftRow = reparsed.rows.find((row) => row.canonicalTeamKey === firstInsert.canonicalTeamKey);
    expect(driftRow?.action).toBe("conflict");
  });

  it("keeps blocked plans ineligible for apply", async () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const authorization = makeAuthorization("apply");
    const plan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization,
      verifiedSources: verified,
    }).plan;
    const blockedPlan = {
      ...plan,
      manifestStatus: "blocked" as const,
      blockers: ["Prepared source manifest or source registry verification failed."],
    };

    expect(evaluateTask2APlanEligibility(blockedPlan).eligible).toBe(false);
    await expect(
      applyTask2ASignalBaselinePlan({
        currentPlan: blockedPlan,
        reviewedPlan: { ...blockedPlan, mode: "dry_run" },
        reviewedStablePlanSha256: blockedPlan.stablePlanSha256,
        authorization,
        databaseAdapter: new FakeDatabaseAdapter(remoteState, []),
      }),
    ).rejects.toThrow(/reviewed plan is ineligible|current plan is ineligible/);
  });

  it("exposes blocked runner status and non-zero exit behavior through the cli summary boundary", () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const plan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;
    const blockedResult = {
      plan: {
        ...plan,
        manifestStatus: "blocked" as const,
        blockers: ["Prepared source manifest or source registry verification failed."],
      },
      artifactPath: "artifact.json",
      coverageArtifactPath: "coverage.json",
      applyResult: null,
    };

    const lines = buildTask2ACliSummaryLines(blockedResult);
    expect(lines).toContain("manifest_status=blocked");
    expect(lines).toContain("blocker_count=1");
    expect(lines.some((line) => line.includes("Prepared source manifest or source registry verification failed."))).toBe(true);
    expect(lines).toContain("apply_eligible=false");
    expect(computeTask2ACliExitCode(blockedResult)).toBe(1);
  });

  it("binds an eligible dry-run artifact to an apply plan with identical semantics", async () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const dryRunPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;
    const applyPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization("apply"),
      verifiedSources: verified,
    }).plan;

    const result = await applyTask2ASignalBaselinePlan({
      currentPlan: applyPlan,
      reviewedPlan: dryRunPlan,
      reviewedStablePlanSha256: dryRunPlan.stablePlanSha256,
      authorization: makeAuthorization("apply"),
      databaseAdapter: new FakeDatabaseAdapter(remoteState, []),
    });

    expect(result.insertedCount).toBe(48);
  });

  it("does not let dry-run/apply mode or zero-write reporting invalidate binding", async () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const dryRunPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;
    const applyPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization("apply"),
      verifiedSources: verified,
    }).plan;

    expect(dryRunPlan.mode).toBe("dry_run");
    expect(applyPlan.mode).toBe("apply");
    expect(dryRunPlan.summary.zeroWriteConfirmation).toBe(true);
    expect(applyPlan.summary.zeroWriteConfirmation).toBe(false);
    expect(dryRunPlan.stablePlanSha256).toBe(applyPlan.stablePlanSha256);
  });

  it("rejects changed semantic binding fields and reports bounded differing paths", async () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const dryRunPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;
    const changedCurrentPlan = {
      ...planTask2ASignalBaseline({
        repoRoot,
        preparedDir: defaults.preparedDir,
        remoteState,
        authorization: makeAuthorization("apply"),
        verifiedSources: verified,
      }).plan,
      cutoffAt: "2026-06-22T00:00:00Z",
    };

    await expect(
      applyTask2ASignalBaselinePlan({
        currentPlan: changedCurrentPlan,
        reviewedPlan: dryRunPlan,
        reviewedStablePlanSha256: dryRunPlan.stablePlanSha256,
        authorization: makeAuthorization("apply"),
        databaseAdapter: new FakeDatabaseAdapter(remoteState, []),
      }),
    ).rejects.toThrow(/differing_paths=cutoffAt/);
  });

  it("rejects a tampered reviewed artifact that keeps its old stored checksum", async () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const dryRunPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization: makeAuthorization(),
      verifiedSources: verified,
    }).plan;
    const tamperedReviewedPlan = {
      ...dryRunPlan,
      rows: dryRunPlan.rows.map((row, index) =>
        index === 0
          ? {
              ...row,
              payload: {
                ...row.payload,
                sample_sizes: { ...row.payload.sample_sizes, last_20: 999 },
              },
            }
          : row,
      ),
    };

    await expect(
      applyTask2ASignalBaselinePlan({
        currentPlan: planTask2ASignalBaseline({
          repoRoot,
          preparedDir: defaults.preparedDir,
          remoteState,
          authorization: makeAuthorization("apply"),
          verifiedSources: verified,
        }).plan,
        reviewedPlan: tamperedReviewedPlan,
        reviewedStablePlanSha256: dryRunPlan.stablePlanSha256,
        authorization: makeAuthorization("apply"),
        databaseAdapter: new FakeDatabaseAdapter(remoteState, []),
      }),
    ).rejects.toThrow(/reviewed artifact checksum did not match its contents/);
  });

  it.each<[Task2APlanState, (plan: ReturnType<typeof planTask2ASignalBaseline>["plan"], remoteState: Task2ARemoteState) => void]>([
    [
      "fresh",
      () => {
        // no-op
      },
    ],
    [
      "exact_complete",
      (plan, remoteState) => {
        remoteState.signalSnapshots = plan.rows
          .filter((row) => row.action === "insert")
          .map((row, index) => ({ ...toRemoteSignalRow(row.payload, `signal-${index + 1}`), created_at: "2099-01-01T00:00:00Z" }));
        plan.rows = [];
      },
    ],
    [
      "partial_or_conflicting",
      (plan, remoteState) => {
        const first = plan.rows.find((row) => row.action === "insert");
        if (!first) {
          throw new Error("missing insert row");
        }
        remoteState.signalSnapshots = [
          toRemoteSignalRow({ ...first.payload, sample_sizes: { changed: true } }, "signal-1"),
        ];
        plan.rows = [];
      },
    ],
  ])("classifies %s state exactly", (expectedState, mutateRemote) => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const authorization = makeAuthorization();

    const initial = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization,
      verifiedSources: verified,
    });
    mutateRemote(initial.plan, remoteState);
    const { plan } = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization,
      verifiedSources: verified,
    });
    expect(plan.expectedPriorState).toBe(expectedState);
  });

  it("applies only in fresh and returns zero-growth on exact-complete rerun", async () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const authorization = makeAuthorization("apply");

    const firstPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization,
      verifiedSources: verified,
    }).plan;
    const database = new FakeDatabaseAdapter(remoteState, []);
    const applyResult = await applyTask2ASignalBaselinePlan({
      currentPlan: firstPlan,
      reviewedPlan: { ...firstPlan, mode: "dry_run" },
      reviewedStablePlanSha256: firstPlan.stablePlanSha256,
      authorization,
      databaseAdapter: database,
    });
    expect(applyResult.insertedCount).toBe(48);

    const exactRemoteState = { ...remoteState, signalSnapshots: await database.readSignalSnapshots(firstPlan.signalVersion, firstPlan.cutoffAt) };
    const exactPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState: exactRemoteState,
      authorization: { ...authorization, mode: "dry_run" },
      verifiedSources: verified,
    }).plan;
    const verifyResult = await applyTask2ASignalBaselinePlan({
      currentPlan: exactPlan,
      reviewedPlan: { ...exactPlan, mode: "dry_run" },
      reviewedStablePlanSha256: exactPlan.stablePlanSha256,
      authorization,
      databaseAdapter: database,
    });
    expect(verifyResult.insertedCount).toBe(0);
    expect(verifyResult.requestedState).toBe("exact_complete");
  });

  it("fails closed on partial or conflicting apply attempts without overwrite behavior", async () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const authorization = makeAuthorization("apply");

    const first = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization,
      verifiedSources: verified,
    }).plan;
    const conflictingRow = first.rows.find((row) => row.action === "insert");
    if (!conflictingRow) {
      throw new Error("missing insert row");
    }
    remoteState.signalSnapshots = [toRemoteSignalRow({ ...conflictingRow.payload, sample_sizes: { drift: true } }, "signal-1")];
    const conflictingPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization,
      verifiedSources: verified,
    }).plan;

    await expect(
      applyTask2ASignalBaselinePlan({
        currentPlan: conflictingPlan,
        reviewedPlan: { ...conflictingPlan, mode: "dry_run" },
        reviewedStablePlanSha256: conflictingPlan.stablePlanSha256,
        authorization,
        databaseAdapter: new FakeDatabaseAdapter(remoteState, remoteState.signalSnapshots),
      }),
    ).rejects.toThrow(/partial or conflicting/);
  });

  it("reclassifies stale fresh apply as exact-complete after a concurrent identical winner with zero duplicate growth", async () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const authorization = makeAuthorization("apply");
    const freshPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization,
      verifiedSources: verified,
    }).plan;

    const database = new FakeDatabaseAdapter(remoteState, []);
    database.concurrentWinnerRows = freshPlan.rows
      .filter((row) => row.action === "insert")
      .map((row, index) => toRemoteSignalRow(row.payload, `winner-${index + 1}`));

    const result = await applyTask2ASignalBaselinePlan({
      currentPlan: freshPlan,
      reviewedPlan: { ...freshPlan, mode: "dry_run" },
      reviewedStablePlanSha256: freshPlan.stablePlanSha256,
      authorization,
      databaseAdapter: database,
    });

    expect(result.insertedCount).toBe(48);
    expect(database.rows).toHaveLength(48);
  });

  it("fails closed after a concurrent conflicting winner and preserves all-or-nothing batch behavior", async () => {
    const remoteState = buildRemoteStateFromDatasets();
    const verified = verifyPreparedSources(defaults.preparedDir);
    const authorization = makeAuthorization("apply");
    const freshPlan = planTask2ASignalBaseline({
      repoRoot,
      preparedDir: defaults.preparedDir,
      remoteState,
      authorization,
      verifiedSources: verified,
    }).plan;
    const firstInsert = freshPlan.rows.find((row) => row.action === "insert");
    if (!firstInsert) {
      throw new Error("missing insert row");
    }

    const database = new FakeDatabaseAdapter(remoteState, []);
    database.concurrentWinnerRows = [
      toRemoteSignalRow(
        {
          ...firstInsert.payload,
          reliability: {
            ...firstInsert.payload.reliability,
            missing_optional_signals: ["concurrent_drift"],
          },
        },
        "winner-conflict",
      ),
    ];

    await expect(
      applyTask2ASignalBaselinePlan({
        currentPlan: freshPlan,
        reviewedPlan: { ...freshPlan, mode: "dry_run" },
        reviewedStablePlanSha256: freshPlan.stablePlanSha256,
        authorization,
        databaseAdapter: database,
      }),
    ).rejects.toThrow(/partial or conflicting state/);
    expect(database.rows).toHaveLength(1);
  });
});
