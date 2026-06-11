import type { TeamPredictionInput } from "./types";

type NationalTeamFallbackSignals = NonNullable<TeamPredictionInput["signals"]>;
// MVP 1 static fallbacks use conservative public ranking/Elo-style strength references
// to avoid default-signal collapse for known national teams. They are launch-safe
// placeholders, not final or continuously updated ratings.
const NATIONAL_TEAM_FALLBACKS: Record<string, NationalTeamFallbackSignals> = {
  argentina: {
    ratingScore: 95,
    recentFormScore: 88,
    attackScore: 92,
    defenseScore: 89,
    marketScore: 50,
    lineupContextScore: 50,
  },
  iceland: {
    ratingScore: 52,
    recentFormScore: 49,
    attackScore: 50,
    defenseScore: 53,
    marketScore: 50,
    lineupContextScore: 50,
  },
  chile: {
    ratingScore: 74,
    recentFormScore: 68,
    attackScore: 72,
    defenseScore: 70,
    marketScore: 50,
    lineupContextScore: 50,
  },
  "congo-dr": {
    ratingScore: 58,
    recentFormScore: 54,
    attackScore: 56,
    defenseScore: 55,
    marketScore: 50,
    lineupContextScore: 50,
  },
  "dr-congo": {
    ratingScore: 58,
    recentFormScore: 54,
    attackScore: 56,
    defenseScore: 55,
    marketScore: 50,
    lineupContextScore: 50,
  },
  "congo-rd": {
    ratingScore: 58,
    recentFormScore: 54,
    attackScore: 56,
    defenseScore: 55,
    marketScore: 50,
    lineupContextScore: 50,
  },
  hungary: {
    ratingScore: 69,
    recentFormScore: 65,
    attackScore: 67,
    defenseScore: 66,
    marketScore: 50,
    lineupContextScore: 50,
  },
  kazakhstan: {
    ratingScore: 46,
    recentFormScore: 44,
    attackScore: 45,
    defenseScore: 47,
    marketScore: 50,
    lineupContextScore: 50,
  },
  "saudi-arabia": {
    ratingScore: 62,
    recentFormScore: 58,
    attackScore: 60,
    defenseScore: 59,
    marketScore: 50,
    lineupContextScore: 50,
  },
  senegal: {
    ratingScore: 84,
    recentFormScore: 79,
    attackScore: 82,
    defenseScore: 80,
    marketScore: 50,
    lineupContextScore: 50,
  },
  iraq: {
    ratingScore: 55,
    recentFormScore: 52,
    attackScore: 53,
    defenseScore: 54,
    marketScore: 50,
    lineupContextScore: 50,
  },
  venezuela: {
    ratingScore: 64,
    recentFormScore: 60,
    attackScore: 62,
    defenseScore: 61,
    marketScore: 50,
    lineupContextScore: 50,
  },
  mexico: {
    ratingScore: 72,
    recentFormScore: 67,
    attackScore: 60,
    defenseScore: 65,
    marketScore: 50,
    lineupContextScore: 50,
  },
  "south-africa": {
    ratingScore: 48,
    recentFormScore: 53,
    attackScore: 52,
    defenseScore: 53,
    marketScore: 50,
    lineupContextScore: 50,
  },
  "south-korea": {
    ratingScore: 64,
    recentFormScore: 59,
    attackScore: 55,
    defenseScore: 57,
    marketScore: 50,
    lineupContextScore: 50,
  },
  "korea-republic": {
    ratingScore: 64,
    recentFormScore: 59,
    attackScore: 55,
    defenseScore: 57,
    marketScore: 50,
    lineupContextScore: 50,
  },
  "czech-republic": {
    ratingScore: 62,
    recentFormScore: 61,
    attackScore: 59,
    defenseScore: 55,
    marketScore: 50,
    lineupContextScore: 50,
  },
  czechia: {
    ratingScore: 62,
    recentFormScore: 61,
    attackScore: 59,
    defenseScore: 55,
    marketScore: 50,
    lineupContextScore: 50,
  },
  canada: {
    ratingScore: 66,
    recentFormScore: 61,
    attackScore: 55,
    defenseScore: 64,
    marketScore: 50,
    lineupContextScore: 50,
  },
  "bosnia-herzegovina": {
    ratingScore: 51,
    recentFormScore: 53,
    attackScore: 60,
    defenseScore: 54,
    marketScore: 50,
    lineupContextScore: 50,
  },
  "bosnia-and-herzegovina": {
    ratingScore: 51,
    recentFormScore: 53,
    attackScore: 60,
    defenseScore: 54,
    marketScore: 50,
    lineupContextScore: 50,
  },
  usa: {
    ratingScore: 65,
    recentFormScore: 55,
    attackScore: 65,
    defenseScore: 55,
    marketScore: 50,
    lineupContextScore: 50,
  },
  "united-states": {
    ratingScore: 65,
    recentFormScore: 55,
    attackScore: 65,
    defenseScore: 55,
    marketScore: 50,
    lineupContextScore: 50,
  },
  paraguay: {
    ratingScore: 68,
    recentFormScore: 61,
    attackScore: 62,
    defenseScore: 66,
    marketScore: 50,
    lineupContextScore: 50,
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
    ...fallback,
  };
}
