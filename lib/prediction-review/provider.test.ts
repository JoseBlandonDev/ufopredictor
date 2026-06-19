import { describe, expect, it } from "vitest";
import type { ProviderFixture } from "../football-api/api-football-types";
import type { PredictionReviewProviderState } from "./types";
import { canReviewProviderFixture, validatePredictionReviewProviderFixture } from "./provider";

function buildFixture(overrides?: Partial<ProviderFixture>): ProviderFixture {
  return {
    provider: "api-football",
    providerFixtureId: 1540356,
    kickoffAt: "2026-06-19T22:00:00Z",
    timezone: "UTC",
    status: "scheduled",
    statusShort: "NS",
    elapsedMinutes: null,
    competition: { providerCompetitionId: 1, name: "World Cup", country: null, season: 2026, round: "GS" },
    homeTeam: { providerTeamId: 1, name: "USA", winner: null },
    awayTeam: { providerTeamId: 2, name: "Türkiye", winner: null },
    goals: { home: null, away: null },
    ...overrides,
  };
}

function buildAvailableState(fixtureOverrides?: Partial<ProviderFixture>) {
  return {
    status: "available",
    fixture: buildFixture(fixtureOverrides),
  } as PredictionReviewProviderState;
}

describe("prediction review provider guard", () => {
  it("allows scheduled pre-kickoff fixtures", () => {
    expect(
      canReviewProviderFixture(buildAvailableState(), new Date("2026-06-19T20:00:00Z")).allowed,
    ).toBe(true);
  });

  it("blocks live fixtures, finished fixtures, kickoff reached, and passed scheduled kickoffs", () => {
    expect(
      canReviewProviderFixture(
        buildAvailableState({
          status: "live",
          statusShort: "1H",
          elapsedMinutes: 31,
        }),
        new Date("2026-06-19T20:30:00Z"),
      ).allowed,
    ).toBe(false);

    expect(
      canReviewProviderFixture(
        buildAvailableState({
          status: "finished",
          statusShort: "FT",
          goals: { home: 2, away: 1 },
        }),
        new Date("2026-06-19T23:30:00Z"),
      ).allowed,
    ).toBe(false);

    expect(
      canReviewProviderFixture(buildAvailableState(), new Date("2026-06-19T22:00:00Z")).allowed,
    ).toBe(false);

    expect(
      canReviewProviderFixture(
        buildAvailableState({
          status: "scheduled",
          statusShort: "PST",
        }),
        new Date("2026-06-19T22:01:00Z"),
      ).allowed,
    ).toBe(false);
  });

  it("blocks provider unavailable states", () => {
    expect(
      canReviewProviderFixture(
        { status: "unavailable", reason: "Provider offline." },
        new Date("2026-06-19T20:00:00Z"),
      ).allowed,
    ).toBe(false);
  });
});

describe("validatePredictionReviewProviderFixture", () => {
  const args = {
    externalId: "api-football:fixture:1540356",
    expectedKickoffAt: "2026-06-19T22:00:00Z",
    expectedHomeTeamName: "United States",
    expectedAwayTeamName: "Turkey",
  };

  it("accepts known provider aliases for the same stored fixture identity", () => {
    expect(
      validatePredictionReviewProviderFixture(
        args,
        buildAvailableState(),
        new Date("2026-06-19T20:00:00Z"),
      ),
    ).toEqual({ allowed: true, reason: null });
  });

  it("fails closed on fixture id mismatch, kickoff mismatch, and home-away mismatch", () => {
    expect(
      validatePredictionReviewProviderFixture(
        args,
        buildAvailableState({
          providerFixtureId: 9999999,
        }),
        new Date("2026-06-19T20:00:00Z"),
      ).allowed,
    ).toBe(false);

    expect(
      validatePredictionReviewProviderFixture(
        args,
        buildAvailableState({
          kickoffAt: "2026-06-20T22:00:00Z",
        }),
        new Date("2026-06-19T20:00:00Z"),
      ).allowed,
    ).toBe(false);

    expect(
      validatePredictionReviewProviderFixture(
        args,
        buildAvailableState({
          homeTeam: { providerTeamId: 1, name: "Mexico", winner: null },
          awayTeam: { providerTeamId: 2, name: "South Korea", winner: null },
        }),
        new Date("2026-06-19T20:00:00Z"),
      ).allowed,
    ).toBe(false);
  });

  it("fails closed when provider returns a non-actionable fixture status", () => {
    expect(
      validatePredictionReviewProviderFixture(
        args,
        buildAvailableState({
          status: "postponed",
          statusShort: "PST",
        }),
        new Date("2026-06-19T23:00:00Z"),
      ).allowed,
    ).toBe(false);
  });
});
