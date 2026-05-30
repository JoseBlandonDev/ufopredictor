export const WORLD_CUP_2026_COMPETITION_KEY = "world_cup_2026";

export type WorldCupStage =
  | "group"
  | "round_of_16"
  | "quarterfinal"
  | "semifinal"
  | "final";

export type WorldCupPackageKind =
  | "world_cup_full_pass"
  | "match_pack_10"
  | "single_match_unlock"
  | "team_pass"
  | "group_pass"
  | "stage_pass"
  | "semifinals_final_pass";

export type WorldCupAccessIntent =
  | {
      intentType: "entitlement";
      packageKind: "world_cup_full_pass" | "team_pass" | "group_pass" | "stage_pass";
      entitlementType: "competition_access" | "team_access" | "stage_access";
      resourceType: "competition" | "team" | "stage";
      resourceId: string;
      requiresUnlockMaterialization: false;
    }
  | {
      intentType: "entitlement";
      packageKind: "semifinals_final_pass";
      entitlementType: "stage_access";
      resourceType: "stage";
      resourceId: string;
      requiresUnlockMaterialization: false;
      linkedStageResourceIds: [string, string];
    }
  | {
      intentType: "pack";
      packageKind: "match_pack_10";
      packType: "match_pack";
      quantity: 10;
      requiresUnlockMaterialization: true;
      unlockResourceType: "match";
      packKey: string;
    }
  | {
      intentType: "match_unlock";
      packageKind: "single_match_unlock";
      resourceType: "match";
      matchId: string;
      requiresUnlockMaterialization: false;
    };

export type WorldCupPackageMappingInput =
  | { packageKind: "world_cup_full_pass"; competitionKey?: string }
  | { packageKind: "match_pack_10"; competitionKey?: string }
  | { packageKind: "single_match_unlock"; matchId: string }
  | { packageKind: "team_pass"; teamKey: string }
  | { packageKind: "group_pass"; groupCode: string; competitionKey?: string }
  | { packageKind: "stage_pass"; stage: Exclude<WorldCupStage, "group">; competitionKey?: string }
  | { packageKind: "semifinals_final_pass"; competitionKey?: string };

export function canonicalWorldCupStageAccessKey(
  stage: Exclude<WorldCupStage, "group">,
  competitionKey = WORLD_CUP_2026_COMPETITION_KEY,
) {
  return `${competitionKey}:stage:${stage}`;
}

export function canonicalWorldCupGroupAccessKey(
  groupCode: string,
  competitionKey = WORLD_CUP_2026_COMPETITION_KEY,
) {
  const normalizedGroup = groupCode.trim().toUpperCase();

  if (!/^[A-Z]$/.test(normalizedGroup)) {
    throw new Error("groupCode must be a single letter A-Z");
  }

  return `${competitionKey}:group:${normalizedGroup}`;
}

export function toWorldCupAccessIntent(
  input: WorldCupPackageMappingInput,
): WorldCupAccessIntent {
  switch (input.packageKind) {
    case "world_cup_full_pass": {
      const competitionKey = input.competitionKey ?? WORLD_CUP_2026_COMPETITION_KEY;
      return {
        intentType: "entitlement",
        packageKind: input.packageKind,
        entitlementType: "competition_access",
        resourceType: "competition",
        resourceId: competitionKey,
        requiresUnlockMaterialization: false,
      };
    }
    case "match_pack_10": {
      const competitionKey = input.competitionKey ?? WORLD_CUP_2026_COMPETITION_KEY;
      return {
        intentType: "pack",
        packageKind: input.packageKind,
        packType: "match_pack",
        quantity: 10,
        requiresUnlockMaterialization: true,
        unlockResourceType: "match",
        packKey: `${competitionKey}:pack:10`,
      };
    }
    case "single_match_unlock":
      return {
        intentType: "match_unlock",
        packageKind: input.packageKind,
        resourceType: "match",
        matchId: input.matchId,
        requiresUnlockMaterialization: false,
      };
    case "team_pass":
      return {
        intentType: "entitlement",
        packageKind: input.packageKind,
        entitlementType: "team_access",
        resourceType: "team",
        resourceId: input.teamKey,
        requiresUnlockMaterialization: false,
      };
    case "group_pass": {
      const competitionKey = input.competitionKey ?? WORLD_CUP_2026_COMPETITION_KEY;
      return {
        intentType: "entitlement",
        packageKind: input.packageKind,
        entitlementType: "stage_access",
        resourceType: "stage",
        resourceId: canonicalWorldCupGroupAccessKey(input.groupCode, competitionKey),
        requiresUnlockMaterialization: false,
      };
    }
    case "stage_pass": {
      const competitionKey = input.competitionKey ?? WORLD_CUP_2026_COMPETITION_KEY;
      return {
        intentType: "entitlement",
        packageKind: input.packageKind,
        entitlementType: "stage_access",
        resourceType: "stage",
        resourceId: canonicalWorldCupStageAccessKey(input.stage, competitionKey),
        requiresUnlockMaterialization: false,
      };
    }
    case "semifinals_final_pass": {
      const competitionKey = input.competitionKey ?? WORLD_CUP_2026_COMPETITION_KEY;
      const semifinalKey = canonicalWorldCupStageAccessKey("semifinal", competitionKey);
      const finalKey = canonicalWorldCupStageAccessKey("final", competitionKey);

      return {
        intentType: "entitlement",
        packageKind: input.packageKind,
        entitlementType: "stage_access",
        resourceType: "stage",
        resourceId: `${competitionKey}:stage:semifinal_final`,
        requiresUnlockMaterialization: false,
        linkedStageResourceIds: [semifinalKey, finalKey],
      };
    }
  }
}
