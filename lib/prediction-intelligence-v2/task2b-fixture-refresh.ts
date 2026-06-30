import path from "node:path";

import type { DatabaseUpdate, MatchRow } from "../../types/database";
import { fetchApiFootballFixturesByLeague } from "../football-api/api-football-client";
import { buildApiFootballFixtureExternalId } from "../football-api/ingest/external-ids";
import { createSupabaseScriptAdminClient } from "../supabase/script-admin";
import { WORLD_CUP_2026_FIXTURES } from "../world-cup-2026";
import {
  resolveWorldCupProviderFixtureFromSanitizedSnapshot,
  verifyWorldCupProviderFixtureIdentity,
} from "../world-cup-2026/fixture-registry";
import {
  TASK2B_COMPETITION_SLUG,
  TASK2B_PROVIDER_LEAGUE_ID,
  TASK2B_PROVIDER_SEASON,
  TASK2B_WORLD_CUP_DATE_RANGE,
  assertTask2BAuthorization,
  assertTask2BLocalRunPreflight,
  assertTask2BProviderSnapshot,
  buildTask2BSelectionLabel,
  ensureDirectory,
  normalizeSelectionSpec,
  normalizeUtcInstant,
  readJsonFile,
  resolveTask2BDefaultArtifactsDir,
  sameUtcInstant,
  sanitizeProviderSnapshot,
  sha256File,
  sha256Json,
  type Task2BAuthorization,
  type Task2BMode,
  type Task2BProviderSnapshot,
  type Task2BProviderStatusClassification,
  type Task2BSelectionSpec,
  writeJsonFile,
} from "./task2b-shared";

const TASK2B1_SCHEMA_NAME = "ufo-task2b-1-fixture-refresh-v1";
const TASK2B1_SCHEMA_VERSION = 1;

type FixtureRefreshClassification =
  | "already_identical"
  | "provider_link_only"
  | "kickoff_only"
  | "provider_link_and_kickoff"
  | "terminal_result_ready"
  | "live_state_observed"
  | "postponed_state_observed"
  | "cancelled_state_observed"
  | "abandoned_state_observed"
  | "blocked_kickoff_conflict"
  | "duplicate_provider_ownership"
  | "identity_conflict"
  | "unsupported_provider_state";

type FixtureRefreshSafeAction = "none" | "update_provider_link" | "update_kickoff" | "update_provider_link_and_kickoff";

type Task2B1CompetitionRow = {
  id: string;
  slug: string;
};

type Task2B1SeasonRow = {
  id: string;
  competition_id: string;
  year: number;
};

type Task2B1TeamRow = {
  id: string;
  slug: string;
  name: string;
};

export type Task2B1MatchRow = Pick<
  MatchRow,
  | "id"
  | "external_id"
  | "slug"
  | "competition_id"
  | "season_id"
  | "home_team_id"
  | "away_team_id"
  | "kickoff_at"
  | "stage"
  | "status"
  | "access_scope"
  | "intake_source"
  | "source_note"
>;

type Task2B1OfficialScheduleMatchRow = {
  id: string;
  official_match_number: number;
  home_team_key: string | null;
  away_team_key: string | null;
  scheduled_at_utc: string;
};

type Task2B1OfficialScheduleMatchLinkRow = {
  official_schedule_match_id: string;
  match_id: string | null;
  api_football_fixture_id: number | null;
  link_status: "linked" | "candidate" | "unresolved";
};

export type Task2B1StageSnapshot = {
  competitions: Task2B1CompetitionRow[];
  seasons: Task2B1SeasonRow[];
  teams: Task2B1TeamRow[];
  matches: Task2B1MatchRow[];
  officialScheduleMatches: Task2B1OfficialScheduleMatchRow[];
  officialScheduleMatchLinks: Task2B1OfficialScheduleMatchLinkRow[];
};

type Task2B1ProviderOnlyRow = {
  providerFixtureId: number;
  providerKickoffAt: string;
  normalizedProviderStatus: Task2BProviderStatusClassification;
  homeTeamName: string;
  awayTeamName: string;
  classification: "provider_only_unknown";
  exclusionReason: string;
};

type Task2B1ExpectedPriorState = {
  externalId: string | null;
  kickoffAt: string;
  notStartedBefore: string;
};

type Task2B1Patch = {
  external_id?: string;
  kickoff_at?: string;
};

export type Task2B1PlanRow = {
  matchId: string;
  canonicalFixtureId: string;
  slug: string;
  officialMatchNumber: number;
  apiFootballFixtureId: number | null;
  currentExternalId: string | null;
  storedKickoffAt: string;
  officialKickoffAt: string;
  providerKickoffAt: string | null;
  normalizedProviderStatus: Task2BProviderStatusClassification | null;
  homeTeamName: string;
  awayTeamName: string;
  classification: FixtureRefreshClassification;
  safeAction: FixtureRefreshSafeAction;
  patch: Task2B1Patch | null;
  expectedPriorState: Task2B1ExpectedPriorState | null;
  exclusionReason: string | null;
  identityReason: string | null;
};

export type Task2B1Plan = {
  schemaName: typeof TASK2B1_SCHEMA_NAME;
  schemaVersion: typeof TASK2B1_SCHEMA_VERSION;
  generatedAt: string;
  mode: Task2BMode;
  taskSlice: "task2b.1";
  targetProjectRef: string;
  deniedProjectRef: string;
  competitionSlug: typeof TASK2B_COMPETITION_SLUG;
  season: typeof TASK2B_PROVIDER_SEASON;
  selection: Task2BSelectionSpec & { label: string };
  providerSnapshotPath: string;
  providerSnapshotSha256: string;
  snapshotNormalizationVersion: 1;
  observedAt: string;
  stageStateFingerprint: string;
  summary: {
    selectedFixtures: number;
    safeActionCount: number;
    alreadyIdenticalCount: number;
    providerLinkOnlyCount: number;
    kickoffOnlyCount: number;
    providerLinkAndKickoffCount: number;
    terminalResultReadyCount: number;
    liveStateObservedCount: number;
    postponedStateObservedCount: number;
    cancelledStateObservedCount: number;
    abandonedStateObservedCount: number;
    blockedKickoffConflictCount: number;
    duplicateProviderOwnershipCount: number;
    identityConflictCount: number;
    unsupportedProviderStateCount: number;
    providerOnlyUnknownCount: number;
    zeroWriteConfirmation: boolean;
  };
  globalBlockers: string[];
  rowLevelExclusions: Array<{
    key: string;
    reason: string;
  }>;
  safeActions: Array<{
    key: string;
    matchId: string;
    canonicalFixtureId: string;
    apiFootballFixtureId: number;
    safeAction: Exclude<FixtureRefreshSafeAction, "none">;
    patch: Task2B1Patch;
    expectedPriorState: Task2B1ExpectedPriorState;
  }>;
  rows: Task2B1PlanRow[];
  providerOnlyRows: Task2B1ProviderOnlyRow[];
  stablePlanSha256: string;
};

