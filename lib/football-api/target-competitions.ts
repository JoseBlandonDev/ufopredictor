import type { ProviderFixture } from "./api-football-types";

export type TargetCompetitionKey =
  | "world-cup"
  | "friendlies"
  | "colombia-primera-a"
  | "copa-colombia";

export type TargetCompetitionUseCase =
  | "core_world_cup"
  | "beta_pre_world_cup"
  | "beta_local"
  | "beta_local_alt";

export type TargetCompetition = {
  key: TargetCompetitionKey;
  provider: "api-football";
  leagueId: number;
  season: number;
  useCase: TargetCompetitionUseCase;
};

export type BetaFixtureCandidate = {
  fixtureId: number;
  competitionKey: TargetCompetitionKey;
  useCase: TargetCompetitionUseCase;
  kickoffAt: string;
  homeTeamName: string;
  awayTeamName: string;
  status: ProviderFixture["status"];
  score: {
    home: number | null;
    away: number | null;
  };
  reason: string;
};

export type BetaFixtureSelectionOptions = {
  competitionKey: TargetCompetitionKey;
  useCase: TargetCompetitionUseCase;
  from?: string;
  to?: string;
  limit?: number;
  includeYouth?: boolean;
};

export type BetaFixturePriority = "high" | "medium_high" | "medium" | "low";

export type BetaFixturePriorityReason =
  | "core_world_cup_fixture"
  | "adult_friendly_pre_world_cup"
  | "local_colombia_beta"
  | "finished_evaluation_sample"
  | "upcoming_beta_sample";

export type PrioritizedBetaFixtureCandidate = BetaFixtureCandidate & {
  priority: BetaFixturePriority;
  priorityScore: number;
  reasons: BetaFixturePriorityReason[];
};

export type BetaFixturePrioritizationOptions = {
  limit?: number;
  maxPerCompetition?: number;
};

export type BetaShortlistStatusBucket = "upcoming" | "finished" | "active";

export type BetaShortlistRecommendation =
  | "product_validation"
  | "upcoming_beta"
  | "historical_evaluation"
  | "local_model_check"
  | "upcoming_local_beta"
  | "active_tracking";

export type BetaShortlistReportEntry = PrioritizedBetaFixtureCandidate & {
  statusBucket: BetaShortlistStatusBucket;
  recommendation: BetaShortlistRecommendation;
};

export type BetaShortlistReport = {
  totalCandidates: number;
  totalByCompetition: Record<TargetCompetitionKey, number>;
  totalByUseCase: Record<TargetCompetitionUseCase, number>;
  totalByStatusBucket: Record<BetaShortlistStatusBucket, number>;
  topOverall: BetaShortlistReportEntry[];
  productValidation: BetaShortlistReportEntry[];
  historicalEvaluation: BetaShortlistReportEntry[];
  activeTracking: BetaShortlistReportEntry[];
  upcoming: BetaShortlistReportEntry[];
  finished: BetaShortlistReportEntry[];
  active: BetaShortlistReportEntry[];
};

export type BetaShortlistReportOptions = {
  topOverallLimit?: number;
};

const TARGET_COMPETITIONS: TargetCompetition[] = [
  {
    key: "world-cup",
    provider: "api-football",
    leagueId: 1,
    season: 2026,
    useCase: "core_world_cup",
  },
  {
    key: "friendlies",
    provider: "api-football",
    leagueId: 10,
    season: 2026,
    useCase: "beta_pre_world_cup",
  },
  {
    key: "colombia-primera-a",
    provider: "api-football",
    leagueId: 239,
    season: 2026,
    useCase: "beta_local",
  },
  {
    key: "copa-colombia",
    provider: "api-football",
    leagueId: 241,
    season: 2026,
    useCase: "beta_local_alt",
  },
];

const YOUTH_MARKER_PATTERN = /\bU(?:17|18|19|20|21|23)\b/i;

function isYouthFixture(fixture: ProviderFixture): boolean {
  return (
    YOUTH_MARKER_PATTERN.test(fixture.homeTeam.name) ||
    YOUTH_MARKER_PATTERN.test(fixture.awayTeam.name)
  );
}

function isAllowedStatus(status: ProviderFixture["status"]): boolean {
  return status !== "cancelled" && status !== "postponed" && status !== "abandoned";
}

function isInsideRange(kickoffAt: string, from?: string, to?: string): boolean {
  const kickoffMs = Date.parse(kickoffAt);
  if (Number.isNaN(kickoffMs)) {
    return false;
  }

  if (from && kickoffMs < Date.parse(`${from}T00:00:00Z`)) {
    return false;
  }

  if (to && kickoffMs > Date.parse(`${to}T23:59:59Z`)) {
    return false;
  }

  return true;
}

