import type { MatchResultRow, MatchRow } from "@/types/database";
import type { ProviderFixture } from "@/lib/football-api/api-football-types";
import type { TargetCompetition, TargetCompetitionKey } from "@/lib/football-api/target-competitions";
import {
  buildApiFootballFixtureExternalId,
  buildApiFootballLeagueExternalId,
  buildApiFootballTeamExternalId,
} from "./external-ids";
import { buildCompetitionSlug, buildMatchSlug, toSlugPart } from "./slug";
import { mapProviderFixtureStatus } from "./status";

export type ApplyGuardInput = {
  apply: boolean;
  competition: TargetCompetitionKey | "all" | null;
  from?: string;
  to?: string;
  limit?: number;
};

export type ApplyConfig = {
  competitionKey: "colombia-primera-a";
  from: string;
  to: string;
  limit: number;
};

export type ApplyDisposition = "persist" | "skip";
export type ApplySkipReason =
  | "unknown_status"
  | "cancelled_status"
  | "postponed_status"
  | "abandoned_status"
  | "out_of_scope_competition";

export type ApplyFixtureDecision =
  | {
      action: "persist";
      mappedStatus: MatchRow["status"];
    }
  | {
      action: "skip";
      reason: ApplySkipReason;
    };

export type ExistingCompetitionSnapshot = {
  id: string;
  external_id: string | null;
  slug: string;
  usage_scope: "public_product" | "internal_lab";
};

export type ExistingSeasonSnapshot = {
  id: string;
  competition_id: string;
  year: number;
};

export type ExistingTeamSnapshot = {
  id: string;
  external_id: string | null;
  slug: string;
};

export type ExistingMatchSnapshot = {
  id: string;
  external_id: string | null;
  slug: string;
  access_scope: MatchRow["access_scope"];
};

export type ExistingMatchResultSnapshot = {
  id: string;
  match_id: string;
  verification_status: MatchResultRow["verification_status"];
  home_goals: number;
  away_goals: number;
};

export type CompetitionWritePlan = {
  externalId: string;
  slug: string;
  name: string;
  country: string | null;
  type: "international" | "league" | "cup";
  usageScope: "public_product";
  mode: "create" | "update";
  preserveExistingSlug: boolean;
};

export type SeasonWritePlan = {
  competitionExternalId: string;
  year: number;
  name: string;
  startsAt: string;
  endsAt: string;
  mode: "create" | "update";
};

export type TeamWritePlan = {
  externalId: string;
  slug: string;
  name: string;
  country: string | null;
  mode: "create" | "update";
  preserveExistingSlug: boolean;
};

export type MatchWritePlan = {
  fixtureId: number;
  externalId: string;
  slug: string;
  kickoffAt: string;
  stage: string | null;
  status: MatchRow["status"];
  homeTeamExternalId: string;
  awayTeamExternalId: string;
  competitionExternalId: string;
  seasonYear: number;
  accessScope: MatchRow["access_scope"];
  intakeSource: "api_football";
  sourceNote: string;
  venueId: null;
  mode: "create" | "update";
  preserveExistingSlug: boolean;
};

export type MatchResultWritePlan =
  | {
      action: "create";
      matchExternalId: string;
      homeGoals: number;
      awayGoals: number;
      verificationStatus: "pending_review";
      intakeSource: "api_football";
      sourceNote: string;
    }
  | {
      action: "update_pending_review";
      matchExternalId: string;
      homeGoals: number;
      awayGoals: number;
      verificationStatus: "pending_review";
      intakeSource: "api_football";
      sourceNote: string;
    }
  | {
      action: "skip";
      matchExternalId: string;
      reason: "existing_verified_or_rejected";
    };

