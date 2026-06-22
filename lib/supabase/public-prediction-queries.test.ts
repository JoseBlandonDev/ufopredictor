import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PREDICTIONS_LANDING_HISTORY_LIMIT,
  PREDICTIONS_LANDING_UPCOMING_LIMIT,
  PREDICTIONS_PAGE_SIZE,
  getHistoricalPublicPredictionsPage,
  getPublicPredictionsData,
  getUpcomingPublicPredictionsPage,
  parsePredictionPage,
  sortHistoricalPredictions,
  sortUpcomingPredictions,
  toPredictionCardView,
} from "./public-prediction-queries";

const { createSupabaseServerClientMock, isLaunchSafePublicMatchMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  isLaunchSafePublicMatchMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/lib/supabase/public-launch-filters", () => ({
  isLaunchSafePublicMatch: isLaunchSafePublicMatchMock,
}));

type SummaryRow = Record<string, unknown>;

function buildRow(overrides: SummaryRow = {}): SummaryRow {
  return {
    match_slug: "world-cup-2026-team-a-vs-team-b-2026-06-20",
    kickoff_at: "2026-06-20T18:00:00Z",
    stage: "Group Stage - 1",
    status: "scheduled",
    competition_name: "World Cup 2026",
    competition_slug: "world-cup-2026",
    home_team_name: "Team A",
    home_team_slug: "team-a",
    home_team_logo_url: null,
    home_team_flag_url: null,
    away_team_name: "Team B",
    away_team_slug: "team-b",
    away_team_logo_url: null,
    away_team_flag_url: null,
    venue_name: null,
    venue_city: null,
    verified_home_goals: null,
    verified_away_goals: null,
    result_verification_status: null,
    prediction_created_at: "2026-06-19T12:00:00Z",
    home_win_prob: 51,
    draw_prob: 27,
    away_win_prob: 22,
    confidence_score: 60,
    risk_level: "medium",
    ...overrides,
  };
}

function createFakeSupabaseClient(data: SummaryRow[]) {
  return {
    from(table: string) {
      expect(table).toBe("public_prediction_summaries");
      return {
        select() {
          const filters: Array<{
            type: "eq" | "like" | "gt" | "neq";
            column: string;
            value: string;
          }> = [];
          const orders: Array<{ column: string; ascending: boolean }> = [];
          let limit: number | null = null;
          let range: { start: number; end: number } | null = null;

          const builder = {
            eq(column: string, value: string) {
              filters.push({ type: "eq", column, value });
              return builder;
            },
            like(column: string, value: string) {
              filters.push({ type: "like", column, value });
              return builder;
            },
            gt(column: string, value: string) {
              filters.push({ type: "gt", column, value });
              return builder;
            },
            neq(column: string, value: string) {
              filters.push({ type: "neq", column, value });
              return builder;
            },
            order(column: string, options?: { ascending?: boolean }) {
              orders.push({ column, ascending: options?.ascending ?? true });
              return builder;
            },
            limit(value: number) {
              limit = value;
              return builder;
            },
            range(start: number, end: number) {
              range = { start, end };
              return builder;
            },
            then(resolve: (value: { data: SummaryRow[]; error: null }) => unknown) {
              let rows = [...data];

              for (const filter of filters) {
                if (filter.type === "eq") {
                  rows = rows.filter((row) => row[filter.column] === filter.value);
                  continue;
                }

                if (filter.type === "neq") {
                  rows = rows.filter((row) => row[filter.column] !== filter.value);
                  continue;
                }

                if (filter.type === "gt") {
                  rows = rows.filter((row) => String(row[filter.column] ?? "") > filter.value);
                  continue;
                }

                const prefix = filter.value.replace(/%$/, "");
                rows = rows.filter((row) => String(row[filter.column] ?? "").startsWith(prefix));
              }

              rows.sort((left, right) => {
                for (const order of orders) {
                  const leftValue = String(left[order.column] ?? "");
                  const rightValue = String(right[order.column] ?? "");
                  if (leftValue === rightValue) continue;

                  const direction = order.ascending ? 1 : -1;
                  return leftValue < rightValue ? -1 * direction : 1 * direction;
                }

                return 0;
              });

              if (range) {
                rows = rows.slice(range.start, range.end + 1);
              } else if (typeof limit === "number") {
                rows = rows.slice(0, limit);
              }

              return Promise.resolve(resolve({ data: rows, error: null }));
            },
          };

          return builder;
        },
      };
    },
  };
}

