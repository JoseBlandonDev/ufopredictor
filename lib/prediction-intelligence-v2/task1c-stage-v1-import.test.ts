import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  applyTask1cStageV1ImportPlan,
  assertTask1cStageV1ImportAuthorization,
  loadTask1cStageV1ImportSourceBundle,
  planTask1cStageV1Import,
  verifyTask1cStageV1ImportState,
  type Task1cStageImportMatchRow,
  type Task1cStageImportSnapshot,
} from "./task1c-stage-v1-import";
import type { ModelVersionRow, PredictionMarketRow, PredictionVersionRow } from "../../types/database";

const repoRoot = process.cwd();
const sourceBundle = loadTask1cStageV1ImportSourceBundle({ repoRoot });
const publicationSqlPath = path.join(
  repoRoot,
  "supabase",
  "migrations",
  "20260626233000_task1c_stage_v1_import_apply.sql",
);
const publicationSql = fs.readFileSync(publicationSqlPath, "utf8");
const cleanupPaths = new Set<string>();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function buildAuthorization(apply = false) {
  return assertTask1cStageV1ImportAuthorization({
    projectRef: "yfmklapgjrupctgxaako",
    denyProjectRef: "gcpdffkgsdomzyoenalg",
    supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
    apply,
    reviewedPlanPath: apply ? "reviewed-plan.json" : null,
  });
}

function buildMatchUuid(matchNumber: number): string {
  return `00000000-0000-4000-8000-${String(matchNumber).padStart(12, "0")}`;
}

function buildBaseMatches(options?: {
  publicEvery?: number;
  forceAccessScope?: Task1cStageImportMatchRow["access_scope"];
}): Task1cStageImportMatchRow[] {
  return sourceBundle.manifestData.fixtures.map((fixture, index) => ({
    id: buildMatchUuid(fixture.matchNumber),
    external_id: `api-football:fixture:${fixture.apiFootballFixtureId}`,
    slug: fixture.canonicalSlug,
    competition_id: "competition-world-cup-2026",
    season_id: "season-world-cup-2026",
    home_team_id: `team-${fixture.canonicalHomeTeamKey}`,
    away_team_id: `team-${fixture.canonicalAwayTeamKey}`,
    kickoff_at: fixture.kickoffAt,
    stage: "Group Stage - 3",
    status: "scheduled",
    access_scope:
      options?.forceAccessScope ??
      ((options?.publicEvery && (index + 1) % options.publicEvery === 0) ? "public" : "admin_only"),
    lab_status: "ready",
    intake_source: "api_football",
    data_quality: "verified",
    source_note: null,
  }));
}

function buildFreshSnapshot(options?: {
  publicEvery?: number;
  forceAccessScope?: Task1cStageImportMatchRow["access_scope"];
}): Task1cStageImportSnapshot {
  return {
    competitions: [
      {
        id: "competition-world-cup-2026",
        slug: "world-cup-2026",
        usage_scope: "public_product",
      },
    ],
    teams: Array.from(
      new Set(
        sourceBundle.manifestData.fixtures.flatMap((fixture) => [
          fixture.canonicalHomeTeamKey,
          fixture.canonicalAwayTeamKey,
        ]),
      ),
    )
      .sort()
      .map((teamKey) => ({
        id: `team-${teamKey}`,
        slug: teamKey,
        name: teamKey,
      })),
    matches: buildBaseMatches(options),
    modelVersions: [],
    predictionVersions: [],
    predictionMarkets: [],
    predictionNarratives: [],
    publicPredictionSummaries: [],
    authUsers: [{ id: "user-1", email: "ufopredictor@gmail.com" }],
    profiles: [{ id: "user-1", email: "ufopredictor@gmail.com", role: "admin" }],
  };
}

function buildExactModel(): ModelVersionRow {
  return {
    id: "model-v1",
    version: sourceBundle.packageData.model.version,
    description: sourceBundle.packageData.model.description,
    weights_json: sourceBundle.packageData.model.weightsJson,
    is_active: true,
    created_at: sourceBundle.packageData.model.originalTimestamps.createdAt,
    updated_at: sourceBundle.packageData.model.originalTimestamps.updatedAt,
  };
}