function toReason(fixture: ProviderFixture, options: BetaFixtureSelectionOptions): string {
  if (fixture.status === "finished") {
    return "historical_evaluation_window";
  }

  if (fixture.status === "scheduled") {
    return "upcoming_beta_window";
  }

  if (fixture.status === "live" || fixture.status === "halftime") {
    return "active_match_window";
  }

  return options.useCase;
}

export function getTargetCompetitions(): TargetCompetition[] {
  return [...TARGET_COMPETITIONS];
}

export function getTargetCompetitionByKey(
  key: TargetCompetitionKey,
): TargetCompetition | null {
  return TARGET_COMPETITIONS.find((competition) => competition.key === key) ?? null;
}

export function selectBetaFixtureCandidates(
  fixtures: ProviderFixture[],
  options: BetaFixtureSelectionOptions,
): BetaFixtureCandidate[] {
  const selected = fixtures
    .filter((fixture) => isAllowedStatus(fixture.status))
    .filter((fixture) => isInsideRange(fixture.kickoffAt, options.from, options.to))
    .filter((fixture) => {
      if (options.competitionKey !== "friendlies" || options.includeYouth === true) {
        return true;
      }

      return !isYouthFixture(fixture);
    })
    .sort((left, right) => left.kickoffAt.localeCompare(right.kickoffAt))
    .map((fixture) => ({
      fixtureId: fixture.providerFixtureId,
      competitionKey: options.competitionKey,
      useCase: options.useCase,
      kickoffAt: fixture.kickoffAt,
      homeTeamName: fixture.homeTeam.name,
      awayTeamName: fixture.awayTeam.name,
      status: fixture.status,
      score: {
        home: fixture.goals.home,
        away: fixture.goals.away,
      },
      reason: toReason(fixture, options),
    }));

  if (typeof options.limit === "number" && options.limit >= 0) {
    return selected.slice(0, options.limit);
  }

  return selected;
}

function toPriority(score: number): BetaFixturePriority {
  if (score >= 110) {
    return "high";
  }

  if (score >= 90) {
    return "medium_high";
  }

  if (score >= 70) {
    return "medium";
  }

  return "low";
}

export function scoreBetaFixtureCandidate(
  candidate: BetaFixtureCandidate,
): PrioritizedBetaFixtureCandidate {
  let score = 0;
  const reasons: BetaFixturePriorityReason[] = [];

  switch (candidate.useCase) {
    case "core_world_cup":
      score += 100;
      reasons.push("core_world_cup_fixture");
      break;
    case "beta_pre_world_cup":
      score += 90;
      reasons.push("adult_friendly_pre_world_cup");
      break;
    case "beta_local":
      score += 78;
      reasons.push("local_colombia_beta");
      break;
    case "beta_local_alt":
      score += 74;
      reasons.push("local_colombia_beta");
      break;
  }

  if (candidate.status === "scheduled") {
    score += 18;
    reasons.push("upcoming_beta_sample");
  } else if (candidate.status === "live" || candidate.status === "halftime") {
    score += 16;
    reasons.push("upcoming_beta_sample");
  } else if (candidate.status === "finished") {
    score += 10;
    reasons.push("finished_evaluation_sample");
  }

  return {
    ...candidate,
    priority: toPriority(score),
    priorityScore: score,
    reasons,
  };
}

export function prioritizeBetaFixtureCandidates(
  candidates: BetaFixtureCandidate[],
  options: BetaFixturePrioritizationOptions = {},
): PrioritizedBetaFixtureCandidate[] {
  const scored = candidates
    .map(scoreBetaFixtureCandidate)
    .sort((left, right) => {
      if (right.priorityScore !== left.priorityScore) {
        return right.priorityScore - left.priorityScore;
      }

      return left.kickoffAt.localeCompare(right.kickoffAt);
    });

  const perCompetitionCounts = new Map<TargetCompetitionKey, number>();
  const limitedByCompetition =
    typeof options.maxPerCompetition === "number" && options.maxPerCompetition >= 0
      ? scored.filter((candidate) => {
          const count = perCompetitionCounts.get(candidate.competitionKey) ?? 0;
          if (count >= options.maxPerCompetition!) {
            return false;
          }

          perCompetitionCounts.set(candidate.competitionKey, count + 1);
          return true;
        })
      : scored;

  if (typeof options.limit === "number" && options.limit >= 0) {
    return limitedByCompetition.slice(0, options.limit);
  }

  return limitedByCompetition;
}

