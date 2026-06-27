import { buildApiFootballFixtureExternalId } from "../football-api/ingest/external-ids";
import { mapProviderFixtureStatus } from "../football-api/ingest/status";
import type { ProviderFixture, ProviderFixtureStatus } from "../football-api/api-football-types";
import {
  WORLD_CUP_2026_CATALOG_METADATA,
  WORLD_CUP_2026_FIXTURES,
  WORLD_CUP_2026_TEAMS,
} from "./index";

export const WORLD_CUP_GROUP_STAGE_FIXTURE_TOTAL = 72;
export const WORLD_CUP_GROUP_STAGE_MATCHDAYS = [1, 2, 3] as const;
export const WORLD_CUP_COMPETITION_SLUG = "world-cup-2026";
export const WORLD_CUP_PROVIDER_LEAGUE_ID = 1;
export const WORLD_CUP_PROVIDER_SEASON = 2026;

export type RegistryLinkState = "linked" | "missing_link" | "conflict";
export type PersistenceState = "already_stored" | "create_candidate" | "update_candidate" | "skip";
export type LifecycleState =
  | "not_started"
  | "started"
  | "finished"
  | "postponed"
  | "cancelled"
  | "unknown";
export type PredictionEligibility = "eligible" | "not_prediction_eligible";

export type FixtureRegistryConflictCode =
  | "provider_id_duplicate"
  | "provider_match_ambiguous"
  | "provider_team_mismatch"
  | "provider_reversed_teams"
  | "provider_kickoff_mismatch"
  | "provider_group_stage_mismatch"
  | "stored_external_id_duplicate"
  | "stored_external_id_conflict"
  | "internal_match_duplicate"
  | "internal_match_reversed_teams"
  | "internal_team_mapping_missing"
  | "internal_team_mapping_ambiguous"
  | "competition_missing"
  | "competition_ambiguous"
  | "season_missing"
  | "season_ambiguous";

export type FixtureRegistryProposedAction =
  | "none"
  | "create_match_with_provider_link"
  | "update_match_provider_link"
  | "report_missing_link"
  | "report_conflict";

export type FixtureRegistryRow = {
  canonicalFixtureId: string;
  homeTeam: string;
  awayTeam: string;
  canonicalKickoffUtc: string;
  competition: string;
  season: number;
  stage: string;
  group: string;
  apiFootballFixtureId: number | null;
  apiFootballStatus: ProviderFixtureStatus | null;
  apiFootballKickoffUtc: string | null;
  internalMatchId: string | null;
  internalMatchExists: boolean;
  externalLinkExists: boolean;
  storedExternalFixtureId: number | null;
  predictionExists: boolean;
  publicationExists: boolean;
  lifecycleState: LifecycleState;
  predictionEligible: PredictionEligibility;
  predictionIneligibilityReason: string | null;
  registryLinkState: RegistryLinkState;
  persistenceState: PersistenceState;
  proposedAction: FixtureRegistryProposedAction;
  conflictCode: FixtureRegistryConflictCode | null;
  conflictReason: string | null;
  sourceEvidence: string[];
};

export type FixtureRegistrySummary = {
  canonicalFixtureTotal: number;
  linked: number;
  missingLinks: number;
  conflicts: number;
  alreadyStored: number;
  createCandidates: number;
  updateCandidates: number;
  started: number;
  finished: number;
  predictionEligible: number;
  notPredictionEligible: number;
};

export type FixtureRegistrySelection = {
  label: string;
  canonicalFixtureIds: string[];
  apiFootballFixtureIds: number[];
  total: number;
  linked: number;
  missingLinks: number;
  conflicts: number;
  createCandidates: number;
  updateCandidates: number;
  alreadyStored: number;
  predictionEligible: number;
  notPredictionEligible: number;
};

export type FixtureRegistryReport = {
  version: 1;
  catalogSourceAuthority: string;
  catalogSourceDate: string;
  generatedAt: string;
  summary: FixtureRegistrySummary;
  selection: FixtureRegistrySelection | null;
  rows: FixtureRegistryRow[];
};

export type FixtureRegistryAllowlist = {
  canonicalFixtureIds: string[];
  apiFootballFixtureIds: number[];
};

export type FixtureRegistryAllowlistManifest = {
  version: 1;
  generatedAt: string;
  selection: {
    matchday: number | null;
    from: string | null;
    to: string | null;
  };
  allowlist: FixtureRegistryAllowlist;
};

export type FixtureRegistrySelectionInput = {
  matchday?: number;
  from?: string;
  to?: string;
  canonicalFixtureIds?: string[];
  apiFootballFixtureIds?: number[];
};

export type FixtureRegistryApplyInput = {
  apply: boolean;
  allowCanonicalFixtureIds?: string[];
  allowApiFootballFixtureIds?: number[];
  allowlistManifest?: FixtureRegistryAllowlistManifest | null;
};

export type FixtureRegistryApplyTarget = {
  canonicalFixtureId: string;
  apiFootballFixtureId: number | null;
};

export type FixtureRegistryApplyPlan = {
  targets: FixtureRegistryApplyTarget[];
  allowlist: FixtureRegistryAllowlist;
};

export type FixtureRegistryApplyCounts = {
  selected: number;
  created: number;
  updated: number;
  alreadyStored: number;
  skipped: number;
  conflicts: number;
  duplicates: number;
};

export type FixtureRegistryMatchInsert = {
  external_id: string;
  slug: string;
  competition_id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  kickoff_at: string;
  stage: string | null;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  access_scope: "admin_only";
  intake_source: "api_football";
  source_note: string;
};

export type FixtureRegistryMatchUpdate = {
  external_id: string;
  kickoff_at: string;
  stage: string | null;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  intake_source: "api_football";
  source_note: string;
};

export type FixtureRegistryWriteAdapter = {
  insertMatch(payload: FixtureRegistryMatchInsert): Promise<{ id: string }>;
  updateMatch(matchId: string, payload: FixtureRegistryMatchUpdate): Promise<void>;
};

export type WorldCupRegistryTeamRow = {
  id: string;
  slug: string;
  name: string;
};

export type WorldCupRegistryCompetitionRow = {
  id: string;
  slug: string;
  external_id: string | null;
  usage_scope: "public_product" | "internal_lab";
};

export type WorldCupRegistrySeasonRow = {
  id: string;
  competition_id: string;
  year: number;
};

export type WorldCupRegistryMatchRow = {
  id: string;
  external_id: string | null;
  slug: string;
  competition_id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  kickoff_at: string;
  stage: string | null;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  access_scope: "public" | "premium" | "admin_only" | "lab_only";
  intake_source: "mock" | "manual" | "csv_import" | "api_football";
  source_note: string | null;
};

export type WorldCupRegistryPredictionVersionRow = {
  id: string;
  match_id: string;
  run_scope: "public_product" | "internal_lab";
};

export type WorldCupRegistryDatabaseSnapshot = {
  competitions: WorldCupRegistryCompetitionRow[];
  seasons: WorldCupRegistrySeasonRow[];
  teams: WorldCupRegistryTeamRow[];
  matches: WorldCupRegistryMatchRow[];
  predictionVersions: WorldCupRegistryPredictionVersionRow[];
};

