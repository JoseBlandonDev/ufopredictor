import type { MatchResultRow, MatchRow } from "@/types/database";
import type { ProviderFixture } from "@/lib/football-api/api-football-types";
import type { TargetCompetition } from "@/lib/football-api/target-competitions";
import {
  buildApiFootballFixtureExternalId,
  buildApiFootballLeagueExternalId,
  buildApiFootballTeamExternalId,
} from "./external-ids";
import { buildCompetitionSlug, buildMatchSlug } from "./slug";
import { mapProviderFixtureStatus } from "./status";

const YOUTH_MARKER_PATTERN = /\bU(?:17|18|19|20|21|23)\b/i;

export type DryRunDefaults = {
  intakeSource: MatchRow["intake_source"];
  matchAccessScope: MatchRow["access_scope"];
  matchResultVerificationStatus: MatchResultRow["verification_status"];
  venuePolicy: "null_unless_provider_venue_supported";
};

export type PlannedEntityPreview = {
  externalId: string;
  slug?: string;
  name?: string;
  action: "create_or_update";
};

export type PlannedMatchPreview = {
  fixtureId: number;
  externalId: string;
  slug: string;
  kickoffAt: string;
  homeTeamName: string;
  awayTeamName: string;
  mappedStatus: MatchRow["status"];
  intakeSource: MatchRow["intake_source"];
  accessScope: MatchRow["access_scope"];
  venueId: null;
};

export type PlannedMatchResultPreview = {
  fixtureId: number;
  matchExternalId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  verificationStatus: MatchResultRow["verification_status"];
  intakeSource: MatchResultRow["intake_source"];
};

export type IngestDryRunReport = {
  competitionKey: TargetCompetition["key"];
  leagueId: number;
  season: number;
  fixturesScanned: number;
  fixturesPlanned: number;
  wouldCreateOrUpdateCompetitions: PlannedEntityPreview[];
  wouldCreateOrUpdateSeasons: PlannedEntityPreview[];
  wouldCreateOrUpdateTeams: PlannedEntityPreview[];
  wouldCreateOrUpdateMatches: PlannedMatchPreview[];
  wouldPrepareMatchResultsPendingReview: PlannedMatchResultPreview[];
  skippedUnknownStatus: number;
  skippedYouthFriendly: number;
  skippedOutOfScopeCompetition: number;
  notes: string[];
  warnings: string[];
  expectedDefaults: DryRunDefaults;
};

export type IngestDryRunPlannerOptions = {
  includeYouth?: boolean;
  limit?: number;
};

function isYouthFixture(fixture: ProviderFixture): boolean {
  return (
    YOUTH_MARKER_PATTERN.test(fixture.homeTeam.name) ||
    YOUTH_MARKER_PATTERN.test(fixture.awayTeam.name)
  );
}

function pushUniquePreview<T extends PlannedEntityPreview>(
  items: T[],
  seen: Set<string>,
  item: T,
): void {
  if (seen.has(item.externalId)) {
    return;
  }

  seen.add(item.externalId);
  items.push(item);
}