function buildExactCompleteSnapshot(): Task1cStageImportSnapshot {
  const matches = buildBaseMatches({ forceAccessScope: "public" });
  const predictions: Array<PredictionVersionRow & { model_version: ModelVersionRow | null }> =
    sourceBundle.packageData.predictions.map((prediction) => ({
      id: `prediction-${prediction.canonicalSlug}`,
      match_id: matches.find((match) => match.slug === prediction.canonicalSlug)!.id,
      model_version_id: "model-v1",
      prediction_type: prediction.predictionType,
      home_win_prob: prediction.probabilities.homeWin,
      draw_prob: prediction.probabilities.draw,
      away_win_prob: prediction.probabilities.awayWin,
      expected_home_goals: prediction.expectedGoals.home,
      expected_away_goals: prediction.expectedGoals.away,
      most_likely_score: prediction.mostLikelyScore,
      top_scores_json: prediction.topScoresJson,
      confidence_score: prediction.confidenceScore,
      risk_level: prediction.riskLevel,
      run_scope: prediction.runScope,
      created_at: prediction.originalTimestamps.createdAt,
      model_version: buildExactModel(),
    }));
  const predictionBySlug = new Map(predictions.map((prediction) => [matches.find((match) => match.id === prediction.match_id)!.slug, prediction]));

  const markets: PredictionMarketRow[] = sourceBundle.packageData.predictionMarkets.map((market) => ({
    id: `market-${market.sourceLineage.sourceMarketRef}`,
    prediction_version_id: predictionBySlug.get(market.canonicalSlug)!.id,
    market: market.market,
    selection: market.selection,
    probability: market.probability,
    confidence: market.confidence,
    is_premium: market.isPremium,
    created_at: market.originalTimestamps.createdAt,
  }));

  const publicSummaries = sourceBundle.packageData.predictions.map((prediction) => ({
    match_slug: prediction.canonicalSlug,
    kickoff_at: sourceBundle.manifestData.fixtures.find((fixture) => fixture.canonicalSlug === prediction.canonicalSlug)!.kickoffAt,
    competition_slug: "world-cup-2026",
    prediction_created_at: prediction.originalTimestamps.createdAt,
    home_win_prob: prediction.probabilities.homeWin,
    draw_prob: prediction.probabilities.draw,
    away_win_prob: prediction.probabilities.awayWin,
    confidence_score: prediction.confidenceScore,
    risk_level: prediction.riskLevel,
  }));

  return {
    ...buildFreshSnapshot({ forceAccessScope: "public" }),
    matches,
    modelVersions: [buildExactModel()],
    predictionVersions: predictions,
    predictionMarkets: markets,
    predictionNarratives: [],
    publicPredictionSummaries: publicSummaries,
  };
}

function makeReviewedArtifact(plan: ReturnType<typeof planTask1cStageV1Import>) {
  return structuredClone(plan);
}

function buildNoOpDatabaseAdapter() {
  return {
    async readSnapshot() {
      return buildFreshSnapshot();
    },
    async applyImportPlan() {
      throw new Error("should not be called");
    },
  };
}

