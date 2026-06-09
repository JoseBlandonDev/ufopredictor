import { describe, expect, it } from "vitest";

import type { ProviderFixture } from "@/lib/football-api/api-football-types";
import type { TargetCompetition } from "@/lib/football-api/target-competitions";
import {
  assertSingleFriendlyApplyPlan,
  buildApiFootballIngestSourceNote,
  decideApplyFixtureAction,
  type MatchResultWritePlan,
  planControlledFixtureWrite,
  resolveApplyConfig,
} from "./apply";

const colombiaTarget: TargetCompetition = {
  key: "colombia-primera-a",
  provider: "api-football",
  leagueId: 239,
  season: 2026,
  useCase: "beta_local",
};

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
    providerFixtureId: 9001,
    kickoffAt: "2026-06-01T20:00:00Z",
    timezone: "UTC",
    status: "scheduled",
    statusShort: "NS",
    elapsedMinutes: null,
    competition: {
      providerCompetitionId: 239,
      name: "Primera A",
      country: "Colombia",
      season: 2026,
      round: "Apertura - Jornada 1",
    },
    homeTeam: {
      providerTeamId: 1,
      name: "Atletico Nacional",
      winner: null,
    },
    awayTeam: {
      providerTeamId: 2,
      name: "Millonarios",
      winner: null,
    },
    goals: {
      home: null,
      away: null,
    },
    ...overrides,
  };
}

describe("controlled apply guards", () => {
  it("returns null when apply is false", () => {
    expect(
      resolveApplyConfig({
        apply: false,
        competition: "colombia-primera-a",
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 5,
      }),
    ).toBeNull();
  });

  it("rejects all apply", () => {
    expect(() =>
      resolveApplyConfig({
        apply: true,
        competition: "all",
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 5,
      }),
    ).toThrow(/competition all/i);
  });

  it("rejects unsupported apply competitions", () => {
    expect(() =>
      resolveApplyConfig({
        apply: true,
        competition: "world-cup",
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 5,
      }),
    ).toThrow(/only for --competition colombia-primera-a/i);

    expect(() =>
      resolveApplyConfig({
        apply: true,
        competition: "copa-colombia",
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 5,
      }),
    ).toThrow(/only for --competition colombia-primera-a/i);
  });

  it("requires from/to/limit for apply", () => {
    expect(() =>
      resolveApplyConfig({
        apply: true,
        competition: "colombia-primera-a",
        from: "2026-05-25",
        to: "2026-06-10",
      }),
    ).toThrow(/requires explicit --from, --to, and --limit/i);
  });

  it("rejects friendlies apply without explicit fixtureId", () => {
    expect(() =>
      resolveApplyConfig({
        apply: true,
        competition: "friendlies",
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      }),
    ).toThrow(/friendlies apply requires explicit --fixtureId/i);
  });

  it("rejects friendlies apply with limit greater than one", () => {
    expect(() =>
      resolveApplyConfig({
        apply: true,
        competition: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 2,
      }),
    ).toThrow(/friendlies apply requires explicit --fixtureId, --from, --to, and --limit 1/i);
  });

  it("allows only narrow single-fixture friendlies apply config", () => {
    expect(
      resolveApplyConfig({
        apply: true,
        competition: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      }),
    ).toEqual({
      competitionKey: "friendlies",
      fixtureId: 1540356,
      from: "2026-06-09",
      to: "2026-06-09",
      limit: 1,
    });
  });
});

