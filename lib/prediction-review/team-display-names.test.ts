import { describe, expect, it } from "vitest";
import {
  arePredictionReviewTeamNamesEquivalent,
  resolvePredictionReviewTeamDisplayNameEs,
} from "./team-display-names";

describe("prediction review Spanish display names", () => {
  it("uses the required Spanish presentation names", () => {
    expect(resolvePredictionReviewTeamDisplayNameEs("Ivory Coast")).toBe("Costa de Marfil");
    expect(resolvePredictionReviewTeamDisplayNameEs("Curaçao")).toBe("Curazao");
    expect(resolvePredictionReviewTeamDisplayNameEs("Cape Verde Islands")).toBe("Cabo Verde");
    expect(resolvePredictionReviewTeamDisplayNameEs("Congo DR")).toBe("RD Congo");
    expect(resolvePredictionReviewTeamDisplayNameEs("Türkiye")).toBe("Turquía");
    expect(resolvePredictionReviewTeamDisplayNameEs("USA")).toBe("Estados Unidos");
  });

  it("treats common provider aliases as the same team identity", () => {
    expect(arePredictionReviewTeamNamesEquivalent("USA", "United States")).toBe(true);
    expect(arePredictionReviewTeamNamesEquivalent("Türkiye", "Turkey")).toBe(true);
    expect(arePredictionReviewTeamNamesEquivalent("Curaçao", "Curacao")).toBe(true);
    expect(arePredictionReviewTeamNamesEquivalent("Congo DR", "DR Congo")).toBe(true);
  });
});
