import { describe, expect, it } from "vitest";

import type { ProviderFixture } from "@/lib/football-api/api-football-types";
import type { TargetCompetition } from "@/lib/football-api/target-competitions";
import {
  assertSingleFriendlyApplyPlan,
  assertSingleWorldCupApplyPlan,
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

const worldCupTarget: TargetCompetition = {
  key: "world-cup",
  provider: "api-football",
  leagueId: 1,
  season: 2026,
  useCase: "core_world_cup",
};

const WORLD_CUP_EXTERNAL_ID = "api-football:league:1";
const WORLD_CUP_COMPETITION_ID = "competition-world-cup";

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

  it("rejects world cup apply without explicit fixtureId", () => {
    expect(() =>
      resolveApplyConfig({
        apply: true,
        competition: "world-cup",
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      }),
    ).toThrow(/world cup apply requires explicit --fixtureId/i);
  });

  it("rejects world cup apply without limit 1", () => {
    expect(() =>
      resolveApplyConfig({
        apply: true,
        competition: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
      }),
    ).toThrow(/world cup apply requires explicit --fixtureId, --from, --to, and --limit 1/i);
  });

  it("rejects world cup apply with limit greater than one", () => {
    expect(() =>
      resolveApplyConfig({
        apply: true,
        competition: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 2,
      }),
    ).toThrow(/world cup apply requires explicit --fixtureId, --from, --to, and --limit 1/i);
  });

  it("rejects world cup apply without explicit from/to", () => {
    expect(() =>
      resolveApplyConfig({
        apply: true,
        competition: "world-cup",
        fixtureId: 1489369,
        limit: 1,
      }),
    ).toThrow(/world cup apply requires explicit --fixtureId, --from, --to, and --limit 1/i);
  });

  it("allows only narrow single-fixture world cup apply config", () => {
    expect(
      resolveApplyConfig({
        apply: true,
        competition: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      }),
    ).toEqual({
      competitionKey: "world-cup",
      fixtureId: 1489369,
      from: "2026-06-11",
      to: "2026-06-11",
      limit: 1,
    });
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
  it("allows scheduled world cup fixture with zero match results through narrow apply plan guard", () => {
    const plan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1489369,
          kickoffAt: "2026-06-11T19:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 1",
          },
          homeTeam: {
            providerTeamId: 16,
            name: "Mexico",
            winner: null,
          },
          awayTeam: {
            providerTeamId: 1531,
            name: "South Africa",
            winner: null,
          },
        }),
      ],
      worldCupTarget,
      {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      },
    );

    expect(plan.matchPlans[0]).toMatchObject({
      fixtureId: 1489369,
      status: "scheduled",
      accessScope: "admin_only",
      intakeSource: "api_football",
      existingCompetitionId: null,
      existingIntakeSource: null,
    });
    expect(plan.matchResultPlans).toHaveLength(0);
    expect(() =>
      assertSingleWorldCupApplyPlan(plan, worldCupTarget, {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      }),
    ).not.toThrow();
  });

  it("allows finished public world cup fixture with one pending_review match_result", () => {
    const finishedPlan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1489369,
          kickoffAt: "2026-06-11T19:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 1",
          },
          status: "finished",
          statusShort: "FT",
          goals: { home: 1, away: 0 },
        }),
      ],
      worldCupTarget,
      {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      },
      {
        competitionByExternalId: new Map([
          [
            WORLD_CUP_EXTERNAL_ID,
            {
              id: WORLD_CUP_COMPETITION_ID,
              external_id: WORLD_CUP_EXTERNAL_ID,
              slug: "world-cup-2026",
              usage_scope: "public_product",
            },
          ],
        ]),
        matchByExternalId: new Map([
          [
            "api-football:fixture:1489369",
            {
              id: "match-1",
              external_id: "api-football:fixture:1489369",
              slug: "world-cup-2026-mexico-vs-south-africa-2026-06-11",
              competition_id: WORLD_CUP_COMPETITION_ID,
              access_scope: "public",
              intake_source: "api_football",
            },
          ],
        ]),
      },
    );

    expect(finishedPlan.matchPlans[0]).toMatchObject({
      fixtureId: 1489369,
      status: "finished",
      accessScope: "public",
      intakeSource: "api_football",
      existingCompetitionId: WORLD_CUP_COMPETITION_ID,
      existingIntakeSource: "api_football",
      targetCompetitionId: WORLD_CUP_COMPETITION_ID,
    });
    expect(finishedPlan.matchResultPlans).toEqual([
      {
        action: "create",
        matchExternalId: "api-football:fixture:1489369",
        homeGoals: 1,
        awayGoals: 0,
        verificationStatus: "pending_review",
        intakeSource: "api_football",
        sourceNote: finishedPlan.sourceNote,
      },
    ]);
    expect(() =>
      assertSingleWorldCupApplyPlan(finishedPlan, worldCupTarget, {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      }),
    ).not.toThrow();
  });

  it("rejects world cup apply when more than one match is planned", () => {
    const plan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1489369,
          kickoffAt: "2026-06-11T19:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 1",
          },
        }),
      ],
      worldCupTarget,
      {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      },
    );

    plan.matchPlans.push({
      ...plan.matchPlans[0]!,
      fixtureId: 1489370,
      externalId: "api-football:fixture:1489370",
    });
    plan.plannedFixtures = 2;

    expect(() =>
      assertSingleWorldCupApplyPlan(plan, worldCupTarget, {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      }),
    ).toThrow(/exactly one planned match/i);
  });

  it("rejects scheduled world cup apply when any match_result write is planned", () => {
    const plan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1489369,
          kickoffAt: "2026-06-11T19:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 1",
          },
        }),
      ],
      worldCupTarget,
      {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      },
    );

    plan.matchResultPlans.push({
      action: "create",
      matchExternalId: "api-football:fixture:1489369",
      homeGoals: 1,
      awayGoals: 0,
      verificationStatus: "pending_review",
      intakeSource: "api_football",
      sourceNote: plan.sourceNote,
    });

    expect(() =>
      assertSingleWorldCupApplyPlan(plan, worldCupTarget, {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      }),
    ).toThrow(/zero planned match_results/i);
  });

  it("rejects world cup apply if access_scope is not admin_only", () => {
    const plan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1489369,
          kickoffAt: "2026-06-11T19:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 1",
          },
        }),
      ],
      worldCupTarget,
      {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      },
    );

    plan.matchPlans[0] = {
      ...plan.matchPlans[0]!,
      accessScope: "public",
    };

    expect(() =>
      assertSingleWorldCupApplyPlan(plan, worldCupTarget, {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      }),
    ).toThrow(/admin_only match access scope/i);
  });

  it("rejects finished world cup apply if the preserved access_scope is not public", () => {
    const finishedPlan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1489369,
          kickoffAt: "2026-06-11T19:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 1",
          },
          status: "finished",
          statusShort: "FT",
          goals: { home: 2, away: 0 },
        }),
      ],
      worldCupTarget,
      {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      },
    );

    expect(() =>
      assertSingleWorldCupApplyPlan(finishedPlan, worldCupTarget, {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      }),
    ).toThrow(/finished world cup apply requires public match access scope/i);
  });

  it("rejects world cup apply if intake_source is not api_football", () => {
    const plan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1489369,
          kickoffAt: "2026-06-11T19:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 1",
          },
        }),
      ],
      worldCupTarget,
      {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      },
    );

    plan.matchPlans[0] = {
      ...plan.matchPlans[0]!,
      intakeSource: "manual" as never,
    };

    expect(() =>
      assertSingleWorldCupApplyPlan(plan, worldCupTarget, {
        competitionKey: "world-cup",
        fixtureId: 1489369,
        from: "2026-06-11",
        to: "2026-06-11",
        limit: 1,
      }),
    ).toThrow(/api_football intake source/i);
  });

  it("keeps broad world cup apply blocked at config level", () => {
    expect(() =>
      resolveApplyConfig({
        apply: true,
        competition: "world-cup",
        from: "2026-06-11",
        to: "2026-06-15",
        limit: 5,
      }),
    ).toThrow(/world cup apply requires explicit --fixtureId, --from, --to, and --limit 1/i);
  });

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
              competition_id: "competition-1",
              access_scope: "admin_only",
              intake_source: "api_football",
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
              competition_id: "competition-1",
              access_scope: "admin_only",
              intake_source: "api_football",
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
              competition_id: "competition-1",
              access_scope: "public",
              intake_source: "api_football",
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

  it("allows exact live world cup apply for an existing public API-Football match and preserves slug/access", () => {
    const livePlan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1539017,
          kickoffAt: "2026-06-22T16:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 2",
          },
          status: "live",
          statusShort: "2H",
          homeTeam: {
            providerTeamId: 85,
            name: "France",
            winner: null,
          },
          awayTeam: {
            providerTeamId: 1025,
            name: "Iraq",
            winner: null,
          },
          goals: { home: 2, away: 0 },
        }),
      ],
      worldCupTarget,
      {
        competitionKey: "world-cup",
        fixtureId: 1539017,
        from: "2026-06-22",
        to: "2026-06-22",
        limit: 1,
      },
      {
        competitionByExternalId: new Map([
          [
            WORLD_CUP_EXTERNAL_ID,
            {
              id: WORLD_CUP_COMPETITION_ID,
              external_id: WORLD_CUP_EXTERNAL_ID,
              slug: "world-cup-2026",
              usage_scope: "public_product",
            },
          ],
        ]),
        matchByExternalId: new Map([
          [
            "api-football:fixture:1539017",
            {
              id: "match-live-1",
              external_id: "api-football:fixture:1539017",
              slug: "world-cup-2026-france-vs-iraq-2026-06-22",
              competition_id: WORLD_CUP_COMPETITION_ID,
              access_scope: "public",
              intake_source: "api_football",
            },
          ],
        ]),
      },
    );

    expect(livePlan.matchPlans[0]).toMatchObject({
      fixtureId: 1539017,
      status: "live",
      mode: "update",
      slug: "world-cup-2026-france-vs-iraq-2026-06-22",
      accessScope: "public",
      existingCompetitionId: WORLD_CUP_COMPETITION_ID,
      existingIntakeSource: "api_football",
      targetCompetitionId: WORLD_CUP_COMPETITION_ID,
      preserveExistingSlug: true,
    });
    expect(livePlan.matchResultPlans).toEqual([]);
    expect(() =>
      assertSingleWorldCupApplyPlan(livePlan, worldCupTarget, {
        competitionKey: "world-cup",
        fixtureId: 1539017,
        from: "2026-06-22",
        to: "2026-06-22",
        limit: 1,
      }),
    ).not.toThrow();
  });

  it("rejects exact live world cup apply when the existing public fixture is absent", () => {
    const livePlan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1539017,
          kickoffAt: "2026-06-22T16:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 2",
          },
          status: "live",
          statusShort: "2H",
        }),
      ],
      worldCupTarget,
      {
        competitionKey: "world-cup",
        fixtureId: 1539017,
        from: "2026-06-22",
        to: "2026-06-22",
        limit: 1,
      },
      {
        competitionByExternalId: new Map([
          [
            WORLD_CUP_EXTERNAL_ID,
            {
              id: WORLD_CUP_COMPETITION_ID,
              external_id: WORLD_CUP_EXTERNAL_ID,
              slug: "world-cup-2026",
              usage_scope: "public_product",
            },
          ],
        ]),
      },
    );

    expect(livePlan.matchPlans[0]).toMatchObject({
      mode: "create",
      preserveExistingSlug: false,
    });
    expect(() =>
      assertSingleWorldCupApplyPlan(livePlan, worldCupTarget, {
        competitionKey: "world-cup",
        fixtureId: 1539017,
        from: "2026-06-22",
        to: "2026-06-22",
        limit: 1,
      }),
    ).toThrow(/existing exact public api-football match row/i);
  });

  it("rejects exact live world cup apply for admin_only fixtures", () => {
    const livePlan = planControlledFixtureWrite(
      [
        buildFixture({
          providerFixtureId: 1489401,
          kickoffAt: "2026-06-22T18:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 2",
          },
          status: "live",
          statusShort: "1H",
          homeTeam: {
            providerTeamId: 900,
            name: "Norway",
            winner: null,
          },
          awayTeam: {
            providerTeamId: 901,
            name: "Senegal",
            winner: null,
          },
        }),
      ],
      worldCupTarget,
      {
        competitionKey: "world-cup",
        fixtureId: 1489401,
        from: "2026-06-22",
        to: "2026-06-22",
        limit: 1,
      },
      {
        competitionByExternalId: new Map([
          [
            WORLD_CUP_EXTERNAL_ID,
            {
              id: WORLD_CUP_COMPETITION_ID,
              external_id: WORLD_CUP_EXTERNAL_ID,
              slug: "world-cup-2026",
              usage_scope: "public_product",
            },
          ],
        ]),
        matchByExternalId: new Map([
          [
            "api-football:fixture:1489401",
            {
              id: "match-live-2",
              external_id: "api-football:fixture:1489401",
              slug: "world-cup-2026-norway-vs-senegal-2026-06-22",
              competition_id: WORLD_CUP_COMPETITION_ID,
              access_scope: "admin_only",
              intake_source: "api_football",
            },
          ],
        ]),
      },
    );

    expect(() =>
      assertSingleWorldCupApplyPlan(livePlan, worldCupTarget, {
        competitionKey: "world-cup",
        fixtureId: 1489401,
        from: "2026-06-22",
        to: "2026-06-22",
        limit: 1,
      }),
    ).toThrow(/public match access scope/i);
  });

  it("keeps live world cup apply blocked without exact fixture/date/limit guards", () => {
    expect(() =>
      resolveApplyConfig({
        apply: true,
        competition: "world-cup",
        fixtureId: 1539017,
        from: "2026-06-22",
        to: "2026-06-22",
        limit: 2,
      }),
    ).toThrow(/world cup apply requires explicit --fixtureId, --from, --to, and --limit 1/i);
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
