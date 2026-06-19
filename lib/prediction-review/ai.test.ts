import { describe, expect, it } from "vitest";
import { predictionReviewAiResponseSchema } from "./ai";

describe("prediction review ai schema", () => {
  it("accepts the bounded decision contract", () => {
    const parsed = predictionReviewAiResponseSchema.parse({
      decision: "PROPOSE_REVIEWED_XG",
      rationale: "The refreshed shadow remains coherent but needs xG smoothing.",
      evidenceUsed: ["current_ufo_prediction", "shadow_prediction", "elo_expectancy"],
      contradictions: ["Current scoreline is more aggressive than refreshed xG."],
      confidence: "medium",
      proposedHomeXg: 1.65,
      proposedAwayXg: 0.91,
      warnings: ["Human approval required."],
      humanApprovalRequired: true,
    });

    expect(parsed.decision).toBe("PROPOSE_REVIEWED_XG");
  });

  it("rejects unsupported publication output fields", () => {
    expect(() =>
      predictionReviewAiResponseSchema.parse({
        decision: "KEEP_CURRENT",
        rationale: "Keep it.",
        evidenceUsed: [],
        contradictions: [],
        confidence: "high",
        proposedHomeXg: null,
        proposedAwayXg: null,
        warnings: [],
        humanApprovalRequired: true,
        finalScore: "2-0",
      }),
    ).toThrow();
  });
});
