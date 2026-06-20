import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SIGNAL_SOURCE_SNAPSHOT_ID, REVIEW_WINDOW_DAYS } from "../prediction-review/constants";
import { calculateExternalCoherenceAlerts, calculateRefreshDeltaAlerts } from "../prediction-review/alerts";
import { buildAtypicalFixtureAnalysisReport } from "../prediction-review/anomaly-detection";
import { buildAtypicalFixtureDetectorInput } from "../prediction-review/anomaly-evidence-adapter";
import { buildPredictionReviewBundleFromSnapshot, buildPredictionReviewBundleFromVersion } from "../prediction-review/bundle";
import { discoverPredictionReviewAiAvailability } from "../prediction-review/ai";
import { findPredictionReviewCoherenceFixture, orientPredictionReviewCoherenceFixture } from "../prediction-review/coherence-source";
import { isRetainedPredictionReviewFixture } from "../prediction-review/fixtures";
import { readPredictionReviewProviderState, validatePredictionReviewProviderFixture } from "../prediction-review/provider";
import { resolvePredictionReviewTeamDisplayNameEs } from "../prediction-review/team-display-names";
import { WORLD_CUP_GROUP_STAGE_2_ROUND } from "../world-cup-2026/matchday2-ops";
import type {
  MatchRow,
  PredictionMarketRow,
  PredictionReviewAiExecutionRow,
  PredictionReviewCaseRow,
  PredictionReviewDecisionRow,
  PredictionReviewSnapshotRow,
  PredictionVersionRow,
  TeamRow,
  CompetitionRow,
  ModelVersionRow,
} from "@/types/database";
import type { AtypicalFixtureAnalysisReportV1, PredictionReviewCaseSummary } from "../prediction-review/types";

const WORLD_CUP_COMPETITION_SLUG = "world-cup-2026";
const ELIGIBLE_MATCHDAY2_MATCH_STATUSES: MatchRow["status"][] = ["scheduled"];

type ReviewMatchRow = Pick<
  MatchRow,
  "id" | "external_id" | "slug" | "competition_id" | "home_team_id" | "away_team_id" | "kickoff_at" | "stage" | "status" | "access_scope" | "intake_source"
> & {
  external_id: string;
};

type ReviewCompetitionRow = Pick<CompetitionRow, "id" | "name" | "slug" | "usage_scope">;
type ReviewTeamRow = Pick<TeamRow, "id" | "name">;
type ReviewPredictionVersionRow = Pick<
  PredictionVersionRow,
  | "id"
  | "match_id"
  | "model_version_id"
  | "prediction_type"
  | "home_win_prob"
  | "draw_prob"
  | "away_win_prob"
  | "expected_home_goals"
  | "expected_away_goals"
  | "most_likely_score"
  | "top_scores_json"
  | "confidence_score"
  | "risk_level"
  | "run_scope"
  | "created_at"
>;

type ReviewModelVersionRow = Pick<ModelVersionRow, "id" | "version">;
type ReviewPredictionMarketRow = Pick<PredictionMarketRow, "prediction_version_id" | "market" | "selection" | "probability">;

function toLatestByMatchId<T extends { match_id: string }>(rows: T[]) {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (!map.has(row.match_id)) {
      map.set(row.match_id, row);
    }
  }
  return map;
}

function toLatestByCaseId<T extends { review_case_id: string }>(rows: T[]) {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (!map.has(row.review_case_id)) {
      map.set(row.review_case_id, row);
    }
  }
  return map;
}

export type PredictionRefreshReviewPageData = {
  aiAvailability: ReturnType<typeof discoverPredictionReviewAiAvailability>;
  atypicalAnalysisReport: AtypicalFixtureAnalysisReportV1 | null;
  cases: PredictionReviewCaseSummary[];
  warnings: string[];
};

