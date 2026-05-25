import { round } from "./normalize";
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
