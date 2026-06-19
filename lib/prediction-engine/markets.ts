import { round } from "./normalize";
import type { ExpectedGoalsResult, PredictionEngineConfig } from "./types";
import type { ScoreMatrixCell, ScorelineProbability } from "./types";

export type CalculatedMarkets = {
  oneXTwo: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  btts: {
    yes: number;
    no: number;
  };
  overUnder25: {
    over: number;
    under: number;
  };
};

function toPercent(probability: number) {
  return round(probability * 100);
}

export function calculateMarkets(matrix: ScoreMatrixCell[]): CalculatedMarkets {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let bttsYes = 0;
  let over25 = 0;

  for (const scoreline of matrix) {
    if (scoreline.homeGoals > scoreline.awayGoals) {
      homeWin += scoreline.probability;
    } else if (scoreline.homeGoals === scoreline.awayGoals) {
      draw += scoreline.probability;
    } else {
      awayWin += scoreline.probability;
    }

    if (scoreline.homeGoals > 0 && scoreline.awayGoals > 0) {
      bttsYes += scoreline.probability;
    }

    if (scoreline.homeGoals + scoreline.awayGoals > 2) {
      over25 += scoreline.probability;
    }
  }

  const bttsYesPercent = toPercent(bttsYes);
  const over25Percent = toPercent(over25);

  return {
    oneXTwo: {
      homeWin: toPercent(homeWin),
      draw: toPercent(draw),
      awayWin: toPercent(awayWin),
    },
    btts: {
      yes: bttsYesPercent,
      no: round(100 - bttsYesPercent),
    },
    overUnder25: {
      over: over25Percent,
      under: round(100 - over25Percent),
    },
  };
}

export function selectTopScorelines(matrix: ScoreMatrixCell[], limit: number): ScorelineProbability[] {
  return [...matrix]
    .sort((left, right) => {
      if (right.probability !== left.probability) {
        return right.probability - left.probability;
      }

      if (left.homeGoals !== right.homeGoals) {
        return left.homeGoals - right.homeGoals;
      }

      return left.awayGoals - right.awayGoals;
    })
    .slice(0, limit)
    .map(({ homeGoals, awayGoals, probability }) => ({
      homeGoals,
      awayGoals,
      score: `${homeGoals}-${awayGoals}`,
      probability: toPercent(probability),
    }));
}

function isDrawScore(score: string) {
  const [homeGoals, awayGoals] = score.split("-");

  return homeGoals.length > 0 && homeGoals === awayGoals;
}

export function reconcileDrawMarket(
  markets: CalculatedMarkets,
  expectedGoals: ExpectedGoalsResult,
  topScorelines: ScorelineProbability[],
  config: PredictionEngineConfig,
): CalculatedMarkets {
  const modalScoreline = topScorelines[0];
  const nextScoreline = topScorelines[1];

  if (!modalScoreline || !isDrawScore(modalScoreline.score)) {
    return markets;
  }

  if (
    nextScoreline &&
    modalScoreline.probability - nextScoreline.probability < config.drawReconciliation.minimumModalDrawLead
  ) {
    return markets;
  }

  const expectedGoalsGap = Math.abs(expectedGoals.home - expectedGoals.away);
  const totalExpectedGoals = expectedGoals.home + expectedGoals.away;

  if (
    expectedGoalsGap > config.drawReconciliation.maxExpectedGoalsGap ||
    totalExpectedGoals > config.drawReconciliation.maxTotalExpectedGoals
  ) {
    return markets;
  }

  const outcomes = [
    { key: "homeWin" as const, probability: markets.oneXTwo.homeWin },
    { key: "draw" as const, probability: markets.oneXTwo.draw },
    { key: "awayWin" as const, probability: markets.oneXTwo.awayWin },
  ].sort((left, right) => right.probability - left.probability);

  const leader = outcomes[0];

  if (!leader || leader.key === "draw") {
    return markets;
  }

  const leaderMargin = leader.probability - markets.oneXTwo.draw;

  if (leaderMargin <= 0 || leaderMargin > config.drawReconciliation.maxLeaderMargin) {
    return markets;
  }

  const otherNonDrawProbability =
    leader.key === "homeWin" ? markets.oneXTwo.awayWin : markets.oneXTwo.homeWin;
  const requiredShiftVsLeader = (leader.probability - markets.oneXTwo.draw + config.drawReconciliation.targetTopEdge) / 2;
  const requiredShiftVsOtherNonDraw =
    otherNonDrawProbability - markets.oneXTwo.draw + config.drawReconciliation.targetTopEdge;
  const requiredShift = Math.max(requiredShiftVsLeader, requiredShiftVsOtherNonDraw);

  if (
    !Number.isFinite(requiredShift) ||
    requiredShift <= 0 ||
    requiredShift > config.drawReconciliation.maxProbabilityShift ||
    leader.probability - requiredShift < 0
  ) {
    return markets;
  }

  const reconciledOneXTwo = {
    ...markets.oneXTwo,
    [leader.key]: round(leader.probability - requiredShift),
    draw: round(markets.oneXTwo.draw + requiredShift),
  };

  return {
    ...markets,
    oneXTwo: reconciledOneXTwo,
  };
}
