import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type {
  MatchRow,
  ModelVersionRow,
  PredictionMarketRow,
  PredictionNarrativeRow,
  PredictionVersionRow,
} from "../../types/database";
import {
  MATCH_SELECT_COLUMNS,
  MARKET_SELECT_COLUMNS,
  MODEL_SELECT_COLUMNS,
  NARRATIVE_SELECT_COLUMNS,
  PREDICTION_SELECT_COLUMNS,
  PUBLIC_SUMMARY_SELECT_COLUMNS,
  assertFrozenArtifactChecksums,
  assertApprovedFixtureIdentity,
  assertExactFixtureAllowlist,
  assertFrozenSourceAuthorization,
  compareFrozenPackageWithOfficialUfoExport,
  createProductionFrozenV1SourceReader,
  deriveFrozenValidationOutcome,
  getCanonicalMatchday3Fixtures,
  getFrozenV1ReadOnlyMethodNames,
  runTask1cFrozenV1SourcePackage,
  type FrozenV1SourceReader,
  type OfficialUfoExportFixture,
  type PublicPredictionSummaryRow,
} from "./task1c-frozen-v1-source-package";

const cleanupPaths = new Set<string>();

function registerCleanup(targetPath: string): string {
  cleanupPaths.add(targetPath);
  return targetPath;
}

afterEach(() => {
  for (const targetPath of cleanupPaths) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
  cleanupPaths.clear();
});

function createFixtureRows() {
  const fixtures = getCanonicalMatchday3Fixtures();
  const model: ModelVersionRow = {
    id: "ce7b48f9-7687-485e-9aee-c83c549a942f",
    version: "v0.2-prelaunch",
    description: "Prelaunch national-team fallback calibration for Real Fixture Lab comparisons.",
    weights_json: {
      calibrationVersion: "v1",
      xgVersion: "prelaunch",
    },
    is_active: true,
    created_at: "2026-06-09T10:06:13.132362+00:00",
    updated_at: "2026-06-09T10:06:13.132362+00:00",
  };

  const matches: MatchRow[] = fixtures.map((fixture, index) => ({
    id: `source-match-${String(fixture.matchNumber).padStart(3, "0")}`,
    external_id: fixture.apiFootballExternalId,
    slug: fixture.matchSlug,
    competition_id: "source-competition-world-cup-2026",
    season_id: "source-season-world-cup-2026",
    home_team_id: `source-home-team-${fixture.homeTeamKey}`,
    away_team_id: `source-away-team-${fixture.awayTeamKey}`,
    venue_id: null,
    kickoff_at: fixture.kickoffAt,
    stage: "group_stage",
    status: "scheduled",
    access_scope: "public",
    lab_status: "ready",
    intake_source: "api_football",
    data_quality: "verified",
    source_note: null,
    reviewed_at: null,
    reviewed_by: null,
    created_at: `2026-06-${String(10 + (index % 10)).padStart(2, "0")}T10:00:00.000Z`,
    updated_at: `2026-06-${String(10 + (index % 10)).padStart(2, "0")}T11:00:00.000Z`,
  }));

  const predictions: PredictionVersionRow[] = matches.map((match, index) => ({
    id: `source-prediction-${String(index + 1).padStart(3, "0")}`,
    match_id: match.id,
    model_version_id: model.id,
    prediction_type: "pre_match_24h",
    home_win_prob: Number((0.41 + index * 0.001).toFixed(3)),
    draw_prob: Number((0.29 + index * 0.001).toFixed(3)),
    away_win_prob: Number((0.30 - index * 0.001).toFixed(3)),
    expected_home_goals: Number((1.4 + index * 0.01).toFixed(2)),
    expected_away_goals: Number((1.1 + index * 0.01).toFixed(2)),
    most_likely_score: `${1 + (index % 2)}-${index % 2}`,
    top_scores_json: [
      { score: "1-0", probability: 0.12 },
      { score: "1-1", probability: 0.11 },
      { score: "2-1", probability: 0.09 },
    ],
    confidence_score: Number((0.63 + index * 0.002).toFixed(3)),
    risk_level: index % 3 === 0 ? "low" : index % 3 === 1 ? "medium" : "high",
    run_scope: "public_product",
    created_at: `2026-06-${String(20 + (index % 5)).padStart(2, "0")}T09:00:00.000Z`,
  }));

  const markets: PredictionMarketRow[] = predictions.flatMap((prediction, index) => {
    const base = Number((0.4 + index * 0.001).toFixed(3));
    return [
      { id: `${prediction.id}-m1`, prediction_version_id: prediction.id, market: "match_winner", selection: "home", probability: base, confidence: 0.7, is_premium: false, created_at: prediction.created_at },
      { id: `${prediction.id}-m2`, prediction_version_id: prediction.id, market: "match_winner", selection: "draw", probability: 0.3, confidence: 0.6, is_premium: false, created_at: prediction.created_at },
      { id: `${prediction.id}-m3`, prediction_version_id: prediction.id, market: "match_winner", selection: "away", probability: 0.3 - index * 0.001, confidence: 0.6, is_premium: false, created_at: prediction.created_at },
      { id: `${prediction.id}-m4`, prediction_version_id: prediction.id, market: "btts", selection: "yes", probability: 0.52, confidence: null, is_premium: false, created_at: prediction.created_at },
      { id: `${prediction.id}-m5`, prediction_version_id: prediction.id, market: "btts", selection: "no", probability: 0.48, confidence: null, is_premium: false, created_at: prediction.created_at },
      { id: `${prediction.id}-m6`, prediction_version_id: prediction.id, market: "over_2_5", selection: "over", probability: 0.49, confidence: 0.55, is_premium: false, created_at: prediction.created_at },
      { id: `${prediction.id}-m7`, prediction_version_id: prediction.id, market: "over_2_5", selection: "under", probability: 0.51, confidence: 0.55, is_premium: false, created_at: prediction.created_at },
      { id: `${prediction.id}-m8`, prediction_version_id: prediction.id, market: "exact_score", selection: "1-0", probability: 0.12, confidence: null, is_premium: false, created_at: prediction.created_at },
      { id: `${prediction.id}-m9`, prediction_version_id: prediction.id, market: "exact_score", selection: "1-1", probability: 0.11, confidence: null, is_premium: false, created_at: prediction.created_at },
      { id: `${prediction.id}-m10`, prediction_version_id: prediction.id, market: "exact_score", selection: "2-1", probability: 0.09, confidence: null, is_premium: false, created_at: prediction.created_at },
    ];
  });

  const narratives: PredictionNarrativeRow[] = [];
  const publicSummaries: PublicPredictionSummaryRow[] = predictions.map((prediction) => {
    const match = matches.find((row) => row.id === prediction.match_id)!;
    return {
      match_slug: match.slug,
      kickoff_at: match.kickoff_at,
      competition_slug: "world-cup-2026",
      prediction_created_at: prediction.created_at,
      home_win_prob: prediction.home_win_prob,
      draw_prob: prediction.draw_prob,
      away_win_prob: prediction.away_win_prob,
      confidence_score: prediction.confidence_score,
      risk_level: prediction.risk_level,
    };
  });

  return { fixtures, model, matches, predictions, markets, narratives, publicSummaries };
}

