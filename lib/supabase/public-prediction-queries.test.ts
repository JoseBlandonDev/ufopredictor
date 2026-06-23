import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PUBLIC_ACTIVE_MATCH_WINDOW_MS,
  PREDICTIONS_LANDING_AWAITING_LIMIT,
  PREDICTIONS_LANDING_HISTORY_LIMIT,
  PREDICTIONS_LANDING_UPCOMING_LIMIT,
  PREDICTIONS_PAGE_SIZE,
  derivePublicPredictionLifecycle,
  getHistoricalPublicPredictionsPage,
  getPublicPredictionsData,
  getUpcomingPublicPredictionsPage,
  parsePredictionPage,
  sortAwaitingUpdatePredictions,
  sortHistoricalPredictions,
  sortInProgressPredictions,
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
            type: "eq" | "like";
            column: string;
            value: string;
          }> = [];
          const orders: Array<{ column: string; ascending: boolean }> = [];

          const builder = {
            eq(column: string, value: string) {
              filters.push({ type: "eq", column, value });
              return builder;
            },
            like(column: string, value: string) {
              filters.push({ type: "like", column, value });
              return builder;
            },
            order(column: string, options?: { ascending?: boolean }) {
              orders.push({ column, ascending: options?.ascending ?? true });
              return builder;
            },
            then(resolve: (value: { data: SummaryRow[]; error: null }) => unknown) {
              let rows = [...data];

              for (const filter of filters) {
                if (filter.type === "eq") {
                  rows = rows.filter((row) => row[filter.column] === filter.value);
                  continue;
                }

                const prefix = String(filter.value).replace(/%$/, "");
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

  it("uses a conservative shared active match window", () => {
    expect(PUBLIC_ACTIVE_MATCH_WINDOW_MS).toBe(3 * 60 * 60 * 1000);
  });

  it("limits landing sections and separates in-progress, awaiting-update, upcoming, and verified history", async () => {
    const rows = [
      ...Array.from({ length: 5 }, (_, index) =>
        buildRow({
          match_slug: `world-cup-2026-live-${index + 1}`,
          kickoff_at: `2026-06-22T${String(index + 9).padStart(2, "0")}:00:00Z`,
          status: "live",
        }),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        buildRow({
          match_slug: `world-cup-2026-awaiting-${index + 1}`,
          kickoff_at: `2026-06-22T0${index}:00:00Z`,
          status: "live",
        }),
      ),
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

    expect(result.livePredictions).toHaveLength(3);
    expect(result.awaitingUpdatePredictions).toHaveLength(PREDICTIONS_LANDING_AWAITING_LIMIT);
    expect(result.upcomingPredictions).toHaveLength(PREDICTIONS_LANDING_UPCOMING_LIMIT);
    expect(result.historicalPredictions).toHaveLength(PREDICTIONS_LANDING_HISTORY_LIMIT);
    expect(result.livePredictions[0]?.matchSlug).toBe("world-cup-2026-live-2");
    expect(result.awaitingUpdatePredictions[0]?.matchSlug).toBe("world-cup-2026-live-1");
    expect(result.upcomingPredictions[0]?.matchSlug).toBe("world-cup-2026-live-5");
    expect(result.historicalPredictions[0]?.matchSlug).toBe("world-cup-2026-history-6");
  });

  it("classifies a future scheduled fixture as upcoming only", async () => {
    const rows = [
      buildRow({
        match_slug: "world-cup-2026-future-scheduled",
        kickoff_at: "2026-06-22T13:30:00Z",
        status: "scheduled",
      }),
    ];
    createSupabaseServerClientMock.mockResolvedValue(createFakeSupabaseClient(rows));

    const landing = await getPublicPredictionsData("anonymous");
    const upcoming = await getUpcomingPublicPredictionsPage("anonymous", 1);

    expect(landing.status).toBe("ready");
    if (landing.status === "ready") {
      expect(landing.livePredictions).toEqual([]);
      expect(landing.awaitingUpdatePredictions).toEqual([]);
      expect(landing.upcomingPredictions.map((prediction) => prediction.matchSlug)).toEqual([
        "world-cup-2026-future-scheduled",
      ]);
    }

    expect(upcoming.status).toBe("ready");
    if (upcoming.status !== "ready") return;
    expect(upcoming.predictions.map((prediction) => prediction.matchSlug)).toEqual([
      "world-cup-2026-future-scheduled",
    ]);
  });

  it("classifies a past stale scheduled fixture inside the active window as in progress", async () => {
    const rows = [
      buildRow({
        match_slug: "world-cup-2026-past-stale-scheduled",
        kickoff_at: "2026-06-22T11:00:00Z",
        status: "scheduled",
      }),
    ];
    createSupabaseServerClientMock.mockResolvedValue(createFakeSupabaseClient(rows));

    const landing = await getPublicPredictionsData("anonymous");
    const upcoming = await getUpcomingPublicPredictionsPage("anonymous", 1);

    expect(landing.status).toBe("ready");
    if (landing.status === "ready") {
      expect(landing.livePredictions.map((prediction) => prediction.matchSlug)).toEqual([
        "world-cup-2026-past-stale-scheduled",
      ]);
      expect(landing.livePredictions[0]?.liveStateLabel).toBe("En vivo");
      expect(landing.awaitingUpdatePredictions).toEqual([]);
      expect(landing.upcomingPredictions).toEqual([]);
    }

    expect(upcoming.status).toBe("ready");
    if (upcoming.status === "ready") {
      expect(upcoming.predictions).toEqual([]);
    }
  });

  it("keeps a past stored live fixture inside the active window as in progress", async () => {
    const rows = [
      buildRow({
        match_slug: "world-cup-2026-live-visible",
        kickoff_at: "2026-06-22T10:30:00Z",
        status: "live",
      }),
    ];
    createSupabaseServerClientMock.mockResolvedValue(createFakeSupabaseClient(rows));

    const landing = await getPublicPredictionsData("anonymous");

    expect(landing.status).toBe("ready");
    if (landing.status !== "ready") return;
    expect(landing.livePredictions.map((prediction) => prediction.matchSlug)).toEqual([
      "world-cup-2026-live-visible",
    ]);
    expect(landing.livePredictions[0]?.liveStateLabel).toBe("En vivo");
  });

  it("moves stale live fixtures beyond the active window into awaiting official update", async () => {
    const rows = [
      buildRow({
        match_slug: "world-cup-2026-stale-live",
        kickoff_at: "2026-06-22T08:30:00Z",
        status: "live",
      }),
    ];
    createSupabaseServerClientMock.mockResolvedValue(createFakeSupabaseClient(rows));

    const landing = await getPublicPredictionsData("anonymous");

    expect(landing.status).toBe("ready");
    if (landing.status !== "ready") return;
    expect(landing.livePredictions).toEqual([]);
    expect(landing.awaitingUpdatePredictions.map((prediction) => prediction.matchSlug)).toEqual([
      "world-cup-2026-stale-live",
    ]);
    expect(landing.awaitingUpdatePredictions[0]?.liveStateLabel).toBe("Esperando resultado oficial");
  });

  it("moves stale scheduled fixtures beyond the active window into awaiting official update", async () => {
    const rows = [
      buildRow({
        match_slug: "world-cup-2026-stale-scheduled",
        kickoff_at: "2026-06-22T08:30:00Z",
        status: "scheduled",
      }),
    ];
    createSupabaseServerClientMock.mockResolvedValue(createFakeSupabaseClient(rows));

    const landing = await getPublicPredictionsData("anonymous");

    expect(landing.status).toBe("ready");
    if (landing.status !== "ready") return;
    expect(landing.livePredictions).toEqual([]);
    expect(landing.awaitingUpdatePredictions.map((prediction) => prediction.matchSlug)).toEqual([
      "world-cup-2026-stale-scheduled",
    ]);
  });

  it("keeps verified finished fixtures in history only", async () => {
    const rows = [
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

    const landing = await getPublicPredictionsData("anonymous");
    const history = await getHistoricalPublicPredictionsPage("anonymous", 1);

    expect(landing.status).toBe("ready");
    if (landing.status === "ready") {
      expect(landing.livePredictions).toEqual([]);
      expect(landing.awaitingUpdatePredictions).toEqual([]);
      expect(landing.upcomingPredictions).toEqual([]);
      expect(landing.historicalPredictions.map((prediction) => prediction.matchSlug)).toEqual([
        "world-cup-2026-finished-verified",
      ]);
    }

    expect(history.status).toBe("ready");
    if (history.status !== "ready") return;
    expect(history.predictions[0]?.verifiedResult).toEqual({
      homeGoals: 2,
      awayGoals: 0,
      verificationStatus: "verified",
    });
  });

  it("keeps explicit postponed and cancelled states visible with honest labels and no verified final result", async () => {
    const rows = [
      buildRow({
        match_slug: "world-cup-2026-cancelled-visible",
        kickoff_at: "2026-06-22T15:30:00Z",
        status: "cancelled",
        verified_home_goals: 2,
        verified_away_goals: 0,
        result_verification_status: null,
      }),
      buildRow({
        match_slug: "world-cup-2026-postponed-visible",
        kickoff_at: "2026-06-22T17:30:00Z",
        status: "postponed",
      }),
    ];
    createSupabaseServerClientMock.mockResolvedValue(createFakeSupabaseClient(rows));

    const landing = await getPublicPredictionsData("anonymous");

    expect(landing.status).toBe("ready");
    if (landing.status !== "ready") return;
    expect(landing.awaitingUpdatePredictions.map((prediction) => prediction.matchSlug)).toEqual([
      "world-cup-2026-postponed-visible",
      "world-cup-2026-cancelled-visible",
    ]);
    expect(landing.awaitingUpdatePredictions[0]?.liveStateLabel).toBe("Partido suspendido");
    expect(landing.awaitingUpdatePredictions[1]?.liveStateLabel).toBe("Partido cancelado");
    expect(landing.awaitingUpdatePredictions[1]?.verifiedResult).toBeNull();
    expect(landing.livePredictions).toEqual([]);
    expect(landing.historicalPredictions).toEqual([]);
  });

  it("paginates upcoming fixtures with deterministic ascending ordering and next-page detection", async () => {
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

  it("paginates verified history only with descending ordering", async () => {
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

  it("keeps sorting helpers bounded and deterministic", () => {
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
      "history",
    );
    const liveNow = toPredictionCardView(
      buildRow({
        match_slug: "live-now",
        kickoff_at: "2026-06-22T11:00:00Z",
        status: "live",
      }),
      "anonymous",
      "in_progress",
    );
    const scheduledNext = toPredictionCardView(
      buildRow({
        match_slug: "future-next",
        kickoff_at: "2026-06-23T18:00:00Z",
        status: "scheduled",
      }),
      "anonymous",
      "upcoming",
    );
    const awaiting = toPredictionCardView(
      buildRow({
        match_slug: "awaiting-old",
        kickoff_at: "2026-06-22T08:00:00Z",
        status: "live",
      }),
      "anonymous",
      "awaiting_result_update",
    );
    const cancelled = toPredictionCardView(
      buildRow({
        match_slug: "cancelled-now",
        kickoff_at: "2026-06-22T15:00:00Z",
        status: "cancelled",
      }),
      "anonymous",
      "awaiting_result_update",
    );

    expect(
      sortInProgressPredictions([liveNow]).map((prediction) => prediction.matchSlug),
    ).toEqual(["live-now"]);
    expect(
      sortAwaitingUpdatePredictions([awaiting, cancelled]).map((prediction) => prediction.matchSlug),
    ).toEqual(["cancelled-now", "awaiting-old"]);
    expect(sortUpcomingPredictions([scheduledNext]).map((prediction) => prediction.matchSlug)).toEqual([
      "future-next",
    ]);
    expect(sortHistoricalPredictions([finishedOld]).map((prediction) => prediction.matchSlug)).toEqual([
      "finished-old",
    ]);
  });

  it("derives lifecycle with verified results taking precedence over stale status", () => {
    const now = new Date("2026-06-22T12:00:00Z");

    expect(
      derivePublicPredictionLifecycle(
        {
          kickoff_at: "2026-06-22T08:00:00Z",
          status: "live",
          verified_home_goals: 1,
          verified_away_goals: 0,
          result_verification_status: "verified",
        },
        now,
      ),
    ).toBe("history");
  });
});