export type ControlledWritePlan = {
  runTag: string;
  sourceNote: string;
  competition: ApplyConfig["competitionKey"];
  fetchedFixtures: number;
  plannedFixtures: number;
  skippedUnknown: number;
  skippedCancelled: number;
  skippedPostponed: number;
  skippedAbandoned: number;
  competitionPlans: CompetitionWritePlan[];
  seasonPlans: SeasonWritePlan[];
  teamPlans: TeamWritePlan[];
  matchPlans: MatchWritePlan[];
  matchResultPlans: MatchResultWritePlan[];
  touchedExternalIds: string[];
  warnings: string[];
};

type ExistingState = {
  competitionByExternalId?: Map<string, ExistingCompetitionSnapshot>;
  seasonByCompetitionYear?: Map<string, ExistingSeasonSnapshot>;
  teamByExternalId?: Map<string, ExistingTeamSnapshot>;
  matchByExternalId?: Map<string, ExistingMatchSnapshot>;
  matchResultByMatchId?: Map<string, ExistingMatchResultSnapshot>;
};

function assertApplyError(message: string): never {
  throw new Error(message);
}

export function resolveApplyConfig(input: ApplyGuardInput): ApplyConfig | null {
  if (!input.apply) {
    return null;
  }

  if (input.competition === "all") {
    assertApplyError("Apply mode is not allowed with --competition all in D05C.2A.");
  }

  if (input.competition !== "colombia-primera-a") {
    assertApplyError(
      "Apply mode in D05C.2A is allowed only for --competition colombia-primera-a.",
    );
  }

  if (!input.from || !input.to || typeof input.limit !== "number" || input.limit <= 0) {
    assertApplyError(
      "Apply mode requires explicit --from, --to, and --limit for D05C.2A.",
    );
  }

  return {
    competitionKey: "colombia-primera-a",
    from: input.from,
    to: input.to,
    limit: input.limit,
  };
}

export function buildApiFootballIngestRunTag(now = new Date()): string {
  return now.toISOString();
}

export function buildApiFootballIngestSourceNote(input: {
  runTag: string;
  competitionKey: string;
  from: string;
  to: string;
}): string {
  return `api_football_ingest_run=${input.runTag}; competition=${input.competitionKey}; from=${input.from}; to=${input.to}`;
}

export function decideApplyFixtureAction(
  fixture: ProviderFixture,
  target: TargetCompetition,
): ApplyFixtureDecision {
  if (fixture.competition.providerCompetitionId !== target.leagueId) {
    return { action: "skip", reason: "out_of_scope_competition" };
  }

  switch (fixture.status) {
    case "cancelled":
      return { action: "skip", reason: "cancelled_status" };
    case "postponed":
      return { action: "skip", reason: "postponed_status" };
    case "abandoned":
      return { action: "skip", reason: "abandoned_status" };
  }

  const mapped = mapProviderFixtureStatus(fixture.status);
  if (mapped.action === "skip") {
    return { action: "skip", reason: "unknown_status" };
  }

  return { action: "persist", mappedStatus: mapped.status };
}

function buildSeasonKey(competitionId: string, year: number): string {
  return `${competitionId}:${year}`;
}

function inferCompetitionType(target: TargetCompetition): "international" | "league" | "cup" {
  switch (target.key) {
    case "friendlies":
    case "world-cup":
      return "international";
    case "colombia-primera-a":
      return "league";
    case "copa-colombia":
      return "cup";
  }
}

function inferSeasonDates(target: TargetCompetition): { startsAt: string; endsAt: string } {
  if (target.key === "colombia-primera-a") {
    return {
      startsAt: `${target.season}-01-01`,
      endsAt: `${target.season}-12-31`,
    };
  }

  return {
    startsAt: `${target.season}-01-01`,
    endsAt: `${target.season}-12-31`,
  };
}

function pushTouchedExternalId(list: string[], seen: Set<string>, externalId: string) {
  if (seen.has(externalId)) {
    return;
  }

  seen.add(externalId);
  list.push(externalId);
}

function pushUniqueTeamPlan(
  list: TeamWritePlan[],
  seen: Set<string>,
  item: TeamWritePlan,
) {
  if (seen.has(item.externalId)) {
    return;
  }

  seen.add(item.externalId);
  list.push(item);
}