describe("public prediction queries", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T12:00:00Z"));
    createSupabaseServerClientMock.mockReset();
    isLaunchSafePublicMatchMock.mockReset();
    isLaunchSafePublicMatchMock.mockImplementation(
      (matchSlug: string, competitionSlug: string) =>
        competitionSlug === "world-cup-2026" && matchSlug.startsWith("world-cup-2026-"),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("limits landing sections at query level and preserves scheduled and verified history ordering", async () => {
    const rows = [
      ...Array.from({ length: 10 }, (_, index) =>
        buildRow({
          match_slug: `world-cup-2026-upcoming-${index + 1}`,
          kickoff_at: `2026-06-${String(23 + index).padStart(2, "0")}T18:00:00Z`,
          status: "scheduled",
        }),
      ),
      ...Array.from({ length: 6 }, (_, index) =>
        buildRow({
          match_slug: `world-cup-2026-history-${index + 1}`,
          kickoff_at: `2026-06-${String(10 + index).padStart(2, "0")}T18:00:00Z`,
          status: "finished",
          verified_home_goals: index + 1,
          verified_away_goals: index,
          result_verification_status: "verified",
        }),
      ),
      buildRow({
        match_slug: "world-cup-2026-unverified-finished",
        kickoff_at: "2026-06-18T18:00:00Z",
        status: "finished",
        verified_home_goals: 1,
        verified_away_goals: 1,
        result_verification_status: null,
      }),
      buildRow({
        match_slug: "friendly-not-launch-safe",
        competition_slug: "friendlies-2026",
        kickoff_at: "2026-06-22T18:00:00Z",
        status: "scheduled",
      }),
    ];

    createSupabaseServerClientMock.mockImplementation(() =>
      Promise.resolve(createFakeSupabaseClient(rows)),
    );

    const result = await getPublicPredictionsData("registered_free");

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    expect(result.upcomingPredictions).toHaveLength(PREDICTIONS_LANDING_UPCOMING_LIMIT);
    expect(result.upcomingPredictions[0]?.matchSlug).toBe("world-cup-2026-upcoming-1");
    expect(result.upcomingPredictions[1]?.matchSlug).toBe("world-cup-2026-upcoming-2");
    expect(result.upcomingPredictions.at(-1)?.matchSlug).toBe("world-cup-2026-upcoming-8");
    expect(result.historicalPredictions).toHaveLength(PREDICTIONS_LANDING_HISTORY_LIMIT);
    expect(result.historicalPredictions[0]?.matchSlug).toBe("world-cup-2026-history-6");
    expect(result.historicalPredictions.at(-1)?.matchSlug).toBe("world-cup-2026-history-3");
  });

  it("excludes a past fixture even when its stored status is still scheduled", async () => {
    const rows = [
      buildRow({
        match_slug: "world-cup-2026-past-stale-scheduled",
        kickoff_at: "2026-06-22T11:00:00Z",
        status: "scheduled",
      }),
      buildRow({
        match_slug: "world-cup-2026-future-scheduled",
        kickoff_at: "2026-06-22T13:30:00Z",
        status: "scheduled",
      }),
    ];
    createSupabaseServerClientMock.mockResolvedValue(createFakeSupabaseClient(rows));

    const result = await getUpcomingPublicPredictionsPage("anonymous", 1);

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    expect(result.predictions.map((prediction) => prediction.matchSlug)).toEqual([
      "world-cup-2026-future-scheduled",
    ]);
  });

  it("keeps verified finished fixtures in history while excluding a past abandoned fixture from upcoming", async () => {
    const rows = [
      buildRow({
        match_slug: "world-cup-2026-past-abandoned",
        kickoff_at: "2026-06-22T10:30:00Z",
        status: "abandoned",
      }),
      buildRow({
        match_slug: "world-cup-2026-finished-verified",
        kickoff_at: "2026-06-21T18:00:00Z",
        status: "finished",
        verified_home_goals: 2,
        verified_away_goals: 0,
        result_verification_status: "verified",
      }),
    ];
    createSupabaseServerClientMock.mockResolvedValue(createFakeSupabaseClient(rows));

    const upcoming = await getUpcomingPublicPredictionsPage("anonymous", 1);
    const history = await getHistoricalPublicPredictionsPage("anonymous", 1);

    expect(upcoming.status).toBe("ready");
    if (upcoming.status === "ready") {
      expect(upcoming.predictions).toEqual([]);
    }

    expect(history.status).toBe("ready");
    if (history.status !== "ready") return;

    expect(history.predictions).toHaveLength(1);
    expect(history.predictions[0]?.matchSlug).toBe("world-cup-2026-finished-verified");
    expect(history.predictions[0]?.verifiedResult).toEqual({
      homeGoals: 2,
      awayGoals: 0,
      verificationStatus: "verified",
    });
  });

  it("returns paginated scheduled fixtures with deterministic ascending ordering and next-page detection", async () => {
    const rows = Array.from({ length: 13 }, (_, index) =>
      buildRow({
        match_slug: `world-cup-2026-upcoming-${String(index + 1).padStart(2, "0")}`,
        kickoff_at: `2026-07-${String(index + 1).padStart(2, "0")}T18:00:00Z`,
        status: "scheduled",
      }),
    );
    createSupabaseServerClientMock.mockResolvedValue(createFakeSupabaseClient(rows));

    const result = await getUpcomingPublicPredictionsPage("anonymous", 1);

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    expect(result.predictions).toHaveLength(PREDICTIONS_PAGE_SIZE);
    expect(result.predictions[0]?.matchSlug).toBe("world-cup-2026-upcoming-01");
    expect(result.predictions.at(-1)?.matchSlug).toBe("world-cup-2026-upcoming-12");
    expect(result.hasPreviousPage).toBe(false);
    expect(result.hasNextPage).toBe(true);
  });

  it("returns paginated verified history only with descending ordering", async () => {
    const rows = [
      ...Array.from({ length: 14 }, (_, index) =>
        buildRow({
          match_slug: `world-cup-2026-history-${String(index + 1).padStart(2, "0")}`,
          kickoff_at: `2026-06-${String(10 + index).padStart(2, "0")}T18:00:00Z`,
          status: "finished",
          verified_home_goals: 2,
          verified_away_goals: 1,
          result_verification_status: "verified",
        }),
      ),
      buildRow({
        match_slug: "world-cup-2026-finished-unverified",
        kickoff_at: "2026-06-28T18:00:00Z",
        status: "finished",
        verified_home_goals: 3,
        verified_away_goals: 3,
        result_verification_status: null,
      }),
    ];
    createSupabaseServerClientMock.mockResolvedValue(createFakeSupabaseClient(rows));

    const result = await getHistoricalPublicPredictionsPage("registered_free", 2);

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    expect(result.predictions).toHaveLength(2);
    expect(result.predictions[0]?.matchSlug).toBe("world-cup-2026-history-02");
    expect(result.predictions[1]?.matchSlug).toBe("world-cup-2026-history-01");
    expect(result.hasPreviousPage).toBe(true);
    expect(result.hasNextPage).toBe(false);
  });

  it("parses invalid, negative, empty, and excessive page values safely", () => {
    expect(parsePredictionPage(undefined)).toBe(1);
    expect(parsePredictionPage("invalid")).toBe(1);
    expect(parsePredictionPage("")).toBe(1);
    expect(parsePredictionPage("-1")).toBe(1);
    expect(parsePredictionPage(["2"])).toBe(2);
    expect(parsePredictionPage("999999")).toBe(100);
  });

  it("keeps pure sorting helpers bounded and deterministic", () => {
    const finishedOld = toPredictionCardView(
      buildRow({
        match_slug: "finished-old",
        kickoff_at: "2026-06-10T18:00:00Z",
        status: "finished",
        verified_home_goals: 2,
        verified_away_goals: 0,
        result_verification_status: "verified",
      }),
      "anonymous",
    );
    const liveNow = toPredictionCardView(
      buildRow({
        match_slug: "live-now",
        kickoff_at: "2026-06-13T18:00:00Z",
        status: "live",
      }),
      "anonymous",
    );
    const scheduledNext = toPredictionCardView(
      buildRow({
        match_slug: "future-next",
        kickoff_at: "2026-06-14T18:00:00Z",
        status: "scheduled",
      }),
      "anonymous",
    );

    expect(
      sortUpcomingPredictions([scheduledNext, liveNow]).map((prediction) => prediction.matchSlug),
    ).toEqual(["live-now", "future-next"]);
    expect(
      sortHistoricalPredictions([finishedOld]).map((prediction) => prediction.matchSlug),
    ).toEqual(["finished-old"]);
  });
});
