import { loadEnvConfig } from "@next/env";
import type {
  ProviderApiRequestDiagnostics,
  ProviderFixture,
  ProviderLeague,
} from "@/lib/football-api/api-football-types";
import type {
  BetaFixtureCandidate,
  BetaShortlistReportEntry,
  PrioritizedBetaFixtureCandidate,
  TargetCompetition,
  TargetCompetitionKey,
} from "@/lib/football-api/target-competitions";
import type { IngestDryRunReport } from "@/lib/football-api/ingest/planner";

type ControlledWriteExecutionReportLike = {
  runTag: string;
  sourceNote: string;
  fetchedFixtures: number;
  plannedFixtures: number;
  skippedUnknown: number;
  skippedCancelled: number;
  skippedPostponed: number;
  skippedAbandoned: number;
  touchedExternalIds: string[];
  warnings: string[];
  counts: {
    competitionsCreated: number;
    competitionsUpdated: number;
    competitionsSkipped: number;
    seasonsCreated: number;
    seasonsUpdated: number;
    seasonsSkipped: number;
    teamsCreated: number;
    teamsUpdated: number;
    teamsSkipped: number;
    matchesCreated: number;
    matchesUpdated: number;
    matchesSkipped: number;
    matchResultsCreated: number;
    matchResultsUpdated: number;
    matchResultsSkipped: number;
  };
};

type SpikeMode =
  | "date"
  | "league"
  | "fixture"
  | "leagues"
  | "rounds"
  | "beta-candidates"
  | "ingest-dry-run";

function getArg(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return null;
  }
  return process.argv[index + 1] ?? null;
}

function printUsage() {
  console.log("Usage:");
  console.log("  npm run spike:api-football -- --mode date --date YYYY-MM-DD");
  console.log("  npm run spike:api-football -- --mode league --leagueId 71 --season 2026 [--from YYYY-MM-DD --to YYYY-MM-DD]");
  console.log("  npm run spike:api-football -- --mode fixture --fixtureId 123456");
  console.log("  npm run spike:api-football -- --mode leagues [--country Colombia] [--search \"World Cup\"] [--season 2026] [--id 1]");
  console.log("  npm run spike:api-football -- --mode rounds --leagueId 1 --season 2026 [--current true] [--dates true] [--timezone America/Bogota]");
  console.log("  npm run spike:api-football -- --mode beta-candidates --competition friendlies --from 2026-05-25 --to 2026-06-10 --limit 20 [--includeYouth true]");
  console.log("  npm run spike:api-football -- --mode beta-candidates --competition all --from 2026-05-25 --to 2026-06-20 --limit 30 --prioritize true [--maxPerCompetition 10]");
  console.log("  npm run spike:api-football -- --mode beta-candidates --competition all --from 2026-05-25 --to 2026-06-20 --limit 30 --prioritize true --maxPerCompetition 10 --report true");
  console.log("  npm run spike:api-football -- --mode ingest-dry-run --competition friendlies --from 2026-05-25 --to 2026-06-10 --limit 20 [--includeYouth true] [--report true]");
  console.log("  npm run spike:api-football -- --mode ingest-dry-run --competition colombia-primera-a --from 2026-05-25 --to 2026-06-10 --limit 5 --apply true --report true");
}

function summarizeFixture(fixture: ProviderFixture): string {
  const score =
    fixture.goals.home === null || fixture.goals.away === null
      ? "-"
      : `${fixture.goals.home}-${fixture.goals.away}`;

  return [
    `fixtureId=${fixture.providerFixtureId}`,
    `league=${fixture.competition.name}(${fixture.competition.providerCompetitionId})`,
    `kickoff=${fixture.kickoffAt}`,
    `teams=${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`,
    `status=${fixture.status}(${fixture.statusShort})`,
    `score=${score}`,
  ].join(" | ");
}

function summarizeLeague(league: ProviderLeague): string {
  const seasons = league.seasonYears.length > 0 ? league.seasonYears.join(",") : "-";

  return [
    `leagueId=${league.providerLeagueId}`,
    `name=${league.name}`,
    `type=${league.type ?? "-"}`,
    `country=${league.country ?? "-"}`,
    `countryCode=${league.countryCode ?? "-"}`,
    `seasons=${seasons}`,
  ].join(" | ");
}