type CanonicalTeamAliasIndex = Map<string, string>;
type CanonicalTeamByKey = Map<string, (typeof WORLD_CUP_2026_TEAMS)[number]>;

type TeamResolution = {
  teamIds: string[];
  conflictCode: FixtureRegistryConflictCode | null;
  conflictReason: string | null;
};

type ProviderResolution =
  | {
      state: "linked";
      providerFixture: ProviderFixture;
      evidence: string;
    }
  | {
      state: "missing_link";
      conflictCode: null;
      conflictReason: null;
    }
  | {
      state: "conflict";
      conflictCode: FixtureRegistryConflictCode;
      conflictReason: string;
    };

type InternalMatchResolution =
  | {
      state: "matched";
      match: WorldCupRegistryMatchRow;
    }
  | {
      state: "missing";
    }
  | {
      state: "conflict";
      conflictCode: FixtureRegistryConflictCode;
      conflictReason: string;
    };

type CompetitionResolution =
  | {
      state: "ready";
      competition: WorldCupRegistryCompetitionRow;
    }
  | {
      state: "conflict";
      conflictCode: FixtureRegistryConflictCode;
      conflictReason: string;
    };

type SeasonResolution =
  | {
      state: "ready";
      season: WorldCupRegistrySeasonRow;
    }
  | {
      state: "conflict";
      conflictCode: FixtureRegistryConflictCode;
      conflictReason: string;
    };

export type ProviderFixtureIdentityCheck =
  | {
      ok: true;
    }
  | {
      ok: false;
      conflictCode:
        | "provider_group_stage_mismatch"
        | "provider_reversed_teams"
        | "provider_team_mismatch"
        | "provider_kickoff_mismatch";
      conflictReason: string;
    };

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeUtcInstant(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Date(timestamp).toISOString();
}

function sameUtcInstant(left: string, right: string): boolean {
  return normalizeUtcInstant(left) === normalizeUtcInstant(right);
}

function normalizeGroupKey(groupKey: string): string {
  return normalizeText(groupKey).replace(/^group /, "group-");
}

function normalizeStageLabel(stage: string | null | undefined): string {
  return normalizeText(stage ?? "");
}

function isProviderGroupStageRound(round: string | null): boolean {
  return normalizeStageLabel(round).startsWith("group stage");
}

