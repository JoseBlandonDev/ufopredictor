export const WORLD_CUP_2026_COMPETITION_KEY = "world_cup_2026";

const WORLD_CUP_GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
const WORLD_CUP_STAGE_VALUES = ["round_of_16", "quarterfinal", "semifinal", "final"] as const;

export type WorldCupGroupLetter = (typeof WORLD_CUP_GROUP_LETTERS)[number];
export type WorldCupCanonicalStage = (typeof WORLD_CUP_STAGE_VALUES)[number];

function isWorldCupGroupLetter(value: string): value is WorldCupGroupLetter {
  return WORLD_CUP_GROUP_LETTERS.includes(value as WorldCupGroupLetter);
}

function isWorldCupCanonicalStage(value: string): value is WorldCupCanonicalStage {
  return WORLD_CUP_STAGE_VALUES.includes(value as WorldCupCanonicalStage);
}

export function normalizeWorldCupGroupLetter(groupLetter: string): WorldCupGroupLetter {
  const normalized = groupLetter.trim().toUpperCase();

  if (!isWorldCupGroupLetter(normalized)) {
    throw new Error("groupLetter must be one of A, B, C, D, E, F, G, H");
  }

  return normalized;
}

export function normalizeWorldCupStageKey(stage: string): WorldCupCanonicalStage {
  const normalized = stage.trim().toLowerCase();

  if (!isWorldCupCanonicalStage(normalized)) {
    throw new Error(
      "stage must be one of round_of_16, quarterfinal, semifinal, final",
    );
  }

  return normalized;
}

export function buildWorldCupGroupAccessKey(
  groupLetter: string,
  competitionKey = WORLD_CUP_2026_COMPETITION_KEY,
) {
  const normalizedGroup = normalizeWorldCupGroupLetter(groupLetter);
  return `${competitionKey}:group:${normalizedGroup}`;
}

export function buildWorldCupStageAccessKey(
  stage: string,
  competitionKey = WORLD_CUP_2026_COMPETITION_KEY,
) {
  const normalizedStage = normalizeWorldCupStageKey(stage);
  return `${competitionKey}:stage:${normalizedStage}`;
}

export function buildWorldCupSemifinalsFinalStageKeys(
  competitionKey = WORLD_CUP_2026_COMPETITION_KEY,
) {
  return [
    buildWorldCupStageAccessKey("semifinal", competitionKey),
    buildWorldCupStageAccessKey("final", competitionKey),
  ] as const;
}
