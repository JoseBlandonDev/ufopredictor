import { clamp, round } from "./normalize";
import type {
  CalculatedMarkets,
} from "./markets";
import type { ExpectedGoalsResult, NormalizedMatchInput, RiskLevel, TeamPowerResult, TeamSignalKey } from "./types";

const SIGNAL_LABELS: Record<TeamSignalKey, string> = {
  ratingScore: "rating",
  recentFormScore: "recent form",
  attackScore: "attack",
  defenseScore: "defense",
  marketScore: "market signal",
  lineupContextScore: "lineup context",
};

const POWER_SCORE_TIE_THRESHOLD = 0.01;

export function calculateConfidenceAndRisk(input: NormalizedMatchInput, markets: CalculatedMarkets) {
  const sortedOutcomes = Object.values(markets.oneXTwo).sort((left, right) => right - left);
  const outcomeMargin = sortedOutcomes[0] - sortedOutcomes[1];
  const confidence = round(clamp(40 + input.dataCompleteness * 30 + Math.min(outcomeMargin, 35) * 0.7, 0, 100), 2);
  let risk: RiskLevel = "medium";

  if (confidence < 60 || outcomeMargin < 8) {
    risk = "high";
  } else if (confidence >= 75 && outcomeMargin >= 15) {
    risk = "low";
  }

  return { confidence, risk, outcomeMargin: round(outcomeMargin, 2) };
}

export function buildFactors(
  input: NormalizedMatchInput,
  teamPower: { home: TeamPowerResult; away: TeamPowerResult },
  expectedGoals: ExpectedGoalsResult,
  outcomeMargin: number,
) {
  const signalDifferences = (Object.keys(SIGNAL_LABELS) as TeamSignalKey[])
    .map((key) => ({
      key,
      difference: input.homeTeam.signals[key] - input.awayTeam.signals[key],
    }))
    .sort((left, right) => Math.abs(right.difference) - Math.abs(left.difference));
  const factors: string[] = [];

  for (const signal of signalDifferences.slice(0, 2)) {
    if (Math.abs(signal.difference) < 1) {
      continue;
    }

    const leadingTeam = signal.difference > 0 ? input.homeTeam.name : input.awayTeam.name;
    factors.push(`${leadingTeam} leads on ${SIGNAL_LABELS[signal.key]} by ${round(Math.abs(signal.difference), 2)} points.`);
  }

  const powerDifference = round(Math.abs(teamPower.home.score - teamPower.away.score), 2);

  if (powerDifference <= POWER_SCORE_TIE_THRESHOLD) {
    factors.push(`${input.homeTeam.name} and ${input.awayTeam.name} are balanced on weighted power score.`);
  } else {
    const strongerTeam = teamPower.home.score > teamPower.away.score ? input.homeTeam.name : input.awayTeam.name;
    factors.push(`${strongerTeam} has the higher weighted power score by ${powerDifference} points.`);
  }

  factors.push(`Expected goals are ${expectedGoals.home} for ${input.homeTeam.name} and ${expectedGoals.away} for ${input.awayTeam.name}.`);

  if (outcomeMargin < 8) {
    factors.push("The 1X2 outcome probabilities are tightly grouped, increasing uncertainty.");
  }

  return factors;
}