describe("task1c stage v1 import", () => {
  it("loads the canonical frozen source with exact 1/24/240/0 cardinality and immutable market composition", () => {
    expect(sourceBundle.packageSha256).toBe(
      "bdb8a3bc57734f97f826a6988c009c646a62e3a0036f6f10fb214e113dbc8416",
    );
    expect(sourceBundle.packageData.expectedCounts).toMatchObject({
      models: 1,
      fixtures: 24,
      predictions: 24,
      markets: 240,
      exactScoreMarkets: 72,
      narratives: 0,
    });

    for (const fixture of sourceBundle.packageData.fixtureManifest) {
      const markets = sourceBundle.packageData.predictionMarkets.filter((market) => market.canonicalSlug === fixture.canonicalSlug);
      expect(markets.filter((market) => market.market === "match_winner")).toHaveLength(3);
      expect(markets.filter((market) => market.market === "btts")).toHaveLength(2);
      expect(markets.filter((market) => market.market === "over_2_5")).toHaveLength(2);
      expect(markets.filter((market) => market.market === "exact_score")).toHaveLength(3);
      expect(markets.every((market) => market.isPremium === false)).toBe(true);
    }
  });

  it("proves 24 unique API-Football fixture identities in the frozen manifest", () => {
    const providerIds = sourceBundle.manifestData.fixtures.map((fixture) => fixture.apiFootballFixtureId);
    const slugs = sourceBundle.manifestData.fixtures.map((fixture) => fixture.canonicalSlug);

    expect(providerIds).toHaveLength(24);
    expect(new Set(providerIds).size).toBe(24);
    expect(new Set(slugs).size).toBe(24);
  });

  it("accepts canonical LF and CRLF-equivalent frozen artifacts but rejects semantic checksum tampering", () => {
    const workspace = registerCleanup(path.join(os.tmpdir(), `task1c-import-crlf-${Date.now()}`));
    fs.mkdirSync(workspace, { recursive: true });

    for (const filename of [
      "ufo-frozen-v1-source-package-v1.json",
      "frozen-source-manifest.json",
      "validation-report.json",
      "checksums.json",
      "run-report.json",
    ]) {
      const sourcePath = path.join(sourceBundle.artifactDirectory, filename);
      const targetPath = path.join(workspace, filename);
      const raw = fs.readFileSync(sourcePath, "utf8");
      fs.writeFileSync(targetPath, raw.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n"), "utf8");
    }

    const crlfBundle = loadTask1cStageV1ImportSourceBundle({
      repoRoot,
      artifactDirectory: workspace,
    });
    expect(crlfBundle.packageSha256).toBe(sourceBundle.packageSha256);
    expect(crlfBundle.lineEndingCompatibility.package).toBe("normalized_crlf");

    fs.writeFileSync(
      path.join(workspace, "ufo-frozen-v1-source-package-v1.json"),
      fs
        .readFileSync(path.join(workspace, "ufo-frozen-v1-source-package-v1.json"), "utf8")
        .replace('"version": "v0.2-prelaunch"', '"version": "v0.2-prelaunch-tampered"'),
      "utf8",
    );

    expect(() =>
      loadTask1cStageV1ImportSourceBundle({
        repoRoot,
        artifactDirectory: workspace,
      }),
    ).toThrow(/checksum/i);
  });

  it("maps deterministically by API-Football external identity and derives fresh-plan publication counts from stage state", () => {
    const snapshot = buildFreshSnapshot({ publicEvery: 2 });
    const plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot,
    });

    expect(plan.expectedPriorState).toBe("fresh");
    expect(plan.summary.expectedFirstApplyCounts.modelInserts).toBe(1);
    expect(plan.summary.expectedFirstApplyCounts.predictionInserts).toBe(24);
    expect(plan.summary.expectedFirstApplyCounts.marketInserts).toBe(240);
    expect(plan.summary.expectedFirstApplyCounts.matchPublications).toBe(12);
    expect(plan.rows.every((row) => row.expectedExternalId === `api-football:fixture:${row.apiFootballFixtureId}`)).toBe(true);
    expect(plan.predictionPayloads.every((payload) => uuidPattern.test(payload.match_id))).toBe(true);
    expect(plan.marketPayloads.every((payload) => uuidPattern.test(payload.match_id))).toBe(true);
    expect(plan.predictionPayloads.every((payload) => !payload.source_prediction_ref.startsWith("match-"))).toBe(true);
    expect(plan.marketPayloads.every((payload) => !payload.source_market_ref.startsWith("match-"))).toBe(true);
    expect(
      plan.accessScopePublications.every((publication) =>
        plan.rows.some((row) => row.stageMatchId === publication.match_id && row.canonicalSlug === publication.slug),
      ),
    ).toBe(true);
  });

  it("produces an exact-complete no-op plan and verification proof on rerun", () => {
    const snapshot = buildExactCompleteSnapshot();
    const plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot,
    });
    const verification = verifyTask1cStageV1ImportState({
      sourceBundle,
      snapshot,
    });

    expect(plan.expectedPriorState).toBe("exact_complete");
    expect(plan.summary.expectedFirstApplyCounts).toMatchObject({
      modelInserts: 0,
      predictionInserts: 0,
      marketInserts: 0,
      matchPublications: 0,
    });
    expect(verification.exact).toBe(true);
    expect(verification.summary.publicPredictionSummaryCount).toBe(24);
  });

  it("blocks partial or conflicting states: inactive model, other active model, narratives, and is_premium drift", () => {
    const inactiveModelSnapshot = buildFreshSnapshot();
    inactiveModelSnapshot.modelVersions = [{ ...buildExactModel(), is_active: false }];
    let plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: inactiveModelSnapshot,
    });
    expect(plan.expectedPriorState).toBe("partial_or_conflicting");
    expect(plan.conflicts.some((conflict) => conflict.includes("inactive"))).toBe(true);

    const otherActiveModelSnapshot = buildFreshSnapshot();
    otherActiveModelSnapshot.modelVersions = [
      {
        ...buildExactModel(),
        id: "model-other",
        version: "v0.3-other",
      },
    ];
    plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: otherActiveModelSnapshot,
    });
    expect(plan.expectedPriorState).toBe("partial_or_conflicting");
    expect(plan.conflicts.some((conflict) => conflict.includes("Another active model"))).toBe(true);

    const narrativeSnapshot = buildExactCompleteSnapshot();
    narrativeSnapshot.predictionNarratives.push({
      id: "narrative-1",
      prediction_version_id: narrativeSnapshot.predictionVersions[0]!.id,
      locale: "en",
      free_summary: "forbidden",
      premium_analysis: null,
      why_it_changed: null,
      risk_notes: null,
      created_at: "2026-06-26T00:00:00Z",
    });
    plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: narrativeSnapshot,
    });
    expect(plan.expectedPriorState).toBe("partial_or_conflicting");

    const premiumSnapshot = buildExactCompleteSnapshot();
    premiumSnapshot.predictionMarkets[0] = {
      ...premiumSnapshot.predictionMarkets[0]!,
      is_premium: true,
    };
    plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: premiumSnapshot,
    });
    expect(plan.expectedPriorState).toBe("partial_or_conflicting");
  });

  it("blocks partial or conflicting states: timestamp drift, partial predictions, partial markets, and unsafe publication", () => {
    const timestampSnapshot = buildExactCompleteSnapshot();
    timestampSnapshot.predictionVersions[0] = {
      ...timestampSnapshot.predictionVersions[0]!,
      created_at: "2026-06-30T00:00:00Z",
    };
    let plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: timestampSnapshot,
    });
    expect(plan.expectedPriorState).toBe("partial_or_conflicting");

    const partialPredictionSnapshot = buildFreshSnapshot();
    const firstPayload = sourceBundle.packageData.predictions[0]!;
    partialPredictionSnapshot.modelVersions = [buildExactModel()];
    partialPredictionSnapshot.predictionVersions = [
      {
        id: "prediction-one",
        match_id: partialPredictionSnapshot.matches[0]!.id,
        model_version_id: "model-v1",
        prediction_type: firstPayload.predictionType,
        home_win_prob: firstPayload.probabilities.homeWin,
        draw_prob: firstPayload.probabilities.draw,
        away_win_prob: firstPayload.probabilities.awayWin,
        expected_home_goals: firstPayload.expectedGoals.home,
        expected_away_goals: firstPayload.expectedGoals.away,
        most_likely_score: firstPayload.mostLikelyScore,
        top_scores_json: firstPayload.topScoresJson,
        confidence_score: firstPayload.confidenceScore,
        risk_level: firstPayload.riskLevel,
        run_scope: firstPayload.runScope,
        created_at: firstPayload.originalTimestamps.createdAt,
        model_version: buildExactModel(),
      },
    ];
    plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: partialPredictionSnapshot,
    });
    expect(plan.expectedPriorState).toBe("partial_or_conflicting");

    const partialMarketSnapshot = buildExactCompleteSnapshot();
    partialMarketSnapshot.predictionMarkets = partialMarketSnapshot.predictionMarkets.slice(0, 239);
    plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: partialMarketSnapshot,
    });
    expect(plan.expectedPriorState).toBe("partial_or_conflicting");

    const duplicateMarketSnapshot = buildExactCompleteSnapshot();
    const duplicateKeyMarket = duplicateMarketSnapshot.predictionMarkets[1]!;
    duplicateMarketSnapshot.predictionMarkets[0] = {
      ...duplicateMarketSnapshot.predictionMarkets[0]!,
      market: duplicateKeyMarket.market,
      selection: duplicateKeyMarket.selection,
    };
    plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: duplicateMarketSnapshot,
    });
    expect(plan.expectedPriorState).toBe("partial_or_conflicting");

    const unsafePublicationSnapshot = buildFreshSnapshot();
    unsafePublicationSnapshot.matches[0] = {
      ...unsafePublicationSnapshot.matches[0]!,
      access_scope: "admin_only",
      status: "finished",
    };
    plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: unsafePublicationSnapshot,
    });
    expect(plan.expectedPriorState).toBe("partial_or_conflicting");
  });

  it("keeps all mutation scope strictly inside the exact 24 fixture set", () => {
    const snapshot = buildFreshSnapshot({ publicEvery: 4 });
    const plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot,
    });

    const plannedMatchIds = new Set(plan.rows.map((row) => row.stageMatchId).filter((value): value is string => Boolean(value)));
    const plannedSlugs = new Set(plan.rows.map((row) => row.canonicalSlug));

    expect(plan.rows).toHaveLength(24);
    expect(plan.predictionPayloads.every((payload) => plannedMatchIds.has(payload.match_id) && plannedSlugs.has(payload.canonical_slug))).toBe(true);
    expect(plan.marketPayloads.every((payload) => plannedMatchIds.has(payload.match_id) && plannedSlugs.has(payload.canonical_slug))).toBe(true);
    expect(plan.accessScopePublications.every((publication) => plannedMatchIds.has(publication.match_id))).toBe(true);
  });

  it("emits snake_case publication payload rows with 24 non-null stage match UUIDs when every fixture starts admin_only", () => {
    const plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: buildFreshSnapshot(),
    });

    expect(plan.accessScopePublications).toHaveLength(24);
    expect(
      plan.accessScopePublications.every((publication) =>
        Object.prototype.hasOwnProperty.call(publication, "match_id") &&
        Object.prototype.hasOwnProperty.call(publication, "current_access_scope") &&
        Object.prototype.hasOwnProperty.call(publication, "next_access_scope") &&
        !Object.prototype.hasOwnProperty.call(publication, "matchId") &&
        !Object.prototype.hasOwnProperty.call(publication, "currentAccessScope") &&
        !Object.prototype.hasOwnProperty.call(publication, "nextAccessScope") &&
        uuidPattern.test(publication.match_id) &&
        publication.current_access_scope === "admin_only" &&
        publication.next_access_scope === "public",
      ),
    ).toBe(true);
  });

  it("keeps the SQL publication extractor aligned with the TypeScript snake_case payload contract", () => {
    expect(publicationSql).toMatch(/entry\.value ->> 'match_id'/);
    expect(publicationSql).toMatch(/entry\.value ->> 'current_access_scope'/);
    expect(publicationSql).toMatch(/entry\.value ->> 'next_access_scope'/);
    expect(publicationSql).toMatch(/publication payload must use non-null snake_case keys match_id, slug, current_access_scope, and next_access_scope/i);
    expect(publicationSql).toMatch(/duplicate match_id values/i);
    expect(publicationSql).toMatch(/referenced an unknown or out-of-scope stage match/i);
    expect(publicationSql).toMatch(/did not exactly match the required admin_only publication set/i);
    expect(publicationSql).toMatch(/full outer join task1c_stage_v1_import_publications as actual/i);
  });

  it("validates publication rows before any real-table mutation statements in the SQL function", () => {
    const nullCheckIndex = publicationSql.indexOf("publication payload must use non-null snake_case keys");
    const duplicateCheckIndex = publicationSql.indexOf("duplicate match_id values");
    const unknownCheckIndex = publicationSql.indexOf("referenced an unknown or out-of-scope stage match");
    const exactSetCheckIndex = publicationSql.indexOf("did not exactly match the required admin_only publication set");
    const firstModelInsertIndex = publicationSql.indexOf("insert into public.model_versions");

    expect(nullCheckIndex).toBeGreaterThan(-1);
    expect(duplicateCheckIndex).toBeGreaterThan(nullCheckIndex);
    expect(unknownCheckIndex).toBeGreaterThan(duplicateCheckIndex);
    expect(exactSetCheckIndex).toBeGreaterThan(unknownCheckIndex);
    expect(firstModelInsertIndex).toBeGreaterThan(exactSetCheckIndex);
  });

  it("produces a stable reviewed plan hash and rejects reviewed-plan tampering", async () => {
    const plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: buildFreshSnapshot(),
    });
    const tampered = makeReviewedArtifact(plan);
    tampered.marketPayloads[0] = {
      ...tampered.marketPayloads[0]!,
      is_premium: true,
    };

    await expect(
      applyTask1cStageV1ImportPlan({
        authorization: buildAuthorization(true),
        sourceBundle,
        currentPlan: {
          ...plan,
          mode: "apply",
        },
        reviewArtifact: tampered,
        databaseAdapter: {
          async readSnapshot() {
            return buildFreshSnapshot();
          },
          async applyImportPlan() {
            throw new Error("not reached");
          },
        },
      }),
    ).rejects.toThrow(/stable plan checksum|premium/i);
  });

  it("accepts reviewed-plan binding when only generatedAt and artifact source paths differ", async () => {
    const plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: buildFreshSnapshot(),
    });
    const reviewedArtifact = makeReviewedArtifact(plan);
    reviewedArtifact.generatedAt = "2026-06-27T05:41:25.057Z";
    reviewedArtifact.sourceArtifacts = {
      ...reviewedArtifact.sourceArtifacts,
      artifactDirectory: "D:/different/review-dir",
      packagePath: "D:/different/review-dir/package.json",
      manifestPath: "D:/different/review-dir/manifest.json",
      validationPath: "D:/different/review-dir/validation.json",
      checksumsPath: "D:/different/review-dir/checksums.json",
      runReportPath: "D:/different/review-dir/run-report.json",
    };

    await expect(
      applyTask1cStageV1ImportPlan({
        authorization: buildAuthorization(true),
        sourceBundle,
        currentPlan: {
          ...plan,
          mode: "apply",
        },
        reviewArtifact: {
          ...reviewedArtifact,
          mode: "dry_run",
        },
        databaseAdapter: buildNoOpDatabaseAdapter(),
      }),
    ).rejects.toThrow("should not be called");
  });

  it("accepts a legacy reviewed artifact publication casing but normalizes the RPC payload to snake_case", async () => {
    const plan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: buildFreshSnapshot(),
    });
    const legacyReviewedArtifact = makeReviewedArtifact(plan) as ReturnType<typeof planTask1cStageV1Import> & {
      accessScopePublications: Array<Record<string, string>>;
    };
    legacyReviewedArtifact.accessScopePublications = legacyReviewedArtifact.accessScopePublications.map((publication) => ({
      matchId: publication.match_id,
      slug: publication.slug,
      currentAccessScope: publication.current_access_scope,
      nextAccessScope: publication.next_access_scope,
    }));

    const appliedArtifacts: Array<ReturnType<typeof planTask1cStageV1Import>> = [];

    const result = await applyTask1cStageV1ImportPlan({
      authorization: buildAuthorization(true),
      sourceBundle,
      currentPlan: {
        ...plan,
        mode: "apply",
      },
      reviewArtifact: legacyReviewedArtifact as ReturnType<typeof planTask1cStageV1Import>,
      databaseAdapter: {
        async readSnapshot() {
          return buildFreshSnapshot();
        },
        async applyImportPlan(reviewArtifact) {
          appliedArtifacts.push(reviewArtifact);
          return {
            requestedState: "fresh",
            modelInsertedCount: 1,
            predictionInsertedCount: 24,
            marketInsertedCount: 240,
            narrativeInsertedCount: 0,
            modelActivatedCount: 1,
            matchPublishedCount: reviewArtifact.accessScopePublications.length,
            alreadyPresentModelCount: 0,
            alreadyPresentPredictionCount: 0,
            alreadyPresentMarketCount: 0,
            alreadyPublicMatchCount: 24,
          };
        },
      },
    });

    expect(result?.matchPublishedCount).toBe(24);
    expect(appliedArtifacts).toHaveLength(1);
    expect(
      appliedArtifacts[0]!.accessScopePublications.every((publication) =>
        Object.prototype.hasOwnProperty.call(publication, "match_id") &&
        !Object.prototype.hasOwnProperty.call(publication, "matchId") &&
        publication.current_access_scope === "admin_only" &&
        publication.next_access_scope === "public",
      ),
    ).toBe(true);
  });

  it("still rejects reviewed-plan binding when semantic authorization or payload fields drift", async () => {
    const basePlan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: buildFreshSnapshot(),
    });

    const rejectionCases: Array<{
      name: string;
      mutateReviewedArtifact?: (artifact: ReturnType<typeof planTask1cStageV1Import>) => void;
      mutateCurrentPlan?: (plan: ReturnType<typeof planTask1cStageV1Import>) => void;
      expectedError: RegExp;
    }> = [
      {
        name: "changed target project ref",
        mutateReviewedArtifact: (artifact) => {
          artifact.targetProjectRef = "wrong-project-ref";
        },
        expectedError: /target binding differed/i,
      },
      {
        name: "changed denied production ref",
        mutateReviewedArtifact: (artifact) => {
          artifact.deniedProjectRef = "wrong-denied-ref";
        },
        expectedError: /target binding differed/i,
      },
      {
        name: "changed stage match UUID",
        mutateReviewedArtifact: (artifact) => {
          artifact.predictionPayloads[0] = {
            ...artifact.predictionPayloads[0]!,
            match_id: "match-tampered",
          };
        },
        expectedError: /stable plan checksum differed|did not match its contents/i,
      },
      {
        name: "changed external fixture ID",
        mutateReviewedArtifact: (artifact) => {
          artifact.rows[0] = {
            ...artifact.rows[0]!,
            apiFootballFixtureId: 999999999,
            expectedExternalId: "api-football:fixture:999999999",
          };
        },
        expectedError: /stable plan checksum differed|did not match its contents/i,
      },
      {
        name: "changed prediction probability",
        mutateReviewedArtifact: (artifact) => {
          artifact.predictionPayloads[0] = {
            ...artifact.predictionPayloads[0]!,
            home_win_prob: 0.999,
          };
        },
        expectedError: /stable plan checksum differed|did not match its contents/i,
      },
      {
        name: "changed prediction timestamp",
        mutateReviewedArtifact: (artifact) => {
          artifact.predictionPayloads[0] = {
            ...artifact.predictionPayloads[0]!,
            created_at: "2026-06-27T00:00:00.000Z",
          };
        },
        expectedError: /stable plan checksum differed|did not match its contents/i,
      },
      {
        name: "changed market probability",
        mutateReviewedArtifact: (artifact) => {
          artifact.marketPayloads[0] = {
            ...artifact.marketPayloads[0]!,
            probability: 0.999,
          };
        },
        expectedError: /stable plan checksum differed|did not match its contents/i,
      },
      {
        name: "changed is_premium",
        mutateReviewedArtifact: (artifact) => {
          artifact.marketPayloads[0] = {
            ...artifact.marketPayloads[0]!,
            is_premium: true,
          };
        },
        expectedError: /stable plan checksum differed|did not match its contents/i,
      },
      {
        name: "changed publication action",
        mutateReviewedArtifact: (artifact) => {
          artifact.rows[0] = {
            ...artifact.rows[0]!,
            accessScopeAction: "blocked",
          };
        },
        expectedError: /stable plan checksum differed|did not match its contents/i,
      },
      {
        name: "changed expected prior state",
        mutateReviewedArtifact: (artifact) => {
          artifact.expectedPriorState = "exact_complete";
        },
        expectedError: /stable plan checksum differed|did not match its contents/i,
      },
      {
        name: "changed expected mutation count",
        mutateReviewedArtifact: (artifact) => {
          artifact.summary = {
            ...artifact.summary,
            expectedFirstApplyCounts: {
              ...artifact.summary.expectedFirstApplyCounts,
              marketInserts: 239,
            },
          };
        },
        expectedError: /stable plan checksum differed|did not match its contents/i,
      },
      {
        name: "manually altered stored stablePlanSha256",
        mutateReviewedArtifact: (artifact) => {
          artifact.stablePlanSha256 = "deadbeef";
        },
        expectedError: /did not match its contents/i,
      },
      {
        name: "semantic payload changed while retaining the old stored SHA",
        mutateCurrentPlan: (plan) => {
          plan.marketPayloads[0] = {
            ...plan.marketPayloads[0]!,
            probability: 0.123,
          };
        },
        expectedError: /current stable plan checksum did not match its contents/i,
      },
    ];

    for (const rejectionCase of rejectionCases) {
      const reviewedArtifact = makeReviewedArtifact(basePlan);
      const currentPlan = {
        ...makeReviewedArtifact(basePlan),
        mode: "apply" as const,
      };
      rejectionCase.mutateReviewedArtifact?.(reviewedArtifact);
      rejectionCase.mutateCurrentPlan?.(currentPlan);

      await expect(
        applyTask1cStageV1ImportPlan({
          authorization: buildAuthorization(true),
          sourceBundle,
          currentPlan,
          reviewArtifact: {
            ...reviewedArtifact,
            mode: "dry_run",
          },
          databaseAdapter: buildNoOpDatabaseAdapter(),
        }),
        rejectionCase.name,
      ).rejects.toThrow(rejectionCase.expectedError);
    }
  });

  it("returns the atomic apply success contract for a fresh reviewed plan", async () => {
    const dryRunPlan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: buildFreshSnapshot({ publicEvery: 3 }),
    });
    const writes: Array<typeof dryRunPlan> = [];

    const result = await applyTask1cStageV1ImportPlan({
      authorization: buildAuthorization(true),
      sourceBundle,
      currentPlan: {
        ...dryRunPlan,
        mode: "apply",
      },
      reviewArtifact: makeReviewedArtifact(dryRunPlan),
      databaseAdapter: {
        async readSnapshot() {
          return buildFreshSnapshot({ publicEvery: 3 });
        },
        async applyImportPlan(reviewArtifact) {
          writes.push(reviewArtifact);
          return {
            requestedState: "fresh",
            modelInsertedCount: 1,
            predictionInsertedCount: 24,
            marketInsertedCount: 240,
            narrativeInsertedCount: 0,
            modelActivatedCount: 1,
            matchPublishedCount: reviewArtifact.accessScopePublications.length,
            alreadyPresentModelCount: 0,
            alreadyPresentPredictionCount: 0,
            alreadyPresentMarketCount: 0,
            alreadyPublicMatchCount: 8,
          };
        },
      },
    });

    expect(writes).toHaveLength(1);
    expect(result).toMatchObject({
      modelInsertedCount: 1,
      predictionInsertedCount: 24,
      marketInsertedCount: 240,
      matchPublishedCount: 16,
    });
  });

  it("treats an exact-complete reviewed plan as a zero-growth no-op apply", async () => {
    const dryRunPlan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: buildExactCompleteSnapshot(),
    });

    const result = await applyTask1cStageV1ImportPlan({
      authorization: buildAuthorization(true),
      sourceBundle,
      currentPlan: {
        ...dryRunPlan,
        mode: "apply",
      },
      reviewArtifact: makeReviewedArtifact(dryRunPlan),
      databaseAdapter: {
        async readSnapshot() {
          return buildExactCompleteSnapshot();
        },
        async applyImportPlan() {
          throw new Error("should not be called");
        },
      },
    });

    expect(result).toMatchObject({
      modelInsertedCount: 0,
      predictionInsertedCount: 0,
      marketInsertedCount: 0,
      alreadyPresentPredictionCount: 24,
      alreadyPresentMarketCount: 240,
    });
  });

  it("recovers ambiguous apply failures only when reread state is exact_complete", async () => {
    const dryRunPlan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: buildFreshSnapshot(),
    });
    let rereadCount = 0;

    const result = await applyTask1cStageV1ImportPlan({
      authorization: buildAuthorization(true),
      sourceBundle,
      currentPlan: {
        ...dryRunPlan,
        mode: "apply",
      },
      reviewArtifact: makeReviewedArtifact(dryRunPlan),
      databaseAdapter: {
        async readSnapshot() {
          rereadCount += 1;
          return rereadCount === 1 ? buildExactCompleteSnapshot() : buildExactCompleteSnapshot();
        },
        async applyImportPlan() {
          throw new Error("simulated timeout");
        },
      },
    });

    expect(result?.predictionInsertedCount).toBe(24);
  });

  it("fails closed on ambiguous apply failures when reread state is still fresh or mixed", async () => {
    const dryRunPlan = planTask1cStageV1Import({
      authorization: buildAuthorization(false),
      sourceBundle,
      snapshot: buildFreshSnapshot(),
    });

    await expect(
      applyTask1cStageV1ImportPlan({
        authorization: buildAuthorization(true),
        sourceBundle,
        currentPlan: {
          ...dryRunPlan,
          mode: "apply",
        },
        reviewArtifact: makeReviewedArtifact(dryRunPlan),
        databaseAdapter: {
          async readSnapshot() {
            return buildFreshSnapshot();
          },
          async applyImportPlan() {
            throw new Error("simulated timeout");
          },
        },
      }),
    ).rejects.toThrow(/safe to retry/i);

    const mixedSnapshot = buildFreshSnapshot();
    mixedSnapshot.matches[0] = {
      ...mixedSnapshot.matches[0]!,
      status: "finished",
    };

    await expect(
      applyTask1cStageV1ImportPlan({
        authorization: buildAuthorization(true),
        sourceBundle,
        currentPlan: {
          ...dryRunPlan,
          mode: "apply",
        },
        reviewArtifact: makeReviewedArtifact(dryRunPlan),
        databaseAdapter: {
          async readSnapshot() {
            return mixedSnapshot;
          },
          async applyImportPlan() {
            throw new Error("simulated timeout");
          },
        },
      }),
    ).rejects.toThrow(/manual reconciliation required/i);
  });

  it("requires service-role-only SQL permissions and an advisory transaction lock in the migration", () => {
    const migration = fs.readFileSync(
      path.join(repoRoot, "supabase", "migrations", "20260626233000_task1c_stage_v1_import_apply.sql"),
      "utf8",
    );

    expect(migration).toMatch(/pg_advisory_xact_lock/);
    expect(migration).toMatch(/revoke execute on function public\.apply_task1c_stage_v1_import\(jsonb\) from public/i);
    expect(migration).toMatch(/revoke execute on function public\.apply_task1c_stage_v1_import\(jsonb\) from anon/i);
    expect(migration).toMatch(/revoke execute on function public\.apply_task1c_stage_v1_import\(jsonb\) from authenticated/i);
    expect(migration).toMatch(/grant execute on function public\.apply_task1c_stage_v1_import\(jsonb\) to service_role/i);
  });
});
