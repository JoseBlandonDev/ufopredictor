import type { ProviderFixture } from "@/lib/football-api/api-football-types";
import type { TorneoUfoExport } from "@/lib/supabase/torneo-export-core";
import { WORLD_CUP_2026_FIXTURES } from "./canonical-fixtures";

export const WORLD_CUP_GROUP_STAGE_2_ROUND = "Group Stage - 2" as const;
export const SIGNAL_V2_SNAPSHOT_ID = "2026-06-19" as const;
export const SIGNAL_V2_SNAPSHOT_START_ISO = "2026-06-19T00:00:00.000Z" as const;

export type Matchday2PredictionSummary = {
  id: string;
  createdAt: string;
  marketSelections: Array<{ market: string; selection: string }>;
  topScorelineCount: number;
};

export type Matchday2FixtureAction =
  | "freeze_keep_public"
  | "block_frozen_without_public"
  | "reuse_current_public_v2"
  | "publish_from_internal_v2"
  | "generate_new_v2_public";

export function getWorldCup2026SecondMatchdayFixtures() {
  return WORLD_CUP_2026_FIXTURES.filter(
    (fixture) => fixture.matchNumber >= 25 && fixture.matchNumber <= 48,
  );
}

export function getWorldCup2026SecondMatchdayWindow() {
  const fixtures = getWorldCup2026SecondMatchdayFixtures();
  const dates = fixtures.map((fixture) => fixture.kickoffAt.slice(0, 10)).sort();
  const from = dates[0];
  const to = dates[dates.length - 1];

  if (!from || !to) {
    throw new Error("World Cup 2026 second-matchday window is unavailable.");
  }

  return { from, to };
}

export function filterProviderFixturesToSecondMatchday(fixtures: ProviderFixture[]) {
  return fixtures
    .filter((fixture) => fixture.competition.round === WORLD_CUP_GROUP_STAGE_2_ROUND)
    .sort((left, right) => left.kickoffAt.localeCompare(right.kickoffAt));
}

export function assertUniqueFixtureIds(fixtures: Pick<ProviderFixture, "providerFixtureId">[]) {
  const uniqueIds = new Set(fixtures.map((fixture) => fixture.providerFixtureId));
  if (uniqueIds.size !== fixtures.length) {
    throw new Error("API-Football returned duplicate fixture IDs for Group Stage - 2.");
  }
}

export function isFrozenFixture(args: {
  kickoffAt: string;
  providerStatus: ProviderFixture["status"];
  now?: Date;
}) {
  if (args.providerStatus === "finished" || args.providerStatus === "live" || args.providerStatus === "halftime") {
    return true;
  }

  const kickoffMs = Date.parse(args.kickoffAt);
  const nowMs = (args.now ?? new Date()).getTime();
  return Number.isFinite(kickoffMs) && kickoffMs <= nowMs;
}

export function isPredictionV2Current(createdAt: string | null | undefined) {
  if (!createdAt) {
    return false;
  }

  const createdAtMs = Date.parse(createdAt);
  return Number.isFinite(createdAtMs) && createdAtMs >= Date.parse(SIGNAL_V2_SNAPSHOT_START_ISO);
}

export function hasCompletePredictionBundle(
  prediction: Matchday2PredictionSummary | null | undefined,
) {
  if (!prediction || prediction.topScorelineCount <= 0) {
    return false;
  }

  const selectionKeys = new Set(
    prediction.marketSelections.map((selection) => `${selection.market}:${selection.selection}`),
  );

  return (
    selectionKeys.has("match_winner:home") &&
    selectionKeys.has("match_winner:draw") &&
    selectionKeys.has("match_winner:away") &&
    selectionKeys.has("btts:yes") &&
    selectionKeys.has("btts:no") &&
    selectionKeys.has("over_2_5:over") &&
    selectionKeys.has("over_2_5:under")
  );
}

export function decideMatchday2FixtureAction(args: {
  kickoffAt: string;
  providerStatus: ProviderFixture["status"];
  latestInternalPrediction: Matchday2PredictionSummary | null;
  latestPublicPrediction: Matchday2PredictionSummary | null;
  now?: Date;
}): Matchday2FixtureAction {
  const frozen = isFrozenFixture({
    kickoffAt: args.kickoffAt,
    providerStatus: args.providerStatus,
    now: args.now,
  });

  if (frozen) {
    return args.latestPublicPrediction ? "freeze_keep_public" : "block_frozen_without_public";
  }

  if (
    hasCompletePredictionBundle(args.latestPublicPrediction) &&
    isPredictionV2Current(args.latestPublicPrediction?.createdAt)
  ) {
    return "reuse_current_public_v2";
  }

  if (
    hasCompletePredictionBundle(args.latestInternalPrediction) &&
    isPredictionV2Current(args.latestInternalPrediction?.createdAt)
  ) {
    return "publish_from_internal_v2";
  }

  return "generate_new_v2_public";
}

export function validateFinalMatchday2Export(args: {
  payload: TorneoUfoExport;
  expectedExternalIds: string[];
}) {
  if (args.payload.schemaVersion !== "torneo-ufo-export-v1") {
    throw new Error("Final export schemaVersion must remain torneo-ufo-export-v1.");
  }

  const expectedIds = [...args.expectedExternalIds].sort();
  const actualIds = args.payload.fixtures.map((fixture) => fixture.externalId).sort();

  if (actualIds.length !== expectedIds.length) {
    throw new Error(`Final export fixture count mismatch. Expected ${expectedIds.length}, received ${actualIds.length}.`);
  }

  const uniqueIds = new Set(actualIds);
  if (uniqueIds.size !== actualIds.length) {
    throw new Error("Final export contains duplicate fixture IDs.");
  }

  if (expectedIds.some((externalId, index) => externalId !== actualIds[index])) {
    throw new Error("Final export fixture IDs do not match the exact Group Stage - 2 provider inventory.");
  }

  for (const fixture of args.payload.fixtures) {
    if (fixture.stage !== WORLD_CUP_GROUP_STAGE_2_ROUND) {
      throw new Error(`Final export leaked a non-Group Stage - 2 fixture: ${fixture.externalId}.`);
    }
  }
}