export function planControlledFixtureWrite(
  fixtures: ProviderFixture[],
  target: TargetCompetition,
  config: ApplyConfig,
  existing: ExistingState = {},
): ControlledWritePlan {
  const runTag = buildApiFootballIngestRunTag();
  const sourceNote = buildApiFootballIngestSourceNote({
    runTag,
    competitionKey: config.competitionKey,
    from: config.from,
    to: config.to,
  });

  const competitionPlans: CompetitionWritePlan[] = [];
  const seasonPlans: SeasonWritePlan[] = [];
  const teamPlans: TeamWritePlan[] = [];
  const matchPlans: MatchWritePlan[] = [];
  const matchResultPlans: MatchResultWritePlan[] = [];
  const touchedExternalIds: string[] = [];
  const touchedSeen = new Set<string>();
  const plannedTeamExternalIds = new Set<string>();
  const warnings: string[] = [];

  let skippedUnknown = 0;
  let skippedCancelled = 0;
  let skippedPostponed = 0;
  let skippedAbandoned = 0;

  const competitionExternalId = buildApiFootballLeagueExternalId(target.leagueId);
  const competitionSlug = buildCompetitionSlug({
    providerCompetitionId: target.leagueId,
    name: fixtures[0]?.competition.name ?? target.key,
    country: fixtures[0]?.competition.country ?? null,
    season: target.season,
    round: null,
  });
  const existingCompetition = existing.competitionByExternalId?.get(competitionExternalId);

  competitionPlans.push({
    externalId: competitionExternalId,
    slug: existingCompetition?.slug ?? competitionSlug,
    name: fixtures[0]?.competition.name ?? target.key,
    country: fixtures[0]?.competition.country ?? null,
    type: inferCompetitionType(target),
    usageScope: "public_product",
    mode: existingCompetition ? "update" : "create",
    preserveExistingSlug: existingCompetition !== undefined,
  });
  pushTouchedExternalId(touchedExternalIds, touchedSeen, competitionExternalId);

  const competitionIdForSeason = existingCompetition?.id ?? competitionExternalId;
  const seasonKey = buildSeasonKey(competitionIdForSeason, target.season);
  const existingSeason = existing.seasonByCompetitionYear?.get(seasonKey);
  const seasonDates = inferSeasonDates(target);

  seasonPlans.push({
    competitionExternalId,
    year: target.season,
    name: String(target.season),
    startsAt: seasonDates.startsAt,
    endsAt: seasonDates.endsAt,
    mode: existingSeason ? "update" : "create",
  });

  for (const fixture of fixtures) {
    const action = decideApplyFixtureAction(fixture, target);
    if (action.action === "skip") {
      switch (action.reason) {
        case "unknown_status":
          skippedUnknown += 1;
          break;
        case "cancelled_status":
          skippedCancelled += 1;
          break;
        case "postponed_status":
          skippedPostponed += 1;
          break;
        case "abandoned_status":
          skippedAbandoned += 1;
          break;
      }
      warnings.push(`fixture ${fixture.providerFixtureId} skipped in apply mode: ${action.reason}`);
      continue;
    }

    if (matchPlans.length >= config.limit) {
      warnings.push(`apply limit reached (${config.limit}); remaining fixtures skipped.`);
      break;
    }

    const homeTeamExternalId = buildApiFootballTeamExternalId(fixture.homeTeam.providerTeamId);
    const awayTeamExternalId = buildApiFootballTeamExternalId(fixture.awayTeam.providerTeamId);
    const existingHomeTeam = existing.teamByExternalId?.get(homeTeamExternalId);
    const existingAwayTeam = existing.teamByExternalId?.get(awayTeamExternalId);

    pushUniqueTeamPlan(teamPlans, plannedTeamExternalIds, {
      externalId: homeTeamExternalId,
      slug: existingHomeTeam?.slug ?? toSlugPart(fixture.homeTeam.name),
      name: fixture.homeTeam.name,
      country: null,
      mode: existingHomeTeam ? "update" : "create",
      preserveExistingSlug: existingHomeTeam !== undefined,
    });
    pushUniqueTeamPlan(teamPlans, plannedTeamExternalIds, {
      externalId: awayTeamExternalId,
      slug: existingAwayTeam?.slug ?? toSlugPart(fixture.awayTeam.name),
      name: fixture.awayTeam.name,
      country: null,
      mode: existingAwayTeam ? "update" : "create",
      preserveExistingSlug: existingAwayTeam !== undefined,
    });
    pushTouchedExternalId(touchedExternalIds, touchedSeen, homeTeamExternalId);
    pushTouchedExternalId(touchedExternalIds, touchedSeen, awayTeamExternalId);

    const matchExternalId = buildApiFootballFixtureExternalId(fixture.providerFixtureId);
    const existingMatch = existing.matchByExternalId?.get(matchExternalId);
    const matchSlug =
      existingMatch?.slug ??
      buildMatchSlug({
        competitionSlug,
        homeTeamName: fixture.homeTeam.name,
        awayTeamName: fixture.awayTeam.name,
        kickoffAt: fixture.kickoffAt,
      });
    const preservedAccessScope = existingMatch?.access_scope ?? "admin_only";
    if (existingMatch?.access_scope === "public") {
      warnings.push(
        `fixture ${fixture.providerFixtureId} preserves existing public access_scope; apply mode will not downgrade it automatically.`,
      );
    }

    matchPlans.push({
      fixtureId: fixture.providerFixtureId,
      externalId: matchExternalId,
      slug: matchSlug,
      kickoffAt: fixture.kickoffAt,
      stage: fixture.competition.round,
      status: action.mappedStatus,
      homeTeamExternalId,
      awayTeamExternalId,
      competitionExternalId,
      seasonYear: target.season,
      accessScope: preservedAccessScope,
      intakeSource: "api_football",
      sourceNote,
      venueId: null,
      mode: existingMatch ? "update" : "create",
      preserveExistingSlug: existingMatch !== undefined,
    });
    pushTouchedExternalId(touchedExternalIds, touchedSeen, matchExternalId);

    if (fixture.status === "finished" && fixture.goals.home !== null && fixture.goals.away !== null) {
      const existingMatchId = existingMatch?.id;
      const existingResult = existingMatchId
        ? existing.matchResultByMatchId?.get(existingMatchId)
        : undefined;

      if (
        existingResult &&
        (existingResult.verification_status === "verified" ||
          existingResult.verification_status === "rejected")
      ) {
        matchResultPlans.push({
          action: "skip",
          matchExternalId,
          reason: "existing_verified_or_rejected",
        });
        continue;
      }

      if (existingResult?.verification_status === "pending_review") {
        matchResultPlans.push({
          action: "update_pending_review",
          matchExternalId,
          homeGoals: fixture.goals.home,
          awayGoals: fixture.goals.away,
          verificationStatus: "pending_review",
          intakeSource: "api_football",
          sourceNote,
        });
        continue;
      }

      matchResultPlans.push({
        action: "create",
        matchExternalId,
        homeGoals: fixture.goals.home,
        awayGoals: fixture.goals.away,
        verificationStatus: "pending_review",
        intakeSource: "api_football",
        sourceNote,
      });
    }
  }

  return {
    runTag,
    sourceNote,
    competition: config.competitionKey,
    fetchedFixtures: fixtures.length,
    plannedFixtures: matchPlans.length,
    skippedUnknown,
    skippedCancelled,
    skippedPostponed,
    skippedAbandoned,
    competitionPlans,
    seasonPlans,
    teamPlans,
    matchPlans,
    matchResultPlans,
    touchedExternalIds,
    warnings: [
      ...warnings,
      "source_note helps locate created or updated rows, but updated rows still require manual rollback review because no ingest_runs snapshot exists.",
    ],
  };
}
