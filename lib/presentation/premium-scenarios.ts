import { formatProbability, resolveTeamDisplayName } from "./public-display";

export type RepresentativeScenario = {
  title: string;
  scoreline: string;
  probabilityLabel: string;
  explanation: string;
  supportSignals: string[];
  weakeningCondition: string;
  disclaimer: string;
};

type ScenarioInput = {
  score: string;
  probability: number;
  homeTeamName: string;
  awayTeamName: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  expectedGoals: {
    home: number;
    away: number;
  } | null;
  btts: {
    yesProbability: number;
    noProbability: number;
  } | null;
  totalGoals25: {
    overProbability: number;
    underProbability: number;
  } | null;
};

const SCENARIO_DISCLAIMER =
  "Estos marcadores representan caminos plausibles del partido. No son resultados garantizados ni una recomendación de apuesta.";

function parseScore(score: string) {
  const match = score.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!match) {
    return null;
  }

  return {
    homeGoals: Number.parseInt(match[1], 10),
    awayGoals: Number.parseInt(match[2], 10),
  };
}

function getScenarioTitle(score: { homeGoals: number; awayGoals: number }) {
  const margin = score.homeGoals - score.awayGoals;
  const totalGoals = score.homeGoals + score.awayGoals;

  if (score.homeGoals === 0 && score.awayGoals === 0) {
    return "Partido cerrado";
  }

  if (margin === 0 && totalGoals > 0) {
    return "Intercambio equilibrado";
  }

  if (margin === 1) {
    return "Victoria local ajustada";
  }

  if (margin >= 2) {
    return "Dominio local";
  }

  if (margin === -1) {
    return "Victoria visitante ajustada";
  }

  return "Golpe visitante";
}

function buildExplanation(input: ScenarioInput, parsedScore: { homeGoals: number; awayGoals: number }) {
  const homeTeam = resolveTeamDisplayName(input.homeTeamName);
  const awayTeam = resolveTeamDisplayName(input.awayTeamName);
  const totalGoals = parsedScore.homeGoals + parsedScore.awayGoals;

  if (parsedScore.homeGoals === parsedScore.awayGoals) {
    return totalGoals === 0
      ? `El modelo contempla un partido muy cerrado, con pocas llegadas claras para ${homeTeam} y ${awayTeam}.`
      : `El modelo deja espacio para un duelo equilibrado en el que ${homeTeam} y ${awayTeam} respondan mutuamente.`;
  }

  if (parsedScore.homeGoals > parsedScore.awayGoals) {
    return `Este escenario representa un partido en el que ${homeTeam} convierte su ligera ventaja probabilística en el marcador.`;
  }

  return `Este escenario representa un partido en el que ${awayTeam} encuentra una respuesta eficaz y rompe el guion principal del local.`;
}

function buildSupportSignals(input: ScenarioInput, parsedScore: { homeGoals: number; awayGoals: number }) {
  const signals: string[] = [];
  const totalGoals = parsedScore.homeGoals + parsedScore.awayGoals;

  if (parsedScore.homeGoals > parsedScore.awayGoals) {
    signals.push(`Victoria local 1X2: ${formatProbability(input.homeWinProb)}`);
  } else if (parsedScore.awayGoals > parsedScore.homeGoals) {
    signals.push(`Victoria visitante 1X2: ${formatProbability(input.awayWinProb)}`);
  } else {
    signals.push(`Empate 1X2: ${formatProbability(input.drawProb)}`);
  }

  if (input.expectedGoals) {
    signals.push(
      `xG estimado: ${input.expectedGoals.home.toFixed(2)} - ${input.expectedGoals.away.toFixed(2)}`,
    );
  }

  if (input.btts) {
    if (parsedScore.homeGoals > 0 && parsedScore.awayGoals > 0) {
      signals.push(
        `Ambos equipos marcan: ${formatProbability(input.btts.yesProbability)}`,
      );
    } else {
      signals.push(
        `Ambos equipos no marcan: ${formatProbability(input.btts.noProbability)}`,
      );
    }
  }

  if (input.totalGoals25) {
    if (totalGoals >= 3) {
      signals.push(`Más de 2,5 goles: ${formatProbability(input.totalGoals25.overProbability)}`);
    } else {
      signals.push(`Menos de 2,5 goles: ${formatProbability(input.totalGoals25.underProbability)}`);
    }
  }

  return signals.slice(0, 3);
}

function buildWeakeningCondition(input: ScenarioInput, parsedScore: { homeGoals: number; awayGoals: number }) {
  const homeTeam = resolveTeamDisplayName(input.homeTeamName);
  const awayTeam = resolveTeamDisplayName(input.awayTeamName);

  if (parsedScore.homeGoals > parsedScore.awayGoals) {
    return `Se debilita si ${awayTeam} sostiene mejor el empate o reduce los espacios del partido.`;
  }

  if (parsedScore.awayGoals > parsedScore.homeGoals) {
    return `Se debilita si ${homeTeam} impone el ritmo esperado y empuja el partido hacia su probabilidad base.`;
  }

  return `Se debilita si el partido se abre antes de tiempo y uno de los dos equipos rompe el equilibrio central.`;
}

export function buildRepresentativeScenario(input: ScenarioInput): RepresentativeScenario {
  const parsedScore = parseScore(input.score);

  if (!parsedScore) {
    return {
      title: "Escenario representativo",
      scoreline: input.score,
      probabilityLabel: formatProbability(input.probability),
      explanation:
        "Este marcador representa una de las salidas plausibles que todavía encajan con la lectura actual del modelo.",
      supportSignals: [],
      weakeningCondition:
        "Puede perder fuerza si el partido se aleja rápido del ritmo central que sugiere el modelo.",
      disclaimer: SCENARIO_DISCLAIMER,
    };
  }

  return {
    title: getScenarioTitle(parsedScore),
    scoreline: input.score,
    probabilityLabel: formatProbability(input.probability),
    explanation: buildExplanation(input, parsedScore),
    supportSignals: buildSupportSignals(input, parsedScore),
    weakeningCondition: buildWeakeningCondition(input, parsedScore),
    disclaimer: SCENARIO_DISCLAIMER,
  };
}
