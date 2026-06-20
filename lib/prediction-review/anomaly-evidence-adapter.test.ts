import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  buildAtypicalFixtureDetectorInput,
  createAtypicalFixtureInputFingerprint,
  normalizeAtypicalFixtureFingerprintValue,
} from "./anomaly-evidence-adapter";

const BASE_ARGS = {
  match: {
    id: "match-1",
    external_id: "api-football:fixture:1540356",
    kickoff_at: "2026-06-20T19:00:00.000Z",
    status: "scheduled",
    stage: "Group Stage - 2",
  },
  competition: {
    name: "World Cup",
  },
  predictionVersion: {
    id: "prediction-1",
    model_version_id: "model-v0",
    home_win_prob: 54,
    draw_prob: 24,
    away_win_prob: 22,
    expected_home_goals: 1.44,
    expected_away_goals: 0.91,
    most_likely_score: "1-0",
    top_scores_json: [{ score: "1-0", probability: 12.3 }],
    confidence_score: 71,
    risk_level: "low",
    run_scope: "public_product",
    created_at: "2026-06-19T12:00:00.000Z",
  },
  markets: [
    { prediction_version_id: "prediction-1", market: "btts", selection: "yes", probability: 46 },
    { prediction_version_id: "prediction-1", market: "btts", selection: "no", probability: 54 },
    { prediction_version_id: "prediction-1", market: "over_2_5", selection: "over", probability: 48 },
    { prediction_version_id: "prediction-1", market: "over_2_5", selection: "under", probability: 52 },
    { prediction_version_id: "prediction-1", market: "match_winner", selection: "home", probability: 54 },
    { prediction_version_id: "prediction-1", market: "match_winner", selection: "draw", probability: 24 },
    { prediction_version_id: "prediction-1", market: "match_winner", selection: "away", probability: 22 },
    { prediction_version_id: "prediction-1", market: "exact_score", selection: "1-0", probability: 12.3 },
  ],
  modelVersionName: "v0.1-lab",
  analysisAsOf: "2026-06-19T21:11:52.000Z",
};

function reverseDuplicateOrder(markets: typeof BASE_ARGS.markets, target: { market: string; selection: string }) {
  const duplicates = markets.filter((market) => market.market === target.market && market.selection === target.selection);
  const nonDuplicates = markets.filter((market) => !(market.market === target.market && market.selection === target.selection));
  return [...duplicates.reverse(), ...nonDuplicates];
}