export type Task2B1ApplyResult = {
  completedActionKeys: string[];
  failedActionKey: string | null;
  ambiguousActionKey: string | null;
  writesApplied: number;
};

export type Task2B1VerifyResult = {
  verificationPassed: boolean;
  reviewedActionCount: number;
  satisfiedActionCount: number;
  missingActionCount: number;
  mismatchedActionCount: number;
  ambiguousActionCount: number;
  pendingReviewedActionCount: number;
  satisfiedActionKeys: string[];
  missingActionKeys: string[];
  ambiguousActionKeys: string[];
  pendingReviewedActionKeys: string[];
  mismatches: Array<{
    actionKey: string;
    matchId: string;
    field: "external_id" | "kickoff_at";
    expected: string;
    actual: string | null;
  }>;
};

type Task2B1DatabaseAdapter = {
  readStageSnapshot(): Promise<Task2B1StageSnapshot>;
  rereadMatches(matchIds: string[]): Promise<Task2B1MatchRow[]>;
  updateMatch(matchId: string, payload: Pick<DatabaseUpdate<"matches">, "external_id" | "kickoff_at">): Promise<void>;
};

type RunTask2B1Input = {
  repoRoot: string;
  artifactsDir: string;
  envSupabaseUrl: string | undefined;
  projectRef: string;
  denyProjectRef: string;
  dryRun: boolean;
  apply: boolean;
  verify: boolean;
  reviewedPlanPath?: string | null;
  reviewedStablePlanSha256?: string | null;
  providerSnapshotPath?: string | null;
  selection: Partial<Task2BSelectionSpec>;
};

export type RunTask2B1Result = {
  plan: Task2B1Plan;
  artifactPath: string;
  providerSnapshotPath: string;
  providerSnapshotSha256: string;
  applyResult: Task2B1ApplyResult | null;
  verifyResult: Task2B1VerifyResult | null;
};

function buildCanonicalFixtureMap() {
  return new Map(
    WORLD_CUP_2026_FIXTURES.slice(0, 72).map((fixture) => [fixture.fixtureKey, fixture]),
  );
}

const CANONICAL_FIXTURES_BY_ID = buildCanonicalFixtureMap();

function inferCanonicalFixtureId(
  matchNumber: number,
): (typeof WORLD_CUP_2026_FIXTURES)[number]["fixtureKey"] {
  return `wc2026-match-${String(matchNumber).padStart(3, "0")}` as (typeof WORLD_CUP_2026_FIXTURES)[number]["fixtureKey"];
}

function parseProviderFixtureId(externalId: string | null): number | null {
  if (!externalId) {
    return null;
  }

  const match = /^api-football:fixture:(\d+)$/.exec(externalId);
  return match ? Number(match[1]) : null;
}

function buildFixtureStateFingerprint(snapshot: Task2B1StageSnapshot): string {
  return sha256Json({
    matches: snapshot.matches.map((match) => ({
      id: match.id,
      external_id: match.external_id,
      kickoff_at: normalizeUtcInstant(match.kickoff_at),
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      competition_id: match.competition_id,
      season_id: match.season_id,
    })),
    officialScheduleMatchLinks: snapshot.officialScheduleMatchLinks.map((link) => ({
      official_schedule_match_id: link.official_schedule_match_id,
      match_id: link.match_id,
      api_football_fixture_id: link.api_football_fixture_id,
      link_status: link.link_status,
    })),
  });
}

function buildTask2B1StablePlanPayload(plan: Omit<Task2B1Plan, "generatedAt" | "mode" | "stablePlanSha256">) {
  return {
    schemaName: plan.schemaName,
    schemaVersion: plan.schemaVersion,
    taskSlice: plan.taskSlice,
    targetProjectRef: plan.targetProjectRef,
    deniedProjectRef: plan.deniedProjectRef,
    competitionSlug: plan.competitionSlug,
    season: plan.season,
    selection: plan.selection,
    providerSnapshotSha256: plan.providerSnapshotSha256,
    snapshotNormalizationVersion: plan.snapshotNormalizationVersion,
    observedAt: plan.observedAt,
    stageStateFingerprint: plan.stageStateFingerprint,
    summary: {
      ...plan.summary,
      zeroWriteConfirmation: undefined,
    },
    globalBlockers: plan.globalBlockers,
    rowLevelExclusions: plan.rowLevelExclusions,
    safeActions: plan.safeActions,
    rows: plan.rows,
    providerOnlyRows: plan.providerOnlyRows,
  };
}

function buildPlanArtifactPath(artifactsDir: string, mode: Task2BMode): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(artifactsDir, `task2b-1-fixture-refresh-${mode}-${timestamp}.json`);
}

function buildProviderSnapshotPath(artifactsDir: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(artifactsDir, `task2b-1-provider-snapshot-${timestamp}.json`);
}

