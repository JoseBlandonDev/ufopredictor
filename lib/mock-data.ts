import type { Match, Team } from "@/types/football";
import type { MockUser, Plan } from "@/types/plans";
import type { PastPrediction, PerformanceMetric, Prediction } from "@/types/prediction";
import type { WorkerRun } from "@/types/workers";

export const teams: Team[] = [
  { id: "colombia", name: "Colombia", slug: "colombia", country: "Colombia", flag: "CO", fifaRank: 12, eloRating: 1858 },
  { id: "portugal", name: "Portugal", slug: "portugal", country: "Portugal", flag: "PT", fifaRank: 6, eloRating: 1939 },
  { id: "japan", name: "Japón", slug: "japan", country: "Japan", flag: "JP", fifaRank: 18, eloRating: 1794 },
  { id: "mexico", name: "México", slug: "mexico", country: "Mexico", flag: "MX", fifaRank: 14, eloRating: 1812 },
  { id: "usa", name: "Estados Unidos", slug: "united-states", country: "USA", flag: "US", fifaRank: 11, eloRating: 1826 },
  { id: "germany", name: "Alemania", slug: "germany", country: "Germany", flag: "DE", fifaRank: 9, eloRating: 1887 },
  { id: "morocco", name: "Marruecos", slug: "morocco", country: "Morocco", flag: "MA", fifaRank: 13, eloRating: 1819 },
  { id: "argentina", name: "Argentina", slug: "argentina", country: "Argentina", flag: "AR", fifaRank: 1, eloRating: 2015 },
];

const worldCup = {
  id: "wc-2026",
  name: "Mundial 2026",
  slug: "world-cup-2026",
  season: "2026",
};

const byId = Object.fromEntries(teams.map((team) => [team.id, team])) as Record<string, Team>;

type LabMatch = {
  id: string;
  competition: {
    name: string;
    usageScope: "internal_lab";
  };
  stage: string;
  kickoffAt: string;
  homeTeam: string;
  awayTeam: string;
  labStatus: "ready" | "review" | "needs_data";
};

type LabPrediction = {
  matchId: string;
  modelVersion: "mock-v0.1";
  runScope: "internal_lab";
  status: "generated" | "pending_data";
  confidenceScore: number | null;
};

export const matches: Match[] = [
  {
    id: "match-colombia-portugal",
    slug: "colombia-vs-portugal",
    competition: worldCup,
    stage: "Fase de grupos",
    venue: "MetLife Stadium",
    city: "New York/New Jersey",
    kickoffAt: "2026-06-18T20:00:00Z",
    status: "scheduled",
    predictionStatus: "post-lineup",
    homeTeam: byId.colombia,
    awayTeam: byId.portugal,
    isPremium: true,
    betaStatus: "ready",
  },
  {
    id: "match-japan-mexico",
    slug: "japan-vs-mexico",
    competition: worldCup,
    stage: "Fase de grupos",
    venue: "AT&T Stadium",
    city: "Dallas",
    kickoffAt: "2026-06-19T01:00:00Z",
    status: "scheduled",
    predictionStatus: "pre-match",
    homeTeam: byId.japan,
    awayTeam: byId.mexico,
    isPremium: false,
    betaStatus: "review",
  },
  {
    id: "match-usa-germany",
    slug: "united-states-vs-germany",
    competition: worldCup,
    stage: "Octavos de final",
    venue: "SoFi Stadium",
    city: "Los Angeles",
    kickoffAt: "2026-07-03T23:00:00Z",
    status: "scheduled",
    predictionStatus: "pre-kickoff",
    homeTeam: byId.usa,
    awayTeam: byId.germany,
    isPremium: true,
    betaStatus: "ready",
  },
  {
    id: "match-morocco-argentina",
    slug: "morocco-vs-argentina",
    competition: worldCup,
    stage: "Cuartos de final",
    venue: "Hard Rock Stadium",
    city: "Miami",
    kickoffAt: "2026-07-10T00:00:00Z",
    status: "scheduled",
    predictionStatus: "pre-match",
    homeTeam: byId.morocco,
    awayTeam: byId.argentina,
    isPremium: true,
    betaStatus: "needs-data",
  },
];

