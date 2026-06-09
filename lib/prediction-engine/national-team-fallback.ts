import type { TeamPredictionInput } from "./types";

type NationalTeamFallbackSignals = NonNullable<TeamPredictionInput["signals"]>;

type NationalTeamFallbackProfile = {
  ratingScore: number;
  recentFormScore: number;
  attackScore: number;
  defenseScore: number;
};

const NATIONAL_TEAM_FALLBACKS: Record<string, NationalTeamFallbackProfile> = {
  argentina: {
    ratingScore: 95,
    recentFormScore: 88,
    attackScore: 92,
    defenseScore: 89,
  },
  iceland: {
    ratingScore: 52,
    recentFormScore: 49,
    attackScore: 50,
    defenseScore: 53,
  },
  chile: {
    ratingScore: 74,
    recentFormScore: 68,
    attackScore: 72,
    defenseScore: 70,
  },
  "congo-dr": {
    ratingScore: 58,
    recentFormScore: 54,
    attackScore: 56,
    defenseScore: 55,
  },
  "dr-congo": {
    ratingScore: 58,
    recentFormScore: 54,
    attackScore: 56,
    defenseScore: 55,
  },
  "congo-rd": {
    ratingScore: 58,
    recentFormScore: 54,
    attackScore: 56,
    defenseScore: 55,
  },
  hungary: {
    ratingScore: 69,
    recentFormScore: 65,
    attackScore: 67,
    defenseScore: 66,
  },
  kazakhstan: {
    ratingScore: 46,
    recentFormScore: 44,
    attackScore: 45,
    defenseScore: 47,
  },
  "saudi-arabia": {
    ratingScore: 62,
    recentFormScore: 58,
    attackScore: 60,
    defenseScore: 59,
  },
  senegal: {
    ratingScore: 84,
    recentFormScore: 79,
    attackScore: 82,
    defenseScore: 80,
  },
  iraq: {
    ratingScore: 55,
    recentFormScore: 52,
    attackScore: 53,
    defenseScore: 54,
  },
  venezuela: {
    ratingScore: 64,
    recentFormScore: 60,
    attackScore: 62,
    defenseScore: 61,
  },
};

function normalizeNationalTeamKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveNationalTeamFallbackSignals(team: Pick<TeamPredictionInput, "name">): NationalTeamFallbackSignals | undefined {
  const fallback = NATIONAL_TEAM_FALLBACKS[normalizeNationalTeamKey(team.name)];

  if (!fallback) {
    return undefined;
  }

  return {
    ratingScore: fallback.ratingScore,
    recentFormScore: fallback.recentFormScore,
    attackScore: fallback.attackScore,
    defenseScore: fallback.defenseScore,
  };
}
