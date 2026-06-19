import { describe, expect, it } from "vitest";
import type { TorneoUfoExport } from "@/lib/supabase/torneo-export-core";
import {
  SIGNAL_V2_SNAPSHOT_START_ISO,
  WORLD_CUP_GROUP_STAGE_2_ROUND,
  assertUniqueFixtureIds,
  decideMatchday2FixtureAction,
  filterProviderFixturesToSecondMatchday,
  getWorldCup2026SecondMatchdayFixtures,
  getWorldCup2026SecondMatchdayWindow,
  hasCompletePredictionBundle,
  isFrozenFixture,
  isPredictionV2Current,
  validateFinalMatchday2Export,
} from "./matchday2-ops";

describe("world cup 2026 matchday2 ops helpers", () => {
  it("filters provider fixtures to the exact Group Stage - 2 round", () => {
    const fixtures = [
      {
        providerFixtureId: 1,
        kickoffAt: "2026-06-18T16:00:00Z",
        competition: { round: WORLD_CUP_GROUP_STAGE_2_ROUND },
      },
      {
        providerFixtureId: 2,
        kickoffAt: "2026-06-18T19:00:00Z",
        competition: { round: "Group Stage - 1" },
      },
      {
        providerFixtureId: 3,
        kickoffAt: "2026-06-18T22:00:00Z",
        competition: { round: WORLD_CUP_GROUP_STAGE_2_ROUND },
      },
    ] as const;

    expect(filterProviderFixturesToSecondMatchday(fixtures as never)).toMatchObject([
      { providerFixtureId: 1 },
      { providerFixtureId: 3 },
    ]);
  });

  it("returns the canonical second-matchday 24-fixture window", () => {
    const fixtures = getWorldCup2026SecondMatchdayFixtures();
    expect(fixtures).toHaveLength(24);
    expect(fixtures[0]?.matchNumber).toBe(25);
    expect(fixtures.at(-1)?.matchNumber).toBe(48);
    expect(getWorldCup2026SecondMatchdayWindow()).toEqual({
      from: "2026-06-18",
      to: "2026-06-24",
    });
  });

  it("rejects duplicate provider fixture ids", () => {
    expect(() =>
      assertUniqueFixtureIds([
        { providerFixtureId: 10 },
        { providerFixtureId: 10 },
      ]),
    ).toThrow(/duplicate fixture IDs/i);
  });

  it("detects frozen fixtures from status and kickoff time", () => {
    expect(
      isFrozenFixture({
        kickoffAt: "2026-06-20T16:00:00Z",
        providerStatus: "live",
        now: new Date("2026-06-20T15:00:00Z"),
      }),
    ).toBe(true);

    expect(
      isFrozenFixture({
        kickoffAt: "2026-06-20T16:00:00Z",
        providerStatus: "scheduled",
        now: new Date("2026-06-20T16:00:01Z"),
      }),
    ).toBe(true);

    expect(
      isFrozenFixture({
        kickoffAt: "2026-06-20T16:00:00Z",
        providerStatus: "scheduled",
        now: new Date("2026-06-20T15:59:59Z"),
      }),
    ).toBe(false);
  });

  it("detects V2-current provenance using the signal snapshot threshold", () => {
    expect(isPredictionV2Current(SIGNAL_V2_SNAPSHOT_START_ISO)).toBe(true);
    expect(isPredictionV2Current("2026-06-18T23:59:59.999Z")).toBe(false);
    expect(isPredictionV2Current(null)).toBe(false);
  });

  it("requires a complete market bundle before reusing a prediction", () => {
    expect(
      hasCompletePredictionBundle({
        id: "prediction-1",
        createdAt: SIGNAL_V2_SNAPSHOT_START_ISO,
        topScorelineCount: 3,
        marketSelections: [
          { market: "match_winner", selection: "home" },
          { market: "match_winner", selection: "draw" },
          { market: "match_winner", selection: "away" },
          { market: "btts", selection: "yes" },
          { market: "btts", selection: "no" },
          { market: "over_2_5", selection: "over" },
          { market: "over_2_5", selection: "under" },
        ],
      }),
    ).toBe(true);

    expect(
      hasCompletePredictionBundle({
        id: "prediction-2",
        createdAt: SIGNAL_V2_SNAPSHOT_START_ISO,
        topScorelineCount: 0,
        marketSelections: [],
      }),
    ).toBe(false);
  });

  it("blocks frozen fixtures without public predictions and reuses V2-current public predictions idempotently", () => {
    expect(
      decideMatchday2FixtureAction({
        kickoffAt: "2026-06-20T16:00:00Z",
        providerStatus: "finished",
        latestInternalPrediction: null,
        latestPublicPrediction: null,
      }),
    ).toBe("block_frozen_without_public");

    const currentPublicPrediction = {
      id: "public-1",
      createdAt: "2026-06-20T12:00:00Z",
      topScorelineCount: 3,
      marketSelections: [
        { market: "match_winner", selection: "home" },
        { market: "match_winner", selection: "draw" },
        { market: "match_winner", selection: "away" },
        { market: "btts", selection: "yes" },
        { market: "btts", selection: "no" },
        { market: "over_2_5", selection: "over" },
        { market: "over_2_5", selection: "under" },
      ],
    };

    expect(
      decideMatchday2FixtureAction({
        kickoffAt: "2026-06-22T16:00:00Z",
        providerStatus: "scheduled",
        latestInternalPrediction: null,
        latestPublicPrediction: currentPublicPrediction,
        now: new Date("2026-06-21T16:00:00Z"),
      }),
    ).toBe("reuse_current_public_v2");
  });

  it("publishes from internal V2 when public provenance is stale and otherwise regenerates", () => {
    const internalPrediction = {
      id: "internal-1",
      createdAt: "2026-06-20T08:00:00Z",
      topScorelineCount: 3,
      marketSelections: [
        { market: "match_winner", selection: "home" },
        { market: "match_winner", selection: "draw" },
        { market: "match_winner", selection: "away" },
        { market: "btts", selection: "yes" },
        { market: "btts", selection: "no" },
        { market: "over_2_5", selection: "over" },
        { market: "over_2_5", selection: "under" },
      ],
    };

    expect(
      decideMatchday2FixtureAction({
        kickoffAt: "2026-06-22T16:00:00Z",
        providerStatus: "scheduled",
        latestInternalPrediction: internalPrediction,
        latestPublicPrediction: {
          ...internalPrediction,
          id: "public-old",
          createdAt: "2026-06-18T08:00:00Z",
        },
        now: new Date("2026-06-21T16:00:00Z"),
      }),
    ).toBe("publish_from_internal_v2");

    expect(
      decideMatchday2FixtureAction({
        kickoffAt: "2026-06-22T16:00:00Z",
        providerStatus: "scheduled",
        latestInternalPrediction: {
          ...internalPrediction,
          createdAt: "2026-06-18T08:00:00Z",
        },
        latestPublicPrediction: null,
        now: new Date("2026-06-21T16:00:00Z"),
      }),
    ).toBe("generate_new_v2_public");
  });

  it("validates the final exact 24-fixture export schema and fixture set", () => {
    const payload = {
      schemaVersion: "torneo-ufo-export-v1",
      generatedAt: "2026-06-19T00:00:00Z",
      source: "ufo_predictor",
      sourceAppUrl: "https://ufopredictor.com",
      competition: "world-cup-2026",
      range: { from: "2026-06-18", to: "2026-06-24" },
      displayGuidance: {
        defaultTeaser: "show_1x2_probabilities_and_link",
        exactScoreRecommendedReveal: "after_user_pick_or_pick_deadline",
        topScorelinesRecommendedReveal: "after_user_pick_or_pick_deadline",
        postMatchUse: "comparison_and_learning",
      },
      fixtures: [
        {
          externalId: "api-football:fixture:1",
          fixtureId: 1,
          slug: "fixture-1",
          ufoUrl: "https://ufopredictor.com/matches/fixture-1",
          kickoffAt: "2026-06-18T16:00:00Z",
          stage: WORLD_CUP_GROUP_STAGE_2_ROUND,
          status: "scheduled",
          homeTeam: "A",
          awayTeam: "B",
          prediction: {
            homeWinProbability: 0.4,
            drawProbability: 0.3,
            awayWinProbability: 0.3,
            confidenceScore: 50,
            riskLevel: "medium",
            mostLikelyScore: "1-0",
            expectedGoals: { home: 1.2, away: 0.9 },
            topScorelines: [{ score: "1-0", probability: 0.15 }],
            bothTeamsToScore: { yesProbability: 0.44, noProbability: 0.56 },
            totalGoals25: { overProbability: 0.47, underProbability: 0.53 },
          },
        },
      ],
    } satisfies TorneoUfoExport;

    expect(() =>
      validateFinalMatchday2Export({
        payload,
        expectedExternalIds: ["api-football:fixture:1"],
      }),
    ).not.toThrow();
  });
});