function summarizeBetaCandidate(candidate: BetaFixtureCandidate): string {
  const score =
    candidate.score.home === null || candidate.score.away === null
      ? "-"
      : `${candidate.score.home}-${candidate.score.away}`;

  return [
    `fixtureId=${candidate.fixtureId}`,
    `competition=${candidate.competitionKey}`,
    `kickoff=${candidate.kickoffAt}`,
    `teams=${candidate.homeTeamName} vs ${candidate.awayTeamName}`,
    `status=${candidate.status}`,
    `score=${score}`,
    `useCase=${candidate.useCase}`,
    `reason=${candidate.reason}`,
  ].join(" | ");
}

function summarizePrioritizedBetaCandidate(
  candidate: PrioritizedBetaFixtureCandidate,
): string {
  return `${summarizeBetaCandidate(candidate)} | priority=${candidate.priority} | score=${candidate.priorityScore} | reasons=${candidate.reasons.join(",")}`;
}

function summarizeReportEntry(candidate: BetaShortlistReportEntry): string {
  return `${summarizePrioritizedBetaCandidate(candidate)} | recommendation=${candidate.recommendation}`;
}

function summarizePlannedEntity(
  entity: IngestDryRunReport["wouldCreateOrUpdateCompetitions"][number],
): string {
  return [
    `externalId=${entity.externalId}`,
    entity.slug ? `slug=${entity.slug}` : null,
    entity.name ? `name=${entity.name}` : null,
    `action=${entity.action}`,
  ]
    .filter((value): value is string => value !== null)
    .join(" | ");
}

function summarizePlannedMatch(
  match: IngestDryRunReport["wouldCreateOrUpdateMatches"][number],
): string {
  return [
    `fixtureId=${match.fixtureId}`,
    `externalId=${match.externalId}`,
    `slug=${match.slug}`,
    `kickoff=${match.kickoffAt}`,
    `teams=${match.homeTeamName} vs ${match.awayTeamName}`,
    `status=${match.mappedStatus}`,
    `intake_source=${match.intakeSource}`,
    `access_scope=${match.accessScope}`,
    "venue_id=null",
  ].join(" | ");
}

function summarizePlannedMatchResult(
  result: IngestDryRunReport["wouldPrepareMatchResultsPendingReview"][number],
): string {
  const score =
    result.homeGoals === null || result.awayGoals === null
      ? "-"
      : `${result.homeGoals}-${result.awayGoals}`;

  return [
    `fixtureId=${result.fixtureId}`,
    `matchExternalId=${result.matchExternalId}`,
    `score=${score}`,
    `verification_status=${result.verificationStatus}`,
    `intake_source=${result.intakeSource}`,
  ].join(" | ");
}

function printIngestDryRunReport(report: IngestDryRunReport): void {
  console.log("EXPECTED_DEFAULTS");
  console.log(
    `intake_source=${report.expectedDefaults.intakeSource} | match_access_scope=${report.expectedDefaults.matchAccessScope} | match_result_verification_status=${report.expectedDefaults.matchResultVerificationStatus} | venue_policy=${report.expectedDefaults.venuePolicy}`,
  );

  if (report.wouldCreateOrUpdateCompetitions.length > 0) {
    console.log("COMPETITIONS");
    report.wouldCreateOrUpdateCompetitions.forEach((entity) =>
      console.log(summarizePlannedEntity(entity)),
    );
  }

  if (report.wouldCreateOrUpdateSeasons.length > 0) {
    console.log("SEASONS");
    report.wouldCreateOrUpdateSeasons.forEach((entity) =>
      console.log(summarizePlannedEntity(entity)),
    );
  }

  if (report.wouldCreateOrUpdateTeams.length > 0) {
    console.log("TEAMS");
    report.wouldCreateOrUpdateTeams.forEach((entity) =>
      console.log(summarizePlannedEntity(entity)),
    );
  }

  if (report.wouldCreateOrUpdateMatches.length > 0) {
    console.log("MATCHES");
    report.wouldCreateOrUpdateMatches.forEach((match) =>
      console.log(summarizePlannedMatch(match)),
    );
  }

  if (report.wouldPrepareMatchResultsPendingReview.length > 0) {
    console.log("MATCH_RESULTS_PENDING_REVIEW");
    report.wouldPrepareMatchResultsPendingReview.forEach((result) =>
      console.log(summarizePlannedMatchResult(result)),
    );
  }

  if (report.notes.length > 0) {
    console.log("NOTES");
    report.notes.forEach((note) => console.log(note));
  }

  if (report.warnings.length > 0) {
    console.log("WARNINGS");
    report.warnings.forEach((warning) => console.log(warning));
  }
}