function createReader(overrides?: Partial<ReturnType<typeof createFixtureRows>>): FrozenV1SourceReader {
  const rows = { ...createFixtureRows(), ...overrides };

  return {
    async fetchModelByVersion(version) {
      return rows.model.version === version ? [rows.model] : [];
    },
    async fetchMatchesBySlugs(slugs) {
      return rows.matches.filter((match) => slugs.includes(match.slug));
    },
    async fetchPredictionsByMatchIds(matchIds, modelVersionId) {
      return rows.predictions.filter(
        (prediction) =>
          matchIds.includes(prediction.match_id) &&
          prediction.model_version_id === modelVersionId &&
          prediction.prediction_type === "pre_match_24h" &&
          prediction.run_scope === "public_product",
      );
    },
    async fetchPredictionsByIds(predictionIds) {
      return rows.predictions.filter((prediction) => predictionIds.includes(prediction.id));
    },
    async fetchMatchesByIds(matchIds) {
      return rows.matches.filter((match) => matchIds.includes(match.id));
    },
    async fetchModelById(modelId) {
      return rows.model.id === modelId ? rows.model : null;
    },
    async fetchMarketsByPredictionIds(predictionIds) {
      return rows.markets.filter((market) => predictionIds.includes(market.prediction_version_id));
    },
    async fetchMarketsByIds(marketIds) {
      return rows.markets.filter((market) => marketIds.includes(market.id));
    },
    async fetchNarrativesByPredictionIds(predictionIds) {
      return rows.narratives.filter((narrative) => predictionIds.includes(narrative.prediction_version_id));
    },
    async fetchPublicSummariesByMatchSlugs(slugs) {
      return rows.publicSummaries.filter((summary) => slugs.includes(summary.match_slug));
    },
  };
}

async function expectRunToFail(reader: FrozenV1SourceReader, message?: RegExp | string) {
  await expect(
    runTask1cFrozenV1SourcePackage(
      {
        repoRoot: process.cwd(),
        artifactsDir: registerCleanup(path.join(os.tmpdir(), `task1c-${Date.now()}-${Math.random().toString(16).slice(2)}`)),
        projectRef: "gcpdffkgsdomzyoenalg",
        denyProjectRef: "yfmklapgjrupctgxaako",
        supabaseUrl: "https://gcpdffkgsdomzyoenalg.supabase.co",
      },
      reader,
    ),
  ).rejects.toThrow(message);
}