describe("buildAtypicalFixtureDetectorInput", () => {
  it("resolves supported aliases safely for Curaçao, Congo DR, and Cape Verde", () => {
    const curacao = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "Ecuador",
      awayTeamName: "Curaçao",
    });
    const congoDr = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "Colombia",
      awayTeamName: "Congo DR",
    });
    const capeVerde = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "Uruguay",
      awayTeamName: "Cape Verde",
    });

    expect(curacao.input.fixture.awayTeam.canonicalKey).toBe("curacao");
    expect(congoDr.input.fixture.awayTeam.canonicalKey).toBe("congo-dr");
    expect(["cape-verde", "cabo-verde"]).toContain(capeVerde.input.fixture.awayTeam.canonicalKey);
    expect(curacao.input.evidence.sourceIntegrity.awayAliasResolved).toBe(true);
    expect(congoDr.input.evidence.sourceIntegrity.awayAliasResolved).toBe(true);
    expect(capeVerde.input.evidence.sourceIntegrity.awayAliasResolved).toBe(true);
  });

  it("represents tied current favorites as TIE through the shared helper", () => {
    const result = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      predictionVersion: {
        ...BASE_ARGS.predictionVersion,
        home_win_prob: 40,
        draw_prob: 20,
        away_win_prob: 40,
      },
    });

    expect(result.input.evidence.referenceProjection.favoriteChanged).not.toBeNull();
    expect(result.inputFingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it("keeps exact same-version binary market bundles provenance-complete", () => {
    const result = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      exactSourceSnapshotId: "2026-06-19",
    });

    expect(result.input.coverage.missingEvidence).not.toContain("markets.predictionVersionId");
    expect(result.input.evidence.sourceIntegrity.centralProvenanceComplete).toBe(true);
    expect(result.input.evidence.markets.bttsYesPct).toBe(46);
    expect(result.input.evidence.markets.over25Pct).toBe(48);
  });

  it("marks duplicate consumed market selections as partial coverage", () => {
    const result = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      markets: [
        ...BASE_ARGS.markets,
        { prediction_version_id: "prediction-1", market: "btts", selection: "yes", probability: 45 },
      ],
    });

    expect(result.input.coverage.missingEvidence).toContain("markets.duplicateSelection");
    expect(result.input.evidence.sourceIntegrity.centralProvenanceComplete).toBe(false);
    expect(result.input.evidence.markets.bttsYesPct).toBeNull();
  });

  it("requires complementary selections for the consumed binary markets", () => {
    const result = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      markets: BASE_ARGS.markets.filter((market) => !(market.market === "btts" && market.selection === "no")),
    });

    expect(result.input.coverage.missingEvidence).toContain("markets.btts");
    expect(result.input.evidence.sourceIntegrity.centralProvenanceComplete).toBe(false);
  });

  it("marks mixed prediction-version market bundles as partial coverage", () => {
    const result = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      markets: [
        ...BASE_ARGS.markets.filter((market) => !(market.market === "btts" && market.selection === "yes")),
        { prediction_version_id: "prediction-other", market: "btts", selection: "yes", probability: 46 },
      ],
    });

    expect(result.input.coverage.missingEvidence).toContain("markets.predictionVersionId");
    expect(result.input.coverage.missingEvidence).toContain("markets.btts");
    expect(result.input.evidence.sourceIntegrity.centralProvenanceComplete).toBe(false);
  });

  it("rejects out-of-range probabilities in consumed market bundles", () => {
    const result = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      markets: BASE_ARGS.markets.map((market) =>
        market.market === "btts" && market.selection === "yes"
          ? { ...market, probability: 101 }
          : market,
      ),
    });

    expect(result.input.coverage.missingEvidence).toContain("markets.btts.probabilityRange");
  });

  it("rejects consumed binary market bundles outside the sum tolerance", () => {
    const result = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      markets: BASE_ARGS.markets.map((market) =>
        market.market === "over_2_5" && market.selection === "under"
          ? { ...market, probability: 40 }
          : market,
      ),
    });

    expect(result.input.coverage.missingEvidence).toContain("markets.over_2_5.sumTolerance");
  });

  it("accepts top scoreline provenance from the selected prediction version when no exact-score market row exists", () => {
    const result = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      exactSourceSnapshotId: "2026-06-19",
      markets: BASE_ARGS.markets.filter((market) => market.market !== "exact_score"),
    });

    expect(result.input.coverage.missingEvidence).not.toContain("markets.topScorelineProvenance");
    expect(result.input.evidence.sourceIntegrity.centralProvenanceComplete).toBe(true);
  });

  it("uses exact immutable source snapshot provenance when provided", () => {
    const result = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      exactSourceSnapshotId: "2026-06-11",
    });

    expect(result.input.prediction.signalSnapshotId).toBe("2026-06-11");
    expect(result.input.provenance.signalSnapshotId).toBe("2026-06-11");
    expect(result.input.provenance.qualityReportId).toBe("quality-report:2026-06-11");
  });

  it("keeps missing provenance explicit when no exact immutable source snapshot is associated", () => {
    const result = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      exactSourceSnapshotId: null,
    });

    expect(result.input.prediction.signalSnapshotId).toBeNull();
    expect(result.input.coverage.missingEvidence).toContain("prediction.signalSnapshotId");
    expect(result.input.evidence.sourceIntegrity.centralProvenanceComplete).toBe(false);
  });

  it("keeps duplicate btts rows order-invariant and isolates the degradation to BTTS", () => {
    const withDuplicate = [
      ...BASE_ARGS.markets,
      { prediction_version_id: "prediction-1", market: "btts", selection: "yes", probability: 45 },
    ];
    const left = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      markets: withDuplicate,
    });
    const right = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      markets: reverseDuplicateOrder(withDuplicate, { market: "btts", selection: "yes" }),
    });

    expect(left).toEqual(right);
    expect(left.input.evidence.markets.bttsYesPct).toBeNull();
    expect(left.input.evidence.markets.over25Pct).toBe(48);
    expect(left.input.evidence.modalScore.probabilityPct).toBe(12.3);
  });

  it("keeps duplicate over 2.5 rows order-invariant and isolates the degradation to over/under", () => {
    const withDuplicate = [
      ...BASE_ARGS.markets,
      { prediction_version_id: "prediction-1", market: "over_2_5", selection: "over", probability: 47 },
    ];
    const left = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      markets: withDuplicate,
    });
    const right = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      markets: reverseDuplicateOrder(withDuplicate, { market: "over_2_5", selection: "over" }),
    });

    expect(left).toEqual(right);
    expect(left.input.evidence.markets.over25Pct).toBeNull();
    expect(left.input.evidence.markets.bttsYesPct).toBe(46);
    expect(left.input.evidence.modalScore.probabilityPct).toBe(12.3);
  });

  it("keeps duplicate exact-score rows order-invariant and prefers selected prediction top-scores provenance", () => {
    const withDuplicate = [
      ...BASE_ARGS.markets,
      { prediction_version_id: "prediction-1", market: "exact_score", selection: "1-0", probability: 15.7 },
    ];
    const left = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      markets: withDuplicate,
    });
    const right = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      markets: reverseDuplicateOrder(withDuplicate, { market: "exact_score", selection: "1-0" }),
    });

    expect(left).toEqual(right);
    expect(left.input.evidence.modalScore.probabilityPct).toBe(12.3);
    expect(left.input.evidence.markets.bttsYesPct).toBe(46);
    expect(left.input.evidence.markets.over25Pct).toBe(48);
  });

  it("nulls modal probability when duplicate exact-score rows are the only possible source", () => {
    const result = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "France",
      awayTeamName: "Iraq",
      predictionVersion: {
        ...BASE_ARGS.predictionVersion,
        top_scores_json: [],
      },
      markets: [
        ...BASE_ARGS.markets,
        { prediction_version_id: "prediction-1", market: "exact_score", selection: "1-0", probability: 15.7 },
      ],
    });

    expect(result.input.evidence.modalScore.probabilityPct).toBeNull();
    expect(result.input.coverage.missingEvidence).toContain("markets.topScorelineProvenance");
    expect(result.input.evidence.markets.bttsYesPct).toBe(46);
    expect(result.input.evidence.markets.over25Pct).toBe(48);
  });
});

