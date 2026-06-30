import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchApiFootballFixtureById,
  fetchApiFootballFixtureByIdDetailed,
} from "./api-football-client";

describe("api-football client knockout score normalization", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.API_FOOTBALL_KEY;

  beforeEach(() => {
    process.env.API_FOOTBALL_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.API_FOOTBALL_KEY;
    } else {
      process.env.API_FOOTBALL_KEY = originalApiKey;
    }
    vi.restoreAllMocks();
  });

  it("normalizes a regulation FT fixture without changing the ordinary goals", async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          results: 1,
          response: [
            {
              fixture: { id: 1001, date: "2026-06-20T18:00:00Z", timezone: "UTC", status: { short: "FT", elapsed: 90 } },
              league: { id: 1, name: "World Cup", country: "World", season: 2026, round: "Round of 32" },
              teams: {
                home: { id: 1, name: "Home", winner: true },
                away: { id: 2, name: "Away", winner: false },
              },
              goals: { home: 2, away: 1 },
              score: {
                halftime: { home: 1, away: 0 },
                fulltime: { home: 2, away: 1 },
                extratime: { home: null, away: null },
                penalty: { home: null, away: null },
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    ) as typeof fetch;

    const fixture = await fetchApiFootballFixtureById(1001);

    expect(fixture).toMatchObject({
      statusShort: "FT",
      goals: { home: 2, away: 1 },
      decision: "regulation",
      scoreBreakdown: {
        halftime: { home: 1, away: 0 },
        fulltime: { home: 2, away: 1 },
        extratime: { home: null, away: null },
        penalty: { home: null, away: null },
      },
    });
  });

  it("normalizes a PEN fixture without folding shootout kicks into ordinary goals", async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          results: 1,
          response: [
            {
              fixture: { id: 1565176, date: "2026-06-30T18:00:00Z", timezone: "UTC", status: { short: "PEN", elapsed: 120 } },
              league: { id: 1, name: "World Cup", country: "World", season: 2026, round: "Round of 32" },
              teams: {
                home: { id: 25, name: "Germany", winner: false },
                away: { id: 2380, name: "Paraguay", winner: true },
              },
              goals: { home: 1, away: 1 },
              score: {
                halftime: { home: 0, away: 1 },
                fulltime: { home: 1, away: 1 },
                extratime: { home: 0, away: 0 },
                penalty: { home: 3, away: 4 },
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    ) as typeof fetch;

    const fixture = await fetchApiFootballFixtureById(1565176);

    expect(fixture).toMatchObject({
      statusShort: "PEN",
      goals: { home: 1, away: 1 },
      decision: "penalties",
      homeTeam: { winner: false },
      awayTeam: { winner: true },
      scoreBreakdown: {
        fulltime: { home: 1, away: 1 },
        penalty: { home: 3, away: 4 },
      },
    });
  });

  it("normalizes an AET fixture with separate regulation and extra-time components", async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          results: 1,
          response: [
            {
              fixture: { id: 2002, date: "2026-07-01T18:00:00Z", timezone: "UTC", status: { short: "AET", elapsed: 120 } },
              league: { id: 1, name: "World Cup", country: "World", season: 2026, round: "Round of 16" },
              teams: {
                home: { id: 10, name: "Home", winner: true },
                away: { id: 20, name: "Away", winner: false },
              },
              goals: { home: 2, away: 1 },
              score: {
                halftime: { home: 0, away: 0 },
                fulltime: { home: 1, away: 1 },
                extratime: { home: 1, away: 0 },
                penalty: { home: null, away: null },
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    ) as typeof fetch;

    const result = await fetchApiFootballFixtureByIdDetailed(2002);

    expect(result.fixture).toMatchObject({
      statusShort: "AET",
      goals: { home: 2, away: 1 },
      decision: "extra_time",
      homeTeam: { winner: true },
      awayTeam: { winner: false },
      scoreBreakdown: {
        fulltime: { home: 1, away: 1 },
        extratime: { home: 1, away: 0 },
      },
    });
    expect(result.failureKind).toBeNull();
  });
});