function buildOfficialExportFixtures(rows = createFixtureRows()): OfficialUfoExportFixture[] {
  return rows.fixtures.map((fixture, index) => {
    const prediction = rows.predictions[index]!;
    return {
      externalId: fixture.apiFootballExternalId,
      fixtureId: fixture.apiFootballFixtureId as number,
      slug: fixture.matchSlug,
      kickoffAt: fixture.kickoffAt,
      stage: "Group Stage - 3",
      homeTeam: fixture.homeTeamKey === "cote-divoire" ? "Ivory Coast" : fixture.homeTeamKey === "congo-dr" ? "Congo DR" : rows.matches[index]!.slug.includes("curacao") ? "Curaçao" : fixture.homeTeamKey.split("-").map((part) => part[0]!.toUpperCase() + part.slice(1)).join(" "),
      awayTeam: fixture.awayTeamKey === "cote-divoire" ? "Ivory Coast" : fixture.awayTeamKey === "congo-dr" ? "Congo DR" : fixture.awayTeamKey === "curacao" ? "Curaçao" : fixture.awayTeamKey.split("-").map((part) => part[0]!.toUpperCase() + part.slice(1)).join(" "),
      prediction: {
        homeWinProbability: prediction.home_win_prob,
        drawProbability: prediction.draw_prob,
        awayWinProbability: prediction.away_win_prob,
        confidenceScore: prediction.confidence_score,
        riskLevel: prediction.risk_level,
        mostLikelyScore: prediction.most_likely_score,
        expectedGoals: {
          home: prediction.expected_home_goals,
          away: prediction.expected_away_goals,
        },
        topScorelines: (prediction.top_scores_json as Array<{ score: string; probability: number }>).map((entry) => ({
          score: entry.score,
          probability: entry.probability,
        })),
      },
    };
  });
}