export const predictions: Prediction[] = [
  {
    id: "pred-colombia-portugal",
    matchId: "match-colombia-portugal",
    modelVersion: "mock-v0.1",
    probabilities: { homeWin: 25, draw: 27, awayWin: 48 },
    expectedGoals: { home: 1.05, away: 1.48 },
    mostLikelyScore: "1-1",
    topScores: [
      { score: "1-1", probability: 12.2 },
      { score: "1-2", probability: 10.8 },
      { score: "0-1", probability: 9.7 },
    ],
    overUnder25: { over: 49, under: 51 },
    btts: { yes: 53, no: 47 },
    confidenceScore: 62,
    riskLevel: "medium",
    modelVsMarket: [
      { selection: "Portugal", modelProbability: 48, marketProbability: 44, edge: 4, label: "slight edge" },
      { selection: "Empate", modelProbability: 27, marketProbability: 29, edge: -2, label: "no edge" },
      { selection: "Colombia", modelProbability: 25, marketProbability: 27, edge: -2, label: "no edge" },
    ],
    timeline: [
      { label: "T-24h", timestamp: "2026-06-17T20:00:00Z", homeWin: 27, draw: 28, awayWin: 45, note: "Lectura estadística base" },
      { label: "T-6h", timestamp: "2026-06-18T14:00:00Z", homeWin: 26, draw: 27, awayWin: 47, note: "La señal de mercado acompaña la presión visitante" },
      { label: "T-60min", timestamp: "2026-06-18T19:00:00Z", homeWin: 25, draw: 27, awayWin: 48, note: "Actualización con alineaciones oficiales aplicada" },
    ],
    goldenHourDelta: {
      homeDelta: -2,
      drawDelta: -1,
      awayDelta: 3,
      reason: "Portugal mantiene su línea ofensiva completa mientras Colombia rota a un generador clave.",
    },
    freeSummary: "Portugal llega con una ventaja estrecha del modelo, pero la zona de empate sigue siendo relevante.",
    premiumAnalysis: "El modelo favorece a Portugal por calidad de definición y alineación con el mercado. La compactación defensiva de Colombia mantiene moderada la brecha de goles esperados, lo que aumenta la sensibilidad al empate.",
    whyItChanged: "La confirmación de alineaciones elevó el contexto ofensivo de Portugal y redujo levemente la señal de generación de ocasiones de Colombia.",
    generatedAt: "2026-06-18T19:05:00Z",
  },
  {
    id: "pred-japan-mexico",
    matchId: "match-japan-mexico",
    modelVersion: "mock-v0.1",
    probabilities: { homeWin: 34, draw: 30, awayWin: 36 },
    expectedGoals: { home: 1.22, away: 1.28 },
    mostLikelyScore: "1-1",
    topScores: [
      { score: "1-1", probability: 13.5 },
      { score: "0-1", probability: 9.9 },
      { score: "1-2", probability: 9.4 },
    ],
    overUnder25: { over: 46, under: 54 },
    btts: { yes: 55, no: 45 },
    confidenceScore: 56,
    riskLevel: "high",
    modelVsMarket: [
      { selection: "México", modelProbability: 36, marketProbability: 37, edge: -1, label: "no edge" },
      { selection: "Japón", modelProbability: 34, marketProbability: 33, edge: 1, label: "no edge" },
      { selection: "Empate", modelProbability: 30, marketProbability: 30, edge: 0, label: "no edge" },
    ],
    timeline: [
      { label: "T-24h", timestamp: "2026-06-18T01:00:00Z", homeWin: 33, draw: 30, awayWin: 37, note: "Primera ejecución del modelo" },
      { label: "T-6h", timestamp: "2026-06-18T19:00:00Z", homeWin: 34, draw: 30, awayWin: 36, note: "El mercado se movió hacia el equilibrio" },
    ],
    goldenHourDelta: {
      homeDelta: 1,
      drawDelta: 0,
      awayDelta: -1,
      reason: "Aún no hay señal fuerte de alineaciones. El delta permanece por debajo del umbral de alerta premium.",
    },
    freeSummary: "Perfil de partido muy cerrado, con riesgo de empate elevado y sin separación fuerte entre modelo y mercado.",
    premiumAnalysis: "Ambas selecciones proyectan una calidad de ocasiones similar. El modelo lo trata como un partido de alta volatilidad donde una novedad de alineación puede mover las probabilidades finales.",
    whyItChanged: "El movimiento del mercado comprimió la diferencia entre las selecciones.",
    generatedAt: "2026-06-18T19:10:00Z",
  },
  {
    id: "pred-usa-germany",
    matchId: "match-usa-germany",
    modelVersion: "mock-v0.1",
    probabilities: { homeWin: 21, draw: 25, awayWin: 54 },
    expectedGoals: { home: 0.98, away: 1.71 },
    mostLikelyScore: "0-1",
    topScores: [
      { score: "0-1", probability: 11.8 },
      { score: "1-2", probability: 10.6 },
      { score: "1-1", probability: 10.1 },
    ],
    overUnder25: { over: 52, under: 48 },
    btts: { yes: 50, no: 50 },
    confidenceScore: 68,
    riskLevel: "medium",
    modelVsMarket: [
      { selection: "Alemania", modelProbability: 54, marketProbability: 49, edge: 5, label: "slight edge" },
      { selection: "Empate", modelProbability: 25, marketProbability: 26, edge: -1, label: "no edge" },
      { selection: "Estados Unidos", modelProbability: 21, marketProbability: 25, edge: -4, label: "no edge" },
    ],
    timeline: [
      { label: "T-24h", timestamp: "2026-07-02T23:00:00Z", homeWin: 23, draw: 26, awayWin: 51, note: "Contexto de eliminación directa aplicado" },
      { label: "T-6h", timestamp: "2026-07-03T17:00:00Z", homeWin: 22, draw: 25, awayWin: 53, note: "La señal de mercado fortaleció a Alemania" },
      { label: "Preinicio", timestamp: "2026-07-03T22:45:00Z", homeWin: 21, draw: 25, awayWin: 54, note: "Predicción simulada final bloqueada" },
    ],
    goldenHourDelta: {
      homeDelta: -2,
      drawDelta: -1,
      awayDelta: 3,
      reason: "Alemania inicia con su estructura preferida en mediocampo.",
    },
    freeSummary: "Alemania lidera el modelo con confianza moderada en contexto de eliminación directa.",
    premiumAnalysis: "La ventaja de Alemania se apoya en separación de goles esperados y mayor alineación con el mercado. La varianza de eliminación directa impide clasificarlo como riesgo bajo.",
    whyItChanged: "La alineación final mejoró la proyección de progresión y calidad de remate de Alemania.",
    generatedAt: "2026-07-03T22:46:00Z",
  },
  {
    id: "pred-morocco-argentina",
    matchId: "match-morocco-argentina",
    modelVersion: "mock-v0.1",
    probabilities: { homeWin: 18, draw: 24, awayWin: 58 },
    expectedGoals: { home: 0.86, away: 1.82 },
    mostLikelyScore: "0-2",
    topScores: [
      { score: "0-2", probability: 10.9 },
      { score: "1-2", probability: 10.4 },
      { score: "0-1", probability: 10.2 },
    ],
    overUnder25: { over: 55, under: 45 },
    btts: { yes: 48, no: 52 },
    confidenceScore: 71,
    riskLevel: "medium",
    modelVsMarket: [
      { selection: "Argentina", modelProbability: 58, marketProbability: 55, edge: 3, label: "slight edge" },
      { selection: "Empate", modelProbability: 24, marketProbability: 25, edge: -1, label: "no edge" },
      { selection: "Marruecos", modelProbability: 18, marketProbability: 20, edge: -2, label: "no edge" },
    ],
    timeline: [
      { label: "T-24h", timestamp: "2026-07-09T00:00:00Z", homeWin: 19, draw: 25, awayWin: 56, note: "Lectura inicial de cuartos de final" },
      { label: "T-6h", timestamp: "2026-07-09T18:00:00Z", homeWin: 18, draw: 24, awayWin: 58, note: "Mercado y forma reciente se alinean" },
    ],
    goldenHourDelta: {
      homeDelta: 0,
      drawDelta: -1,
      awayDelta: 1,
      reason: "Alineaciones pendientes. La actualización Golden Hour seguirá simulada hasta integrar proveedores.",
    },
    freeSummary: "Argentina sostiene la ventaja más fuerte de la cartelera simulada actual.",
    premiumAnalysis: "La proyección nace de mayor eficiencia ofensiva y un puntaje de confianza superior, mientras el perfil de transición de Marruecos mantiene el BTTS cerca del equilibrio.",
    whyItChanged: "Aún no hay cambio confirmado de alineación; el movimiento viene de actualizaciones de mercado y forma.",
    generatedAt: "2026-07-09T18:04:00Z",
  },
];