function toStatusBucket(
  candidate: PrioritizedBetaFixtureCandidate,
): BetaShortlistStatusBucket {
  if (candidate.status === "finished") {
    return "finished";
  }

  if (candidate.status === "live" || candidate.status === "halftime") {
    return "active";
  }

  return "upcoming";
}

function toRecommendation(
  candidate: PrioritizedBetaFixtureCandidate,
): BetaShortlistRecommendation {
  if (candidate.status === "live" || candidate.status === "halftime") {
    return "active_tracking";
  }

  if (candidate.useCase === "core_world_cup" && candidate.status === "scheduled") {
    return "product_validation";
  }

  if (candidate.useCase === "beta_pre_world_cup" && candidate.status === "scheduled") {
    return "upcoming_beta";
  }

  if (candidate.useCase === "beta_pre_world_cup" && candidate.status === "finished") {
    return "historical_evaluation";
  }

  if (candidate.useCase === "beta_local" && candidate.status === "scheduled") {
    return "upcoming_local_beta";
  }

  if (candidate.useCase === "beta_local_alt" && candidate.status === "scheduled") {
    return "upcoming_local_beta";
  }

  if (candidate.useCase === "beta_local" && candidate.status === "finished") {
    return "local_model_check";
  }

  if (candidate.useCase === "beta_local_alt" && candidate.status === "finished") {
    return "local_model_check";
  }

  return "historical_evaluation";
}

function incrementRecord<Key extends string>(
  record: Record<Key, number>,
  key: Key,
): void {
  record[key] += 1;
}

export function buildBetaShortlistReport(
  candidates: PrioritizedBetaFixtureCandidate[],
  options: BetaShortlistReportOptions = {},
): BetaShortlistReport {
  const entries: BetaShortlistReportEntry[] = candidates.map((candidate) => ({
    ...candidate,
    statusBucket: toStatusBucket(candidate),
    recommendation: toRecommendation(candidate),
  }));

  const totalByCompetition: Record<TargetCompetitionKey, number> = {
    "world-cup": 0,
    friendlies: 0,
    "colombia-primera-a": 0,
    "copa-colombia": 0,
  };
  const totalByUseCase: Record<TargetCompetitionUseCase, number> = {
    core_world_cup: 0,
    beta_pre_world_cup: 0,
    beta_local: 0,
    beta_local_alt: 0,
  };
  const totalByStatusBucket: Record<BetaShortlistStatusBucket, number> = {
    upcoming: 0,
    finished: 0,
    active: 0,
  };

  for (const entry of entries) {
    incrementRecord(totalByCompetition, entry.competitionKey);
    incrementRecord(totalByUseCase, entry.useCase);
    incrementRecord(totalByStatusBucket, entry.statusBucket);
  }

  const topOverallLimit = options.topOverallLimit ?? 5;

  return {
    totalCandidates: entries.length,
    totalByCompetition,
    totalByUseCase,
    totalByStatusBucket,
    topOverall: entries.slice(0, topOverallLimit),
    productValidation: entries.filter(
      (entry) => entry.recommendation === "product_validation",
    ),
    historicalEvaluation: entries.filter(
      (entry) =>
        entry.recommendation === "historical_evaluation" ||
        entry.recommendation === "local_model_check",
    ),
    activeTracking: entries.filter(
      (entry) => entry.recommendation === "active_tracking",
    ),
    upcoming: entries.filter((entry) => entry.statusBucket === "upcoming"),
    finished: entries.filter((entry) => entry.statusBucket === "finished"),
    active: entries.filter((entry) => entry.statusBucket === "active"),
  };
}

export function summarizeBetaShortlistReport(
  report: BetaShortlistReport,
): string[] {
  return [
    `total_candidates=${report.totalCandidates}`,
    `by_competition world-cup=${report.totalByCompetition["world-cup"]} friendlies=${report.totalByCompetition.friendlies} colombia-primera-a=${report.totalByCompetition["colombia-primera-a"]} copa-colombia=${report.totalByCompetition["copa-colombia"]}`,
    `by_use_case core_world_cup=${report.totalByUseCase.core_world_cup} beta_pre_world_cup=${report.totalByUseCase.beta_pre_world_cup} beta_local=${report.totalByUseCase.beta_local} beta_local_alt=${report.totalByUseCase.beta_local_alt}`,
    `by_status upcoming=${report.totalByStatusBucket.upcoming} finished=${report.totalByStatusBucket.finished} active=${report.totalByStatusBucket.active}`,
    `recommended product_validation=${report.productValidation.length} historical_evaluation=${report.historicalEvaluation.length} active_tracking=${report.activeTracking.length}`,
    `top_overall=${report.topOverall.length}`,
  ];
}
