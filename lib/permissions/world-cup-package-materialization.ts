import type { WorldCupAccessIntent } from "./world-cup-package-mapping";

export type WorldCupGrantOperation =
  | {
      kind: "entitlement_grant";
      resourceType: "competition" | "stage" | "team" | "match" | "global";
      resourceId: string;
      sourcePackageKey: string;
    }
  | {
      kind: "match_unlock_grant";
      matchId: string;
      sourcePackageKey: string;
    }
  | {
      kind: "pack_requires_selection";
      quantity: number;
      sourcePackageKey: string;
      reason: string;
    }
  | {
      kind: "pack_selection_validation_error";
      sourcePackageKey: string;
      reason: string;
    };

export type WorldCupPackageMaterializationInput = {
  intent: WorldCupAccessIntent;
  selectedMatchIds?: string[];
};

function hasDuplicate(values: string[]) {
  return new Set(values).size !== values.length;
}

function validatePackSelection(
  selectedMatchIds: string[] | undefined,
  quantity: number,
  sourcePackageKey: string,
): WorldCupGrantOperation | null {
  if (!selectedMatchIds || selectedMatchIds.length === 0) {
    return {
      kind: "pack_requires_selection",
      quantity,
      sourcePackageKey,
      reason: "Se requiere seleccionar partidos para materializar unlocks explIcitos.",
    };
  }

  if (selectedMatchIds.length > quantity) {
    return {
      kind: "pack_selection_validation_error",
      sourcePackageKey,
      reason: `La seleccion supera el maximo permitido de ${quantity} partidos.`,
    };
  }

  if (selectedMatchIds.some((id) => id.trim().length === 0)) {
    return {
      kind: "pack_selection_validation_error",
      sourcePackageKey,
      reason: "La seleccion contiene match IDs vacIos.",
    };
  }

  if (hasDuplicate(selectedMatchIds)) {
    return {
      kind: "pack_selection_validation_error",
      sourcePackageKey,
      reason: "La seleccion contiene partidos duplicados.",
    };
  }

  return null;
}

export function simulateWorldCupPackageMaterialization({
  intent,
  selectedMatchIds,
}: WorldCupPackageMaterializationInput): WorldCupGrantOperation[] {
  const sourcePackageKey = intent.packageKind;

  if (intent.intentType === "entitlement") {
    if (intent.packageKind === "semifinals_final_pass") {
      return intent.linkedStageResourceIds.map((resourceId) => ({
        kind: "entitlement_grant",
        resourceType: "stage",
        resourceId,
        sourcePackageKey,
      }));
    }

    return [
      {
        kind: "entitlement_grant",
        resourceType: intent.resourceType,
        resourceId: intent.resourceId,
        sourcePackageKey,
      },
    ];
  }

  if (intent.intentType === "match_unlock") {
    return [
      {
        kind: "match_unlock_grant",
        matchId: intent.matchId,
        sourcePackageKey,
      },
    ];
  }

  const validationIssue = validatePackSelection(
    selectedMatchIds,
    intent.quantity,
    sourcePackageKey,
  );

  if (validationIssue) {
    return [validationIssue];
  }

  return selectedMatchIds!.map((matchId) => ({
    kind: "match_unlock_grant",
    matchId,
    sourcePackageKey,
  }));
}