export const labMatches: LabMatch[] = [
  {
    id: "lab-match-aurora-meridian",
    competition: { name: "Copa Orbital de Clubes", usageScope: "internal_lab" },
    stage: "Final mock de calibración",
    kickoffAt: "2026-05-14T23:00:00Z",
    homeTeam: "Aurora FC",
    awayTeam: "Atlético Meridian",
    labStatus: "ready",
  },
  {
    id: "lab-match-pacifico-estrella",
    competition: { name: "Copa Orbital de Clubes", usageScope: "internal_lab" },
    stage: "Semifinal mock",
    kickoffAt: "2026-05-27T22:00:00Z",
    homeTeam: "Pacífico Sur",
    awayTeam: "Estrella Norte",
    labStatus: "review",
  },
  {
    id: "lab-match-meridian-pacifico",
    competition: { name: "Amistosos de Calibración", usageScope: "internal_lab" },
    stage: "Amistoso mock",
    kickoffAt: "2026-05-29T19:30:00Z",
    homeTeam: "Atlético Meridian",
    awayTeam: "Pacífico Sur",
    labStatus: "needs_data",
  },
];

export const labPredictions: LabPrediction[] = [
  {
    matchId: "lab-match-aurora-meridian",
    modelVersion: "mock-v0.1",
    runScope: "internal_lab",
    status: "generated",
    confidenceScore: 57,
  },
  {
    matchId: "lab-match-pacifico-estrella",
    modelVersion: "mock-v0.1",
    runScope: "internal_lab",
    status: "generated",
    confidenceScore: 54,
  },
  {
    matchId: "lab-match-meridian-pacifico",
    modelVersion: "mock-v0.1",
    runScope: "internal_lab",
    status: "pending_data",
    confidenceScore: null,
  },
];

