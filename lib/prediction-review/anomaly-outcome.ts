import type { OutcomeLeader } from "./types";

const OUTCOME_TIE_EPSILON = 1e-6;

export function resolveOutcomeLeader(homePct: number, drawPct: number, awayPct: number): OutcomeLeader {
  const ranked = [
    { side: "HOME" as const, value: homePct },
    { side: "DRAW" as const, value: drawPct },
    { side: "AWAY" as const, value: awayPct },
  ];
  const max = Math.max(homePct, drawPct, awayPct);
  const leaders = ranked.filter((entry) => Math.abs(entry.value - max) <= OUTCOME_TIE_EPSILON);

  if (leaders.length !== 1) {
    return "TIE";
  }

  return leaders[0]!.side;
}

export function isDirectionalOutcomeLeader(value: OutcomeLeader): value is Exclude<OutcomeLeader, "DRAW" | "TIE"> {
  return value === "HOME" || value === "AWAY";
}