function parseStoredExternalFixtureId(externalId: string | null): number | null {
  if (!externalId) {
    return null;
  }

  const match = /^api-football:fixture:(\d+)$/.exec(externalId);
  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function buildCanonicalTeamIndexes(): {
  aliasToTeamKey: CanonicalTeamAliasIndex;
  teamByKey: CanonicalTeamByKey;
} {
  const aliasToTeamKey = new Map<string, string>();
  const teamByKey = new Map<string, (typeof WORLD_CUP_2026_TEAMS)[number]>();

  for (const team of WORLD_CUP_2026_TEAMS) {
    teamByKey.set(team.teamKey, team);

    const aliases = [
      team.teamKey,
      team.displayName,
      team.fifaOfficialName,
      team.fifaCode,
      ...team.aliases,
    ];

    for (const alias of aliases) {
      aliasToTeamKey.set(normalizeText(alias), team.teamKey);
    }
  }

  return { aliasToTeamKey, teamByKey };
}

const CANONICAL_TEAM_INDEXES = buildCanonicalTeamIndexes();

function resolveProviderTeamKey(
  aliasToTeamKey: CanonicalTeamAliasIndex,
  providerName: string,
): string | null {
  return aliasToTeamKey.get(normalizeText(providerName)) ?? null;
}

function buildProviderFixtureIndexes(fixtures: ProviderFixture[]) {
  const { aliasToTeamKey } = CANONICAL_TEAM_INDEXES;
  const byId = new Map<number, ProviderFixture>();
  const byCanonicalPair = new Map<string, ProviderFixture[]>();
  const byCanonicalKickoffPair = new Map<string, ProviderFixture[]>();

  for (const fixture of fixtures) {
    byId.set(fixture.providerFixtureId, fixture);

    const homeTeamKey = resolveProviderTeamKey(aliasToTeamKey, fixture.homeTeam.name);
    const awayTeamKey = resolveProviderTeamKey(aliasToTeamKey, fixture.awayTeam.name);
    if (!homeTeamKey || !awayTeamKey) {
      continue;
    }

    const pairKey = `${homeTeamKey}|${awayTeamKey}`;
    const kickoffPairKey = `${normalizeUtcInstant(fixture.kickoffAt)}|${pairKey}`;
    const pairCollection = byCanonicalPair.get(pairKey) ?? [];
    pairCollection.push(fixture);
    byCanonicalPair.set(pairKey, pairCollection);

    const kickoffPairCollection = byCanonicalKickoffPair.get(kickoffPairKey) ?? [];
    kickoffPairCollection.push(fixture);
    byCanonicalKickoffPair.set(kickoffPairKey, kickoffPairCollection);
  }

  return {
    byId,
    byCanonicalPair,
    byCanonicalKickoffPair,
  };
}

function resolveProviderFixture(
  canonicalFixture: (typeof WORLD_CUP_2026_FIXTURES)[number],
  providerFixtures: ProviderFixture[],
): ProviderResolution {
  const worldCupFixtures = providerFixtures.filter(
    (fixture) =>
      fixture.competition.providerCompetitionId === WORLD_CUP_PROVIDER_LEAGUE_ID &&
      fixture.competition.season === WORLD_CUP_PROVIDER_SEASON,
  );
  const indexes = buildProviderFixtureIndexes(worldCupFixtures);
  const pairKey = `${canonicalFixture.homeTeamKey}|${canonicalFixture.awayTeamKey}`;
  const reversePairKey = `${canonicalFixture.awayTeamKey}|${canonicalFixture.homeTeamKey}`;
  const kickoffPairKey = `${normalizeUtcInstant(canonicalFixture.kickoffAt)}|${pairKey}`;
  const reverseKickoffPairKey = `${normalizeUtcInstant(canonicalFixture.kickoffAt)}|${reversePairKey}`;

  if (canonicalFixture.apiFootballFixtureId !== null) {
    const canonicalLinkedFixture = indexes.byId.get(canonicalFixture.apiFootballFixtureId);
    if (!canonicalLinkedFixture) {
      return {
        state: "conflict",
        conflictCode: "provider_team_mismatch",
        conflictReason: `Canonical fixture ${canonicalFixture.fixtureKey} references API-Football fixture ${canonicalFixture.apiFootballFixtureId}, but that fixture was not present in the provider response.`,
      };
    }

    if (
      resolveProviderFixtureIdentityConflict(canonicalFixture, canonicalLinkedFixture) !== null
    ) {
      return resolveProviderFixtureIdentityConflict(canonicalFixture, canonicalLinkedFixture)!;
    }

    return {
      state: "linked",
      providerFixture: canonicalLinkedFixture,
      evidence: "canonical_verified_provider_id",
    };
  }

  const kickoffPairMatches = indexes.byCanonicalKickoffPair.get(kickoffPairKey) ?? [];
  if (kickoffPairMatches.length > 1) {
    return {
      state: "conflict",
      conflictCode: "provider_match_ambiguous",
      conflictReason: `Canonical fixture ${canonicalFixture.fixtureKey} matched multiple provider fixtures with the same kickoff and team pair.`,
    };
  }

  if (kickoffPairMatches.length === 1) {
    const match = kickoffPairMatches[0]!;
    if (!isProviderGroupStageRound(match.competition.round)) {
      return {
        state: "conflict",
        conflictCode: "provider_group_stage_mismatch",
        conflictReason: `Provider fixture ${match.providerFixtureId} matched ${canonicalFixture.fixtureKey}, but its round "${match.competition.round}" is not group-stage.`,
      };
    }

    return {
      state: "linked",
      providerFixture: match,
      evidence: "kickoff_and_teams",
    };
  }

  const reverseKickoffMatches = indexes.byCanonicalKickoffPair.get(reverseKickoffPairKey) ?? [];
  if (reverseKickoffMatches.length > 0) {
    return {
      state: "conflict",
      conflictCode: "provider_reversed_teams",
      conflictReason: `Provider returned a reversed home/away team order for canonical fixture ${canonicalFixture.fixtureKey}.`,
    };
  }

  const pairMatches = indexes.byCanonicalPair.get(pairKey) ?? [];
  if (pairMatches.length > 1) {
    return {
      state: "conflict",
      conflictCode: "provider_match_ambiguous",
      conflictReason: `Canonical fixture ${canonicalFixture.fixtureKey} matched multiple provider fixtures by team pair without a unique kickoff match.`,
    };
  }

  if (pairMatches.length === 1) {
    const match = pairMatches[0]!;
    if (!isProviderGroupStageRound(match.competition.round)) {
      return {
        state: "conflict",
        conflictCode: "provider_group_stage_mismatch",
        conflictReason: `Provider fixture ${match.providerFixtureId} matched ${canonicalFixture.fixtureKey}, but its round "${match.competition.round}" is not group-stage.`,
      };
    }

    if (match.kickoffAt !== canonicalFixture.kickoffAt) {
      return {
        state: "conflict",
        conflictCode: "provider_kickoff_mismatch",
        conflictReason: `Provider fixture ${match.providerFixtureId} matched ${canonicalFixture.fixtureKey} by teams, but kickoff ${match.kickoffAt} differs from canonical kickoff ${canonicalFixture.kickoffAt}.`,
      };
    }

    return {
      state: "linked",
      providerFixture: match,
      evidence: "unique_team_pair",
    };
  }

  const reversePairMatches = indexes.byCanonicalPair.get(reversePairKey) ?? [];
  if (reversePairMatches.length > 0) {
    return {
      state: "conflict",
      conflictCode: "provider_reversed_teams",
      conflictReason: `Provider returned at least one reversed team-pair candidate for canonical fixture ${canonicalFixture.fixtureKey}.`,
    };
  }

  return {
    state: "missing_link",
    conflictCode: null,
    conflictReason: null,
  };
}

function resolveProviderFixtureIdentityConflict(
  canonicalFixture: (typeof WORLD_CUP_2026_FIXTURES)[number],
  providerFixture: ProviderFixture,
): ProviderResolution | null {
  if (!isProviderGroupStageRound(providerFixture.competition.round)) {
    return {
      state: "conflict",
      conflictCode: "provider_group_stage_mismatch",
      conflictReason: `Canonical fixture ${canonicalFixture.fixtureKey} references provider fixture ${providerFixture.providerFixtureId}, but its round "${providerFixture.competition.round}" is not group-stage.`,
    };
  }

  const { aliasToTeamKey } = CANONICAL_TEAM_INDEXES;
  const homeTeamKey = resolveProviderTeamKey(aliasToTeamKey, providerFixture.homeTeam.name);
  const awayTeamKey = resolveProviderTeamKey(aliasToTeamKey, providerFixture.awayTeam.name);

  if (homeTeamKey === canonicalFixture.awayTeamKey && awayTeamKey === canonicalFixture.homeTeamKey) {
    return {
      state: "conflict",
      conflictCode: "provider_reversed_teams",
      conflictReason: `Canonical fixture ${canonicalFixture.fixtureKey} references provider fixture ${providerFixture.providerFixtureId}, but the provider teams are reversed.`,
    };
  }

  if (
    homeTeamKey !== canonicalFixture.homeTeamKey ||
    awayTeamKey !== canonicalFixture.awayTeamKey
  ) {
    return {
      state: "conflict",
      conflictCode: "provider_team_mismatch",
      conflictReason: `Canonical fixture ${canonicalFixture.fixtureKey} references provider fixture ${providerFixture.providerFixtureId}, but the provider teams do not match the canonical home/away teams.`,
    };
  }

  if (!sameUtcInstant(providerFixture.kickoffAt, canonicalFixture.kickoffAt)) {
    return {
      state: "conflict",
      conflictCode: "provider_kickoff_mismatch",
      conflictReason: `Canonical fixture ${canonicalFixture.fixtureKey} references provider fixture ${providerFixture.providerFixtureId}, but kickoff ${providerFixture.kickoffAt} differs from canonical kickoff ${canonicalFixture.kickoffAt}.`,
    };
  }

  return null;
}

export function verifyWorldCupProviderFixtureIdentity(args: {
  canonicalFixture: {
    fixtureKey: string;
    homeTeamKey: string;
    awayTeamKey: string;
    kickoffAt: string;
  };
  providerFixture: ProviderFixture;
}): ProviderFixtureIdentityCheck {
  const conflict = resolveProviderFixtureIdentityConflict(
    args.canonicalFixture as (typeof WORLD_CUP_2026_FIXTURES)[number],
    args.providerFixture,
  );

  if (!conflict) {
    return { ok: true };
  }

  if (conflict.state !== "conflict") {
    throw new Error("Expected provider identity verification conflict state.");
  }

  if (
    conflict.conflictCode !== "provider_group_stage_mismatch" &&
    conflict.conflictCode !== "provider_reversed_teams" &&
    conflict.conflictCode !== "provider_team_mismatch" &&
    conflict.conflictCode !== "provider_kickoff_mismatch"
  ) {
    throw new Error(`Unexpected provider identity conflict code: ${conflict.conflictCode}`);
  }

  return {
    ok: false,
    conflictCode: conflict.conflictCode,
    conflictReason: conflict.conflictReason,
  };
}

function resolveCompetition(
  snapshot: WorldCupRegistryDatabaseSnapshot,
): CompetitionResolution {
  const matches = snapshot.competitions.filter(
    (competition) =>
      competition.slug === WORLD_CUP_COMPETITION_SLUG ||
      competition.external_id === `api-football:league:${WORLD_CUP_PROVIDER_LEAGUE_ID}`,
  );

  if (matches.length === 0) {
    return {
      state: "conflict",
      conflictCode: "competition_missing",
      conflictReason: `No World Cup competition row was found for slug ${WORLD_CUP_COMPETITION_SLUG}.`,
    };
  }

  const distinctCompetitionIds = new Set(matches.map((competition) => competition.id));
  if (distinctCompetitionIds.size > 1) {
    return {
      state: "conflict",
      conflictCode: "competition_ambiguous",
      conflictReason: `Multiple World Cup competition rows were found for slug ${WORLD_CUP_COMPETITION_SLUG}.`,
    };
  }

  return {
    state: "ready",
    competition: matches[0]!,
  };
}

function resolveSeason(
  snapshot: WorldCupRegistryDatabaseSnapshot,
  competitionResolution: CompetitionResolution,
): SeasonResolution {
  if (competitionResolution.state === "conflict") {
    return {
      state: "conflict",
      conflictCode: competitionResolution.conflictCode,
      conflictReason: competitionResolution.conflictReason,
    };
  }

  const matches = snapshot.seasons.filter(
    (season) =>
      season.competition_id === competitionResolution.competition.id &&
      season.year === WORLD_CUP_PROVIDER_SEASON,
  );

  if (matches.length === 0) {
    return {
      state: "conflict",
      conflictCode: "season_missing",
      conflictReason: `No ${WORLD_CUP_PROVIDER_SEASON} season row was found for the World Cup competition.`,
    };
  }

  if (matches.length > 1) {
    return {
      state: "conflict",
      conflictCode: "season_ambiguous",
      conflictReason: `Multiple ${WORLD_CUP_PROVIDER_SEASON} season rows were found for the World Cup competition.`,
    };
  }

  return {
    state: "ready",
    season: matches[0]!,
  };
}

function resolveTeam(
  snapshot: WorldCupRegistryDatabaseSnapshot,
  canonicalTeamKey: string,
): TeamResolution {
  const { aliasToTeamKey } = CANONICAL_TEAM_INDEXES;
  const candidates = snapshot.teams.filter((team) => {
    if (normalizeText(team.slug) === normalizeText(canonicalTeamKey)) {
      return true;
    }

    return aliasToTeamKey.get(normalizeText(team.name)) === canonicalTeamKey;
  });

  const deduped = Array.from(new Map(candidates.map((team) => [team.id, team.id])).values());

  if (deduped.length === 0) {
    return {
      teamIds: [],
      conflictCode: "internal_team_mapping_missing",
      conflictReason: `No internal team row matched canonical team ${canonicalTeamKey}.`,
    };
  }

  if (deduped.length > 1) {
    return {
      teamIds: deduped,
      conflictCode: "internal_team_mapping_ambiguous",
      conflictReason: `Multiple internal team rows matched canonical team ${canonicalTeamKey}.`,
    };
  }

  return {
    teamIds: deduped,
    conflictCode: null,
    conflictReason: null,
  };
}

function resolveInternalMatch(
  canonicalFixture: (typeof WORLD_CUP_2026_FIXTURES)[number],
  snapshot: WorldCupRegistryDatabaseSnapshot,
  homeTeamResolution: TeamResolution,
  awayTeamResolution: TeamResolution,
  providerFixture: ProviderFixture | null,
): InternalMatchResolution {
  const identityMatches = new Map<string, WorldCupRegistryMatchRow>();
  const slugMatches = snapshot.matches.filter((match) => match.slug === canonicalFixture.matchSlug);
  for (const match of slugMatches) {
    identityMatches.set(match.id, match);
  }

  if (
    homeTeamResolution.teamIds.length === 1 &&
    awayTeamResolution.teamIds.length === 1
  ) {
    for (const match of snapshot.matches) {
      if (
        match.home_team_id === homeTeamResolution.teamIds[0] &&
        match.away_team_id === awayTeamResolution.teamIds[0] &&
        sameUtcInstant(match.kickoff_at, canonicalFixture.kickoffAt)
      ) {
        identityMatches.set(match.id, match);
      }
    }

    const reversedPairMatches = snapshot.matches.filter(
      (match) =>
        match.home_team_id === awayTeamResolution.teamIds[0] &&
        match.away_team_id === homeTeamResolution.teamIds[0] &&
        sameUtcInstant(match.kickoff_at, canonicalFixture.kickoffAt),
    );

    if (identityMatches.size === 0 && reversedPairMatches.length > 0) {
      return {
        state: "conflict",
        conflictCode: "internal_match_reversed_teams",
        conflictReason: `An internal match exists for canonical fixture ${canonicalFixture.fixtureKey}, but its home and away teams are reversed.`,
      };
    }
  }

  let linkedMatchCandidates: WorldCupRegistryMatchRow[] = [];
  if (providerFixture) {
    const providerExternalId = buildApiFootballFixtureExternalId(providerFixture.providerFixtureId);
    linkedMatchCandidates = snapshot.matches.filter(
      (match) => match.external_id === providerExternalId,
    );

    if (linkedMatchCandidates.length > 1) {
      return {
        state: "conflict",
        conflictCode: "stored_external_id_duplicate",
        conflictReason: `Provider fixture ${providerFixture.providerFixtureId} is already linked to multiple internal match rows.`,
      };
    }

    if (
      linkedMatchCandidates.length === 1 &&
      identityMatches.size > 0 &&
      !identityMatches.has(linkedMatchCandidates[0]!.id)
    ) {
      return {
        state: "conflict",
        conflictCode: "stored_external_id_conflict",
        conflictReason: `Provider fixture ${providerFixture.providerFixtureId} is already linked to a different internal match than canonical fixture ${canonicalFixture.fixtureKey}.`,
      };
    }

    if (linkedMatchCandidates.length === 1) {
      identityMatches.set(linkedMatchCandidates[0]!.id, linkedMatchCandidates[0]!);
    }
  }

  if (identityMatches.size > 1) {
    return {
      state: "conflict",
      conflictCode: "internal_match_duplicate",
      conflictReason: `Canonical fixture ${canonicalFixture.fixtureKey} resolved to multiple internal match rows.`,
    };
  }

  const match = identityMatches.values().next().value as WorldCupRegistryMatchRow | undefined;
  if (!match) {
    return {
      state: "missing",
    };
  }

  return {
    state: "matched",
    match,
  };
}

function determineLifecycleState(args: {
  canonicalKickoffAt: string;
  providerFixture: ProviderFixture | null;
  internalMatch: WorldCupRegistryMatchRow | null;
  now: Date;
}): LifecycleState {
  const status = args.providerFixture?.status ?? args.internalMatch?.status ?? "unknown";

  if (status === "finished") {
    return "finished";
  }
  if (status === "postponed") {
    return "postponed";
  }
  if (status === "cancelled") {
    return "cancelled";
  }
  if (status === "live" || status === "halftime") {
    return "started";
  }
  if (status === "abandoned") {
    return "unknown";
  }

  const kickoffAt = args.providerFixture?.kickoffAt ?? args.canonicalKickoffAt;
  return Date.parse(kickoffAt) > args.now.getTime() ? "not_started" : "started";
}

function determinePredictionEligibility(
  canonicalKickoffAt: string,
  lifecycleState: LifecycleState,
  now: Date,
): {
  predictionEligible: PredictionEligibility;
  reason: string | null;
} {
  if (lifecycleState === "finished") {
    return {
      predictionEligible: "not_prediction_eligible",
      reason: "fixture_finished",
    };
  }
  if (lifecycleState === "postponed") {
    return {
      predictionEligible: "not_prediction_eligible",
      reason: "fixture_postponed",
    };
  }
  if (lifecycleState === "cancelled") {
    return {
      predictionEligible: "not_prediction_eligible",
      reason: "fixture_cancelled",
    };
  }
  if (Date.parse(canonicalKickoffAt) <= now.getTime()) {
    return {
      predictionEligible: "not_prediction_eligible",
      reason: "kickoff_passed",
    };
  }

  return {
    predictionEligible: "eligible",
    reason: null,
  };
}

function buildPredictionLookup(
  predictionVersions: WorldCupRegistryPredictionVersionRow[],
): Map<string, { predictionExists: boolean; publicationExists: boolean }> {
  const lookup = new Map<string, { predictionExists: boolean; publicationExists: boolean }>();

  for (const prediction of predictionVersions) {
    const existing = lookup.get(prediction.match_id) ?? {
      predictionExists: false,
      publicationExists: false,
    };

    existing.predictionExists = true;
    if (prediction.run_scope === "public_product") {
      existing.publicationExists = true;
    }

    lookup.set(prediction.match_id, existing);
  }

  return lookup;
}

function determinePersistenceState(args: {
  rowBase: Omit<
    FixtureRegistryRow,
    "persistenceState" | "proposedAction" | "conflictCode" | "conflictReason"
  >;
  canonicalFixture: (typeof WORLD_CUP_2026_FIXTURES)[number];
  providerResolution: ProviderResolution;
  internalResolution: InternalMatchResolution;
  competitionResolution: CompetitionResolution;
  seasonResolution: SeasonResolution;
  homeTeamResolution: TeamResolution;
  awayTeamResolution: TeamResolution;
}): Pick<
  FixtureRegistryRow,
  "persistenceState" | "proposedAction" | "conflictCode" | "conflictReason"
> {
  if (args.providerResolution.state === "conflict") {
    return {
      persistenceState: "skip",
      proposedAction: "report_conflict",
      conflictCode: args.providerResolution.conflictCode,
      conflictReason: args.providerResolution.conflictReason,
    };
  }

  if (args.internalResolution.state === "conflict") {
    return {
      persistenceState: "skip",
      proposedAction: "report_conflict",
      conflictCode: args.internalResolution.conflictCode,
      conflictReason: args.internalResolution.conflictReason,
    };
  }

  const prerequisiteConflict =
    args.competitionResolution.state === "conflict"
      ? args.competitionResolution
      : args.seasonResolution.state === "conflict"
        ? args.seasonResolution
        : args.homeTeamResolution.conflictCode
          ? {
              state: "conflict" as const,
              conflictCode: args.homeTeamResolution.conflictCode,
              conflictReason: args.homeTeamResolution.conflictReason!,
            }
          : args.awayTeamResolution.conflictCode
            ? {
                state: "conflict" as const,
                conflictCode: args.awayTeamResolution.conflictCode,
                conflictReason: args.awayTeamResolution.conflictReason!,
              }
            : null;

  if (prerequisiteConflict) {
    return {
      persistenceState: "skip",
      proposedAction: "report_conflict",
      conflictCode: prerequisiteConflict.conflictCode,
      conflictReason: prerequisiteConflict.conflictReason,
    };
  }

  if (args.providerResolution.state === "missing_link") {
    return {
      persistenceState: "skip",
      proposedAction: "report_missing_link",
      conflictCode: null,
      conflictReason: null,
    };
  }

  const providerFixture = args.providerResolution.providerFixture;
  const providerExternalId = buildApiFootballFixtureExternalId(providerFixture.providerFixtureId);
  const mappedStatus = mapProviderFixtureStatus(providerFixture.status);

  if (args.internalResolution.state === "missing") {
    return {
      persistenceState: "create_candidate",
      proposedAction: "create_match_with_provider_link",
      conflictCode: null,
      conflictReason: null,
    };
  }

  const internalMatch = args.internalResolution.match;
  const storedExternalId = internalMatch.external_id;
  if (storedExternalId && storedExternalId !== providerExternalId) {
    return {
      persistenceState: "skip",
      proposedAction: "report_conflict",
      conflictCode: "stored_external_id_conflict",
      conflictReason: `Internal match ${internalMatch.id} is linked to ${storedExternalId}, which conflicts with provider fixture ${providerExternalId}.`,
    };
  }

  const stageMismatch =
    normalizeStageLabel(internalMatch.stage) !== normalizeStageLabel(providerFixture.competition.round);
  const kickoffMismatch = !sameUtcInstant(internalMatch.kickoff_at, providerFixture.kickoffAt);
  const statusMismatch =
    mappedStatus.action !== "skip" && internalMatch.status !== mappedStatus.status;

  if (
    storedExternalId === providerExternalId &&
    !kickoffMismatch &&
    !stageMismatch &&
    !statusMismatch &&
    internalMatch.intake_source === "api_football"
  ) {
    return {
      persistenceState: "already_stored",
      proposedAction: "none",
      conflictCode: null,
      conflictReason: null,
    };
  }

  return {
    persistenceState: "update_candidate",
    proposedAction: "update_match_provider_link",
    conflictCode: null,
    conflictReason: null,
  };
}

function buildSummary(rows: FixtureRegistryRow[]): FixtureRegistrySummary {
  return {
    canonicalFixtureTotal: rows.length,
    linked: rows.filter((row) => row.registryLinkState === "linked").length,
    missingLinks: rows.filter((row) => row.registryLinkState === "missing_link").length,
    conflicts: rows.filter((row) => row.registryLinkState === "conflict").length,
    alreadyStored: rows.filter((row) => row.persistenceState === "already_stored").length,
    createCandidates: rows.filter((row) => row.persistenceState === "create_candidate").length,
    updateCandidates: rows.filter((row) => row.persistenceState === "update_candidate").length,
    started: rows.filter((row) => row.lifecycleState === "started").length,
    finished: rows.filter((row) => row.lifecycleState === "finished").length,
    predictionEligible: rows.filter((row) => row.predictionEligible === "eligible").length,
    notPredictionEligible: rows.filter((row) => row.predictionEligible === "not_prediction_eligible").length,
  };
}

function inferMatchday(matchNumber: number): 1 | 2 | 3 {
  if (matchNumber <= 24) {
    return 1;
  }
  if (matchNumber <= 48) {
    return 2;
  }
  return 3;
}

export function getWorldCupGroupStageFixtures() {
  return [...WORLD_CUP_2026_FIXTURES].sort((left, right) => {
    const kickoffCompare = left.kickoffAt.localeCompare(right.kickoffAt);
    if (kickoffCompare !== 0) {
      return kickoffCompare;
    }

    return left.fixtureKey.localeCompare(right.fixtureKey);
  });
}

export function getWorldCupGroupStageDateRange() {
  const fixtures = getWorldCupGroupStageFixtures();
  const first = fixtures[0];
  const last = fixtures[fixtures.length - 1];

  if (!first || !last) {
    throw new Error("World Cup group-stage fixture catalog is empty.");
  }

  return {
    from: first.kickoffAt.slice(0, 10),
    to: last.kickoffAt.slice(0, 10),
  };
}

export function planWorldCupGroupStageFixtureRegistry(args: {
  providerFixtures: ProviderFixture[];
  databaseSnapshot: WorldCupRegistryDatabaseSnapshot;
  now?: Date;
}): FixtureRegistryReport {
  const fixtures = getWorldCupGroupStageFixtures();
  if (fixtures.length !== WORLD_CUP_GROUP_STAGE_FIXTURE_TOTAL) {
    throw new Error(
      `Expected ${WORLD_CUP_GROUP_STAGE_FIXTURE_TOTAL} canonical group-stage fixtures, received ${fixtures.length}.`,
    );
  }

  const now = args.now ?? new Date();
  const competitionResolution = resolveCompetition(args.databaseSnapshot);
  const seasonResolution = resolveSeason(args.databaseSnapshot, competitionResolution);
  const predictionLookup = buildPredictionLookup(args.databaseSnapshot.predictionVersions);

  const rows = fixtures.map((canonicalFixture) => {
    const providerResolution = resolveProviderFixture(canonicalFixture, args.providerFixtures);
    const providerFixture =
      providerResolution.state === "linked" ? providerResolution.providerFixture : null;
    const homeTeamResolution = resolveTeam(args.databaseSnapshot, canonicalFixture.homeTeamKey);
    const awayTeamResolution = resolveTeam(args.databaseSnapshot, canonicalFixture.awayTeamKey);
    const internalResolution = resolveInternalMatch(
      canonicalFixture,
      args.databaseSnapshot,
      homeTeamResolution,
      awayTeamResolution,
      providerFixture,
    );

    const internalMatch =
      internalResolution.state === "matched" ? internalResolution.match : null;
    const predictionState = internalMatch
      ? predictionLookup.get(internalMatch.id) ?? {
          predictionExists: false,
          publicationExists: false,
        }
      : {
          predictionExists: false,
          publicationExists: false,
        };

    const lifecycleState = determineLifecycleState({
      canonicalKickoffAt: canonicalFixture.kickoffAt,
      providerFixture,
      internalMatch,
      now,
    });
    const predictionEligibility = determinePredictionEligibility(
      canonicalFixture.kickoffAt,
      lifecycleState,
      now,
    );

    const rowBase: Omit<
      FixtureRegistryRow,
      "persistenceState" | "proposedAction" | "conflictCode" | "conflictReason"
    > = {
      canonicalFixtureId: canonicalFixture.fixtureKey,
      homeTeam: CANONICAL_TEAM_INDEXES.teamByKey.get(canonicalFixture.homeTeamKey)?.displayName ?? canonicalFixture.homeTeamKey,
      awayTeam: CANONICAL_TEAM_INDEXES.teamByKey.get(canonicalFixture.awayTeamKey)?.displayName ?? canonicalFixture.awayTeamKey,
      canonicalKickoffUtc: canonicalFixture.kickoffAt,
      competition: WORLD_CUP_COMPETITION_SLUG,
      season: WORLD_CUP_PROVIDER_SEASON,
      stage: canonicalFixture.stage,
      group: normalizeGroupKey(canonicalFixture.groupKey),
      apiFootballFixtureId: providerFixture?.providerFixtureId ?? canonicalFixture.apiFootballFixtureId,
      apiFootballStatus: providerFixture?.status ?? null,
      apiFootballKickoffUtc: providerFixture?.kickoffAt ?? null,
      internalMatchId: internalMatch?.id ?? null,
      internalMatchExists: internalMatch !== null,
      externalLinkExists: internalMatch?.external_id != null,
      storedExternalFixtureId: parseStoredExternalFixtureId(internalMatch?.external_id ?? null),
      predictionExists: predictionState.predictionExists,
      publicationExists: predictionState.publicationExists,
      lifecycleState,
      predictionEligible: predictionEligibility.predictionEligible,
      predictionIneligibilityReason: predictionEligibility.reason,
      registryLinkState:
        providerResolution.state === "linked"
          ? "linked"
          : providerResolution.state === "missing_link"
            ? "missing_link"
            : "conflict",
      sourceEvidence: [
        "canonical_schedule",
        ...(providerFixture
          ? [`api_football:${providerFixture.providerFixtureId}`]
          : []),
        ...(internalMatch ? [`database_match:${internalMatch.id}`] : []),
        ...(internalMatch?.external_id ? [`database_external_id:${internalMatch.external_id}`] : []),
        ...(predictionState.predictionExists ? ["database_prediction_versions"] : []),
      ],
    };

    return {
      ...rowBase,
      ...determinePersistenceState({
        rowBase,
        canonicalFixture,
        providerResolution,
        internalResolution,
        competitionResolution,
        seasonResolution,
        homeTeamResolution,
        awayTeamResolution,
      }),
    };
  });

  const duplicateProviderFixtureIds = new Map<number, FixtureRegistryRow[]>();
  for (const row of rows) {
    if (row.apiFootballFixtureId === null || row.registryLinkState !== "linked") {
      continue;
    }

    const collection = duplicateProviderFixtureIds.get(row.apiFootballFixtureId) ?? [];
    collection.push(row);
    duplicateProviderFixtureIds.set(row.apiFootballFixtureId, collection);
  }

  const finalRows = rows.map((row) => {
    if (row.apiFootballFixtureId === null) {
      return row;
    }

    const duplicates = duplicateProviderFixtureIds.get(row.apiFootballFixtureId);
    if (!duplicates || duplicates.length === 1) {
      return row;
    }

    return {
      ...row,
      registryLinkState: "conflict" as const,
      persistenceState: "skip" as const,
      proposedAction: "report_conflict" as const,
      conflictCode: "provider_id_duplicate" as const,
      conflictReason: `Provider fixture ${row.apiFootballFixtureId} resolved to multiple canonical fixtures.`,
    };
  });

  return {
    version: 1,
    catalogSourceAuthority: WORLD_CUP_2026_CATALOG_METADATA.sourceAuthority,
    catalogSourceDate: WORLD_CUP_2026_CATALOG_METADATA.sourceDate,
    generatedAt: now.toISOString(),
    summary: buildSummary(finalRows),
    selection: null,
    rows: finalRows,
  };
}

export function buildFixtureRegistrySelection(
  report: FixtureRegistryReport,
  input: FixtureRegistrySelectionInput,
): FixtureRegistrySelection | null {
  const explicitCanonicalIds = new Set(input.canonicalFixtureIds ?? []);
  const explicitProviderIds = new Set(input.apiFootballFixtureIds ?? []);
  const hasSelection =
    explicitCanonicalIds.size > 0 ||
    explicitProviderIds.size > 0 ||
    typeof input.matchday === "number" ||
    Boolean(input.from) ||
    Boolean(input.to);

  if (!hasSelection) {
    return null;
  }

  const selectedRows = report.rows.filter((row) => {
    if (explicitCanonicalIds.has(row.canonicalFixtureId)) {
      return true;
    }
    if (row.apiFootballFixtureId !== null && explicitProviderIds.has(row.apiFootballFixtureId)) {
      return true;
    }
    if (
      typeof input.matchday === "number" &&
      inferMatchday(Number(row.canonicalFixtureId.slice(-3))) === input.matchday
    ) {
      return true;
    }
    if (input.from || input.to) {
      const kickoffDate = row.canonicalKickoffUtc.slice(0, 10);
      if (input.from && kickoffDate < input.from) {
        return false;
      }
      if (input.to && kickoffDate > input.to) {
        return false;
      }
      return true;
    }

    return false;
  });

  const labelParts: string[] = [];
  if (typeof input.matchday === "number") {
    labelParts.push(`matchday_${input.matchday}`);
  }
  if (input.from || input.to) {
    labelParts.push(`range_${input.from ?? "open"}_${input.to ?? "open"}`);
  }
  if (explicitCanonicalIds.size > 0) {
    labelParts.push(`canonical_${explicitCanonicalIds.size}`);
  }
  if (explicitProviderIds.size > 0) {
    labelParts.push(`provider_${explicitProviderIds.size}`);
  }

  return {
    label: labelParts.join("__") || "selection",
    canonicalFixtureIds: selectedRows.map((row) => row.canonicalFixtureId),
    apiFootballFixtureIds: selectedRows.flatMap((row) =>
      row.apiFootballFixtureId === null ? [] : [row.apiFootballFixtureId],
    ),
    total: selectedRows.length,
    linked: selectedRows.filter((row) => row.registryLinkState === "linked").length,
    missingLinks: selectedRows.filter((row) => row.registryLinkState === "missing_link").length,
    conflicts: selectedRows.filter((row) => row.registryLinkState === "conflict").length,
    createCandidates: selectedRows.filter((row) => row.persistenceState === "create_candidate").length,
    updateCandidates: selectedRows.filter((row) => row.persistenceState === "update_candidate").length,
    alreadyStored: selectedRows.filter((row) => row.persistenceState === "already_stored").length,
    predictionEligible: selectedRows.filter((row) => row.predictionEligible === "eligible").length,
    notPredictionEligible: selectedRows.filter((row) => row.predictionEligible === "not_prediction_eligible").length,
  };
}

export function withFixtureRegistrySelection(
  report: FixtureRegistryReport,
  selection: FixtureRegistrySelection | null,
): FixtureRegistryReport {
  return {
    ...report,
    selection,
  };
}

export function buildFixtureRegistryAllowlistManifest(
  report: FixtureRegistryReport,
  input: FixtureRegistrySelectionInput,
): FixtureRegistryAllowlistManifest {
  const selection = buildFixtureRegistrySelection(report, input);
  if (!selection) {
    throw new Error("Cannot build an allowlist manifest without an explicit selection.");
  }

  return {
    version: 1,
    generatedAt: report.generatedAt,
    selection: {
      matchday: input.matchday ?? null,
      from: input.from ?? null,
      to: input.to ?? null,
    },
    allowlist: {
      canonicalFixtureIds: selection.canonicalFixtureIds,
      apiFootballFixtureIds: selection.apiFootballFixtureIds,
    },
  };
}

export function resolveFixtureRegistryApplyPlan(
  report: FixtureRegistryReport,
  input: FixtureRegistryApplyInput,
): FixtureRegistryApplyPlan | null {
  if (!input.apply) {
    return null;
  }

  const allowCanonicalFixtureIds = new Set(input.allowCanonicalFixtureIds ?? []);
  const allowApiFootballFixtureIds = new Set(input.allowApiFootballFixtureIds ?? []);
  const manifest = input.allowlistManifest;

  for (const canonicalFixtureId of manifest?.allowlist.canonicalFixtureIds ?? []) {
    allowCanonicalFixtureIds.add(canonicalFixtureId);
  }
  for (const fixtureId of manifest?.allowlist.apiFootballFixtureIds ?? []) {
    allowApiFootballFixtureIds.add(fixtureId);
  }

  if (allowCanonicalFixtureIds.size === 0 && allowApiFootballFixtureIds.size === 0) {
    throw new Error(
      "Apply mode requires an exact allowlist via canonical fixture ids, API-Football fixture ids, or an allowlist manifest.",
    );
  }

  const selectedRows = report.rows.filter((row) => {
    if (allowCanonicalFixtureIds.has(row.canonicalFixtureId)) {
      return true;
    }
    return row.apiFootballFixtureId !== null && allowApiFootballFixtureIds.has(row.apiFootballFixtureId);
  });

  if (selectedRows.length === 0) {
    throw new Error("Apply mode resolved an empty exact allowlist.");
  }

  return {
    targets: selectedRows.map((row) => ({
      canonicalFixtureId: row.canonicalFixtureId,
      apiFootballFixtureId: row.apiFootballFixtureId,
    })),
    allowlist: {
      canonicalFixtureIds: [...allowCanonicalFixtureIds].sort(),
      apiFootballFixtureIds: [...allowApiFootballFixtureIds].sort((left, right) => left - right),
    },
  };
}

export function summarizeFixtureRegistryReport(
  report: FixtureRegistryReport,
  artifactPath: string,
): string[] {
  const lines = [
    `canonical_fixture_total=${report.summary.canonicalFixtureTotal}`,
    `linked=${report.summary.linked} missing_links=${report.summary.missingLinks} conflicts=${report.summary.conflicts}`,
    `already_stored=${report.summary.alreadyStored} create_candidates=${report.summary.createCandidates} update_candidates=${report.summary.updateCandidates}`,
    `started=${report.summary.started} finished=${report.summary.finished}`,
    `prediction_eligible=${report.summary.predictionEligible} not_prediction_eligible=${report.summary.notPredictionEligible}`,
    `artifact_path=${artifactPath}`,
  ];

  if (report.selection) {
    lines.push(
      `selection label=${report.selection.label} total=${report.selection.total} linked=${report.selection.linked} missing_links=${report.selection.missingLinks} conflicts=${report.selection.conflicts} create_candidates=${report.selection.createCandidates} update_candidates=${report.selection.updateCandidates} already_stored=${report.selection.alreadyStored} prediction_eligible=${report.selection.predictionEligible} not_prediction_eligible=${report.selection.notPredictionEligible}`,
    );
  }

  return lines;
}

export function buildFixtureRegistrySourceNote(input: {
  generatedAt: string;
  canonicalFixtureId: string;
  providerFixtureId: number;
}): string {
  return `world_cup_group_stage_fixture_registry generated_at=${input.generatedAt}; canonical_fixture=${input.canonicalFixtureId}; provider_fixture_id=${input.providerFixtureId}`;
}

export function buildFixtureRegistryApplyCounts(): FixtureRegistryApplyCounts {
  return {
    selected: 0,
    created: 0,
    updated: 0,
    alreadyStored: 0,
    skipped: 0,
    conflicts: 0,
    duplicates: 0,
  };
}

function getCanonicalFixtureById(canonicalFixtureId: string) {
  const fixture = WORLD_CUP_2026_FIXTURES.find(
    (candidate) => candidate.fixtureKey === canonicalFixtureId,
  );
  if (!fixture) {
    throw new Error(`Unknown canonical fixture id: ${canonicalFixtureId}`);
  }

  return fixture;
}

function resolveRegistryWriteContext(args: {
  canonicalFixtureId: string;
  report: FixtureRegistryReport;
  databaseSnapshot: WorldCupRegistryDatabaseSnapshot;
  providerFixtures: ProviderFixture[];
  now?: Date;
}) {
  const freshReport = planWorldCupGroupStageFixtureRegistry({
    providerFixtures: args.providerFixtures,
    databaseSnapshot: args.databaseSnapshot,
    now: args.now,
  });
  const row = freshReport.rows.find(
    (candidate) => candidate.canonicalFixtureId === args.canonicalFixtureId,
  );
  if (!row) {
    throw new Error(`Fresh revalidation could not find canonical fixture ${args.canonicalFixtureId}.`);
  }

  const canonicalFixture = getCanonicalFixtureById(args.canonicalFixtureId);
  const competitionResolution = resolveCompetition(args.databaseSnapshot);
  const seasonResolution = resolveSeason(args.databaseSnapshot, competitionResolution);
  const homeTeamResolution = resolveTeam(args.databaseSnapshot, canonicalFixture.homeTeamKey);
  const awayTeamResolution = resolveTeam(args.databaseSnapshot, canonicalFixture.awayTeamKey);
  const providerResolution = resolveProviderFixture(canonicalFixture, args.providerFixtures);
  const internalResolution = resolveInternalMatch(
    canonicalFixture,
    args.databaseSnapshot,
    homeTeamResolution,
    awayTeamResolution,
    providerResolution.state === "linked" ? providerResolution.providerFixture : null,
  );

  return {
    freshReport,
    row,
    canonicalFixture,
    competitionResolution,
    seasonResolution,
    homeTeamResolution,
    awayTeamResolution,
    providerResolution,
    internalResolution,
  };
}

export async function applyWorldCupGroupStageFixtureRegistryPlan(args: {
  report: FixtureRegistryReport;
  databaseSnapshot: WorldCupRegistryDatabaseSnapshot;
  providerFixtures: ProviderFixture[];
  applyPlan: FixtureRegistryApplyPlan;
  writeAdapter: FixtureRegistryWriteAdapter;
  now?: Date;
}): Promise<FixtureRegistryApplyCounts> {
  const counts = buildFixtureRegistryApplyCounts();
  const seenCanonicalIds = new Set<string>();
  const seenProviderIds = new Set<number>();

  for (const target of args.applyPlan.targets) {
    counts.selected += 1;

    if (seenCanonicalIds.has(target.canonicalFixtureId)) {
      counts.duplicates += 1;
      counts.skipped += 1;
      continue;
    }
    seenCanonicalIds.add(target.canonicalFixtureId);

    if (target.apiFootballFixtureId !== null) {
      if (seenProviderIds.has(target.apiFootballFixtureId)) {
        counts.duplicates += 1;
        counts.skipped += 1;
        continue;
      }
      seenProviderIds.add(target.apiFootballFixtureId);
    }

    const context = resolveRegistryWriteContext({
      canonicalFixtureId: target.canonicalFixtureId,
      report: args.report,
      databaseSnapshot: args.databaseSnapshot,
      providerFixtures: args.providerFixtures,
      now: args.now,
    });

    if (context.row.registryLinkState === "conflict" || context.row.conflictCode !== null) {
      counts.conflicts += 1;
      counts.skipped += 1;
      continue;
    }

    if (context.row.registryLinkState !== "linked" || context.providerResolution.state !== "linked") {
      counts.skipped += 1;
      continue;
    }

    if (context.competitionResolution.state === "conflict") {
      counts.conflicts += 1;
      counts.skipped += 1;
      continue;
    }

    if (context.seasonResolution.state === "conflict") {
      counts.conflicts += 1;
      counts.skipped += 1;
      continue;
    }

    if (context.homeTeamResolution.teamIds.length !== 1 || context.awayTeamResolution.teamIds.length !== 1) {
      counts.conflicts += 1;
      counts.skipped += 1;
      continue;
    }

    if (context.internalResolution.state === "conflict") {
      counts.conflicts += 1;
      counts.skipped += 1;
      continue;
    }

    if (context.row.persistenceState === "already_stored") {
      counts.alreadyStored += 1;
      continue;
    }

    if (
      context.row.persistenceState !== "create_candidate" &&
      context.row.persistenceState !== "update_candidate"
    ) {
      counts.skipped += 1;
      continue;
    }

    const mappedStatus = mapProviderFixtureStatus(context.providerResolution.providerFixture.status);
    if (mappedStatus.action === "skip") {
      counts.skipped += 1;
      continue;
    }

    const sourceNote = buildFixtureRegistrySourceNote({
      generatedAt: context.freshReport.generatedAt,
      canonicalFixtureId: context.canonicalFixture.fixtureKey,
      providerFixtureId: context.providerResolution.providerFixture.providerFixtureId,
    });

    if (context.row.persistenceState === "create_candidate") {
      await args.writeAdapter.insertMatch({
        external_id: buildApiFootballFixtureExternalId(
          context.providerResolution.providerFixture.providerFixtureId,
        ),
        slug: context.canonicalFixture.matchSlug,
        competition_id: context.competitionResolution.competition.id,
        season_id: context.seasonResolution.season.id,
        home_team_id: context.homeTeamResolution.teamIds[0]!,
        away_team_id: context.awayTeamResolution.teamIds[0]!,
        kickoff_at: context.providerResolution.providerFixture.kickoffAt,
        stage: context.providerResolution.providerFixture.competition.round,
        status: mappedStatus.status,
        access_scope: "admin_only",
        intake_source: "api_football",
        source_note: sourceNote,
      });
      counts.created += 1;
      continue;
    }

    if (context.internalResolution.state !== "matched") {
      counts.skipped += 1;
      continue;
    }

    await args.writeAdapter.updateMatch(context.internalResolution.match.id, {
      external_id: buildApiFootballFixtureExternalId(
        context.providerResolution.providerFixture.providerFixtureId,
      ),
      kickoff_at: context.providerResolution.providerFixture.kickoffAt,
      stage: context.providerResolution.providerFixture.competition.round,
      status: mappedStatus.status,
      intake_source: "api_football",
      source_note: sourceNote,
    });
    counts.updated += 1;
  }

  return counts;
}