export const plans: Plan[] = [
  {
    id: "plan-free",
    name: "Gratis",
    slug: "free",
    description: "Señal diaria básica para revisar partidos de forma casual.",
    price: 0,
    currency: "USD",
    billingType: "free",
    isActive: true,
    features: [
      { key: "basic_1x2", label: "Probabilidades 1X2 básicas", included: true },
      { key: "short_summary", label: "Resumen corto estilo IA", included: true },
      { key: "premium_markets", label: "Mercados premium", included: false },
    ],
  },
  {
    id: "plan-world-cup",
    name: "World Cup Pass",
    slug: "world-cup-pass",
    description: "Análisis premium para todos los partidos del Mundial 2026.",
    price: 29,
    currency: "USD",
    billingType: "one_time",
    isActive: true,
    highlighted: true,
    features: [
      { key: "all_matches", label: "Todos los partidos del Mundial", included: true },
      { key: "golden_hour_delta", label: "Golden Hour Delta", included: true },
      { key: "model_vs_market", label: "Modelo vs Mercado", included: true },
    ],
  },
  {
    id: "plan-10-pack",
    name: "Pack de 10 partidos",
    slug: "10-match-pack",
    description: "Desbloquea lecturas premium para diez partidos seleccionados.",
    price: 12,
    currency: "USD",
    billingType: "custom_pack",
    isActive: true,
    features: [
      { key: "matches_limit", label: "10 desbloqueos premium de partido", included: true },
      { key: "timeline", label: "Línea de tiempo de predicción", included: true },
      { key: "alerts", label: "Alertas premium", included: false },
    ],
  },
  {
    id: "plan-knockout",
    name: "Pase fase eliminatoria",
    slug: "knockout-pass",
    description: "Preparado para activarse en fases eliminatorias.",
    price: 18,
    currency: "USD",
    billingType: "one_time",
    isActive: false,
    features: [
      { key: "stage_scope", label: "Acceso a fase eliminatoria", included: true },
      { key: "risk_notes", label: "Notas de riesgo ampliadas", included: true },
    ],
  },
  {
    id: "plan-team",
    name: "Pase por selección",
    slug: "team-pass",
    description: "Sigue una selección durante todo el torneo.",
    price: 9,
    currency: "USD",
    billingType: "one_time",
    isActive: false,
    features: [
      { key: "team_scope", label: "Cobertura de una selección", included: true },
      { key: "team_alerts", label: "Alertas de selección", included: true },
    ],
  },
  {
    id: "plan-premium-monthly",
    name: "Premium mensual",
    slug: "premium-monthly",
    description: "Acceso mensual futuro para ligas después del Mundial.",
    price: 15,
    currency: "USD",
    billingType: "monthly",
    isActive: false,
    features: [
      { key: "monthly_access", label: "Acceso premium mensual", included: true },
      { key: "league_scope", label: "Cobertura futura de ligas", included: true },
    ],
  },
];