describe("createAtypicalFixtureInputFingerprint", () => {
  it("builds a stable fingerprint from normalized evidence and analysisAsOf", () => {
    const built = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "Germany",
      awayTeamName: "Ivory Coast",
    });

    const fingerprintA = createAtypicalFixtureInputFingerprint({
      input: built.input,
      analysisAsOf: BASE_ARGS.analysisAsOf,
    });
    const fingerprintB = createAtypicalFixtureInputFingerprint({
      input: built.input,
      analysisAsOf: BASE_ARGS.analysisAsOf,
    });

    expect(fingerprintA).toBe(fingerprintB);
    expect(built.inputFingerprint).toBe(fingerprintA);
    expect(fingerprintA).toMatch(/^[a-f0-9]{64}$/);
  });

  it("normalizes equivalent timestamps to the same fingerprint", () => {
    const built = buildAtypicalFixtureDetectorInput({
      ...BASE_ARGS,
      homeTeamName: "Germany",
      awayTeamName: "Ivory Coast",
    });
    const latestEvidenceAt = built.input.evidence.sourceIntegrity.latestEvidenceAt;
    const equivalentLatestEvidenceAt = latestEvidenceAt
      ? new Date(Date.parse(latestEvidenceAt) - 5 * 60 * 60 * 1000).toISOString().replace(".000Z", "-05:00")
      : null;
    const leftPayload = normalizeAtypicalFixtureFingerprintValue({
      detectorVersion: "model-ops-01-slice-a-v1",
      analysisAsOf: "2026-06-19T21:11:52.000Z",
      input: built.input,
    });
    const rightPayload = normalizeAtypicalFixtureFingerprintValue({
      detectorVersion: "model-ops-01-slice-a-v1",
      analysisAsOf: "2026-06-19T16:11:52-05:00",
      input: {
        ...built.input,
        fixture: { ...built.input.fixture, kickoffAt: "2026-06-20T14:00:00-05:00" },
        prediction: { ...built.input.prediction, generatedAt: "2026-06-19T07:00:00-05:00" },
        evidence: {
          ...built.input.evidence,
          sourceIntegrity: {
            ...built.input.evidence.sourceIntegrity,
            latestEvidenceAt: equivalentLatestEvidenceAt,
          },
        },
      },
    });

    const left = createAtypicalFixtureInputFingerprint({
      input: built.input,
      analysisAsOf: "2026-06-19T21:11:52.000Z",
    });
    const right = createAtypicalFixtureInputFingerprint({
      input: {
        ...built.input,
        fixture: { ...built.input.fixture, kickoffAt: "2026-06-20T14:00:00-05:00" },
        prediction: { ...built.input.prediction, generatedAt: "2026-06-19T07:00:00-05:00" },
        evidence: {
          ...built.input.evidence,
          sourceIntegrity: {
            ...built.input.evidence.sourceIntegrity,
            latestEvidenceAt: equivalentLatestEvidenceAt,
          },
        },
      },
      analysisAsOf: "2026-06-19T16:11:52-05:00",
    });

    expect(leftPayload).toEqual(rightPayload);
    expect(left).toBe(right);
  });

  it("keeps unordered arrays fingerprint-equivalent after reordering", () => {
    const payloadA = normalizeAtypicalFixtureFingerprintValue({
      missingEvidence: ["b", "a"],
      changedComponents: ["attack", "rating"],
      evidenceRefs: ["two", "one"],
    });
    const payloadB = normalizeAtypicalFixtureFingerprintValue({
      missingEvidence: ["a", "b"],
      changedComponents: ["rating", "attack"],
      evidenceRefs: ["one", "two"],
    });

    expect(payloadA).toEqual(payloadB);
  });

  it("keeps meaningful ordered arrays distinct after reordering", () => {
    const payloadA = normalizeAtypicalFixtureFingerprintValue({
      topScorelines: [
        { score: "1-0", probability: 12 },
        { score: "2-0", probability: 9 },
      ],
    });
    const payloadB = normalizeAtypicalFixtureFingerprintValue({
      topScorelines: [
        { score: "2-0", probability: 9 },
        { score: "1-0", probability: 12 },
      ],
    });

    expect(payloadA).not.toEqual(payloadB);
  });

  it("keeps null distinct from missing while preserving explicit undefined", () => {
    const withNull = normalizeAtypicalFixtureFingerprintValue({ source: null });
    const missing = normalizeAtypicalFixtureFingerprintValue({});
    const withUndefined = normalizeAtypicalFixtureFingerprintValue({ source: undefined });

    expect(withNull).not.toEqual(missing);
    expect(withUndefined).toEqual({ source: { __type: "undefined" } });
  });

  it("rejects non-finite numeric values before hashing", () => {
    expect(() =>
      createAtypicalFixtureInputFingerprint({
        input: {
          ...buildAtypicalFixtureDetectorInput({
            ...BASE_ARGS,
            homeTeamName: "Germany",
            awayTeamName: "Ivory Coast",
          }).input,
          evidence: {
            ...buildAtypicalFixtureDetectorInput({
              ...BASE_ARGS,
              homeTeamName: "Germany",
              awayTeamName: "Ivory Coast",
            }).input.evidence,
            oneXtwo: {
              homePct: Number.NaN,
              drawPct: 24,
              awayPct: 76,
            },
          },
        },
        analysisAsOf: BASE_ARGS.analysisAsOf,
      }),
    ).toThrow(/non-finite numeric value/i);
  });
});
