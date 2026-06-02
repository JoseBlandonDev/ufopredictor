import { loadEnvConfig } from "@next/env";
import type { ProviderFixture } from "@/lib/football-api/api-football-types";

type SpikeMode = "date" | "league" | "fixture";

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

function parseMode(): SpikeMode | null {
  const mode = getArg("--mode");
  if (mode === "date" || mode === "league" || mode === "fixture") {
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