export const mockUser: MockUser = {
  id: "user-demo",
  name: "Observador beta",
  email: "observer@ufopredictor.test",
  planSlug: "free",
  entitlements: [
    {
      id: "ent-free-daily",
      userId: "user-demo",
      entitlementType: "free_daily",
      resourceType: "global",
      resourceId: "daily-free",
      quantity: 1,
    },
  ],
  matchUnlocks: [
    {
      id: "unlock-japan-mexico",
      userId: "user-demo",
      matchId: "match-japan-mexico",
      sourcePlanId: "plan-free",
      unlockedAt: "2026-06-18T00:00:00Z",
      expiresAt: "2026-06-19T03:00:00Z",
    },
  ],
};

export const performanceMetrics: PerformanceMetric[] = [
  { label: "Precisión 1X2", value: "61%", detail: "Muestra beta simulada, 62 partidos validados" },
  { label: "Precisión BTTS", value: "58%", detail: "Dato de plantilla hasta tener validación real" },
  { label: "Precisión OU 2.5", value: "55%", detail: "Métrica de transparencia simulada" },
  { label: "Mejora postalineación", value: "+4.2%", detail: "Comparación simulada contra ejecuciones prealineación" },
];

export const pastPredictions: PastPrediction[] = [
  { match: "Brasil vs Croacia", market: "1X2", prediction: "Brasil", result: "Brasil 2-0", status: "hit" },
  { match: "España vs Uruguay", market: "BTTS", prediction: "Sí", result: "1-0", status: "miss" },
  { match: "Francia vs Senegal", market: "OU 2.5", prediction: "Menos", result: "Pendiente", status: "pending" },
];

export const workerRuns: WorkerRun[] = [
  {
    id: "run-sync-fixtures",
    workerName: "sync-fixtures",
    status: "success",
    startedAt: "2026-06-18T10:00:00Z",
    finishedAt: "2026-06-18T10:00:08Z",
    recordsProcessed: 48,
    metadata: { provider: "mock", competition: "wc-2026" },
  },
  {
    id: "run-sync-odds",
    workerName: "sync-odds",
    status: "failed",
    startedAt: "2026-06-18T11:00:00Z",
    finishedAt: "2026-06-18T11:00:04Z",
    recordsProcessed: 0,
    errorMessage: "Timeout simulado del proveedor de cuotas",
    metadata: { provider: "mock", retryable: true },
  },
  {
    id: "run-generate-prediction",
    workerName: "generate-prediction",
    status: "running",
    startedAt: "2026-06-18T19:00:00Z",
    recordsProcessed: 4,
    metadata: { modelVersion: "mock-v0.1", dryRun: true },
  },
  {
    id: "run-generate-narrative",
    workerName: "generate-narrative",
    status: "queued",
    startedAt: "2026-06-18T19:03:00Z",
    recordsProcessed: 0,
    metadata: { llmProvider: "mock", locale: "es/en" },
  },
];

export function getPredictionForMatch(matchId: string) {
  return predictions.find((prediction) => prediction.matchId === matchId);
}

export function getMatchBySlug(slug: string) {
  return matches.find((match) => match.slug === slug);
}