function printControlledWriteExecutionReport(
  report: ControlledWriteExecutionReportLike,
): void {
  console.log("APPLY_RESULT");
  console.log(`run_tag=${report.runTag}`);
  console.log(`source_note=${report.sourceNote}`);
  console.log(
    `fetched_fixtures=${report.fetchedFixtures} planned_fixtures=${report.plannedFixtures}`,
  );
  console.log(
    `skipped cancelled=${report.skippedCancelled} postponed=${report.skippedPostponed} abandoned=${report.skippedAbandoned} unknown=${report.skippedUnknown}`,
  );
  console.log(
    `counts competitions created=${report.counts.competitionsCreated} updated=${report.counts.competitionsUpdated} skipped=${report.counts.competitionsSkipped}`,
  );
  console.log(
    `counts seasons created=${report.counts.seasonsCreated} updated=${report.counts.seasonsUpdated} skipped=${report.counts.seasonsSkipped}`,
  );
  console.log(
    `counts teams created=${report.counts.teamsCreated} updated=${report.counts.teamsUpdated} skipped=${report.counts.teamsSkipped}`,
  );
  console.log(
    `counts matches created=${report.counts.matchesCreated} updated=${report.counts.matchesUpdated} skipped=${report.counts.matchesSkipped}`,
  );
  console.log(
    `counts match_results created=${report.counts.matchResultsCreated} updated=${report.counts.matchResultsUpdated} skipped=${report.counts.matchResultsSkipped}`,
  );

  if (report.touchedExternalIds.length > 0) {
    console.log("EXTERNAL_IDS_TOUCHED");
    report.touchedExternalIds.forEach((externalId) => console.log(externalId));
  }

  console.log("WARNINGS");
  console.log("rows remain admin_only by default and are not public");
  console.log(
    "source_note helps locate rows, but updated rows require manual review because there is no ingest_runs table or snapshot",
  );
  report.warnings.forEach((warning) => console.log(warning));
}

function summarizeDiagnostics(diagnostics: ProviderApiRequestDiagnostics): string {
  const query = Object.entries(diagnostics.query)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

  const errors = diagnostics.errors.length > 0 ? diagnostics.errors.join(" | ") : "-";
  const paging = diagnostics.paging
    ? `current=${diagnostics.paging.current ?? "-"} total=${diagnostics.paging.total ?? "-"}`
    : "-";

  return [
    `endpoint=${diagnostics.endpoint}`,
    `params=${query || "-"}`,
    `results=${diagnostics.results ?? "-"}`,
    `errors=${errors}`,
    `paging=${paging}`,
  ].join(" | ");
}

function printReportBlock(
  label: string,
  entries: BetaShortlistReportEntry[],
): void {
  if (entries.length === 0) {
    return;
  }

  console.log(label);
  entries.forEach((entry) => console.log(summarizeReportEntry(entry)));
}

function parseMode(): SpikeMode | null {
  const mode = getArg("--mode");
  if (
    mode === "date" ||
    mode === "league" ||
    mode === "fixture" ||
    mode === "leagues" ||
    mode === "rounds" ||
    mode === "beta-candidates" ||
    mode === "ingest-dry-run"
  ) {
    return mode;
  }
  return null;
}

function parseBooleanArg(flag: string): boolean | undefined {
  const value = getArg(flag);
  if (value === null) {
    return undefined;
  }

  return value === "true";
}

function parseCompetitionArg(value: string | null): TargetCompetitionKey | "all" | null {
  if (
    value === "world-cup" ||
    value === "friendlies" ||
    value === "colombia-primera-a" ||
    value === "copa-colombia" ||
    value === "all"
  ) {
    return value;
  }

  return null;
}