describe("task1c frozen v1 source package", () => {
  it("rejects an unbounded fixture selection outside the exact 24-fixture allowlist", () => {
    const fixtures = getCanonicalMatchday3Fixtures();
    expect(() =>
      assertExactFixtureAllowlist(
        fixtures.slice(0, fixtures.length - 1).map((fixture) => ({
          matchNumber: fixture.matchNumber,
          matchSlug: fixture.matchSlug,
        })),
      ),
    ).toThrow();
  });

  it("accepts all 24 approved Matchday 3 identities", () => {
    const fixtures = getCanonicalMatchday3Fixtures();
    for (const fixture of fixtures) {
      expect(() =>
        assertApprovedFixtureIdentity({
          matchNumber: fixture.matchNumber,
          canonicalSlug: fixture.matchSlug,
          apiFootballFixtureId: fixture.apiFootballFixtureId as number,
          canonicalHomeTeamKey: fixture.homeTeamKey,
          canonicalAwayTeamKey: fixture.awayTeamKey,
          kickoffAt: fixture.kickoffAt,
        }),
      ).not.toThrow();
    }
  });

  it("rejects a slug match with the wrong provider fixture id", () => {
    const fixture = getCanonicalMatchday3Fixtures()[0];
    expect(() =>
      assertApprovedFixtureIdentity({
        matchNumber: fixture.matchNumber,
        canonicalSlug: fixture.matchSlug,
        apiFootballFixtureId: fixture.apiFootballFixtureId! + 1,
        canonicalHomeTeamKey: fixture.homeTeamKey,
        canonicalAwayTeamKey: fixture.awayTeamKey,
        kickoffAt: fixture.kickoffAt,
      }),
    ).toThrow(/apiFootballFixtureId/);
  });

  it("rejects a provider fixture id match with the wrong home or away identity", () => {
    const fixture = getCanonicalMatchday3Fixtures()[0];
    expect(() =>
      assertApprovedFixtureIdentity({
        matchNumber: fixture.matchNumber,
        canonicalSlug: fixture.matchSlug,
        apiFootballFixtureId: fixture.apiFootballFixtureId as number,
        canonicalHomeTeamKey: fixture.awayTeamKey,
        canonicalAwayTeamKey: fixture.homeTeamKey,
        kickoffAt: fixture.kickoffAt,
      }),
    ).toThrow(/canonicalHomeTeamKey|canonicalAwayTeamKey/);
  });

  it("rejects a correct slug and teams combination with the wrong kickoff instant", () => {
    const fixture = getCanonicalMatchday3Fixtures()[0];
    expect(() =>
      assertApprovedFixtureIdentity({
        matchNumber: fixture.matchNumber,
        canonicalSlug: fixture.matchSlug,
        apiFootballFixtureId: fixture.apiFootballFixtureId as number,
        canonicalHomeTeamKey: fixture.homeTeamKey,
        canonicalAwayTeamKey: fixture.awayTeamKey,
        kickoffAt: "2026-06-24T23:00:00Z",
      }),
    ).toThrow(/kickoffAt/);
  });

  it("uses production-only source authorization and denies the stage project as a source", () => {
    expect(() =>
      assertFrozenSourceAuthorization({
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "yfmklapgjrupctgxaako",
        supabaseUrl: "https://yfmklapgjrupctgxaako.supabase.co",
      }),
    ).toThrow();

    expect(
      assertFrozenSourceAuthorization({
        projectRef: "gcpdffkgsdomzyoenalg",
        denyProjectRef: "yfmklapgjrupctgxaako",
        supabaseUrl: "https://gcpdffkgsdomzyoenalg.supabase.co",
      }).sourceProjectRef,
    ).toBe("gcpdffkgsdomzyoenalg");
  });

  it("exposes a read-only extraction interface with no mutation operations", () => {
    const methodNames = getFrozenV1ReadOnlyMethodNames(createProductionFrozenV1SourceReader());
    expect(methodNames).toEqual([
      "fetchMarketsByIds",
      "fetchMarketsByPredictionIds",
      "fetchMatchesByIds",
      "fetchMatchesBySlugs",
      "fetchModelById",
      "fetchModelByVersion",
      "fetchNarrativesByPredictionIds",
      "fetchPredictionsByIds",
      "fetchPredictionsByMatchIds",
      "fetchPublicSummariesByMatchSlugs",
    ]);
    expect(methodNames.some((name) => /(insert|update|upsert|delete|rpc|storage)/i.test(name))).toBe(false);
  });

  it("uses explicit projections only", () => {
    for (const columns of [
      MATCH_SELECT_COLUMNS,
      MODEL_SELECT_COLUMNS,
      PREDICTION_SELECT_COLUMNS,
      MARKET_SELECT_COLUMNS,
      NARRATIVE_SELECT_COLUMNS,
      PUBLIC_SUMMARY_SELECT_COLUMNS,
    ]) {
      expect(columns.some((column) => column.includes("*"))).toBe(false);
    }
  });

  it("omits privacy-adjacent review fields from the match projection", () => {
    expect(MATCH_SELECT_COLUMNS).not.toContain("reviewed_by");
    expect(MATCH_SELECT_COLUMNS).not.toContain("source_note");
    expect(MATCH_SELECT_COLUMNS).not.toContain("reviewed_at");
  });

  it("omits result and evaluation fields from the public-summary projection", () => {
    expect(PUBLIC_SUMMARY_SELECT_COLUMNS).not.toContain("verified_home_goals");
    expect(PUBLIC_SUMMARY_SELECT_COLUMNS).not.toContain("verified_away_goals");
    expect(PUBLIC_SUMMARY_SELECT_COLUMNS).not.toContain("result_verification_status");
  });

  it("fails closed on duplicate provider fixture ids in the 24-match source set", async () => {
    const rows = createFixtureRows();
    const duplicateProviderMatches = rows.matches.map((match, index) =>
      index === 1 ? { ...match, external_id: rows.matches[0].external_id } : match,
    );
    await expectRunToFail(createReader({ matches: duplicateProviderMatches }));
  });

  it("fails closed on ambiguous duplicate slugs in the 24-match source set", async () => {
    const rows = createFixtureRows();
    const duplicateSlugMatches = rows.matches.map((match, index) =>
      index === 1 ? { ...match, slug: rows.matches[0].slug } : match,
    );
    await expectRunToFail(createReader({ matches: duplicateSlugMatches }));
  });

  it("fails closed when a fixture has zero qualifying predictions", async () => {
    const base = createFixtureRows();
    await expectRunToFail(createReader({ predictions: base.predictions.slice(1) }));
  });

  it("fails closed when a fixture has multiple qualifying predictions", async () => {
    const base = createFixtureRows();
    await expectRunToFail(createReader({ predictions: [...base.predictions, { ...base.predictions[0], id: "duplicate-prediction" }] }));
  });

  it("fails closed on a source model version mismatch", async () => {
    const rows = createFixtureRows();
    await expectRunToFail(
      createReader({
        model: {
          ...rows.model,
          version: "wrong-model",
        },
      }),
    );
  });

  it("fails closed when a prediction does not retain 10 markets", async () => {
    const rows = createFixtureRows();
    await expectRunToFail(
      createReader({
        markets: rows.markets.filter((market) => market.id !== `${rows.predictions[0].id}-m10`),
      }),
    );
  });

  it("fails closed when a prediction does not retain exactly 3 exact-score markets", async () => {
    const rows = createFixtureRows();
    await expectRunToFail(
      createReader({
        markets: rows.markets.map((market) =>
          market.id === `${rows.predictions[0].id}-m8`
            ? { ...market, market: "btts" }
            : market,
        ),
      }),
    );
  });

  it("fails closed when persisted narratives exist", async () => {
    const rows = createFixtureRows();
    await expectRunToFail(
      createReader({
        narratives: [
          {
            id: "narrative-1",
            prediction_version_id: rows.predictions[0].id,
            locale: "es",
            free_summary: "Should not exist",
            premium_analysis: null,
            why_it_changed: null,
            risk_notes: null,
            created_at: rows.predictions[0].created_at,
          },
        ],
      }),
    );
  });

  it("fails closed when an exported source payload contains a secret-looking field name", async () => {
    const rows = createFixtureRows();
    await expectRunToFail(
      createReader({
        model: {
          ...rows.model,
          weights_json: {
            ...((rows.model.weights_json as Record<string, unknown>) ?? {}),
            serviceRoleKey: "should-not-export",
          },
        },
      }),
    );
  });

  it("builds a deterministic package with zero narratives, namespaced production refs, null preservation, numeric preservation, timestamp preservation, and field-level frozen-read equality", async () => {
    const artifactsDir = registerCleanup(path.join(os.tmpdir(), `task1c-${Date.now()}-${Math.random().toString(16).slice(2)}`));
    const result = await runTask1cFrozenV1SourcePackage(
      {
        repoRoot: process.cwd(),
        artifactsDir,
        projectRef: "gcpdffkgsdomzyoenalg",
        denyProjectRef: "yfmklapgjrupctgxaako",
        supabaseUrl: "https://gcpdffkgsdomzyoenalg.supabase.co",
      },
      createReader(),
    );

    expect(result.packageData.predictionNarratives).toEqual([]);
    expect(result.packageData.observedCounts).toEqual({
      models: 1,
      fixtures: 24,
      predictions: 24,
      markets: 240,
      exactScoreMarkets: 72,
      narratives: 0,
      publicSourceSummaries: 24,
    });
    expect(result.packageData.v1FieldAvailability).toEqual([
      { concept: "evidence_cutoff", representation: "not_present_in_v1_persistence_contract", availableInV1: false, packageTreatment: "recorded_as_unavailable" },
      { concept: "calculation_time", representation: "not_present_in_v1_persistence_contract", availableInV1: false, packageTreatment: "recorded_as_unavailable" },
      { concept: "publication_timestamp", representation: "public_prediction_summaries.prediction_created_at", availableInV1: true, packageTreatment: "validation_evidence_only" },
      { concept: "feature_version", representation: "not_present_in_v1_persistence_contract", availableInV1: false, packageTreatment: "recorded_as_unavailable" },
      { concept: "predecessor_lineage", representation: "not_present_in_v1_persistence_contract", availableInV1: false, packageTreatment: "recorded_as_unavailable" },
      { concept: "source_creation_timestamp", representation: "prediction_versions.created_at", availableInV1: true, packageTreatment: "preserved_directly" },
    ]);
    expect(result.validationData.secondReadProof.fieldEquality).toBe(true);
    expect(result.validationData.secondReadProof.byteEquality).toBe(true);
    expect(result.runReportData.reads.first.packageSha256).toBe(result.runReportData.reads.second.packageSha256);
    expect(result.packageData.matches[0]).not.toHaveProperty("id");
    expect(result.packageData.predictions[0]).not.toHaveProperty("predictionId");
    expect(JSON.stringify(result.packageData)).not.toContain("yfmklapgjrupctgxaako");
    expect(JSON.stringify(result.packageData)).not.toContain("scenario");
    expect(result.packageData.predictionMarkets[3]?.confidence).toBeNull();
    expect(result.packageData.predictions[0]?.probabilities.homeWin).toBe(0.41);
    expect(result.packageData.matches[0]?.kickoffAt).toBe(getCanonicalMatchday3Fixtures()[0]?.kickoffAt);
    expect(JSON.parse(fs.readFileSync(result.packagePath, "utf8")).fixtureManifest).toHaveLength(24);
    expect(result.checksumsData.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filename: "ufo-frozen-v1-source-package-v1.json",
          firstReadBytes: expect.any(Number),
          secondReadBytes: expect.any(Number),
          firstReadSha256: expect.any(String),
          secondReadSha256: expect.any(String),
          byteSizeEqual: true,
          hashEqual: true,
          equal: true,
        }),
      ]),
    );
    expect(result.runReportData.sourceProjectRef).toBe("gcpdffkgsdomzyoenalg");
    expect(result.runReportData.deniedProjectRef).toBe("yfmklapgjrupctgxaako");
    expect(result.runReportData.reads.first.status).toBe("success");
    expect(result.runReportData.reads.second.status).toBe("success");
    expect(result.runReportData.reads.first.selectionMode).toBe("exact_bounded_source_scope");
    expect(result.runReportData.reads.second.selectionMode).toBe("frozen_source_references");
    expect(result.runReportData.expectedCounts).toEqual({
      models: 1,
      fixtures: 24,
      predictions: 24,
      markets: 240,
      exactScoreMarkets: 72,
      narratives: 0,
      publicSourceSummaries: 24,
    });
    expect(result.runReportData.observedCounts).toEqual(result.packageData.observedCounts);
    expect(result.runReportData.byteEquality).toBe(true);
    expect(result.runReportData.fieldEquality).toBe(true);
    expect(result.runReportData.productionDatabaseWrites).toBe(0);
    expect(result.runReportData.stageDatabaseWrites).toBe(0);
    expect(result.runReportData.artifacts.packagePath).toBe(result.packagePath);
    expect(result.runReportData.artifacts.manifestPath).toBe(result.manifestPath);
    expect(result.runReportData.artifacts.validationReportPath).toBe(result.validationPath);
    expect(result.runReportData.artifacts.checksumReportPath).toBe(result.checksumsPath);
    expect(result.validationData.requiredChecks.fixtureIdentityAndUniqueness.uniqueSlugs).toBe(true);
    expect(result.validationData.requiredChecks.relationshipIntegrity.onePredictionPerFixture).toBe(true);
    expect(result.validationData.requiredChecks.marketInvariants.marketsPerPredictionMinimum).toBe(10);
    expect(result.validationData.requiredChecks.marketInvariants.exactScoreMarketsPerPredictionMaximum).toBe(3);
    expect(result.validationData.requiredChecks.forbiddenContentScan.secretDataPresent).toBe(false);
    expect(result.validationData.requiredChecks.stageLeakage.stageUuidReferencePresent).toBe(false);
    expect(result.validationData.derivedValidity.allMandatoryChecksPresent).toBe(true);
    expect(result.validationData.derivedValidity.allMandatoryChecksSatisfied).toBe(true);
  });

  it("fails closed when the second frozen-reference read drifts on an explicitly exported field", async () => {
    const driftRows = createFixtureRows();
    let secondRead = false;
    const driftReader: FrozenV1SourceReader = {
      ...createReader(),
      async fetchPredictionsByIds(predictionIds) {
        secondRead = true;
        return driftRows.predictions
          .filter((prediction) => predictionIds.includes(prediction.id))
          .map((prediction, index) =>
            index === 0 ? { ...prediction, expected_home_goals: prediction.expected_home_goals + 0.01 } : prediction,
          );
      },
    };

    await expectRunToFail(driftReader, /source drift/i);
    expect(secondRead).toBe(true);
  });

  it("rejects checksum evidence when first or second digest data is missing", () => {
    expect(() =>
      assertFrozenArtifactChecksums({
        schemaName: "ufo-frozen-v1-source-checksums-v1",
        schemaVersion: 1,
        algorithm: "sha256",
        files: [
          {
            filename: "ufo-frozen-v1-source-package-v1.json",
            firstReadBytes: 12,
            secondReadBytes: 12,
            firstReadSha256: "",
            secondReadSha256: "abc",
            byteSizeEqual: true,
            hashEqual: true,
            equal: true,
          },
        ],
      }),
    ).toThrow(/Incomplete checksum evidence/);
  });

  it("rejects checksum evidence when first and second reads do not match", () => {
    expect(() =>
      assertFrozenArtifactChecksums({
        schemaName: "ufo-frozen-v1-source-checksums-v1",
        schemaVersion: 1,
        algorithm: "sha256",
        files: [
          {
            filename: "validation-report.json",
            firstReadBytes: 10,
            secondReadBytes: 11,
            firstReadSha256: "abc",
            secondReadSha256: "def",
            byteSizeEqual: false,
            hashEqual: false,
            equal: false,
          },
        ],
      }),
    ).toThrow(/Checksum mismatch detected/);
  });

  it("derives a blocked validation verdict when mandatory evidence is missing", () => {
    const outcome = deriveFrozenValidationOutcome({
      mandatoryFields: {
        exactFixtureAllowlist: true,
        matchNumbers49Through72ExactlyOnce: true,
        uniqueSlugs: true,
        uniqueProviderFixtureIds: true,
        uniqueSourceMatchRefs: true,
        uniqueSourcePredictionRefs: true,
        completeCanonicalIdentityMatch: true,
        extraFixtureCount: 0,
        missingFixtureCount: 0,
        onePredictionPerFixture: true,
        allPredictionsReferenceSelectedModel: true,
        allMarketsReferenceSelectedPredictions: true,
        orphanMarketCount: 0,
        duplicateMarketSourceRefCount: 0,
        marketsPerPredictionMinimum: 10,
        marketsPerPredictionMaximum: 10,
        exactScoreMarketsPerPredictionMinimum: 3,
        exactScoreMarketsPerPredictionMaximum: 3,
        allPredictionTypesPreMatch24h: true,
        allRunScopesPublicProduct: true,
        narrativeCount: 0,
        scenarioDataPresent: false,
        fabricatedNarrativePresent: false,
        personalDataPresent: false,
        authDataPresent: false,
        secretDataPresent: false,
        paymentDataPresent: false,
        wompiDataPresent: false,
        webhookDataPresent: false,
        subscriptionDataPresent: false,
        sessionDataPresent: false,
        entitlementDataPresent: false,
        resultDataPresent: false,
        evaluationDataPresent: false,
        reviewedByReferencePresent: false,
        sourceNotePresent: false,
        stageProjectRefPresent: false,
        stageUuidReferencePresent: false,
        genericTargetPrimaryKeysPresent: false,
        firstReadSucceeded: true,
        secondReadSucceeded: true,
        secondReadUsedFrozenReferences: true,
        fieldEquality: true,
        byteEquality: true,
      },
      requiredChecks: {
        fixtureIdentityAndUniqueness: {
          exactFixtureAllowlist: true,
          matchNumbers49Through72ExactlyOnce: true,
          uniqueSlugs: true,
          uniqueProviderFixtureIds: true,
          uniqueSourceMatchRefs: true,
          uniqueSourcePredictionRefs: true,
          completeCanonicalIdentityMatch: true,
          extraFixtureCount: 0,
          missingFixtureCount: 0,
        },
        relationshipIntegrity: {
          onePredictionPerFixture: true,
          allPredictionsReferenceSelectedModel: true,
          allMarketsReferenceSelectedPredictions: true,
          orphanMarketCount: 0,
          duplicateMarketSourceRefCount: 0,
        },
        marketInvariants: {
          marketsPerPredictionMinimum: 10,
          marketsPerPredictionMaximum: 10,
          exactScoreMarketsPerPredictionMinimum: 3,
          exactScoreMarketsPerPredictionMaximum: 3,
        },
        predictionScope: {
          allPredictionTypesPreMatch24h: true,
          allRunScopesPublicProduct: true,
        },
        narrativeAndScenarioTruth: {
          narrativeCount: 0,
          scenarioDataPresent: false,
          fabricatedNarrativePresent: false,
        },
        forbiddenContentScan: {
          personalDataPresent: false,
          authDataPresent: false,
          secretDataPresent: false,
          paymentDataPresent: false,
          wompiDataPresent: false,
          webhookDataPresent: false,
          subscriptionDataPresent: false,
          sessionDataPresent: false,
          entitlementDataPresent: false,
          resultDataPresent: false,
          evaluationDataPresent: false,
          reviewedByReferencePresent: false,
          sourceNotePresent: false,
        },
        stageLeakage: {
          stageProjectRefPresent: false,
          stageUuidReferencePresent: false,
          genericTargetPrimaryKeysPresent: false,
        },
        frozenReadEvidence: {
          firstReadSucceeded: true,
          secondReadSucceeded: true,
          secondReadUsedFrozenReferences: true,
          fieldEquality: true,
          byteEquality: undefined as unknown as boolean,
        },
      },
    });

    expect(outcome.verdict).toBe("blocked");
    expect(outcome.mandatoryFailureKeys.join(" ")).toMatch(/byteEquality:missing/);
  });

  it("derives a blocked validation verdict when forbidden content or stage leakage is present", () => {
    const outcome = deriveFrozenValidationOutcome({
      mandatoryFields: {
        exactFixtureAllowlist: true,
        matchNumbers49Through72ExactlyOnce: true,
        uniqueSlugs: true,
        uniqueProviderFixtureIds: true,
        uniqueSourceMatchRefs: true,
        uniqueSourcePredictionRefs: true,
        completeCanonicalIdentityMatch: true,
        extraFixtureCount: 0,
        missingFixtureCount: 0,
        onePredictionPerFixture: true,
        allPredictionsReferenceSelectedModel: true,
        allMarketsReferenceSelectedPredictions: true,
        orphanMarketCount: 0,
        duplicateMarketSourceRefCount: 0,
        marketsPerPredictionMinimum: 10,
        marketsPerPredictionMaximum: 10,
        exactScoreMarketsPerPredictionMinimum: 3,
        exactScoreMarketsPerPredictionMaximum: 3,
        allPredictionTypesPreMatch24h: true,
        allRunScopesPublicProduct: true,
        narrativeCount: 0,
        scenarioDataPresent: false,
        fabricatedNarrativePresent: false,
        personalDataPresent: false,
        authDataPresent: false,
        secretDataPresent: false,
        paymentDataPresent: false,
        wompiDataPresent: false,
        webhookDataPresent: false,
        subscriptionDataPresent: false,
        sessionDataPresent: false,
        entitlementDataPresent: false,
        resultDataPresent: false,
        evaluationDataPresent: false,
        reviewedByReferencePresent: false,
        sourceNotePresent: false,
        stageProjectRefPresent: false,
        stageUuidReferencePresent: false,
        genericTargetPrimaryKeysPresent: false,
        firstReadSucceeded: true,
        secondReadSucceeded: true,
        secondReadUsedFrozenReferences: true,
        fieldEquality: true,
        byteEquality: true,
      },
      requiredChecks: {
        fixtureIdentityAndUniqueness: {
          exactFixtureAllowlist: true,
          matchNumbers49Through72ExactlyOnce: true,
          uniqueSlugs: true,
          uniqueProviderFixtureIds: true,
          uniqueSourceMatchRefs: true,
          uniqueSourcePredictionRefs: true,
          completeCanonicalIdentityMatch: true,
          extraFixtureCount: 0,
          missingFixtureCount: 0,
        },
        relationshipIntegrity: {
          onePredictionPerFixture: true,
          allPredictionsReferenceSelectedModel: true,
          allMarketsReferenceSelectedPredictions: true,
          orphanMarketCount: 0,
          duplicateMarketSourceRefCount: 0,
        },
        marketInvariants: {
          marketsPerPredictionMinimum: 10,
          marketsPerPredictionMaximum: 10,
          exactScoreMarketsPerPredictionMinimum: 3,
          exactScoreMarketsPerPredictionMaximum: 3,
        },
        predictionScope: {
          allPredictionTypesPreMatch24h: true,
          allRunScopesPublicProduct: true,
        },
        narrativeAndScenarioTruth: {
          narrativeCount: 0,
          scenarioDataPresent: false,
          fabricatedNarrativePresent: false,
        },
        forbiddenContentScan: {
          personalDataPresent: false,
          authDataPresent: false,
          secretDataPresent: true,
          paymentDataPresent: false,
          wompiDataPresent: false,
          webhookDataPresent: false,
          subscriptionDataPresent: false,
          sessionDataPresent: false,
          entitlementDataPresent: false,
          resultDataPresent: false,
          evaluationDataPresent: false,
          reviewedByReferencePresent: false,
          sourceNotePresent: false,
        },
        stageLeakage: {
          stageProjectRefPresent: false,
          stageUuidReferencePresent: true,
          genericTargetPrimaryKeysPresent: false,
        },
        frozenReadEvidence: {
          firstReadSucceeded: true,
          secondReadSucceeded: true,
          secondReadUsedFrozenReferences: true,
          fieldEquality: true,
          byteEquality: true,
        },
      },
    });

    expect(outcome.verdict).toBe("blocked");
    expect(outcome.mandatoryFailureKeys.join(" ")).toMatch(/secretDataPresent/);
    expect(outcome.mandatoryFailureKeys.join(" ")).toMatch(/stageUuidReferencePresent/);
  });

  it("compares overlapping public fields against the official UFO export and excludes Colombia vs Congo DR from Matchday 3", async () => {
    const artifactsDir = registerCleanup(path.join(os.tmpdir(), `task1c-${Date.now()}-${Math.random().toString(16).slice(2)}`));
    const result = await runTask1cFrozenV1SourcePackage(
      {
        repoRoot: process.cwd(),
        artifactsDir,
        projectRef: "gcpdffkgsdomzyoenalg",
        denyProjectRef: "yfmklapgjrupctgxaako",
        supabaseUrl: "https://gcpdffkgsdomzyoenalg.supabase.co",
      },
      createReader(),
    );

    const exportPayload = {
      schemaVersion: "torneo-ufo-export-v1",
      source: "ufo_predictor",
      fixtures: [
        ...buildOfficialExportFixtures(),
        {
          externalId: "api-football:fixture:1539008",
          fixtureId: 1539008,
          slug: "world-cup-2026-colombia-vs-congo-dr-2026-06-24",
          kickoffAt: "2026-06-24T02:00:00+00:00",
          stage: "Group Stage - 2",
          homeTeam: "Colombia",
          awayTeam: "Congo DR",
          prediction: {
            homeWinProbability: 0.376063,
            drawProbability: 0.294522,
            awayWinProbability: 0.329416,
            confidenceScore: 73.27,
            riskLevel: "high",
            mostLikelyScore: "1-1",
            expectedGoals: {
              home: 1.1235,
              away: 1.0316,
            },
            topScorelines: [
              { score: "1-1", probability: 0.134319 },
              { score: "1-0", probability: 0.130204 },
              { score: "0-1", probability: 0.119554 },
            ],
          },
        },
      ],
    };

    const comparison = compareFrozenPackageWithOfficialUfoExport({
      frozenPackage: result.packageData,
      exportPayload,
    });

    expect(comparison.exportTotalFixtureCount).toBe(25);
    expect(comparison.matchday3FixtureCount).toBe(24);
    expect(comparison.matchedFixtureCount).toBe(24);
    expect(comparison.missingFrozenPackageFixtures).toEqual([]);
    expect(comparison.extraExportMatchday3Fixtures).toEqual([]);
    expect(comparison.exactFieldMismatchCount).toBe(0);
    expect(comparison.colombiaVsCongoDrConfirmedAsMatchday2).toBe(true);
    expect(comparison.exportUsedAsPersistenceInput).toBe(false);
  });
});