function buildSelection(
  snapshot: Task2B1StageSnapshot,
  selectionInput: Partial<Task2BSelectionSpec>,
): Task2BSelectionSpec & { label: string } {
  const normalized = normalizeSelectionSpec(selectionInput);
  const explicit = Boolean(
    normalized.canonicalFixtureIds.length ||
      normalized.matchIds.length ||
      normalized.apiFootballFixtureIds.length ||
      normalized.matchday !== null ||
      normalized.from ||
      normalized.to,
  );
  if (!explicit) {
    throw new Error("Task 2B.1 requires an explicit bounded selection.");
  }

  const selectedMatchIds = new Set<string>();
  for (const match of snapshot.matches) {
    const providerFixtureId = parseProviderFixtureId(match.external_id);
    const canonicalFixture = WORLD_CUP_2026_FIXTURES.find((fixture) => fixture.matchSlug === match.slug);
    const kickoffDate = normalizeUtcInstant(match.kickoff_at).slice(0, 10);
    const matchday =
      canonicalFixture?.matchNumber != null
        ? canonicalFixture.matchNumber <= 24
          ? 1
          : canonicalFixture.matchNumber <= 48
            ? 2
            : canonicalFixture.matchNumber <= 72
              ? 3
              : null
        : null;

    if (normalized.matchIds.includes(match.id)) {
      selectedMatchIds.add(match.id);
      continue;
    }
    if (canonicalFixture && normalized.canonicalFixtureIds.includes(canonicalFixture.fixtureKey)) {
      selectedMatchIds.add(match.id);
      continue;
    }
    if (providerFixtureId !== null && normalized.apiFootballFixtureIds.includes(providerFixtureId)) {
      selectedMatchIds.add(match.id);
      continue;
    }
    if (normalized.matchday !== null && matchday === normalized.matchday) {
      selectedMatchIds.add(match.id);
      continue;
    }
    if (normalized.from || normalized.to) {
      if (normalized.from && kickoffDate < normalized.from) {
        continue;
      }
      if (normalized.to && kickoffDate > normalized.to) {
        continue;
      }
      selectedMatchIds.add(match.id);
    }
  }

  return {
    ...normalized,
    matchIds: [...selectedMatchIds].sort(),
    label: buildTask2BSelectionLabel(normalized),
  };
}

function selectMatches(snapshot: Task2B1StageSnapshot, selection: Task2BSelectionSpec & { label: string }) {
  const selectedMatchIds = new Set(selection.matchIds);
  return snapshot.matches.filter((match) => selectedMatchIds.has(match.id));
}

function hasFixtureStarted(kickoffAt: string, now: string): boolean {
  return Date.parse(normalizeUtcInstant(kickoffAt)) <= Date.parse(normalizeUtcInstant(now));
}

function buildTask2B1Summary(rows: Task2B1PlanRow[], providerOnlyRows: Task2B1ProviderOnlyRow[], mode: Task2BMode) {
  return {
    selectedFixtures: rows.length,
    safeActionCount: rows.filter((row) => row.safeAction !== "none").length,
    alreadyIdenticalCount: rows.filter((row) => row.classification === "already_identical").length,
    providerLinkOnlyCount: rows.filter((row) => row.classification === "provider_link_only").length,
    kickoffOnlyCount: rows.filter((row) => row.classification === "kickoff_only").length,
    providerLinkAndKickoffCount: rows.filter((row) => row.classification === "provider_link_and_kickoff").length,
    terminalResultReadyCount: rows.filter((row) => row.classification === "terminal_result_ready").length,
    liveStateObservedCount: rows.filter((row) => row.classification === "live_state_observed").length,
    postponedStateObservedCount: rows.filter((row) => row.classification === "postponed_state_observed").length,
    cancelledStateObservedCount: rows.filter((row) => row.classification === "cancelled_state_observed").length,
    abandonedStateObservedCount: rows.filter((row) => row.classification === "abandoned_state_observed").length,
    blockedKickoffConflictCount: rows.filter((row) => row.classification === "blocked_kickoff_conflict").length,
    duplicateProviderOwnershipCount: rows.filter((row) => row.classification === "duplicate_provider_ownership").length,
    identityConflictCount: rows.filter((row) => row.classification === "identity_conflict").length,
    unsupportedProviderStateCount: rows.filter((row) => row.classification === "unsupported_provider_state").length,
    providerOnlyUnknownCount: providerOnlyRows.length,
    zeroWriteConfirmation: mode !== "apply",
  };
}

export function evaluateTask2B1Eligibility(plan: Task2B1Plan): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (plan.globalBlockers.length > 0) {
    reasons.push(...plan.globalBlockers);
  }
  if (plan.safeActions.length === 0) {
    reasons.push("No exact safe fixture actions were available.");
  }
  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

