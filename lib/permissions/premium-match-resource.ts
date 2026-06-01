import type { PremiumMatchResource } from "./entitlements";
import {
  buildWorldCupGroupAccessKey,
  buildWorldCupStageAccessKey,
  WORLD_CUP_2026_COMPETITION_KEY,
} from "./world-cup-access-keys";

export type PremiumMatchResourceBuildInput = {
  matchId: string | null;
  competitionAccessKey: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  stageLabel: string | null;
};

export type PremiumMatchResourceBuildResult =
  | {
      status: "ready";
      resource: PremiumMatchResource;
    }
  | {
      status: "invalid";
      reason:
        | "missing_match_id"
        | "missing_competition_access_key"
        | "missing_home_team_id"
        | "missing_away_team_id"
        | "unrecognized_world_cup_stage";
      message: string;
    };

type PremiumMatchResourceBuildErrorReason = Extract<
  PremiumMatchResourceBuildResult,
  { status: "invalid" }
>["reason"];

export function normalizeCompetitionAccessKey(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "world-cup-2026" || normalized === "world cup 2026") {
    return WORLD_CUP_2026_COMPETITION_KEY;
  }

  return normalized;
}

function deriveWorldCupStageAccessKey(stageLabel: string): string | null {
  const normalized = stageLabel.trim().toLowerCase();

  const groupMatch = normalized.match(/(?:group|grupo)\s*([a-h])/i);
  if (groupMatch?.[1]) {
    return buildWorldCupGroupAccessKey(groupMatch[1]);
  }

  if (normalized === "round_of_16" || normalized === "round of 16" || normalized === "octavos") {
    return buildWorldCupStageAccessKey("round_of_16");
  }

  if (normalized === "quarterfinal" || normalized === "quarter-final" || normalized === "cuartos") {
    return buildWorldCupStageAccessKey("quarterfinal");
  }

  if (normalized === "semifinal" || normalized === "semi-final" || normalized === "semifinales") {
    return buildWorldCupStageAccessKey("semifinal");
  }

  if (normalized === "final") {
    return buildWorldCupStageAccessKey("final");
  }

  return null;
}

function invalid(
  reason: PremiumMatchResourceBuildErrorReason,
  message: string,
): PremiumMatchResourceBuildResult {
  return { status: "invalid", reason, message };
}

export function buildPremiumMatchResource(
  input: PremiumMatchResourceBuildInput,
): PremiumMatchResourceBuildResult {
  if (!input.matchId) {
    return invalid("missing_match_id", "matchId is required.");
  }

  if (!input.competitionAccessKey) {
    return invalid(
      "missing_competition_access_key",
      "competitionAccessKey is required.",
    );
  }

  if (!input.homeTeamId) {
    return invalid("missing_home_team_id", "homeTeamId is required.");
  }

  if (!input.awayTeamId) {
    return invalid("missing_away_team_id", "awayTeamId is required.");
  }

  const canonicalCompetition = normalizeCompetitionAccessKey(input.competitionAccessKey);
  let stageAccessKey: string | null = null;

  if (canonicalCompetition === WORLD_CUP_2026_COMPETITION_KEY && input.stageLabel) {
    stageAccessKey = deriveWorldCupStageAccessKey(input.stageLabel);

    if (stageAccessKey === null) {
      return invalid(
        "unrecognized_world_cup_stage",
        "World Cup stage could not be normalized from server stageLabel.",
      );
    }
  }

  return {
    status: "ready",
    resource: {
      access: "premium",
      resourceType: "match",
      resourceId: input.matchId,
      matchId: input.matchId,
      competitionId: canonicalCompetition,
      stageAccessKey,
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
    },
  };
}
