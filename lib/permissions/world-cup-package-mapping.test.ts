import { describe, expect, it } from "vitest";
import {
  buildWorldCupGroupAccessKey,
  buildWorldCupStageAccessKey,
  WORLD_CUP_2026_COMPETITION_KEY,
} from "./world-cup-access-keys";
import {
  toWorldCupAccessIntent,
} from "./world-cup-package-mapping";

describe("world cup package mapping", () => {
  it("maps World Cup Full Pass to a competition entitlement intent", () => {
    const intent = toWorldCupAccessIntent({ packageKind: "world_cup_full_pass" });

    expect(intent).toMatchObject({
      intentType: "entitlement",
      packageKind: "world_cup_full_pass",
      entitlementType: "competition_access",
      resourceType: "competition",
      resourceId: WORLD_CUP_2026_COMPETITION_KEY,
      requiresUnlockMaterialization: false,
    });
    expect(intent.resourceType).not.toBe("global");
  });

  it("maps 10 Match Pack to a non-authorizing pack intent", () => {
    const intent = toWorldCupAccessIntent({ packageKind: "match_pack_10" });

    expect(intent).toMatchObject({
      intentType: "pack",
      packageKind: "match_pack_10",
      quantity: 10,
      requiresUnlockMaterialization: true,
      unlockResourceType: "match",
    });
  });

  it("maps Single Match Unlock to a match unlock intent", () => {
    const intent = toWorldCupAccessIntent({
      packageKind: "single_match_unlock",
      matchId: "match-123",
    });

    expect(intent).toMatchObject({
      intentType: "match_unlock",
      packageKind: "single_match_unlock",
      resourceType: "match",
      matchId: "match-123",
      requiresUnlockMaterialization: false,
    });
  });

  it("maps Team/Country Pass to team entitlement intent", () => {
    const intent = toWorldCupAccessIntent({
      packageKind: "team_pass",
      teamKey: "team-argentina",
    });

    expect(intent).toMatchObject({
      intentType: "entitlement",
      packageKind: "team_pass",
      entitlementType: "team_access",
      resourceType: "team",
      resourceId: "team-argentina",
    });
  });

  it("builds a canonical Group Pass key", () => {
    expect(buildWorldCupGroupAccessKey("a")).toBe("world_cup_2026:group:A");
    expect(
      toWorldCupAccessIntent({ packageKind: "group_pass", groupCode: "b" }),
    ).toMatchObject({
      intentType: "entitlement",
      packageKind: "group_pass",
      entitlementType: "stage_access",
      resourceType: "stage",
      resourceId: "world_cup_2026:group:B",
    });
  });

  it("maps Stage Pass to canonical stage entitlement intent", () => {
    const intent = toWorldCupAccessIntent({
      packageKind: "stage_pass",
      stage: "final",
    });

    expect(intent).toMatchObject({
      intentType: "entitlement",
      packageKind: "stage_pass",
      entitlementType: "stage_access",
      resourceType: "stage",
      resourceId: buildWorldCupStageAccessKey("final"),
    });
  });

  it("maps Semifinals/Final Pass to canonical stage-linked intent", () => {
    const intent = toWorldCupAccessIntent({ packageKind: "semifinals_final_pass" });

    expect(intent).toMatchObject({
      intentType: "entitlement",
      packageKind: "semifinals_final_pass",
      entitlementType: "stage_access",
      resourceType: "stage",
      linkedStageResourceIds: [
        "world_cup_2026:stage:semifinal",
        "world_cup_2026:stage:final",
      ],
    });
  });

  it("rejects invalid group keys", () => {
    expect(() => buildWorldCupGroupAccessKey("12")).toThrow(
      "groupLetter must be one of A, B, C, D, E, F, G, H",
    );
  });
});