describe("controlled apply rules", () => {
  it("skips unknown status for apply", () => {
    expect(
      decideApplyFixtureAction(
        buildFixture({ status: "unknown", statusShort: "TBD" }),
        colombiaTarget,
      ),
    ).toEqual({ action: "skip", reason: "unknown_status" });
  });

  it("skips cancelled/postponed/abandoned for apply", () => {
    expect(
      decideApplyFixtureAction(buildFixture({ status: "cancelled" }), colombiaTarget),
    ).toEqual({ action: "skip", reason: "cancelled_status" });
    expect(
      decideApplyFixtureAction(buildFixture({ status: "postponed" }), colombiaTarget),
    ).toEqual({ action: "skip", reason: "postponed_status" });
    expect(
      decideApplyFixtureAction(buildFixture({ status: "abandoned" }), colombiaTarget),
    ).toEqual({ action: "skip", reason: "abandoned_status" });
  });

  it("allows finished exact friendly with one pending_review match_result", () => {
    const finishedPlan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1540356,
          kickoffAt: "2026-06-09T02:00:00Z",
          competition: {
            providerCompetitionId: 10,
            name: "Friendlies",
            country: null,
            season: 2026,
            round: null,
          },
          status: "finished",
          statusShort: "FT",
          goals: { home: 1, away: 0 },
        }),
      ],
      friendliesTarget,
      {
        competitionKey: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      },
    );

    expect(finishedPlan.matchPlans[0]).toMatchObject({
      fixtureId: 1540356,
      status: "finished",
      accessScope: "admin_only",
      intakeSource: "api_football",
    });
    expect(finishedPlan.matchResultPlans).toHaveLength(1);
    expect(finishedPlan.matchResultPlans[0]).toEqual({
      action: "create",
      matchExternalId: "api-football:fixture:1540356",
      homeGoals: 1,
      awayGoals: 0,
      verificationStatus: "pending_review",
      intakeSource: "api_football",
      sourceNote: finishedPlan.sourceNote,
    });
    expect(() =>
      assertSingleFriendlyApplyPlan(finishedPlan, friendliesTarget, {
        competitionKey: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      }),
    ).not.toThrow();
  });

  it("rejects live friendlies for narrow apply planning", () => {
    const livePlan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1540356,
          kickoffAt: "2026-06-09T02:00:00Z",
          competition: {
            providerCompetitionId: 10,
            name: "Friendlies",
            country: null,
            season: 2026,
            round: null,
          },
          status: "live",
          statusShort: "1H",
        }),
      ],
      friendliesTarget,
      {
        competitionKey: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      },
    );

    expect(() =>
      assertSingleFriendlyApplyPlan(livePlan, friendliesTarget, {
        competitionKey: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      }),
    ).toThrow(/scheduled or finished exact fixture/i);
  });

  it("allows scheduled friendly with zero match results through narrow apply plan guard", () => {
    const plan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1540356,
          kickoffAt: "2026-06-09T02:00:00Z",
          competition: {
            providerCompetitionId: 10,
            name: "Friendlies",
            country: null,
            season: 2026,
            round: null,
          },
          homeTeam: {
            providerTeamId: 500,
            name: "Peru",
            winner: null,
          },
          awayTeam: {
            providerTeamId: 600,
            name: "Spain",
            winner: null,
          },
        }),
      ],
      friendliesTarget,
      {
        competitionKey: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      },
    );

    expect(plan.matchResultPlans).toHaveLength(0);
    expect(plan.matchPlans[0]).toMatchObject({
      fixtureId: 1540356,
      accessScope: "admin_only",
      intakeSource: "api_football",
      status: "scheduled",
    });
    expect(() =>
      assertSingleFriendlyApplyPlan(plan, friendliesTarget, {
        competitionKey: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      }),
    ).not.toThrow();
  });

  it("rejects finished exact fixture when more than one result is planned", () => {
    const finishedPlan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1540356,
          kickoffAt: "2026-06-09T02:00:00Z",
          competition: {
            providerCompetitionId: 10,
            name: "Friendlies",
            country: null,
            season: 2026,
            round: null,
          },
          homeTeam: {
            providerTeamId: 500,
            name: "Peru",
            winner: true,
          },
          awayTeam: {
            providerTeamId: 600,
            name: "Spain",
            winner: false,
          },
          status: "finished",
          statusShort: "FT",
          goals: { home: 2, away: 1 },
        }),
      ],
      friendliesTarget,
      {
        competitionKey: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      },
    );

    finishedPlan.matchResultPlans.push({
      action: "create",
      matchExternalId: "api-football:fixture:1540356",
      homeGoals: 3,
      awayGoals: 1,
      verificationStatus: "pending_review",
      intakeSource: "api_football",
      sourceNote: finishedPlan.sourceNote,
    });

    expect(() =>
      assertSingleFriendlyApplyPlan(finishedPlan, friendliesTarget, {
        competitionKey: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      }),
    ).toThrow(/exactly one planned match_result/i);
  });

  it("rejects finished exact fixture when result is not pending_review", () => {
    const finishedPlan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1540356,
          kickoffAt: "2026-06-09T02:00:00Z",
          competition: {
            providerCompetitionId: 10,
            name: "Friendlies",
            country: null,
            season: 2026,
            round: null,
          },
          status: "finished",
          statusShort: "FT",
          goals: { home: 1, away: 0 },
        }),
      ],
      friendliesTarget,
      {
        competitionKey: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      },
    );

    const invalidResultPlan: MatchResultWritePlan = {
      action: "create",
      matchExternalId: "api-football:fixture:1540356",
      homeGoals: 1,
      awayGoals: 0,
      verificationStatus: "verified" as never,
      intakeSource: "api_football",
      sourceNote: finishedPlan.sourceNote,
    };
    finishedPlan.matchResultPlans[0] = invalidResultPlan;

    expect(() =>
      assertSingleFriendlyApplyPlan(finishedPlan, friendliesTarget, {
        competitionKey: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      }),
    ).toThrow(/pending_review verification status/i);
  });

  it("rejects finished exact fixture when result is not api_football", () => {
    const finishedPlan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1540356,
          kickoffAt: "2026-06-09T02:00:00Z",
          competition: {
            providerCompetitionId: 10,
            name: "Friendlies",
            country: null,
            season: 2026,
            round: null,
          },
          status: "finished",
          statusShort: "FT",
          goals: { home: 1, away: 0 },
        }),
      ],
      friendliesTarget,
      {
        competitionKey: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      },
    );

    const invalidResultPlan: MatchResultWritePlan = {
      action: "create",
      matchExternalId: "api-football:fixture:1540356",
      homeGoals: 1,
      awayGoals: 0,
      verificationStatus: "pending_review",
      intakeSource: "manual" as never,
      sourceNote: finishedPlan.sourceNote,
    };
    finishedPlan.matchResultPlans[0] = invalidResultPlan;

    expect(() =>
      assertSingleFriendlyApplyPlan(finishedPlan, friendliesTarget, {
        competitionKey: "friendlies",
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      }),
    ).toThrow(/api_football match_result intake source/i);
  });

  it("builds source_note with ingest run metadata", () => {
    expect(
      buildApiFootballIngestSourceNote({
        runTag: "2026-06-05T07:00:00.000Z",
        competitionKey: "colombia-primera-a",
        from: "2026-05-25",
        to: "2026-06-10",
      }),
    ).toBe(
      "api_football_ingest_run=2026-06-05T07:00:00.000Z; competition=colombia-primera-a; from=2026-05-25; to=2026-06-10",
    );
  });

  it("protects verified/rejected match results from pending_review overwrite", () => {
    const plan = planControlledFixtureWrite(
      [
        buildFixture({
          status: "finished",
          statusShort: "FT",
          goals: { home: 2, away: 1 },
        }),
      ],
      colombiaTarget,
      {
        competitionKey: "colombia-primera-a",
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 5,
      },
      {
        matchByExternalId: new Map([
          [
            "api-football:fixture:9001",
            {
              id: "match-1",
              external_id: "api-football:fixture:9001",
              slug: "existing-safe-slug",
              access_scope: "admin_only",
            },
          ],
        ]),
        matchResultByMatchId: new Map([
          [
            "match-1",
            {
              id: "result-1",
              match_id: "match-1",
              verification_status: "verified",
              home_goals: 1,
              away_goals: 1,
            },
          ],
        ]),
      },
    );

    expect(plan.matchPlans[0]?.slug).toBe("existing-safe-slug");
    expect(plan.matchResultPlans[0]).toEqual({
      action: "skip",
      matchExternalId: "api-football:fixture:9001",
      reason: "existing_verified_or_rejected",
    });
  });

  it("also protects rejected match results from pending_review overwrite", () => {
    const plan = planControlledFixtureWrite(
      [
        buildFixture({
          status: "finished",
          statusShort: "FT",
          goals: { home: 3, away: 2 },
        }),
      ],
      colombiaTarget,
      {
        competitionKey: "colombia-primera-a",
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 5,
      },
      {
        matchByExternalId: new Map([
          [
            "api-football:fixture:9001",
            {
              id: "match-1",
              external_id: "api-football:fixture:9001",
              slug: "existing-safe-slug",
              access_scope: "admin_only",
            },
          ],
        ]),
        matchResultByMatchId: new Map([
          [
            "match-1",
            {
              id: "result-1",
              match_id: "match-1",
              verification_status: "rejected",
              home_goals: 1,
              away_goals: 1,
            },
          ],
        ]),
      },
    );

    expect(plan.matchResultPlans[0]).toEqual({
      action: "skip",
      matchExternalId: "api-football:fixture:9001",
      reason: "existing_verified_or_rejected",
    });
  });

  it("plans pending_review match results only for finished fixtures with scores", () => {
    const plan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 9001,
          status: "finished",
          statusShort: "FT",
          goals: { home: 2, away: 1 },
        }),
        buildFixture({
          providerFixtureId: 9002,
          status: "scheduled",
          statusShort: "NS",
          homeTeam: {
            providerTeamId: 3,
            name: "Deportivo Cali",
            winner: null,
          },
          awayTeam: {
            providerTeamId: 4,
            name: "Junior",
            winner: null,
          },
        }),
      ],
      colombiaTarget,
      {
        competitionKey: "colombia-primera-a",
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 5,
      },
    );

    expect(plan.matchResultPlans).toHaveLength(1);
    expect(plan.matchResultPlans[0]).toEqual({
      action: "create",
      matchExternalId: "api-football:fixture:9001",
      homeGoals: 2,
      awayGoals: 1,
      verificationStatus: "pending_review",
      intakeSource: "api_football",
      sourceNote: plan.sourceNote,
    });
  });

  it("uses admin_only and venue_id null defaults for new matches", () => {
    const plan = planControlledFixtureWrite(
      [buildFixture()],
      colombiaTarget,
      {
        competitionKey: "colombia-primera-a",
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 5,
      },
    );

    expect(plan.matchPlans[0]).toMatchObject({
      accessScope: "admin_only",
      venueId: null,
      intakeSource: "api_football",
      mode: "create",
    });
  });

  it("preserves existing match access_scope, including public", () => {
    const plan = planControlledFixtureWrite(
      [buildFixture()],
      colombiaTarget,
      {
        competitionKey: "colombia-primera-a",
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 5,
      },
      {
        matchByExternalId: new Map([
          [
            "api-football:fixture:9001",
            {
              id: "match-1",
              external_id: "api-football:fixture:9001",
              slug: "already-public-match",
              access_scope: "public",
            },
          ],
        ]),
      },
    );

    expect(plan.matchPlans[0]).toMatchObject({
      slug: "already-public-match",
      accessScope: "public",
      mode: "update",
    });
    expect(plan.warnings.some((warning) => warning.includes("preserves existing public access_scope"))).toBe(true);
  });

  it("dedupes team plans by external_id within a run", () => {
    const plan = planControlledFixtureWrite(
      [
        buildFixture({ providerFixtureId: 9001 }),
        buildFixture({
          providerFixtureId: 9002,
          kickoffAt: "2026-06-03T20:00:00Z",
          statusShort: "NS",
        }),
      ],
      colombiaTarget,
      {
        competitionKey: "colombia-primera-a",
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 5,
      },
    );

    expect(plan.teamPlans).toHaveLength(2);
    expect(plan.teamPlans.map((team) => team.externalId)).toEqual([
      "api-football:team:1",
      "api-football:team:2",
    ]);
  });
});