function planTask2B1FromSnapshot(args: {
  authorization: Task2BAuthorization;
  stageSnapshot: Task2B1StageSnapshot;
  providerSnapshot: Task2BProviderSnapshot;
  providerSnapshotPath: string;
  providerSnapshotSha256: string;
  selectionInput: Partial<Task2BSelectionSpec>;
  now: string;
}): Task2B1Plan {
  assertTask2BProviderSnapshot(args.providerSnapshot);
  const selection = buildSelection(args.stageSnapshot, args.selectionInput);
  const selectedMatches = selectMatches(args.stageSnapshot, selection);
  const teamById = new Map(args.stageSnapshot.teams.map((team) => [team.id, team]));
  const officialMatchById = new Map(
    args.stageSnapshot.officialScheduleMatches.map((match) => [match.id, match]),
  );
  const officialLinkByMatchId = new Map<string, Task2B1OfficialScheduleMatchLinkRow>();
  for (const link of args.stageSnapshot.officialScheduleMatchLinks) {
    if (link.match_id) {
      officialLinkByMatchId.set(link.match_id, link);
    }
  }
  const duplicateProviderOwnership = new Map<number, string[]>();
  for (const match of args.stageSnapshot.matches) {
    const providerId = parseProviderFixtureId(match.external_id);
    if (providerId === null) {
      continue;
    }
    const owners = duplicateProviderOwnership.get(providerId) ?? [];
    owners.push(match.id);
    duplicateProviderOwnership.set(providerId, owners);
  }

  const rows: Task2B1PlanRow[] = [];
  const usedProviderIds = new Set<number>();
  const rowLevelExclusions: Array<{ key: string; reason: string }> = [];
  const safeActions: Task2B1Plan["safeActions"] = [];
  const globalBlockers: string[] = [];

  for (const match of selectedMatches) {
    const officialLink = officialLinkByMatchId.get(match.id);
    const officialScheduleMatch = officialLink ? officialMatchById.get(officialLink.official_schedule_match_id) : null;
    if (!officialLink || !officialScheduleMatch || officialScheduleMatch.home_team_key == null || officialScheduleMatch.away_team_key == null) {
      globalBlockers.push(`Missing official schedule/runtime linkage for match ${match.id}.`);
      continue;
    }

    const canonicalFixtureId = inferCanonicalFixtureId(officialScheduleMatch.official_match_number);
    const canonicalFixture = CANONICAL_FIXTURES_BY_ID.get(canonicalFixtureId);
    if (!canonicalFixture) {
      globalBlockers.push(`Missing canonical fixture ${canonicalFixtureId}.`);
      continue;
    }

    const requestedProviderFixtureId = officialLink.api_football_fixture_id ?? canonicalFixture.apiFootballFixtureId ?? null;
    const homeTeamName = teamById.get(match.home_team_id)?.name ?? match.home_team_id;
    const awayTeamName = teamById.get(match.away_team_id)?.name ?? match.away_team_id;

    let classification: FixtureRefreshClassification = "identity_conflict";
    let safeAction: FixtureRefreshSafeAction = "none";
    let patch: Task2B1Patch | null = null;
    let expectedPriorState: Task2B1ExpectedPriorState | null = null;
    let exclusionReason: string | null = null;
    let identityReason: string | null = null;
    const currentExternalId = match.external_id;
    const storedKickoffAt = normalizeUtcInstant(match.kickoff_at);
    const officialKickoffAt = normalizeUtcInstant(officialScheduleMatch.scheduled_at_utc);
    const providerResolution = resolveWorldCupProviderFixtureFromSanitizedSnapshot({
      canonicalFixture: {
        fixtureKey: canonicalFixture.fixtureKey,
        homeTeamKey: canonicalFixture.homeTeamKey,
        awayTeamKey: canonicalFixture.awayTeamKey,
        kickoffAt: officialKickoffAt,
        apiFootballFixtureId: requestedProviderFixtureId,
      },
      providerFixtures: args.providerSnapshot.fixtures,
    });
    const providerFixture = providerResolution.providerFixture;
    const providerFixtureId = providerFixture?.providerFixtureId ?? requestedProviderFixtureId;
    if (providerFixtureId !== null) {
      usedProviderIds.add(providerFixtureId);
    }
    const providerKickoffAt = providerFixture?.kickoffAt ?? null;
    const normalizedProviderStatus = providerFixture?.normalizedStatus ?? null;

    if (providerResolution.state === "missing_link" || !providerFixture || providerFixtureId === null) {
      classification = "identity_conflict";
      exclusionReason = "Provider league snapshot did not contain the expected exact fixture.";
    } else if (providerResolution.state === "conflict") {
      classification = providerResolution.conflictCode === "provider_kickoff_mismatch" ? "blocked_kickoff_conflict" : "identity_conflict";
      exclusionReason = providerResolution.conflictReason;
      identityReason = providerResolution.conflictReason;
    } else {
      const identityCheck = verifyWorldCupProviderFixtureIdentity({
        canonicalFixture: {
          fixtureKey: canonicalFixture.fixtureKey,
          homeTeamKey: canonicalFixture.homeTeamKey,
          awayTeamKey: canonicalFixture.awayTeamKey,
          kickoffAt: officialKickoffAt,
        },
        providerFixture: {
          provider: "api-football",
          providerFixtureId: providerFixture.providerFixtureId,
          kickoffAt: providerFixture.kickoffAt,
          timezone: providerFixture.timezone,
          status: providerFixture.providerStatus,
          statusShort: providerFixture.providerStatusShort,
          elapsedMinutes: providerFixture.elapsedMinutes,
          competition: providerFixture.competition,
          homeTeam: { ...providerFixture.homeTeam, winner: null },
          awayTeam: { ...providerFixture.awayTeam, winner: null },
          goals: providerFixture.goals,
        },
      });

      if (!identityCheck.ok) {
        classification = identityCheck.conflictCode === "provider_kickoff_mismatch" ? "blocked_kickoff_conflict" : "identity_conflict";
        exclusionReason = identityCheck.conflictReason;
        identityReason = identityCheck.conflictReason;
      } else if ((duplicateProviderOwnership.get(providerFixture.providerFixtureId)?.length ?? 0) > 1) {
        classification = "duplicate_provider_ownership";
        exclusionReason = `Provider fixture ${providerFixture.providerFixtureId} is already owned by multiple stored fixtures.`;
      } else {
        const nextExternalId = buildApiFootballFixtureExternalId(providerFixture.providerFixtureId);
        const linkNeedsUpdate = currentExternalId !== nextExternalId;
        const kickoffNeedsUpdate = !sameUtcInstant(storedKickoffAt, officialKickoffAt);
        const startedAtPlanTime = hasFixtureStarted(storedKickoffAt, args.now);

        if (!sameUtcInstant(officialKickoffAt, providerFixture.kickoffAt)) {
          classification = "blocked_kickoff_conflict";
          exclusionReason = `Stored/official/provider kickoff disagreement for ${canonicalFixture.fixtureKey}.`;
        } else {
          switch (providerFixture.normalizedStatus) {
            case "not_started": {
              if (kickoffNeedsUpdate && startedAtPlanTime) {
                classification = "blocked_kickoff_conflict";
                exclusionReason = "Kickoff drift cannot be applied because the fixture has already started.";
                break;
              }

              if (!linkNeedsUpdate && !kickoffNeedsUpdate) {
                classification = "already_identical";
                break;
              }

              classification =
                linkNeedsUpdate && kickoffNeedsUpdate
                  ? "provider_link_and_kickoff"
                  : linkNeedsUpdate
                    ? "provider_link_only"
                    : "kickoff_only";
              safeAction =
                classification === "provider_link_and_kickoff"
                  ? "update_provider_link_and_kickoff"
                  : classification === "provider_link_only"
                    ? "update_provider_link"
                    : "update_kickoff";
              patch = {
                ...(linkNeedsUpdate ? { external_id: nextExternalId } : {}),
                ...(kickoffNeedsUpdate ? { kickoff_at: officialKickoffAt } : {}),
              };
              expectedPriorState = {
                externalId: currentExternalId,
                kickoffAt: storedKickoffAt,
                notStartedBefore: officialKickoffAt,
              };
              break;
            }
            case "terminal_ft":
              if (linkNeedsUpdate) {
                classification = "provider_link_only";
                safeAction = "update_provider_link";
                patch = {
                  external_id: nextExternalId,
                };
                expectedPriorState = {
                  externalId: currentExternalId,
                  kickoffAt: storedKickoffAt,
                  notStartedBefore: officialKickoffAt,
                };
              } else {
                classification = "terminal_result_ready";
                exclusionReason = "Trusted terminal result is ready for Task 2B.2.";
              }
              break;
            case "live_or_in_progress":
              if (linkNeedsUpdate) {
                classification = "provider_link_only";
                safeAction = "update_provider_link";
                patch = {
                  external_id: nextExternalId,
                };
                expectedPriorState = {
                  externalId: currentExternalId,
                  kickoffAt: storedKickoffAt,
                  notStartedBefore: officialKickoffAt,
                };
              } else {
                classification = "live_state_observed";
                exclusionReason = "Live provider state is observed only and is excluded from durable fixture writes.";
              }
              break;
            case "postponed":
              classification = "postponed_state_observed";
              exclusionReason = "Postponed provider state is excluded from Task 2B.1 writes.";
              break;
            case "cancelled":
              classification = "cancelled_state_observed";
              exclusionReason = "Cancelled provider state is excluded from Task 2B.1 writes.";
              break;
            case "abandoned":
              classification = "abandoned_state_observed";
              exclusionReason = "Abandoned provider state is excluded from Task 2B.1 writes.";
              break;
            case "unsupported":
            default:
              classification = "unsupported_provider_state";
              exclusionReason = `Unsupported provider state ${providerFixture.providerStatusShort}.`;
              break;
          }
        }
      }
    }

    const row: Task2B1PlanRow = {
      matchId: match.id,
      canonicalFixtureId,
      slug: match.slug,
      officialMatchNumber: officialScheduleMatch.official_match_number,
      apiFootballFixtureId: providerFixtureId,
      currentExternalId,
      storedKickoffAt,
      officialKickoffAt,
      providerKickoffAt,
      normalizedProviderStatus,
      homeTeamName,
      awayTeamName,
      classification,
      safeAction,
      patch,
      expectedPriorState,
      exclusionReason,
      identityReason,
    };
    rows.push(row);

    const actionKey = `${row.matchId}:${row.canonicalFixtureId}:${row.apiFootballFixtureId ?? "none"}:${row.safeAction}`;
    if (row.safeAction !== "none" && row.patch && row.expectedPriorState && row.apiFootballFixtureId !== null) {
      safeActions.push({
        key: actionKey,
        matchId: row.matchId,
        canonicalFixtureId: row.canonicalFixtureId,
        apiFootballFixtureId: row.apiFootballFixtureId,
        safeAction: row.safeAction,
        patch: row.patch,
        expectedPriorState: row.expectedPriorState,
      });
    } else if (row.exclusionReason) {
      rowLevelExclusions.push({
        key: `${row.matchId}:${row.canonicalFixtureId}`,
        reason: row.exclusionReason,
      });
    }
  }

  const providerOnlyRows = args.providerSnapshot.fixtures
    .filter((fixture) => !usedProviderIds.has(fixture.providerFixtureId))
    .map(
      (fixture) =>
        ({
          providerFixtureId: fixture.providerFixtureId,
          providerKickoffAt: fixture.kickoffAt,
          normalizedProviderStatus: fixture.normalizedStatus,
          homeTeamName: fixture.homeTeam.name,
          awayTeamName: fixture.awayTeam.name,
          classification: "provider_only_unknown",
          exclusionReason: "Provider row is outside the stored canonical group-stage fixture set and is never insertable.",
        }) satisfies Task2B1ProviderOnlyRow,
    );

  const basePlan: Omit<Task2B1Plan, "stablePlanSha256"> = {
    schemaName: TASK2B1_SCHEMA_NAME,
    schemaVersion: TASK2B1_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    mode: args.authorization.mode,
    taskSlice: "task2b.1",
    targetProjectRef: args.authorization.projectRef,
    deniedProjectRef: args.authorization.denyProjectRef,
    competitionSlug: TASK2B_COMPETITION_SLUG,
    season: TASK2B_PROVIDER_SEASON,
    selection,
    providerSnapshotPath: args.providerSnapshotPath,
    providerSnapshotSha256: args.providerSnapshotSha256,
    snapshotNormalizationVersion: 1,
    observedAt: args.providerSnapshot.observedAt,
    stageStateFingerprint: buildFixtureStateFingerprint(args.stageSnapshot),
    summary: buildTask2B1Summary(rows, providerOnlyRows, args.authorization.mode),
    globalBlockers: [...new Set(globalBlockers)],
    rowLevelExclusions,
    safeActions,
    rows,
    providerOnlyRows,
  };

  return {
    ...basePlan,
    stablePlanSha256: sha256Json(buildTask2B1StablePlanPayload(basePlan)),
  };
}

