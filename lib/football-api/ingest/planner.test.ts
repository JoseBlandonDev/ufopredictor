import { describe, expect, it } from "vitest";

import type { ProviderFixture } from "@/lib/football-api/api-football-types";
import type { TargetCompetition } from "@/lib/football-api/target-competitions";
import {
  buildApiFootballFixtureExternalId,
  buildApiFootballLeagueExternalId,
  buildApiFootballTeamExternalId,
  buildApiFootballVenueExternalId,
} from "./external-ids";
import { planControlledFixtureIngestDryRun } from "./planner";
import { buildCompetitionSlug, buildMatchSlug, toSlugPart } from "./slug";
import { mapProviderFixtureStatus } from "./status";

const friendliesTarget: TargetCompetition = {
  key: "friendlies",
  provider: "api-football",
  leagueId: 10,
  season: 2026,
  useCase: "beta_pre_world_cup",
};

function buildFixture(overrides: Partial<ProviderFixture> = {}): ProviderFixture {
  return {
    provider: "api-football",
    providerFixtureId: 12345,
    kickoffAt: "2026-06-01T20:00:00Z",
    timezone: "UTC",
    status: "scheduled",
    statusShort: "NS",
    elapsedMinutes: null,
    competition: {
      providerCompetitionId: 10,
      name: "Friendlies",
      country: null,
      season: 2026,
      round: null,
    },
    homeTeam: {
      providerTeamId: 100,
      name: "Colombia",
      winner: null,
    },
    awayTeam: {
      providerTeamId: 200,
      name: "Portugal",
      winner: null,
    },
    goals: {
      home: null,
      away: null,
    },
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: null, away: null },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
    ...overrides,
  };
}

describe("api-football ingest dry-run helpers", () => {
  it("builds namespaced external ids", () => {
    expect(buildApiFootballLeagueExternalId(10)).toBe("api-football:league:10");
    expect(buildApiFootballTeamExternalId(200)).toBe("api-football:team:200");
    expect(buildApiFootballVenueExternalId(300)).toBe("api-football:venue:300");
    expect(buildApiFootballFixtureExternalId(400)).toBe("api-football:fixture:400");
  });

  it("maps provider statuses to dry-run persistence statuses", () => {
    expect(mapProviderFixtureStatus("scheduled")).toEqual({
      action: "persist",
      status: "scheduled",
    });
    expect(mapProviderFixtureStatus("halftime")).toEqual({
      action: "persist",
      status: "live",
    });
    expect(mapProviderFixtureStatus("abandoned")).toEqual({
      action: "persist",
      status: "cancelled",
    });
    expect(mapProviderFixtureStatus("unknown")).toEqual({
      action: "skip",
      reason: "unknown_status",
    });
  });

  it("builds product-safe slug parts and match slugs", () => {
    expect(toSlugPart("México U23")).toBe("mexico-u23");

    const competitionSlug = buildCompetitionSlug({
      providerCompetitionId: 239,
      name: "Primera A",
      country: "Colombia",
      season: 2026,
      round: null,
    });
    expect(competitionSlug).toBe("colombia-primera-a-2026");

    expect(
      buildMatchSlug({
        competitionSlug,
        homeTeamName: "Atlético Nacional",
        awayTeamName: "Millonarios",
        kickoffAt: "2026-06-10T23:00:00Z",
      }),
    ).toBe("colombia-primera-a-2026-atletico-nacional-vs-millonarios-2026-06-10");
  });

  it("excludes youth friendlies by default", () => {
    const report = planControlledFixtureIngestDryRun(
      [
        buildFixture({
          homeTeam: {
            providerTeamId: 100,
            name: "Colombia U20",
            winner: null,
          },
        }),
      ],
      friendliesTarget,
    );

    expect(report.fixturesPlanned).toBe(0);
    expect(report.skippedYouthFriendly).toBe(1);
  });

  it("quarantines unknown status instead of planning persistence", () => {
    const report = planControlledFixtureIngestDryRun(
      [
        buildFixture({
          status: "unknown",
          statusShort: "XYZ",
        }),
      ],
      friendliesTarget,
    );

    expect(report.fixturesPlanned).toBe(0);
    expect(report.skippedUnknownStatus).toBe(1);
    expect(report.warnings[0]).toContain("unknown");
  });

  it("previews pending_review match results only for finished fixtures", () => {
    const report = planControlledFixtureIngestDryRun(
      [
        buildFixture({
          providerFixtureId: 1,
          status: "finished",
          statusShort: "FT",
          goals: { home: 2, away: 1 },
        }),
        buildFixture({
          providerFixtureId: 2,
          status: "scheduled",
          statusShort: "NS",
        }),
      ],
      friendliesTarget,
    );

    expect(report.wouldCreateOrUpdateMatches).toHaveLength(2);
    expect(report.wouldPrepareMatchResultsPendingReview).toHaveLength(1);
    expect(report.wouldPrepareMatchResultsPendingReview[0]).toMatchObject({
      fixtureId: 1,
      verificationStatus: "pending_review",
      intakeSource: "api_football",
      homeGoals: 2,
      awayGoals: 1,
    });
  });
});
