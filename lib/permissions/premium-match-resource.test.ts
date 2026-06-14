import { describe, expect, it } from "vitest";
import { resolvePremiumMatchAccess, type ViewerAccessContext } from "./entitlements";
import {
  buildPremiumMatchResource,
  normalizeCompetitionAccessKey,
} from "./premium-match-resource";
import {
  buildWorldCupGroupAccessKey,
  buildWorldCupStageAccessKey,
  WORLD_CUP_2026_COMPETITION_KEY,
} from "./world-cup-access-keys";

const emptyViewer: ViewerAccessContext = {
  viewerKind: "authenticated",
  role: "free_user",
  subscriptions: [],
  entitlements: [],
  matchUnlocks: [],
};

describe("premium match resource contract", () => {
  it("builds a resource with canonical world cup competition key", () => {
    const result = buildPremiumMatchResource({
      matchId: "match-1",
      competitionAccessKey: WORLD_CUP_2026_COMPETITION_KEY,
      homeTeamId: "team-home",
      awayTeamId: "team-away",
      stageLabel: "final",
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.resource.competitionId).toBe(WORLD_CUP_2026_COMPETITION_KEY);
  });

  it("normalizes world-cup-2026 into world_cup_2026", () => {
    expect(normalizeCompetitionAccessKey("world-cup-2026")).toBe(
      WORLD_CUP_2026_COMPETITION_KEY,
    );
  });

  it("builds canonical group stage access key", () => {
    const result = buildPremiumMatchResource({
      matchId: "match-2",
      competitionAccessKey: "world-cup-2026",
      homeTeamId: "team-home",
      awayTeamId: "team-away",
      stageLabel: "Group a",
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.resource.stageAccessKey).toBe(buildWorldCupGroupAccessKey("A"));
  });

  it("keeps real world cup stage labels like Group Stage - 1 valid with no stage key", () => {
    const result = buildPremiumMatchResource({
      matchId: "match-group-stage-1",
      competitionAccessKey: WORLD_CUP_2026_COMPETITION_KEY,
      homeTeamId: "team-home",
      awayTeamId: "team-away",
      stageLabel: "Group Stage - 1",
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.resource.stageAccessKey).toBeNull();
  });

  it("builds canonical final stage access key", () => {
    const result = buildPremiumMatchResource({
      matchId: "match-3",
      competitionAccessKey: WORLD_CUP_2026_COMPETITION_KEY,
      homeTeamId: "team-home",
      awayTeamId: "team-away",
      stageLabel: "final",
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.resource.stageAccessKey).toBe(buildWorldCupStageAccessKey("final"));
  });

  it("returns controlled error when required fields are missing", () => {
    expect(
      buildPremiumMatchResource({
        matchId: null,
        competitionAccessKey: WORLD_CUP_2026_COMPETITION_KEY,
        homeTeamId: "team-home",
        awayTeamId: "team-away",
        stageLabel: "final",
      }),
    ).toMatchObject({ status: "invalid", reason: "missing_match_id" });
  });

  it("degrades unknown world cup stage labels to null stage access", () => {
    const result = buildPremiumMatchResource({
      matchId: "match-4",
      competitionAccessKey: WORLD_CUP_2026_COMPETITION_KEY,
      homeTeamId: "team-home",
      awayTeamId: "team-away",
      stageLabel: "golden stage",
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.resource.stageAccessKey).toBeNull();
  });

  it("keeps known knockout labels normalized", () => {
    const result = buildPremiumMatchResource({
      matchId: "match-quarterfinal",
      competitionAccessKey: WORLD_CUP_2026_COMPETITION_KEY,
      homeTeamId: "team-home",
      awayTeamId: "team-away",
      stageLabel: "quarter-final",
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.resource.stageAccessKey).toBe(buildWorldCupStageAccessKey("quarterfinal"));
  });

  it("is compatible with resolvePremiumMatchAccess", () => {
    const result = buildPremiumMatchResource({
      matchId: "match-5",
      competitionAccessKey: WORLD_CUP_2026_COMPETITION_KEY,
      homeTeamId: "team-home",
      awayTeamId: "team-away",
      stageLabel: "final",
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    const access = resolvePremiumMatchAccess(emptyViewer, result.resource);
    expect(access).toMatchObject({ canAccess: false, source: "none" });
  });
});
