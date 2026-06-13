import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getPublicPredictionsData,
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

function createFakeSupabaseClient(data: Array<Record<string, unknown>>) {
  return {
    from(table: string) {
      expect(table).toBe("public_prediction_summaries");
      return {
        select() {
          return {
            order(column: string) {
              expect(column).toBe("kickoff_at");
              return Promise.resolve({ data, error: null });
            },
          };
        },
      };
    },
  };
}

describe("public prediction queries", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
    isLaunchSafePublicMatchMock.mockReset();
    isLaunchSafePublicMatchMock.mockReturnValue(true);
  });

  it("groups upcoming fixtures ahead of finished history and sorts each section safely", async () => {
    createSupabaseServerClientMock.mockResolvedValue(
      createFakeSupabaseClient([
        {
          match_slug: "finished-old",
          kickoff_at: "2026-06-10T18:00:00Z",
          stage: "Group A",
          status: "finished",
          competition_name: "World Cup 2026",
          competition_slug: "world-cup-2026",
          home_team_name: "Mexico",
          home_team_slug: "mexico",
          home_team_logo_url: null,
          home_team_flag_url: null,
          away_team_name: "South Africa",
          away_team_slug: "south-africa",
          away_team_logo_url: null,
          away_team_flag_url: null,
          venue_name: null,
          venue_city: null,
          verified_home_goals: 2,
          verified_away_goals: 0,
          result_verification_status: "verified",
          prediction_created_at: "2026-06-09T12:00:00Z",
          home_win_prob: 52,
          draw_prob: 25,
          away_win_prob: 23,
          confidence_score: 58,
          risk_level: "medium",
        },
        {
          match_slug: "live-now",
          kickoff_at: "2026-06-13T18:00:00Z",
          stage: "Group A",
          status: "live",
          competition_name: "World Cup 2026",
          competition_slug: "world-cup-2026",
          home_team_name: "Brazil",
          home_team_slug: "brazil",
          home_team_logo_url: null,
          home_team_flag_url: null,
          away_team_name: "Morocco",
          away_team_slug: "morocco",
          away_team_logo_url: null,
          away_team_flag_url: null,
          venue_name: null,
          venue_city: null,
          verified_home_goals: null,
          verified_away_goals: null,
          result_verification_status: null,
          prediction_created_at: "2026-06-13T12:00:00Z",
          home_win_prob: 61,
          draw_prob: 21,
          away_win_prob: 18,
          confidence_score: 66,
          risk_level: "medium",
        },
        {
          match_slug: "future-next",
          kickoff_at: "2026-06-14T18:00:00Z",
          stage: "Group A",
          status: "scheduled",
          competition_name: "World Cup 2026",
          competition_slug: "world-cup-2026",
          home_team_name: "Germany",
          home_team_slug: "germany",
          home_team_logo_url: null,
          home_team_flag_url: null,
          away_team_name: "Curacao",
          away_team_slug: "curacao",
          away_team_logo_url: null,
          away_team_flag_url: null,
          venue_name: null,
          venue_city: null,
          verified_home_goals: null,
          verified_away_goals: null,
          result_verification_status: null,
          prediction_created_at: "2026-06-13T12:30:00Z",
          home_win_prob: 69,
          draw_prob: 18,
          away_win_prob: 13,
          confidence_score: 72,
          risk_level: "low",
        },
        {
          match_slug: "finished-recent",
          kickoff_at: "2026-06-12T22:00:00Z",
          stage: "Group A",
          status: "finished",
          competition_name: "World Cup 2026",
          competition_slug: "world-cup-2026",
          home_team_name: "USA",
          home_team_slug: "usa",
          home_team_logo_url: null,
          home_team_flag_url: null,
          away_team_name: "Paraguay",
          away_team_slug: "paraguay",
          away_team_logo_url: null,
          away_team_flag_url: null,
          venue_name: null,
          venue_city: null,
          verified_home_goals: 4,
          verified_away_goals: 1,
          result_verification_status: "verified",
          prediction_created_at: "2026-06-11T12:00:00Z",
          home_win_prob: 48,
          draw_prob: 28,
          away_win_prob: 24,
          confidence_score: 54,
          risk_level: "high",
        },
      ]),
    );

    const result = await getPublicPredictionsData("registered_free");

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    expect(result.upcomingPredictions.map((prediction) => prediction.matchSlug)).toEqual([
      "live-now",
      "future-next",
    ]);
    expect(result.historicalPredictions.map((prediction) => prediction.matchSlug)).toEqual([
      "finished-recent",
      "finished-old",
    ]);
    expect(result.historicalPredictions[0]?.verifiedResult).toEqual({
      homeGoals: 4,
      awayGoals: 1,
      verificationStatus: "verified",
    });
  });

  it("keeps pure sorting helpers bounded and deterministic", () => {
    const finishedOld = toPredictionCardView(
      {
        match_slug: "finished-old",
        kickoff_at: "2026-06-10T18:00:00Z",
        stage: null,
        status: "finished",
        competition_name: "World Cup 2026",
        competition_slug: "world-cup-2026",
        home_team_name: "Mexico",
        home_team_slug: "mexico",
        home_team_logo_url: null,
        home_team_flag_url: null,
        away_team_name: "South Africa",
        away_team_slug: "south-africa",
        away_team_logo_url: null,
        away_team_flag_url: null,
        venue_name: null,
        venue_city: null,
        verified_home_goals: 2,
        verified_away_goals: 0,
        result_verification_status: "verified",
        prediction_created_at: "2026-06-09T12:00:00Z",
        home_win_prob: 52,
        draw_prob: 25,
        away_win_prob: 23,
        confidence_score: 58,
        risk_level: "medium",
      },
      "anonymous",
    );
    const liveNow = toPredictionCardView(
      {
        match_slug: "live-now",
        kickoff_at: "2026-06-13T18:00:00Z",
        stage: null,
        status: "live",
        competition_name: "World Cup 2026",
        competition_slug: "world-cup-2026",
        home_team_name: "Brazil",
        home_team_slug: "brazil",
        home_team_logo_url: null,
        home_team_flag_url: null,
        away_team_name: "Morocco",
        away_team_slug: "morocco",
        away_team_logo_url: null,
        away_team_flag_url: null,
        venue_name: null,
        venue_city: null,
        verified_home_goals: null,
        verified_away_goals: null,
        result_verification_status: null,
        prediction_created_at: "2026-06-13T12:00:00Z",
        home_win_prob: 61,
        draw_prob: 21,
        away_win_prob: 18,
        confidence_score: 66,
        risk_level: "medium",
      },
      "anonymous",
    );
    const scheduledNext = toPredictionCardView(
      {
        match_slug: "future-next",
        kickoff_at: "2026-06-14T18:00:00Z",
        stage: null,
        status: "scheduled",
        competition_name: "World Cup 2026",
        competition_slug: "world-cup-2026",
        home_team_name: "Germany",
        home_team_slug: "germany",
        home_team_logo_url: null,
        home_team_flag_url: null,
        away_team_name: "Curacao",
        away_team_slug: "curacao",
        away_team_logo_url: null,
        away_team_flag_url: null,
        venue_name: null,
        venue_city: null,
        verified_home_goals: null,
        verified_away_goals: null,
        result_verification_status: null,
        prediction_created_at: "2026-06-13T12:30:00Z",
        home_win_prob: 69,
        draw_prob: 18,
        away_win_prob: 13,
        confidence_score: 72,
        risk_level: "low",
      },
      "anonymous",
    );

    expect(sortUpcomingPredictions([scheduledNext, liveNow]).map((prediction) => prediction.matchSlug)).toEqual([
      "live-now",
      "future-next",
    ]);
    expect(sortHistoricalPredictions([finishedOld]).map((prediction) => prediction.matchSlug)).toEqual([
      "finished-old",
    ]);
  });
});