function assertReviewedTask2B1ArtifactIntegrity(input: {
  reviewedPlan: Task2B1Plan;
  reviewedStablePlanSha256: string;
  authorization: Task2BAuthorization;
  reviewedSnapshotSha256: string;
}): void {
  if (input.reviewedPlan.mode !== "dry_run") {
    throw new Error("Task 2B.1 apply/verify requires a reviewed dry-run artifact.");
  }
  if (
    input.reviewedPlan.targetProjectRef !== input.authorization.projectRef ||
    input.reviewedPlan.deniedProjectRef !== input.authorization.denyProjectRef
  ) {
    throw new Error("Task 2B.1 reviewed artifact target binding differed.");
  }
  if (input.reviewedStablePlanSha256 !== input.reviewedPlan.stablePlanSha256) {
    throw new Error("Task 2B.1 reviewed stable plan SHA did not match the reviewed artifact.");
  }
  if (input.reviewedSnapshotSha256 !== input.reviewedPlan.providerSnapshotSha256) {
    throw new Error("Task 2B.1 reviewed provider snapshot checksum differed.");
  }

  const reviewedSemanticSha = sha256Json(buildTask2B1StablePlanPayload(input.reviewedPlan));
  if (reviewedSemanticSha !== input.reviewedPlan.stablePlanSha256) {
    throw new Error("Task 2B.1 reviewed artifact checksum did not match its contents.");
  }
}

