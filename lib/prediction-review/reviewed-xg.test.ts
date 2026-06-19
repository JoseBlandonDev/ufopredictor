import { describe, expect, it } from "vitest";
import {
  buildReviewedXgPredictionBundle,
  determinePredictionReviewFavorite,
  normalizeAiReviewedXgDecision,
  validateReviewedXgBounds,
} from "./reviewed-xg";

const input = {
  matchId: "match-1",
  homeTeam: {
    id: "home-1",
    name: "France",
    signals: {
      ratingScore: 91,
      recentFormScore: 80,
      attackScore: 75,
      defenseScore: 72,
      marketScore: 50,
      lineupContextScore: 50,
    },
  },
  awayTeam: {
    id: "away-1",
    name: "Iraq",
    signals: {
      ratingScore: 43,
      recentFormScore: 40,
      attackScore: 45,
      defenseScore: 48,
      marketScore: 50,
      lineupContextScore: 50,
    },
  },
  context: {
    neutralVenue: true,
  },
  runScope: "internal_lab" as const,
  predictionType: "pre_match_24h" as const,
};

const baseline = {
  expectedHomeGoals: 1.6,
  expectedAwayGoals: 0.9,
};

describe("reviewed xg bounds", () => {
  it("accepts exact boundary values", () => {
    expect(
      validateReviewedXgBounds({
        homeXg: 0.1,
        awayXg: 0.4,
        baseline: {
          expectedHomeGoals: 0.85,
          expectedAwayGoals: 0.4,
        },
      }).valid,
    ).toBe(true);

    expect(
      validateReviewedXgBounds({
        homeXg: 3.5,
        awayXg: 2,
        baseline: {
          expectedHomeGoals: 2.75,
          expectedAwayGoals: 2,
        },
      }).valid,
    ).toBe(true);
  });

  it("rejects negatives, NaN, Infinity, and per-team min/max violations", () => {
    expect(validateReviewedXgBounds({ homeXg: -1, awayXg: 1.2, baseline }).valid).toBe(false);
    expect(validateReviewedXgBounds({ homeXg: Number.NaN, awayXg: 1.2, baseline }).valid).toBe(false);
    expect(validateReviewedXgBounds({ homeXg: Number.POSITIVE_INFINITY, awayXg: 1.2, baseline }).valid).toBe(false);
    expect(validateReviewedXgBounds({ homeXg: 3.6, awayXg: 1.2, baseline }).valid).toBe(false);
    expect(validateReviewedXgBounds({ homeXg: 0.09, awayXg: 0.5, baseline }).valid).toBe(false);
  });

  it("rejects combined xg, per-team delta, and total delta violations", () => {
    expect(validateReviewedXgBounds({ homeXg: 0.1, awayXg: 0.2, baseline }).valid).toBe(false);
    expect(validateReviewedXgBounds({ homeXg: 3.5, awayXg: 2.1, baseline }).valid).toBe(false);
    expect(validateReviewedXgBounds({ homeXg: 2.36, awayXg: 0.9, baseline }).valid).toBe(false);
    expect(validateReviewedXgBounds({ homeXg: 2.2, awayXg: 1.5, baseline }).valid).toBe(false);
  });
});

describe("reviewed xg bundle", () => {
  it("builds a coherent deterministic bundle from approved xg", () => {
    const bundle = buildReviewedXgPredictionBundle({
      input,
      homeXg: 2.1,
      awayXg: 0.8,
    });

    expect(bundle.expectedHomeGoals).toBe(2.1);
    expect(bundle.expectedAwayGoals).toBe(0.8);
    expect(bundle.topScorelines.length).toBeGreaterThan(0);
    expect(bundle.homeWinProb + bundle.drawProb + bundle.awayWinProb).toBeCloseTo(100, 1);
    expect(bundle.bttsYesProb + bundle.bttsNoProb).toBeCloseTo(100, 1);
    expect(bundle.over25Prob + bundle.under25Prob).toBeCloseTo(100, 1);
    expect(determinePredictionReviewFavorite(bundle)).toBe("home");
  });
});

describe("normalizeAiReviewedXgDecision", () => {
  it("keeps valid reviewed xg proposals intact", () => {
    const response = normalizeAiReviewedXgDecision({
      response: {
        decision: "PROPOSE_REVIEWED_XG",
        rationale: "Smaller xG adjustment.",
        evidenceUsed: ["shadow_prediction"],
        contradictions: [],
        confidence: "medium",
        proposedHomeXg: 1.9,
        proposedAwayXg: 0.95,
        warnings: [],
        humanApprovalRequired: true,
      },
      baseline,
    });

    expect(response.decision).toBe("PROPOSE_REVIEWED_XG");
    expect(response.proposedHomeXg).toBe(1.9);
  });

  it("converts out-of-bounds reviewed xg proposals into HOLD", () => {
    const response = normalizeAiReviewedXgDecision({
      response: {
        decision: "PROPOSE_REVIEWED_XG",
        rationale: "Large xG swing.",
        evidenceUsed: ["shadow_prediction"],
        contradictions: [],
        confidence: "medium",
        proposedHomeXg: 2.5,
        proposedAwayXg: 1.7,
        warnings: [],
        humanApprovalRequired: true,
      },
      baseline,
    });

    expect(response.decision).toBe("HOLD");
    expect(response.proposedHomeXg).toBeNull();
    expect(response.warnings.some((warning) => warning.includes("fuera de limites"))).toBe(true);
  });
});
