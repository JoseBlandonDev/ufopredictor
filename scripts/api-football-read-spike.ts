import { loadEnvConfig } from "@next/env";
import type {
  ProviderApiRequestDiagnostics,
  ProviderFixture,
  ProviderLeague,
} from "@/lib/football-api/api-football-types";

type SpikeMode = "date" | "league" | "fixture" | "leagues" | "rounds";

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

function parseMode(): SpikeMode | null {
  const mode = getArg("--mode");
  if (mode === "date" || mode === "league" || mode === "fixture" || mode === "leagues" || mode === "rounds") {
    return mode;
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