function assertReviewedTask2B1PlanBinding(input: {
  reviewedPlan: Task2B1Plan;
  currentPlan: Task2B1Plan;
  reviewedStablePlanSha256: string;
  authorization: Task2BAuthorization;
  reviewedSnapshotSha256: string;
}): void {
  assertReviewedTask2B1ArtifactIntegrity(input);
  const reviewedSemanticSha = sha256Json(buildTask2B1StablePlanPayload(input.reviewedPlan));
  const currentSemanticSha = sha256Json(buildTask2B1StablePlanPayload(input.currentPlan));
  if (currentSemanticSha !== input.currentPlan.stablePlanSha256) {
    throw new Error("Task 2B.1 current plan checksum did not match its contents.");
  }
  if (reviewedSemanticSha !== currentSemanticSha) {
    throw new Error("Task 2B.1 current semantic plan differed from the reviewed artifact.");
  }
}

export async function applyTask2B1Plan(input: {
  reviewedPlan: Task2B1Plan;
  currentPlan: Task2B1Plan;
  reviewedStablePlanSha256: string;
  reviewedSnapshotSha256: string;
  authorization: Task2BAuthorization;
  databaseAdapter: Task2B1DatabaseAdapter;
  now: string;
}): Promise<Task2B1ApplyResult> {
  const reviewedEligibility = evaluateTask2B1Eligibility(input.reviewedPlan);
  if (!reviewedEligibility.eligible) {
    throw new Error(`Task 2B.1 apply refused because the reviewed plan is ineligible: ${reviewedEligibility.reasons.join(" | ")}`);
  }
  const currentEligibility = evaluateTask2B1Eligibility(input.currentPlan);
  if (!currentEligibility.eligible) {
    throw new Error(`Task 2B.1 apply refused because the current plan is ineligible: ${currentEligibility.reasons.join(" | ")}`);
  }

  assertReviewedTask2B1PlanBinding(input);
  const currentRows = await input.databaseAdapter.rereadMatches(
    input.reviewedPlan.safeActions.map((row) => row.matchId),
  );
  const currentById = new Map(currentRows.map((row) => [row.id, row]));
  const completedActionKeys: string[] = [];
  let failedActionKey: string | null = null;
  let ambiguousActionKey: string | null = null;

  for (const action of input.reviewedPlan.safeActions) {
    const current = currentById.get(action.matchId);
    if (!current) {
      throw new Error(`Task 2B.1 apply refused because match ${action.matchId} disappeared.`);
    }
    if (
      current.external_id !== action.expectedPriorState.externalId ||
      !sameUtcInstant(current.kickoff_at, action.expectedPriorState.kickoffAt)
    ) {
      throw new Error(`Task 2B.1 apply refused because match ${action.matchId} drifted before apply.`);
    }
    if (action.patch.kickoff_at && hasFixtureStarted(action.patch.kickoff_at, input.now)) {
      throw new Error(`Task 2B.1 apply refused because kickoff ${action.patch.kickoff_at} has already passed.`);
    }

    try {
      await input.databaseAdapter.updateMatch(action.matchId, action.patch);
      completedActionKeys.push(action.key);
    } catch (error) {
      failedActionKey = action.key;
      const reread = await input.databaseAdapter.rereadMatches([action.matchId]);
      const post = reread[0];
      if (
        post &&
        (action.patch.external_id == null || post.external_id === action.patch.external_id) &&
        (action.patch.kickoff_at == null || sameUtcInstant(post.kickoff_at, action.patch.kickoff_at))
      ) {
        ambiguousActionKey = action.key;
        completedActionKeys.push(action.key);
        continue;
      }
      throw new Error(
        `Task 2B.1 apply stopped on the first fixture mutation error. failed_action=${action.key}. Cause: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return {
    completedActionKeys,
    failedActionKey,
    ambiguousActionKey,
    writesApplied: completedActionKeys.length,
  };
}

export async function verifyTask2B1PostState(input: {
  reviewedPlan: Task2B1Plan;
  currentPlan: Task2B1Plan;
  reviewedStablePlanSha256: string;
  reviewedSnapshotSha256: string;
  authorization: Task2BAuthorization;
  databaseAdapter: Task2B1DatabaseAdapter;
  stageSnapshot: Task2B1StageSnapshot;
}): Promise<Task2B1VerifyResult> {
  assertReviewedTask2B1ArtifactIntegrity(input);

  const reviewedActions = input.reviewedPlan.safeActions;
  const rereadRows = await input.databaseAdapter.rereadMatches(reviewedActions.map((action) => action.matchId));
  const rereadById = new Map(rereadRows.map((row) => [row.id, row]));
  const ownershipByExternalId = new Map<string, string[]>();
  for (const match of input.stageSnapshot.matches) {
    if (!match.external_id) {
      continue;
    }
    const owners = ownershipByExternalId.get(match.external_id) ?? [];
    owners.push(match.id);
    ownershipByExternalId.set(match.external_id, owners);
  }

  const satisfiedActionKeys: string[] = [];
  const missingActionKeys: string[] = [];
  const ambiguousActionKeys: string[] = [];
  const pendingReviewedActionKeys: string[] = [];
  const mismatches: Task2B1VerifyResult["mismatches"] = [];

  for (const action of reviewedActions) {
    const reread = rereadById.get(action.matchId);
    if (!reread) {
      missingActionKeys.push(action.key);
      continue;
    }

    let actionSatisfied = true;
    if (action.patch.external_id !== undefined && reread.external_id !== action.patch.external_id) {
      actionSatisfied = false;
      mismatches.push({
        actionKey: action.key,
        matchId: action.matchId,
        field: "external_id",
        expected: action.patch.external_id,
        actual: reread.external_id,
      });
    }
    if (action.patch.kickoff_at !== undefined && !sameUtcInstant(reread.kickoff_at, action.patch.kickoff_at)) {
      actionSatisfied = false;
      mismatches.push({
        actionKey: action.key,
        matchId: action.matchId,
        field: "kickoff_at",
        expected: action.patch.kickoff_at,
        actual: reread.kickoff_at,
      });
    }

    if (!actionSatisfied) {
      continue;
    }

    if (action.patch.external_id !== undefined) {
      const owners = ownershipByExternalId.get(action.patch.external_id) ?? [];
      if (owners.length !== 1 || owners[0] !== action.matchId) {
        ambiguousActionKeys.push(action.key);
        continue;
      }
    }

    if (input.currentPlan.safeActions.some((pending) => pending.matchId === action.matchId)) {
      pendingReviewedActionKeys.push(action.key);
      continue;
    }

    satisfiedActionKeys.push(action.key);
  }

  const blockedConflictIds = ["wc2026-match-006", "wc2026-match-020", "wc2026-match-036"];
  for (const fixtureId of blockedConflictIds) {
    const row = input.currentPlan.rows.find((candidate) => candidate.canonicalFixtureId === fixtureId);
    if (row && row.classification !== "blocked_kickoff_conflict") {
      throw new Error(`Task 2B.1 verify expected blocked kickoff conflict to persist for ${fixtureId}.`);
    }
  }
  const isFullGroupStageVerification =
    input.currentPlan.selection.from === TASK2B_WORLD_CUP_DATE_RANGE.from &&
    input.currentPlan.selection.to === TASK2B_WORLD_CUP_DATE_RANGE.to;
  if (isFullGroupStageVerification && input.currentPlan.providerOnlyRows.length !== 1) {
    throw new Error("Task 2B.1 verify expected exactly one provider-only unknown row to persist.");
  }

  return {
    verificationPassed:
      missingActionKeys.length === 0 &&
      mismatches.length === 0 &&
      ambiguousActionKeys.length === 0 &&
      pendingReviewedActionKeys.length === 0,
    reviewedActionCount: reviewedActions.length,
    satisfiedActionCount: satisfiedActionKeys.length,
    missingActionCount: missingActionKeys.length,
    mismatchedActionCount: mismatches.length,
    ambiguousActionCount: ambiguousActionKeys.length,
    pendingReviewedActionCount: pendingReviewedActionKeys.length,
    satisfiedActionKeys,
    missingActionKeys,
    ambiguousActionKeys,
    pendingReviewedActionKeys,
    mismatches,
  };
}

function createLiveTask2B1DatabaseAdapter(): Task2B1DatabaseAdapter {
  const supabase = createSupabaseScriptAdminClient();

  return {
    async readStageSnapshot() {
      const { data: competitionData, error: competitionError } = await supabase
        .from("competitions")
        .select("id, slug")
        .eq("slug", TASK2B_COMPETITION_SLUG);
      if (competitionError) {
        throw new Error(`Failed to read competitions: ${competitionError.message}`);
      }
      const competitionIds = ((competitionData ?? []) as Task2B1CompetitionRow[]).map((row) => row.id);
      const { data: seasonData, error: seasonError } = await supabase
        .from("seasons")
        .select("id, competition_id, year")
        .in("competition_id", competitionIds.length > 0 ? competitionIds : ["00000000-0000-0000-0000-000000000000"])
        .eq("year", TASK2B_PROVIDER_SEASON);
      if (seasonError) {
        throw new Error(`Failed to read seasons: ${seasonError.message}`);
      }
      const seasonIds = ((seasonData ?? []) as Task2B1SeasonRow[]).map((row) => row.id);
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("id, external_id, slug, competition_id, season_id, home_team_id, away_team_id, kickoff_at, stage, status, access_scope, intake_source, source_note")
        .in("season_id", seasonIds.length > 0 ? seasonIds : ["00000000-0000-0000-0000-000000000000"])
        .order("kickoff_at", { ascending: true });
      if (matchError) {
        throw new Error(`Failed to read matches: ${matchError.message}`);
      }
      const teamIds = [
        ...new Set(
          ((matchData ?? []) as Task2B1MatchRow[]).flatMap((match) => [match.home_team_id, match.away_team_id]),
        ),
      ];
      const [{ data: teamData, error: teamError }, { data: officialMatchData, error: officialMatchError }, { data: officialLinkData, error: officialLinkError }] =
        await Promise.all([
          supabase.from("teams").select("id, slug, name").in("id", teamIds.length > 0 ? teamIds : ["00000000-0000-0000-0000-000000000000"]),
          supabase
            .from("official_schedule_matches")
            .select("id, official_match_number, home_team_key, away_team_key, scheduled_at_utc"),
          supabase
            .from("official_schedule_match_links")
            .select("official_schedule_match_id, match_id, api_football_fixture_id, link_status"),
        ]);
      if (teamError || officialMatchError || officialLinkError) {
        throw new Error(
          `Failed to read Task 2B.1 support tables: ${teamError?.message ?? officialMatchError?.message ?? officialLinkError?.message}`,
        );
      }

      return {
        competitions: (competitionData ?? []) as Task2B1CompetitionRow[],
        seasons: (seasonData ?? []) as Task2B1SeasonRow[],
        teams: (teamData ?? []) as Task2B1TeamRow[],
        matches: (matchData ?? []) as Task2B1MatchRow[],
        officialScheduleMatches: (officialMatchData ?? []) as Task2B1OfficialScheduleMatchRow[],
        officialScheduleMatchLinks: (officialLinkData ?? []) as Task2B1OfficialScheduleMatchLinkRow[],
      };
    },
    async rereadMatches(matchIds) {
      const { data, error } = await supabase
        .from("matches")
        .select("id, external_id, slug, competition_id, season_id, home_team_id, away_team_id, kickoff_at, stage, status, access_scope, intake_source, source_note")
        .in("id", matchIds.length > 0 ? matchIds : ["00000000-0000-0000-0000-000000000000"]);
      if (error) {
        throw new Error(`Failed to reread Task 2B.1 matches: ${error.message}`);
      }
      return (data ?? []) as Task2B1MatchRow[];
    },
    async updateMatch(matchId, payload) {
      const { error } = await supabase.from("matches").update(payload).eq("id", matchId);
      if (error) {
        throw new Error(`Failed to update match ${matchId}: ${error.message}`);
      }
    },
  };
}

export function resolveTask2B1Defaults(repoRoot: string) {
  return {
    artifactsDir: resolveTask2BDefaultArtifactsDir(repoRoot, "task2b-1"),
  };
}

export async function runTask2B1FixtureRefresh(
  input: RunTask2B1Input,
  dependencies?: {
    databaseAdapter?: Task2B1DatabaseAdapter;
    providerFetcher?: typeof fetchApiFootballFixturesByLeague;
  },
): Promise<RunTask2B1Result> {
  assertTask2BLocalRunPreflight(input.repoRoot, input.artifactsDir, "task2b-1");
  ensureDirectory(input.artifactsDir);
  const authorization = assertTask2BAuthorization({
    projectRef: input.projectRef,
    denyProjectRef: input.denyProjectRef,
    dryRun: input.dryRun,
    apply: input.apply,
    verify: input.verify,
    supabaseUrl: input.envSupabaseUrl,
  });
  const databaseAdapter = dependencies?.databaseAdapter ?? createLiveTask2B1DatabaseAdapter();
  const now = new Date().toISOString();

  let providerSnapshotPath = input.providerSnapshotPath ? path.resolve(input.providerSnapshotPath) : null;
  let providerSnapshot: Task2BProviderSnapshot;
  if (authorization.mode === "dry_run") {
    const providerFetcher = dependencies?.providerFetcher ?? fetchApiFootballFixturesByLeague;
    const providerFixtures = await providerFetcher({
      leagueId: TASK2B_PROVIDER_LEAGUE_ID,
      season: TASK2B_PROVIDER_SEASON,
      from: TASK2B_WORLD_CUP_DATE_RANGE.from,
      to: TASK2B_WORLD_CUP_DATE_RANGE.to,
    });
    providerSnapshot = sanitizeProviderSnapshot({
      fixtures: providerFixtures,
      acquiredAt: now,
      from: TASK2B_WORLD_CUP_DATE_RANGE.from,
      to: TASK2B_WORLD_CUP_DATE_RANGE.to,
    });
    providerSnapshotPath = buildProviderSnapshotPath(input.artifactsDir);
    writeJsonFile(providerSnapshotPath, providerSnapshot);
  } else {
    if (!providerSnapshotPath) {
      throw new Error("Task 2B.1 apply/verify requires --provider-snapshot or a reviewed plan that references one.");
    }
    providerSnapshot = readJsonFile<Task2BProviderSnapshot>(providerSnapshotPath);
  }

  const providerSnapshotSha256 = sha256File(providerSnapshotPath!);
  const stageSnapshot = await databaseAdapter.readStageSnapshot();
  const currentPlan = planTask2B1FromSnapshot({
    authorization,
    stageSnapshot,
    providerSnapshot,
    providerSnapshotPath: providerSnapshotPath!,
    providerSnapshotSha256,
    selectionInput: input.selection,
    now,
  });

  let applyResult: Task2B1ApplyResult | null = null;
  let verifyResult: Task2B1VerifyResult | null = null;
  if (authorization.mode !== "dry_run") {
    if (!input.reviewedPlanPath || !input.reviewedStablePlanSha256) {
      throw new Error("Task 2B.1 apply/verify requires --reviewed-plan and --reviewed-stable-plan-sha256.");
    }
    const reviewedPlan = readJsonFile<Task2B1Plan>(path.resolve(input.reviewedPlanPath));
    const reviewedSnapshotPath = path.resolve(input.providerSnapshotPath ?? reviewedPlan.providerSnapshotPath);
    const reviewedSnapshotSha256 = sha256File(reviewedSnapshotPath);
    if (authorization.mode === "apply") {
      applyResult = await applyTask2B1Plan({
        reviewedPlan,
        currentPlan,
        reviewedStablePlanSha256: input.reviewedStablePlanSha256,
        reviewedSnapshotSha256,
        authorization,
        databaseAdapter,
        now,
      });
    } else {
      verifyResult = await verifyTask2B1PostState({
        reviewedPlan,
        currentPlan,
        reviewedStablePlanSha256: input.reviewedStablePlanSha256,
        reviewedSnapshotSha256,
        authorization,
        databaseAdapter,
        stageSnapshot,
      });
      if (!verifyResult.verificationPassed) {
        throw new Error("Task 2B.1 verify found unsatisfied reviewed actions in the current post-apply state.");
      }
    }
  }

  const artifactPath = buildPlanArtifactPath(input.artifactsDir, authorization.mode);
  const artifactPayload =
    authorization.mode === "dry_run"
      ? currentPlan
      : authorization.mode === "apply"
        ? {
            ...currentPlan,
            applySummary: applyResult
              ? {
                  attemptedActionCount: currentPlan.safeActions.length,
                  completedActionCount: applyResult.completedActionKeys.length,
                  failedActionKey: applyResult.failedActionKey,
                  ambiguousActionKey: applyResult.ambiguousActionKey,
                  completedActionKeys: applyResult.completedActionKeys,
                }
              : null,
          }
        : {
            ...currentPlan,
            verificationSummary: verifyResult
              ? {
                  reviewedPlanPath: path.resolve(input.reviewedPlanPath!),
                  reviewedStablePlanSha256: input.reviewedStablePlanSha256!,
                  providerSnapshotPath: path.resolve(input.providerSnapshotPath ?? providerSnapshotPath!),
                  providerSnapshotSha256,
                  verifiedAt: now,
                  reviewedActionCount: verifyResult.reviewedActionCount,
                  satisfiedActionCount: verifyResult.satisfiedActionCount,
                  missingActionCount: verifyResult.missingActionCount,
                  mismatchedActionCount: verifyResult.mismatchedActionCount,
                  ambiguousActionCount: verifyResult.ambiguousActionCount,
                  pendingReviewedActionCount: verifyResult.pendingReviewedActionCount,
                  satisfiedActionKeys: verifyResult.satisfiedActionKeys,
                  missingActionKeys: verifyResult.missingActionKeys,
                  ambiguousActionKeys: verifyResult.ambiguousActionKeys,
                  pendingReviewedActionKeys: verifyResult.pendingReviewedActionKeys,
                  mismatches: verifyResult.mismatches,
                  verificationPassed: verifyResult.verificationPassed,
                }
              : null,
          };
  writeJsonFile(artifactPath, artifactPayload);
  return {
    plan: currentPlan,
    artifactPath,
    providerSnapshotPath: providerSnapshotPath!,
    providerSnapshotSha256,
    applyResult,
    verifyResult,
  };
}
