import type { RealFixtureLabFixtureView } from "@/lib/supabase/real-fixture-lab-queries";
import type { MatchPredictionInput } from "./types";
import { resolveNationalTeamFallbackSignals } from "./national-team-fallback";

export function buildRealFixturePredictionInput(
  fixture: RealFixtureLabFixtureView,
): MatchPredictionInput {
  return {
    matchId: fixture.id,
    homeTeam: {
      id: fixture.homeTeamId,
      name: fixture.homeTeamName,
      signals: resolveNationalTeamFallbackSignals({
        name: fixture.homeTeamName,
      }),
    },
    awayTeam: {
      id: fixture.awayTeamId,
      name: fixture.awayTeamName,
      signals: resolveNationalTeamFallbackSignals({
        name: fixture.awayTeamName,
      }),
    },
    context: {
      neutralVenue: false,
    },
    runScope: "internal_lab",
    predictionType: "pre_match_24h",
  };
}