export async function getPredictionRefreshReviewPageData(): Promise<PredictionRefreshReviewPageData> {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const maxKickoff = new Date(now.getTime() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("id, external_id, slug, competition_id, home_team_id, away_team_id, kickoff_at, stage, status, access_scope, intake_source")
    .eq("intake_source", "api_football")
    .in("access_scope", ["admin_only", "public"])
    .gte("kickoff_at", new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString())
    .lte("kickoff_at", maxKickoff)
    .order("kickoff_at", { ascending: true });

  if (matchError) {
    throw new Error(`No fue posible leer los fixtures para prediction refresh review: ${matchError.message}`);
  }

  const matches = ((matchData ?? []) as ReviewMatchRow[]).filter((match) => match.external_id);
  if (matches.length === 0) {
    return {
      aiAvailability: discoverPredictionReviewAiAvailability(),
      atypicalAnalysisReport: null,
      cases: [],
      warnings: [],
    };
  }

  const matchIds = matches.map((match) => match.id);
  const competitionIds = [...new Set(matches.map((match) => match.competition_id))];
  const teamIds = [...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))];

  const [
    { data: competitionData, error: competitionError },
    { data: teamData, error: teamError },
    { data: publicPredictionData, error: publicPredictionError },
    { data: internalPredictionData, error: internalPredictionError },
    reviewTables,
  ] = await Promise.all([
    supabase.from("competitions").select("id, name, slug, usage_scope").in("id", competitionIds),
    supabase.from("teams").select("id, name").in("id", teamIds),
    supabase
      .from("prediction_versions")
      .select("id, match_id, model_version_id, prediction_type, home_win_prob, draw_prob, away_win_prob, expected_home_goals, expected_away_goals, most_likely_score, top_scores_json, confidence_score, risk_level, run_scope, created_at")
      .in("match_id", matchIds)
      .eq("prediction_type", "pre_match_24h")
      .eq("run_scope", "public_product")
      .order("created_at", { ascending: false }),
    supabase
      .from("prediction_versions")
      .select("id, match_id, model_version_id, prediction_type, home_win_prob, draw_prob, away_win_prob, expected_home_goals, expected_away_goals, most_likely_score, top_scores_json, confidence_score, risk_level, run_scope, created_at")
      .in("match_id", matchIds)
      .eq("prediction_type", "pre_match_24h")
      .eq("run_scope", "internal_lab")
      .order("created_at", { ascending: false }),
    Promise.all([
      supabase.from("prediction_review_cases").select("*").in("match_id", matchIds).order("created_at", { ascending: false }),
      supabase.from("prediction_review_snapshots").select("*").order("created_at", { ascending: false }),
      supabase.from("prediction_review_ai_executions").select("*").order("created_at", { ascending: false }),
      supabase.from("prediction_review_decisions").select("*").order("created_at", { ascending: false }),
    ]),
  ]);

  const warnings: string[] = [];
  if (competitionError) {
    warnings.push(`No fue posible leer las competiciones del review gate: ${competitionError.message}`);
  }
  if (teamError) {
    warnings.push(`No fue posible leer los equipos del review gate: ${teamError.message}`);
  }
  if (publicPredictionError) {
    warnings.push(`No fue posible leer las predicciones publicas actuales: ${publicPredictionError.message}`);
  }
  if (internalPredictionError) {
    warnings.push(`No fue posible leer las predicciones internas actuales: ${internalPredictionError.message}`);
  }

  const [caseResult, snapshotResult, aiExecutionResult, decisionResult] = reviewTables;
  const reviewCases = caseResult.error ? [] : ((caseResult.data ?? []) as PredictionReviewCaseRow[]);
  if (caseResult.error) {
    warnings.push(`Review-case tables are not readable yet: ${caseResult.error.message}`);
  }
  const reviewSnapshots = snapshotResult.error ? [] : ((snapshotResult.data ?? []) as PredictionReviewSnapshotRow[]);
  if (snapshotResult.error) {
    warnings.push(`Review snapshot rows are not readable yet: ${snapshotResult.error.message}`);
  }
  const aiExecutions = aiExecutionResult.error ? [] : ((aiExecutionResult.data ?? []) as PredictionReviewAiExecutionRow[]);
  if (aiExecutionResult.error) {
    warnings.push(`AI execution audit rows are not readable yet: ${aiExecutionResult.error.message}`);
  }
  const reviewDecisions = decisionResult.error ? [] : ((decisionResult.data ?? []) as PredictionReviewDecisionRow[]);
  if (decisionResult.error) {
    warnings.push(`Review decision rows are not readable yet: ${decisionResult.error.message}`);
  }

  const currentPredictionRows = [
    ...((publicPredictionData ?? []) as ReviewPredictionVersionRow[]),
    ...((internalPredictionData ?? []) as ReviewPredictionVersionRow[]),
  ];
  const currentPredictionIds = [...new Set(currentPredictionRows.map((row) => row.id))];
  const modelVersionIds = [...new Set(currentPredictionRows.map((row) => row.model_version_id).filter(Boolean))];

  const [{ data: marketData }, { data: modelVersionData }] = await Promise.all([
    currentPredictionIds.length > 0
      ? supabase
          .from("prediction_markets")
          .select("prediction_version_id, market, selection, probability")
          .in("prediction_version_id", currentPredictionIds)
      : Promise.resolve({ data: [] }),
    modelVersionIds.length > 0
      ? supabase.from("model_versions").select("id, version").in("id", modelVersionIds)
      : Promise.resolve({ data: [] }),
  ]);

  const competitionById = new Map(((competitionData ?? []) as ReviewCompetitionRow[]).map((row) => [row.id, row]));
  const teamById = new Map(((teamData ?? []) as ReviewTeamRow[]).map((row) => [row.id, row.name]));
  const publicPredictionByMatchId = toLatestByMatchId((publicPredictionData ?? []) as ReviewPredictionVersionRow[]);
  const internalPredictionByMatchId = toLatestByMatchId((internalPredictionData ?? []) as ReviewPredictionVersionRow[]);
  const marketsByPredictionId = new Map<string, ReviewPredictionMarketRow[]>();
  for (const market of (marketData ?? []) as ReviewPredictionMarketRow[]) {
    const collection = marketsByPredictionId.get(market.prediction_version_id) ?? [];
    collection.push(market);
    marketsByPredictionId.set(market.prediction_version_id, collection);
  }
  const modelVersionById = new Map(((modelVersionData ?? []) as ReviewModelVersionRow[]).map((row) => [row.id, row.version]));
  const reviewCaseByMatchId = toLatestByMatchId(reviewCases.map((row) => ({ ...row, match_id: row.match_id })));
  const snapshotById = new Map(reviewSnapshots.map((row) => [row.id, row]));
  const sourceSnapshotIdByPredictionVersionId = new Map<string, string>();
  for (const snapshot of reviewSnapshots) {
    if (snapshot.source_prediction_version_id && !sourceSnapshotIdByPredictionVersionId.has(snapshot.source_prediction_version_id)) {
      sourceSnapshotIdByPredictionVersionId.set(snapshot.source_prediction_version_id, snapshot.source_snapshot_id);
    }
  }
  const latestAiExecutionByCaseId = toLatestByCaseId(aiExecutions);
  const latestDecisionByCaseId = toLatestByCaseId(reviewDecisions);

  const aiAvailability = discoverPredictionReviewAiAvailability();
  const analysisAsOf = now.toISOString();
  const cases = await Promise.all(
    matches
      .filter((match) => competitionById.get(match.competition_id)?.usage_scope === "public_product")
      .map(async (match) => {
        const competition = competitionById.get(match.competition_id);
        const homeTeamName = teamById.get(match.home_team_id) ?? "Home team unavailable";
        const awayTeamName = teamById.get(match.away_team_id) ?? "Away team unavailable";
        const currentPredictionRow = publicPredictionByMatchId.get(match.id) ?? internalPredictionByMatchId.get(match.id) ?? null;
        const currentPrediction = currentPredictionRow
          ? buildPredictionReviewBundleFromVersion({
              kind: "current_reference",
              predictionVersion: currentPredictionRow,
              markets: marketsByPredictionId.get(currentPredictionRow.id) ?? [],
              sourceSnapshotId: SIGNAL_SOURCE_SNAPSHOT_ID,
              provenanceLabel: currentPredictionRow.run_scope === "public_product" ? "Current public prediction" : "Current internal prediction",
              modelVersionLabel: modelVersionById.get(currentPredictionRow.model_version_id) ?? null,
            })
          : null;

        const coherenceFixture = findPredictionReviewCoherenceFixture({
          homeTeamName,
          awayTeamName,
        });
        const orientedCoherenceFixture = orientPredictionReviewCoherenceFixture({
          coherenceFixture,
          homeTeamName,
          awayTeamName,
        });
        const providerState = await readPredictionReviewProviderState(match.external_id);
        const providerGuard = validatePredictionReviewProviderFixture(
          {
            externalId: match.external_id,
            expectedKickoffAt: match.kickoff_at,
            expectedHomeTeamName: homeTeamName,
            expectedAwayTeamName: awayTeamName,
          },
          providerState,
          now,
        );
        const reviewCase = reviewCaseByMatchId.get(match.id) as PredictionReviewCaseRow | undefined;
        const shadowSnapshot = reviewCase?.latest_shadow_snapshot_id ? snapshotById.get(reviewCase.latest_shadow_snapshot_id) ?? null : null;
        const reviewedXgSnapshot = reviewCase?.latest_reviewed_xg_snapshot_id ? snapshotById.get(reviewCase.latest_reviewed_xg_snapshot_id) ?? null : null;
        const latestAiExecution = reviewCase ? latestAiExecutionByCaseId.get(reviewCase.id) ?? null : null;
        const latestDecision = reviewCase ? latestDecisionByCaseId.get(reviewCase.id) ?? null : null;

        const shadowPrediction = shadowSnapshot
          ? buildPredictionReviewBundleFromSnapshot({
              snapshot: shadowSnapshot,
              provenanceLabel: "Saved shadow prediction",
              modelVersionLabel: shadowSnapshot.model_version_id ? modelVersionById.get(shadowSnapshot.model_version_id) ?? null : null,
            })
          : null;
        const reviewedXgPreview = reviewedXgSnapshot
          ? buildPredictionReviewBundleFromSnapshot({
              snapshot: reviewedXgSnapshot,
              provenanceLabel: "Saved reviewed xG preview",
              modelVersionLabel: reviewedXgSnapshot.model_version_id ? modelVersionById.get(reviewedXgSnapshot.model_version_id) ?? null : null,
            })
          : null;

        return {
          matchId: match.id,
          externalId: match.external_id,
          slug: match.slug,
          kickoffAt: match.kickoff_at,
          providerStatus: providerState.status === "available" ? providerState.fixture.status : null,
          providerStatusShort: providerState.status === "available" ? providerState.fixture.statusShort : null,
          providerStatusLabel:
            providerState.status === "available" ? providerState.fixture.status : providerState.reason,
          providerStatusAvailable: providerGuard.allowed,
          providerStatusReason: providerGuard.reason,
          accessScope: match.access_scope === "public" ? "public" : "admin_only",
          competitionName: competition?.name ?? "Competition unavailable",
          homeTeamNameEn: homeTeamName,
          awayTeamNameEn: awayTeamName,
          homeTeamDisplayNameEs: orientedCoherenceFixture?.homeDisplayNameEs ?? resolvePredictionReviewTeamDisplayNameEs(homeTeamName),
          awayTeamDisplayNameEs: orientedCoherenceFixture?.awayDisplayNameEs ?? resolvePredictionReviewTeamDisplayNameEs(awayTeamName),
          currentPrediction,
          shadowPrediction,
          reviewedXgPreview,
          coherenceFixture,
          refreshAlerts: calculateRefreshDeltaAlerts({
            currentPrediction,
            shadowPrediction,
            homeTeamName,
            awayTeamName,
          }),
          coherenceAlerts: calculateExternalCoherenceAlerts({
            prediction: shadowPrediction ?? currentPrediction,
            coherenceFixture,
          }),
          retainedFixtureOverride: isRetainedPredictionReviewFixture(homeTeamName, awayTeamName),
          aiAvailability,
          latestAiRecommendation:
            latestAiExecution?.response_json && typeof latestAiExecution.response_json === "object"
              ? (latestAiExecution.response_json as PredictionReviewCaseSummary["latestAiRecommendation"])
              : latestDecision?.decision
                ? null
                : null,
          auditHistory: [
            ...(shadowSnapshot ? [{ id: shadowSnapshot.id, kind: "shadow" as const, createdAt: shadowSnapshot.created_at, summary: "Generated shadow prediction" }] : []),
            ...(latestAiExecution ? [{ id: latestAiExecution.id, kind: "ai" as const, createdAt: latestAiExecution.created_at, summary: `${latestAiExecution.provider} ${latestAiExecution.status}` }] : []),
            ...(latestDecision ? [{ id: latestDecision.id, kind: "decision" as const, createdAt: latestDecision.created_at, summary: latestDecision.decision }] : []),
          ],
        } satisfies PredictionReviewCaseSummary;
      }),
  );

  const atypicalFixtures = matches
    .filter((match) => match.kickoff_at > analysisAsOf)
    .filter((match) => ELIGIBLE_MATCHDAY2_MATCH_STATUSES.includes(match.status))
    .filter((match) => match.stage === WORLD_CUP_GROUP_STAGE_2_ROUND)
    .filter((match) => {
      const competition = competitionById.get(match.competition_id);
      return competition?.slug === WORLD_CUP_COMPETITION_SLUG;
    })
    .map((match) => {
      const competition = competitionById.get(match.competition_id);
      const homeTeamName = teamById.get(match.home_team_id);
      const awayTeamName = teamById.get(match.away_team_id);
      const currentPredictionRow = publicPredictionByMatchId.get(match.id) ?? internalPredictionByMatchId.get(match.id) ?? null;

      if (!competition || !homeTeamName || !awayTeamName || !currentPredictionRow) {
        return null;
      }

      return buildAtypicalFixtureDetectorInput({
        match,
        competition,
        homeTeamName,
        awayTeamName,
        predictionVersion: currentPredictionRow,
        markets: marketsByPredictionId.get(currentPredictionRow.id) ?? [],
        modelVersionName: currentPredictionRow.model_version_id ? modelVersionById.get(currentPredictionRow.model_version_id) ?? null : null,
        analysisAsOf,
        exactSourceSnapshotId: sourceSnapshotIdByPredictionVersionId.get(currentPredictionRow.id) ?? null,
      });
    })
    .filter((fixture): fixture is NonNullable<typeof fixture> => fixture !== null);

  const atypicalAnalysisReport = buildAtypicalFixtureAnalysisReport({
    analysisAsOf,
    scope: {
      competitionKey: WORLD_CUP_COMPETITION_SLUG,
      stage: WORLD_CUP_GROUP_STAGE_2_ROUND,
      futureOnly: true,
    },
    fixtures: atypicalFixtures,
  });

  return {
    aiAvailability,
    atypicalAnalysisReport,
    cases,
    warnings,
  };
}
