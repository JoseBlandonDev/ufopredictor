import type { RiskLevel } from "@/types/prediction";

export type PublicExpertReadInput = {
  homeTeamName: string;
  awayTeamName: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
};

export type PublicExpertReadConfidenceInput = {
  confidenceScore: number;
  riskLevel: RiskLevel;
};

export type PublicExpertReadView = {
  summary: string;
  confidenceNote: string | null;
};

const BALANCED_OUTCOME_GAP = 4;
const DRAW_STAYS_RELEVANT_GAP = 6;
const CLEAR_OUTCOME_EDGE = 10;

function isFiniteProbability(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function normalizeTeamName(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function buildBalancedSummary(homeTeamName: string, awayTeamName: string) {
  return `El modelo ve un partido muy equilibrado entre ${homeTeamName} y ${awayTeamName}.`;
}

function buildDrawLedSummary(homeTeamName: string, awayTeamName: string) {
  return `El modelo ve un partido muy equilibrado entre ${homeTeamName} y ${awayTeamName}, con el empate apenas por delante.`;
}

function buildEdgeSummary(teamName: string, drawRelevant: boolean) {
  if (drawRelevant) {
    return `El modelo le da una ligera ventaja a ${teamName}, aunque el empate sigue siendo importante en la lectura del partido.`;
  }

  return `El modelo le da a ${teamName} la probabilidad más alta en su lectura del partido.`;
}

export function buildPublicExpertReadSummary(input: PublicExpertReadInput) {
  const homeTeamName = normalizeTeamName(input.homeTeamName, "el local");
  const awayTeamName = normalizeTeamName(input.awayTeamName, "el visitante");

  if (
    !isFiniteProbability(input.homeWinProb) ||
    !isFiniteProbability(input.drawProb) ||
    !isFiniteProbability(input.awayWinProb)
  ) {
    return "La lectura del modelo no está disponible para este partido en este momento.";
  }

  const outcomes = [
    {
      key: "home" as const,
      label: homeTeamName,
      value: input.homeWinProb,
    },
    {
      key: "draw" as const,
      label: "el empate",
      value: input.drawProb,
    },
    {
      key: "away" as const,
      label: awayTeamName,
      value: input.awayWinProb,
    },
  ].sort((left, right) => right.value - left.value);

  const leader = outcomes[0];
  const runnerUp = outcomes[1];
  const homeAwayGap = Math.abs(input.homeWinProb - input.awayWinProb);
  const leaderGap = leader.value - runnerUp.value;
  const drawCloseToLeader = leader.value - input.drawProb <= DRAW_STAYS_RELEVANT_GAP;

  if (leader.key === "draw") {
    return buildDrawLedSummary(homeTeamName, awayTeamName);
  }

  if (
    homeAwayGap <= BALANCED_OUTCOME_GAP &&
    Math.abs(input.homeWinProb - input.drawProb) <= DRAW_STAYS_RELEVANT_GAP &&
    Math.abs(input.awayWinProb - input.drawProb) <= DRAW_STAYS_RELEVANT_GAP
  ) {
    return buildBalancedSummary(homeTeamName, awayTeamName);
  }

  if (leaderGap >= CLEAR_OUTCOME_EDGE) {
    return buildEdgeSummary(leader.label, false);
  }

  return buildEdgeSummary(leader.label, drawCloseToLeader);
}

export function buildPublicExpertConfidenceNote(
  input: PublicExpertReadConfidenceInput | null | undefined,
) {
  if (!input || !Number.isFinite(input.confidenceScore)) {
    return null;
  }

  if (input.riskLevel === "high" || input.confidenceScore < 58) {
    return "La lectura del modelo sigue abierta y con bastante incertidumbre.";
  }

  if (input.riskLevel === "low" && input.confidenceScore >= 68) {
    return "Dentro del modelo, esta lectura aparece relativamente estable.";
  }

  return "Dentro del modelo, esta lectura todavía deja espacio para varios desenlaces.";
}

export function buildPublicExpertReadView(args: {
  base: PublicExpertReadInput;
  confidence?: PublicExpertReadConfidenceInput | null;
}): PublicExpertReadView {
  return {
    summary: buildPublicExpertReadSummary(args.base),
    confidenceNote: buildPublicExpertConfidenceNote(args.confidence),
  };
}