export function planControlledFixtureIngestDryRun(
  fixtures: ProviderFixture[],
  target: TargetCompetition,
  options: IngestDryRunPlannerOptions = {},
): IngestDryRunReport {
  const expectedDefaults: DryRunDefaults = {
    intakeSource: "api_football",
    matchAccessScope: "admin_only",
    matchResultVerificationStatus: "pending_review",
    venuePolicy: "null_unless_provider_venue_supported",
  };

  const competitionExternalId = buildApiFootballLeagueExternalId(target.leagueId);
  const competitionSlug = buildCompetitionSlug({
    providerCompetitionId: target.leagueId,
    name: fixtures[0]?.competition.name ?? target.key,
    country: fixtures[0]?.competition.country ?? null,
    season: target.season,
    round: null,
  });

  const competitions: PlannedEntityPreview[] = [];
  const seasons: PlannedEntityPreview[] = [];
  const teams: PlannedEntityPreview[] = [];
  const matches: PlannedMatchPreview[] = [];
  const matchResults: PlannedMatchResultPreview[] = [];
  const notes = [
    "dry-run only: no database reads or writes were performed",
    "venue_id is planned as null unless provider venue support is added later",
  ];
  const warnings: string[] = [];

  const seenCompetitionIds = new Set<string>();
  const seenSeasonIds = new Set<string>();
  const seenTeamIds = new Set<string>();

  let skippedUnknownStatus = 0;
  let skippedYouthFriendly = 0;
  let skippedOutOfScopeCompetition = 0;

  for (const fixture of fixtures) {
    if (fixture.competition.providerCompetitionId !== target.leagueId) {
      skippedOutOfScopeCompetition += 1;
      continue;
    }

    if (
      target.key === "friendlies" &&
      options.includeYouth !== true &&
      isYouthFixture(fixture)
    ) {
      skippedYouthFriendly += 1;
      continue;
    }

    const statusMapping = mapProviderFixtureStatus(fixture.status);
    if (statusMapping.action === "skip") {
      skippedUnknownStatus += 1;
      warnings.push(
        `fixture ${fixture.providerFixtureId} skipped due to provider status=${fixture.status}`,
      );
      continue;
    }

    if (typeof options.limit === "number" && options.limit >= 0 && matches.length >= options.limit) {
      continue;
    }

    pushUniquePreview(competitions, seenCompetitionIds, {
      externalId: competitionExternalId,
      slug: competitionSlug,
      name: fixture.competition.name,
      action: "create_or_update",
    });

    pushUniquePreview(seasons, seenSeasonIds, {
      externalId: `${competitionExternalId}:season:${target.season}`,
      name: String(target.season),
      action: "create_or_update",
    });

    const homeTeamExternalId = buildApiFootballTeamExternalId(
      fixture.homeTeam.providerTeamId,
    );
    const awayTeamExternalId = buildApiFootballTeamExternalId(
      fixture.awayTeam.providerTeamId,
    );

    pushUniquePreview(teams, seenTeamIds, {
      externalId: homeTeamExternalId,
      slug: undefined,
      name: fixture.homeTeam.name,
      action: "create_or_update",
    });
    pushUniquePreview(teams, seenTeamIds, {
      externalId: awayTeamExternalId,
      slug: undefined,
      name: fixture.awayTeam.name,
      action: "create_or_update",
    });

    const fixtureExternalId = buildApiFootballFixtureExternalId(
      fixture.providerFixtureId,
    );
    const slug = buildMatchSlug({
      competitionSlug,
      homeTeamName: fixture.homeTeam.name,
      awayTeamName: fixture.awayTeam.name,
      kickoffAt: fixture.kickoffAt,
    });

    matches.push({
      fixtureId: fixture.providerFixtureId,
      externalId: fixtureExternalId,
      slug,
      kickoffAt: fixture.kickoffAt,
      homeTeamName: fixture.homeTeam.name,
      awayTeamName: fixture.awayTeam.name,
      mappedStatus: statusMapping.status,
      intakeSource: expectedDefaults.intakeSource,
      accessScope: expectedDefaults.matchAccessScope,
      venueId: null,
    });

    if (fixture.status === "finished") {
      matchResults.push({
        fixtureId: fixture.providerFixtureId,
        matchExternalId: fixtureExternalId,
        homeGoals: fixture.goals.home,
        awayGoals: fixture.goals.away,
        verificationStatus: expectedDefaults.matchResultVerificationStatus,
        intakeSource: expectedDefaults.intakeSource,
      });
    }
  }

  if (target.key === "friendlies" && options.includeYouth !== true) {
    notes.push("youth friendlies are excluded by default");
  }

  return {
    competitionKey: target.key,
    leagueId: target.leagueId,
    season: target.season,
    fixturesScanned: fixtures.length,
    fixturesPlanned: matches.length,
    wouldCreateOrUpdateCompetitions: competitions,
    wouldCreateOrUpdateSeasons: seasons,
    wouldCreateOrUpdateTeams: teams,
    wouldCreateOrUpdateMatches: matches,
    wouldPrepareMatchResultsPendingReview: matchResults,
    skippedUnknownStatus,
    skippedYouthFriendly,
    skippedOutOfScopeCompetition,
    notes,
    warnings,
    expectedDefaults,
  };
}

export function summarizeControlledFixtureIngestDryRun(
  report: IngestDryRunReport,
): string[] {
  return [
    `competition=${report.competitionKey} leagueId=${report.leagueId} season=${report.season}`,
    `fixtures_scanned=${report.fixturesScanned} fixtures_planned=${report.fixturesPlanned}`,
    `would_create_or_update competitions=${report.wouldCreateOrUpdateCompetitions.length} seasons=${report.wouldCreateOrUpdateSeasons.length} teams=${report.wouldCreateOrUpdateTeams.length} matches=${report.wouldCreateOrUpdateMatches.length} match_results=${report.wouldPrepareMatchResultsPendingReview.length}`,
    `skipped unknown_status=${report.skippedUnknownStatus} youth_friendly=${report.skippedYouthFriendly} out_of_scope_competition=${report.skippedOutOfScopeCompetition}`,
    `expected_defaults intake_source=${report.expectedDefaults.intakeSource} match_access_scope=${report.expectedDefaults.matchAccessScope} match_result_verification_status=${report.expectedDefaults.matchResultVerificationStatus} venue_policy=${report.expectedDefaults.venuePolicy}`,
  ];
}
