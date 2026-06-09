import type { RealFixtureLabFixtureView } from "@/lib/supabase/real-fixture-lab-queries";
import type { MatchPredictionInput } from "./types";

export function buildRealFixturePredictionInput(
  fixture: RealFixtureLabFixtureView,
): MatchPredictionInput {
  return {
    matchId: fixture.id,
    homeTeam: {
      id: fixture.homeTeamId,
      name: fixture.homeTeamName,
    },
    awayTeam: {
      id: fixture.awayTeamId,
      name: fixture.awayTeamName,
    },
    context: {
      neutralVenue: false,
    },
    runScope: "internal_lab",
    predictionType: "pre_match_24h",
  };
}
