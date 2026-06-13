import type { RealFixtureLabFixtureView } from "@/lib/supabase/real-fixture-lab-queries";
import type { MatchPredictionInput } from "./types";
import { resolveNationalTeamPredictionInputData } from "./national-team-strength-snapshots";

export function buildRealFixturePredictionInput(
  fixture: RealFixtureLabFixtureView,
): MatchPredictionInput {
  const homeTeamFallback = resolveNationalTeamPredictionInputData({
    name: fixture.homeTeamName,
  });
  const awayTeamFallback = resolveNationalTeamPredictionInputData({
    name: fixture.awayTeamName,
  });

  return {
    matchId: fixture.id,
    homeTeam: {
      id: fixture.homeTeamId,
      name: fixture.homeTeamName,
      ...(homeTeamFallback ? homeTeamFallback : {}),
    },
    awayTeam: {
      id: fixture.awayTeamId,
      name: fixture.awayTeamName,
      ...(awayTeamFallback ? awayTeamFallback : {}),
    },
    context: {
      neutralVenue: false,
    },
    runScope: "internal_lab",
    predictionType: "pre_match_24h",
  };
}
