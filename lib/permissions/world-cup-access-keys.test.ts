import { describe, expect, it } from "vitest";
import {
  buildWorldCupGroupAccessKey,
  buildWorldCupSemifinalsFinalStageKeys,
  buildWorldCupStageAccessKey,
  normalizeWorldCupGroupLetter,
  normalizeWorldCupStageKey,
  WORLD_CUP_2026_COMPETITION_KEY,
} from "./world-cup-access-keys";

describe("world cup access keys", () => {
  it("exposes the canonical competition key", () => {
    expect(WORLD_CUP_2026_COMPETITION_KEY).toBe("world_cup_2026");
  });

  it("normalizes group 'a' to world_cup_2026:group:A", () => {
    expect(buildWorldCupGroupAccessKey("a")).toBe("world_cup_2026:group:A");
  });

  it("produces the same key for group 'A' and 'a'", () => {
    expect(buildWorldCupGroupAccessKey("A")).toBe(buildWorldCupGroupAccessKey("a"));
  });

  it("returns clear validation error for invalid group letters", () => {
    expect(() => normalizeWorldCupGroupLetter("I")).toThrow(
      "groupLetter must be one of A, B, C, D, E, F, G, H",
    );
  });

  it("builds canonical final and semifinal stage keys", () => {
    expect(buildWorldCupStageAccessKey("final")).toBe("world_cup_2026:stage:final");
    expect(buildWorldCupStageAccessKey("semifinal")).toBe(
      "world_cup_2026:stage:semifinal",
    );
  });

  it("returns clear validation error for invalid stages", () => {
    expect(() => normalizeWorldCupStageKey("group")).toThrow(
      "stage must be one of round_of_16, quarterfinal, semifinal, final",
    );
  });

  it("returns exactly semifinal and final canonical stage keys", () => {
    expect(buildWorldCupSemifinalsFinalStageKeys()).toEqual([
      "world_cup_2026:stage:semifinal",
      "world_cup_2026:stage:final",
    ]);
  });
});
