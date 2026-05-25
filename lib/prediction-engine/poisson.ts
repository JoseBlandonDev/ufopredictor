import type { ExpectedGoalsResult, ScoreMatrixCell } from "./types";

export function poissonProbability(lambda: number, goals: number) {
  let factorial = 1;

  for (let factor = 2; factor <= goals; factor += 1) {
    factorial *= factor;
  }

  return (Math.exp(-lambda) * lambda ** goals) / factorial;
}

export function buildScoreMatrix(expectedGoals: ExpectedGoalsResult, maxGoals: number): ScoreMatrixCell[] {
  const matrix: ScoreMatrixCell[] = [];

  for (let homeGoals = 0; homeGoals <= maxGoals; homeGoals += 1) {
    for (let awayGoals = 0; awayGoals <= maxGoals; awayGoals += 1) {
      matrix.push({
        homeGoals,
        awayGoals,
        probability: poissonProbability(expectedGoals.home, homeGoals) * poissonProbability(expectedGoals.away, awayGoals),
      });
    }
  }

  const coveredProbability = matrix.reduce((total, scoreline) => total + scoreline.probability, 0);

  return matrix.map((scoreline) => ({
    ...scoreline,
    probability: scoreline.probability / coveredProbability,
  }));
}