async function run() {
  loadEnvConfig(process.cwd());

  const mode = parseMode();
  if (!mode) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  try {
    const {
      fetchApiFootballFixtureById,
      fetchApiFootballFixturesByDate,
      fetchApiFootballFixturesByLeague,
      fetchApiFootballFixtureRounds,
      fetchApiFootballLeagues,
    } = await import("@/lib/football-api/api-football-client");
    const {
      getTargetCompetitionByKey,
      getTargetCompetitions,
      buildBetaShortlistReport,
      prioritizeBetaFixtureCandidates,
      selectBetaFixtureCandidates,
      summarizeBetaShortlistReport,
    } = await import("@/lib/football-api/target-competitions");
    const {
      planControlledFixtureIngestDryRun,
      summarizeControlledFixtureIngestDryRun,
    } = await import("@/lib/football-api/ingest/planner");
    const { resolveApplyConfig } = await import("@/lib/football-api/ingest/apply");

    if (mode === "date") {
      const date = getArg("--date");
      if (!date) {
        throw new Error("Missing --date for mode=date.");
      }

      const fixtures = await fetchApiFootballFixturesByDate(date);
      console.log(`fixtures=${fixtures.length} mode=date date=${date}`);
      fixtures.slice(0, 20).forEach((fixture) => console.log(summarizeFixture(fixture)));
      return;
    }

    if (mode === "league") {
      const leagueIdRaw = getArg("--leagueId");
      const seasonRaw = getArg("--season");
      if (!leagueIdRaw || !seasonRaw) {
        throw new Error("Missing --leagueId or --season for mode=league.");
      }

      const fixtures = await fetchApiFootballFixturesByLeague({
        leagueId: Number(leagueIdRaw),
        season: Number(seasonRaw),
        from: getArg("--from") ?? undefined,
        to: getArg("--to") ?? undefined,
      });
      console.log(`fixtures=${fixtures.length} mode=league leagueId=${leagueIdRaw} season=${seasonRaw}`);
      fixtures.slice(0, 20).forEach((fixture) => console.log(summarizeFixture(fixture)));
      return;
    }

    if (mode === "leagues") {
      const leagues = await fetchApiFootballLeagues({
        country: getArg("--country") ?? undefined,
        search: getArg("--search") ?? undefined,
        season: getArg("--season") ? Number(getArg("--season")) : undefined,
        id: getArg("--id") ? Number(getArg("--id")) : undefined,
      });
      console.log(
        `leagues=${leagues.length} mode=leagues country=${getArg("--country") ?? "-"} search=${getArg("--search") ?? "-"} season=${getArg("--season") ?? "-"}`,
      );
      leagues.slice(0, 30).forEach((league) => console.log(summarizeLeague(league)));
      return;
    }

    if (mode === "rounds") {
      const leagueIdRaw = getArg("--leagueId");
      const seasonRaw = getArg("--season");
      if (!leagueIdRaw || !seasonRaw) {
        throw new Error("Missing --leagueId or --season for mode=rounds.");
      }

      const roundsResult = await fetchApiFootballFixtureRounds({
        leagueId: Number(leagueIdRaw),
        season: Number(seasonRaw),
        current: getArg("--current") === null ? undefined : getArg("--current") === "true",
        dates: getArg("--dates") === null ? undefined : getArg("--dates") === "true",
        timezone: getArg("--timezone") ?? undefined,
      });

      console.log(`rounds=${roundsResult.rounds.length} mode=rounds leagueId=${leagueIdRaw} season=${seasonRaw}`);
      console.log(summarizeDiagnostics(roundsResult.diagnostics));
      roundsResult.rounds.forEach((round) => console.log(round));
      return;
    }

    if (mode === "beta-candidates") {
      const competitionArg = parseCompetitionArg(getArg("--competition"));
      if (!competitionArg) {
        throw new Error(
          "Missing or invalid --competition for mode=beta-candidates.",
        );
      }

      const targets: TargetCompetition[] =
        competitionArg === "all"
          ? getTargetCompetitions()
          : (() => {
              const competition = getTargetCompetitionByKey(competitionArg);
              if (!competition) {
                throw new Error(`Unknown target competition: ${competitionArg}`);
              }

              return [competition];
            })();

      const from = getArg("--from") ?? undefined;
      const to = getArg("--to") ?? undefined;
      const limitArg = getArg("--limit");
      const includeYouth = parseBooleanArg("--includeYouth");
      const prioritize = parseBooleanArg("--prioritize") === true;
      const report = parseBooleanArg("--report") === true;
      const maxPerCompetitionArg = getArg("--maxPerCompetition");
      const limit = limitArg ? Number(limitArg) : undefined;
      const maxPerCompetition = maxPerCompetitionArg
        ? Number(maxPerCompetitionArg)
        : undefined;
      const allCandidates: BetaFixtureCandidate[] = [];

      for (const target of targets) {
        const fixtures = await fetchApiFootballFixturesByLeague({
          leagueId: target.leagueId,
          season: target.season,
          from,
          to,
        });

        const candidates = selectBetaFixtureCandidates(fixtures, {
          competitionKey: target.key,
          useCase: target.useCase,
          from,
          to,
          includeYouth,
        });

        if (prioritize || report) {
          allCandidates.push(...candidates);
          continue;
        }

        const visibleCandidates =
          typeof limit === "number" && limit >= 0
            ? candidates.slice(0, limit)
            : candidates;

        console.log(
          `candidates=${visibleCandidates.length} mode=beta-candidates competition=${target.key} leagueId=${target.leagueId} season=${target.season}`,
        );
        visibleCandidates.forEach((candidate) =>
          console.log(summarizeBetaCandidate(candidate)),
        );
      }

      if (prioritize || report) {
        const prioritized = prioritizeBetaFixtureCandidates(allCandidates, {
          limit,
          maxPerCompetition,
        });

        if (report) {
          const shortlistReport = buildBetaShortlistReport(prioritized);
          summarizeBetaShortlistReport(shortlistReport).forEach((line) =>
            console.log(line),
          );
          printReportBlock("TOP_OVERALL", shortlistReport.topOverall);
          printReportBlock("UPCOMING", shortlistReport.upcoming);
          printReportBlock("FINISHED", shortlistReport.finished);
          printReportBlock("ACTIVE", shortlistReport.active);
          return;
        }

        console.log(
          `candidates=${prioritized.length} mode=beta-candidates competition=${competitionArg} prioritized=true`,
        );
        prioritized.forEach((candidate) =>
          console.log(summarizePrioritizedBetaCandidate(candidate)),
        );
      }

      return;
    }

    if (mode === "ingest-dry-run") {
      const competitionArg = parseCompetitionArg(getArg("--competition"));
      if (!competitionArg) {
        throw new Error(
          "Missing or invalid --competition for mode=ingest-dry-run. Use world-cup, friendlies, colombia-primera-a, copa-colombia, or all.",
        );
      }

      const from = getArg("--from") ?? undefined;
      const to = getArg("--to") ?? undefined;
      const limitArg = getArg("--limit");
      const includeYouth = parseBooleanArg("--includeYouth");
      const report = parseBooleanArg("--report") === true;
      const apply = parseBooleanArg("--apply") === true;
      const limit = limitArg ? Number(limitArg) : undefined;
      const applyConfig = resolveApplyConfig({
        apply,
        competition: competitionArg,
        from,
        to,
        limit,
      });

      if (!apply && competitionArg === "copa-colombia") {
        throw new Error(
          "Unsupported target competition for mode=ingest-dry-run. Use world-cup, friendlies, colombia-primera-a, or all.",
        );
      }

      const targets: TargetCompetition[] =
        competitionArg === "all"
          ? getTargetCompetitions().filter(
              (competition) => competition.key !== "copa-colombia",
            )
          : (() => {
              const competition = getTargetCompetitionByKey(competitionArg);
              if (!competition) {
                throw new Error(`Unknown target competition: ${competitionArg}`);
              }

              if (!apply && competition.key === "copa-colombia") {
                throw new Error(`Unsupported target competition: ${competitionArg}`);
              }

              return [competition];
            })();

      if (apply && targets.length !== 1) {
        throw new Error("Apply mode in D05C.2A supports exactly one target competition.");
      }

      for (const target of targets) {
        const fixtures = await fetchApiFootballFixturesByLeague({
          leagueId: target.leagueId,
          season: target.season,
          from,
          to,
        });

        const dryRunReport = planControlledFixtureIngestDryRun(fixtures, target, {
          includeYouth,
          limit,
        });

        summarizeControlledFixtureIngestDryRun(dryRunReport).forEach((line) =>
          console.log(line),
        );

        if (report) {
          printIngestDryRunReport(dryRunReport);
        }

        if (apply) {
          if (!applyConfig) {
            throw new Error("Apply mode requires explicit --apply true.");
          }

          const { executeControlledFixtureWrite } = await import(
            "@/lib/football-api/ingest/writer"
          );
          const applyReport = await executeControlledFixtureWrite({
            target,
            fixtures,
            apply: true,
            from: applyConfig.from,
            to: applyConfig.to,
            limit: applyConfig.limit,
          });

          printControlledWriteExecutionReport(applyReport);
        }
      }

      return;
    }

    const fixtureIdRaw = getArg("--fixtureId");
    if (!fixtureIdRaw) {
      throw new Error("Missing --fixtureId for mode=fixture.");
    }

    const fixture = await fetchApiFootballFixtureById(Number(fixtureIdRaw));
    if (!fixture) {
      console.log(`No fixture found for fixtureId=${fixtureIdRaw}`);
      return;
    }

    console.log(summarizeFixture(fixture));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`API-Football spike failed: ${message}`);
    process.exitCode = 1;
  }
}

void run();
