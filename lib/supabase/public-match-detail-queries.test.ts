import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicMatchDetailData } from "./public-match-detail-queries";

const {
  createSupabaseServerClientMock,
  buildPremiumMatchResourceMock,
  getPremiumMatchAccessDecisionMock,
  resolvePremiumProjectionForMatchMock,
  isLaunchSafePublicMatchMock,
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  buildPremiumMatchResourceMock: vi.fn(),
  getPremiumMatchAccessDecisionMock: vi.fn(),
  resolvePremiumProjectionForMatchMock: vi.fn(),
  isLaunchSafePublicMatchMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/lib/permissions/premium-match-resource", () => ({
  buildPremiumMatchResource: buildPremiumMatchResourceMock,
}));

vi.mock("./viewer-access-queries", () => ({
  getPremiumMatchAccessDecision: getPremiumMatchAccessDecisionMock,
}));

vi.mock("@/lib/permissions/premium-match-projection-resolver", () => ({
  resolvePremiumProjectionForMatch: resolvePremiumProjectionForMatchMock,
}));

vi.mock("@/lib/supabase/public-launch-filters", () => ({
  isLaunchSafePublicMatch: isLaunchSafePublicMatchMock,
}));

function createFakeSupabaseClient(options?: {
  matchData?: Record<string, unknown> | null;
  predictionData?: Record<string, unknown> | null;
  probableScoreData?: Record<string, unknown> | null;
  probableScoreError?: unknown;
}) {
  const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = [];

  const client = {
    from(table: string) {
      return {
        select() {
          return {
            eq(column: string, value: unknown) {
              if (table === "public_match_details") {
                expect(column).toBe("match_slug");
                expect(value).toBe("match-slug");
                return {
                  maybeSingle: () =>
                    Promise.resolve({
                      data: options?.matchData ?? null,
                      error: null,
                    }),
                };
              }

              if (table === "public_prediction_summaries") {
                expect(column).toBe("match_slug");
                expect(value).toBe("match-slug");
                return {
                  maybeSingle: () =>
                    Promise.resolve({
                      data: options?.predictionData ?? null,
                      error: null,
                    }),
                };
              }

              throw new Error(`Unexpected table eq chain: ${table}`);
            },
          };
        },
      };
    },
    rpc(fn: string, args: Record<string, unknown>) {
      rpcCalls.push({ fn, args });

      if (fn === "get_authenticated_public_match_probable_score") {
        return Promise.resolve({
          data: options?.probableScoreData ?? null,
          error: options?.probableScoreError ?? null,
        });
      }

      throw new Error(`Unexpected rpc call: ${fn}`);
    },
  };

  return { client, rpcCalls };
}

