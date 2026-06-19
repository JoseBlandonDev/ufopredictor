import { fetchApiFootballFixtureById } from "../football-api/api-football-client";
import { arePredictionReviewTeamNamesEquivalent } from "./team-display-names";
import type { PredictionReviewProviderGuard, PredictionReviewProviderState } from "./types";

function parseApiFootballFixtureId(externalId: string) {
  const match = /^api-football:fixture:(\d+)$/.exec(externalId);
  return match ? Number(match[1]) : null;
}

export function extractPredictionReviewProviderFixtureId(externalId: string) {
  return parseApiFootballFixtureId(externalId);
}

export async function readPredictionReviewProviderState(externalId: string): Promise<PredictionReviewProviderState> {
  const fixtureId = parseApiFootballFixtureId(externalId);
  if (!fixtureId) {
    return {
      status: "not_found",
      reason: "The match external_id is not an api-football fixture identifier.",
    };
  }

  if (!process.env.API_FOOTBALL_KEY) {
    return {
      status: "unavailable",
      reason: "API_FOOTBALL_KEY is not configured, so provider revalidation is unavailable.",
    };
  }

  try {
    const fixture = await fetchApiFootballFixtureById(fixtureId);
    if (!fixture) {
      return {
        status: "not_found",
        reason: "Provider fixture could not be found.",
      };
    }

    return {
      status: "available",
      fixture,
    };
  } catch (error) {
    return {
      status: "unavailable",
      reason: error instanceof Error ? error.message : "Provider request failed.",
    };
  }
}

export function canReviewProviderFixture(state: PredictionReviewProviderState, now = new Date()) {
  if (state.status !== "available") {
    return {
      allowed: false,
      reason: state.reason,
    } satisfies PredictionReviewProviderGuard;
  }

  const kickoffTime = new Date(state.fixture.kickoffAt).getTime();
  const nowTime = now.getTime();
  if (state.fixture.status === "finished") {
    return {
      allowed: false,
      reason: "Finished fixtures are excluded from pre-match review.",
    } satisfies PredictionReviewProviderGuard;
  }

  if (state.fixture.status === "live" || state.fixture.status === "halftime") {
    return {
      allowed: false,
      reason: "Live fixtures are frozen and cannot be regenerated or reviewed.",
    } satisfies PredictionReviewProviderGuard;
  }

  if (!Number.isFinite(kickoffTime)) {
    return {
      allowed: false,
      reason: "Provider kickoff is invalid, so the fixture cannot be reviewed safely.",
    } satisfies PredictionReviewProviderGuard;
  }

  if (nowTime >= kickoffTime) {
    return {
      allowed: false,
      reason: "Fixtures whose kickoff has passed cannot be reviewed or published.",
    } satisfies PredictionReviewProviderGuard;
  }

  if (state.fixture.status !== "scheduled") {
    return {
      allowed: false,
      reason: `Provider status ${state.fixture.status} is not eligible for review.`,
    } satisfies PredictionReviewProviderGuard;
  }

  return {
    allowed: true,
    reason: null,
  } satisfies PredictionReviewProviderGuard;
}

export function validatePredictionReviewProviderFixture(
  args: {
    externalId: string;
    expectedKickoffAt: string;
    expectedHomeTeamName: string;
    expectedAwayTeamName: string;
  },
  state: PredictionReviewProviderState,
  now = new Date(),
) {
  const temporalGuard = canReviewProviderFixture(state, now);
  if (!temporalGuard.allowed || state.status !== "available") {
    return temporalGuard;
  }

  const expectedFixtureId = parseApiFootballFixtureId(args.externalId);
  if (!expectedFixtureId || state.fixture.providerFixtureId !== expectedFixtureId) {
    return {
      allowed: false,
      reason: "Provider fixture ID does not match the stored external identifier.",
    } satisfies PredictionReviewProviderGuard;
  }

  const expectedKickoffTime = new Date(args.expectedKickoffAt).getTime();
  const providerKickoffTime = new Date(state.fixture.kickoffAt).getTime();
  if (
    Number.isFinite(expectedKickoffTime) &&
    Number.isFinite(providerKickoffTime) &&
    expectedKickoffTime !== providerKickoffTime
  ) {
    return {
      allowed: false,
      reason: "Provider kickoff does not match the stored fixture kickoff.",
    } satisfies PredictionReviewProviderGuard;
  }

  const homeMatches = arePredictionReviewTeamNamesEquivalent(
    args.expectedHomeTeamName,
    state.fixture.homeTeam.name,
  );
  const awayMatches = arePredictionReviewTeamNamesEquivalent(
    args.expectedAwayTeamName,
    state.fixture.awayTeam.name,
  );

  if (!homeMatches || !awayMatches) {
    return {
      allowed: false,
      reason: "Provider teams do not match the stored home and away teams.",
    } satisfies PredictionReviewProviderGuard;
  }

  return {
    allowed: true,
    reason: null,
  } satisfies PredictionReviewProviderGuard;
}
