import { describe, expect, it } from "vitest";
import { toWorldCupAccessIntent } from "./world-cup-package-mapping";
import { simulateWorldCupPackageMaterialization } from "./world-cup-package-materialization";

describe("world cup package materialization", () => {
  it("materializes Full Pass as competition entitlement and never global", () => {
    const operations = simulateWorldCupPackageMaterialization({
      intent: toWorldCupAccessIntent({ packageKind: "world_cup_full_pass" }),
    });

    expect(operations).toEqual([
      {
        kind: "entitlement_grant",
        resourceType: "competition",
        resourceId: "world_cup_2026",
        sourcePackageKey: "world_cup_full_pass",
      },
    ]);
    expect(operations.some((operation) => operation.kind === "entitlement_grant" && operation.resourceType === "global")).toBe(false);
  });

  it("materializes Team Pass as a team entitlement", () => {
    const operations = simulateWorldCupPackageMaterialization({
      intent: toWorldCupAccessIntent({ packageKind: "team_pass", teamKey: "team-colombia" }),
    });

    expect(operations).toEqual([
      {
        kind: "entitlement_grant",
        resourceType: "team",
        resourceId: "team-colombia",
        sourcePackageKey: "team_pass",
      },
    ]);
  });

  it("materializes Group Pass using canonical stage-like key and no group resource type", () => {
    const operations = simulateWorldCupPackageMaterialization({
      intent: toWorldCupAccessIntent({ packageKind: "group_pass", groupCode: "c" }),
    });

    expect(operations).toEqual([
      {
        kind: "entitlement_grant",
        resourceType: "stage",
        resourceId: "world_cup_2026:group:C",
        sourcePackageKey: "group_pass",
      },
    ]);
  });

  it("materializes Stage Pass as stage entitlement", () => {
    const operations = simulateWorldCupPackageMaterialization({
      intent: toWorldCupAccessIntent({ packageKind: "stage_pass", stage: "quarterfinal" }),
    });

    expect(operations).toEqual([
      {
        kind: "entitlement_grant",
        resourceType: "stage",
        resourceId: "world_cup_2026:stage:quarterfinal",
        sourcePackageKey: "stage_pass",
      },
    ]);
  });

  it("expands Semifinals/Final Pass into two canonical stage grants", () => {
    const operations = simulateWorldCupPackageMaterialization({
      intent: toWorldCupAccessIntent({ packageKind: "semifinals_final_pass" }),
    });

    expect(operations).toEqual([
      {
        kind: "entitlement_grant",
        resourceType: "stage",
        resourceId: "world_cup_2026:stage:semifinal",
        sourcePackageKey: "semifinals_final_pass",
      },
      {
        kind: "entitlement_grant",
        resourceType: "stage",
        resourceId: "world_cup_2026:stage:final",
        sourcePackageKey: "semifinals_final_pass",
      },
    ]);
  });

  it("materializes Single Match Unlock as explicit match unlock operation", () => {
    const operations = simulateWorldCupPackageMaterialization({
      intent: toWorldCupAccessIntent({
        packageKind: "single_match_unlock",
        matchId: "match-100",
      }),
    });

    expect(operations).toEqual([
      {
        kind: "match_unlock_grant",
        matchId: "match-100",
        sourcePackageKey: "single_match_unlock",
      },
    ]);
  });

  it("returns pack_requires_selection for 10 Match Pack without selected matches", () => {
    const operations = simulateWorldCupPackageMaterialization({
      intent: toWorldCupAccessIntent({ packageKind: "match_pack_10" }),
    });

    expect(operations).toEqual([
      {
        kind: "pack_requires_selection",
        quantity: 10,
        sourcePackageKey: "match_pack_10",
        reason: "Se requiere seleccionar partidos para materializar unlocks explIcitos.",
      },
    ]);
    expect(operations.some((operation) => operation.kind === "match_unlock_grant")).toBe(false);
  });

  it("materializes explicit match unlock grants for valid 10 Match Pack selections", () => {
    const operations = simulateWorldCupPackageMaterialization({
      intent: toWorldCupAccessIntent({ packageKind: "match_pack_10" }),
      selectedMatchIds: ["match-1", "match-2", "match-3"],
    });

    expect(operations).toEqual([
      {
        kind: "match_unlock_grant",
        matchId: "match-1",
        sourcePackageKey: "match_pack_10",
      },
      {
        kind: "match_unlock_grant",
        matchId: "match-2",
        sourcePackageKey: "match_pack_10",
      },
      {
        kind: "match_unlock_grant",
        matchId: "match-3",
        sourcePackageKey: "match_pack_10",
      },
    ]);
  });

  it("returns validation error when pack selection exceeds ten matches", () => {
    const operations = simulateWorldCupPackageMaterialization({
      intent: toWorldCupAccessIntent({ packageKind: "match_pack_10" }),
      selectedMatchIds: [
        "m1",
        "m2",
        "m3",
        "m4",
        "m5",
        "m6",
        "m7",
        "m8",
        "m9",
        "m10",
        "m11",
      ],
    });

    expect(operations).toEqual([
      {
        kind: "pack_selection_validation_error",
        sourcePackageKey: "match_pack_10",
        reason: "La seleccion supera el maximo permitido de 10 partidos.",
      },
    ]);
  });

  it("returns validation error when pack selection contains duplicates", () => {
    const operations = simulateWorldCupPackageMaterialization({
      intent: toWorldCupAccessIntent({ packageKind: "match_pack_10" }),
      selectedMatchIds: ["match-1", "match-1"],
    });

    expect(operations).toEqual([
      {
        kind: "pack_selection_validation_error",
        sourcePackageKey: "match_pack_10",
        reason: "La seleccion contiene partidos duplicados.",
      },
    ]);
  });

  it("keeps operations conceptually compatible with user_entitlements and user_match_unlocks", () => {
    const entitlementOps = simulateWorldCupPackageMaterialization({
      intent: toWorldCupAccessIntent({ packageKind: "stage_pass", stage: "final" }),
    });
    const unlockOps = simulateWorldCupPackageMaterialization({
      intent: toWorldCupAccessIntent({
        packageKind: "single_match_unlock",
        matchId: "match-999",
      }),
    });

    expect(entitlementOps[0]?.kind).toBe("entitlement_grant");
    expect(unlockOps[0]?.kind).toBe("match_unlock_grant");
  });
});