describe("public match detail queries", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
    buildPremiumMatchResourceMock.mockReset();
    getPremiumMatchAccessDecisionMock.mockReset();
    resolvePremiumProjectionForMatchMock.mockReset();
    isLaunchSafePublicMatchMock.mockReset();

    buildPremiumMatchResourceMock.mockReturnValue({
      status: "ready",
      resource: {
        matchId: "match-1",
      },
    });
    getPremiumMatchAccessDecisionMock.mockResolvedValue({
      status: "ready",
      access: {
        canAccess: false,
      },
    });
    resolvePremiumProjectionForMatchMock.mockResolvedValue({
      status: "locked",
      reason: "no_entitlement",
    });
    isLaunchSafePublicMatchMock.mockReturnValue(true);
  });

  it("does not fetch probable score for anonymous viewers", async () => {
    const { client, rpcCalls } = createFakeSupabaseClient({
      matchData: {
        match_slug: "match-slug",
        match_id: "match-1",
        kickoff_at: "2026-06-12T19:00:00Z",
        stage: "Group A",
        status: "scheduled",
        competition_name: "World Cup 2026",
        competition_slug: "world-cup-2026",
        competition_access_key: "world_cup_2026",
        competition_id: "competition-1",
        home_team_name: "Canada",
        home_team_slug: "canada",
        home_team_logo_url: null,
        home_team_flag_url: null,
        home_team_id: "team-1",
        away_team_name: "Bosnia & Herzegovina",
        away_team_slug: "bosnia-herzegovina",
        away_team_logo_url: null,
        away_team_flag_url: null,
        away_team_id: "team-2",
        venue_name: "Venue",
        venue_city: "City",
        verified_home_goals: 1,
        verified_away_goals: 1,
        result_verification_status: "verified",
      },
      predictionData: {
        prediction_created_at: "2026-06-11T12:00:00Z",
        home_win_prob: 44,
        draw_prob: 27,
        away_win_prob: 29,
        confidence_score: 58,
        risk_level: "medium",
      },
    });

    createSupabaseServerClientMock.mockResolvedValue(client);

    const result = await getPublicMatchDetailData("match-slug", "anonymous");

    expect(result.status).toBe("ready");
    if (result.status !== "ready" || result.match.prediction === null) return;
    expect(result.match.prediction.viewer).toBe("anonymous");
    expect(result.match.verifiedResult).toEqual({
      homeGoals: 1,
      awayGoals: 1,
      verificationStatus: "verified",
    });
    expect(rpcCalls).toEqual([]);
  });

  it("fetches probable score only for authenticated viewers", async () => {
    const { client, rpcCalls } = createFakeSupabaseClient({
      matchData: {
        match_slug: "match-slug",
        match_id: "match-1",
        kickoff_at: "2026-06-12T19:00:00Z",
        stage: "Group A",
        status: "scheduled",
        competition_name: "World Cup 2026",
        competition_slug: "world-cup-2026",
        competition_access_key: "world_cup_2026",
        competition_id: "competition-1",
        home_team_name: "Canada",
        home_team_slug: "canada",
        home_team_logo_url: null,
        home_team_flag_url: null,
        home_team_id: "team-1",
        away_team_name: "Bosnia & Herzegovina",
        away_team_slug: "bosnia-herzegovina",
        away_team_logo_url: null,
        away_team_flag_url: null,
        away_team_id: "team-2",
        venue_name: "Venue",
        venue_city: "City",
        verified_home_goals: null,
        verified_away_goals: null,
        result_verification_status: null,
      },
      predictionData: {
        prediction_created_at: "2026-06-11T12:00:00Z",
        home_win_prob: 44,
        draw_prob: 27,
        away_win_prob: 29,
        confidence_score: 58,
        risk_level: "medium",
      },
      probableScoreData: {
        most_likely_score: "1-0",
      },
    });

    createSupabaseServerClientMock.mockResolvedValue(client);

    const result = await getPublicMatchDetailData("match-slug", "registered_free");

    expect(result.status).toBe("ready");
    if (result.status !== "ready" || result.match.prediction === null) return;
    expect(result.match.prediction.viewer).toBe("registered_free");
    expect(result.match.verifiedResult).toBeNull();
    expect(result.match.prediction).toMatchObject({
      probableScore: "1-0",
      confidenceScore: 58,
      riskLevel: "medium",
    });
    expect(rpcCalls).toEqual([
      {
        fn: "get_authenticated_public_match_probable_score",
        args: {
          p_match_id: "match-1",
        },
      },
    ]);
  });

  it("falls back calmly when the probable score boundary is unavailable", async () => {
    const { client, rpcCalls } = createFakeSupabaseClient({
      matchData: {
        match_slug: "match-slug",
        match_id: "match-1",
        kickoff_at: "2026-06-12T19:00:00Z",
        stage: "Group A",
        status: "scheduled",
        competition_name: "World Cup 2026",
        competition_slug: "world-cup-2026",
        competition_access_key: "world_cup_2026",
        competition_id: "competition-1",
        home_team_name: "Canada",
        home_team_slug: "canada",
        home_team_logo_url: null,
        home_team_flag_url: null,
        home_team_id: "team-1",
        away_team_name: "Bosnia & Herzegovina",
        away_team_slug: "bosnia-herzegovina",
        away_team_logo_url: null,
        away_team_flag_url: null,
        away_team_id: "team-2",
        venue_name: "Venue",
        venue_city: "City",
        verified_home_goals: null,
        verified_away_goals: null,
        result_verification_status: null,
      },
      predictionData: {
        prediction_created_at: "2026-06-11T12:00:00Z",
        home_win_prob: 44,
        draw_prob: 27,
        away_win_prob: 29,
        confidence_score: 58,
        risk_level: "medium",
      },
      probableScoreError: new Error("rpc unavailable"),
    });

    createSupabaseServerClientMock.mockResolvedValue(client);

    const result = await getPublicMatchDetailData("match-slug", "registered_free");

    expect(result.status).toBe("ready");
    if (result.status !== "ready" || result.match.prediction === null) return;
    expect(result.match.prediction.viewer).toBe("registered_free");
    expect(result.match.prediction.probableScore).toBeNull();
    expect(rpcCalls).toHaveLength(1);
  });
});
