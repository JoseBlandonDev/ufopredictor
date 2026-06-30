import type {
  ProviderApiRequestDiagnostics,
  FetchFixtureRoundsParams,
  FetchLeaguesParams,
  FetchFixturesByLeagueParams,
  ProviderFixture,
  ProviderFixtureStatus,
  ProviderFixtureRoundsResult,
  ProviderLeague,
} from "./api-football-types";

const DEFAULT_BASE_URL = "https://v3.football.api-sports.io";

type ApiFootballFixtureEnvelope = {
  fixture?: {
    id?: number;
    date?: string;
    timezone?: string;
    status?: {
      short?: string;
      elapsed?: number | null;
    };
  };
  league?: {
    id?: number;
    name?: string;
    country?: string | null;
    season?: number | null;
    round?: string | null;
  };
  teams?: {
    home?: {
      id?: number;
      name?: string;
      winner?: boolean | null;
    };
    away?: {
      id?: number;
      name?: string;
      winner?: boolean | null;
    };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
  score?: {
    halftime?: {
      home?: number | null;
      away?: number | null;
    };
    fulltime?: {
      home?: number | null;
      away?: number | null;
    };
    extratime?: {
      home?: number | null;
      away?: number | null;
    };
    penalty?: {
      home?: number | null;
      away?: number | null;
    };
  };
};

type ApiFootballResponse = {
  results?: number;
  errors?: string[] | Record<string, string>;
  paging?: {
    current?: number;
    total?: number;
  };
  response?: ApiFootballFixtureEnvelope[];
};

type ApiFootballLeagueEnvelope = {
  league?: {
    id?: number;
    name?: string;
    type?: string | null;
  };
  country?: {
    name?: string | null;
    code?: string | null;
  };
  seasons?: Array<{
    year?: number;
  }>;
};

type ApiFootballLeaguesResponse = {
  results?: number;
  errors?: string[] | Record<string, string>;
  paging?: {
    current?: number;
    total?: number;
  };
  response?: ApiFootballLeagueEnvelope[];
};

type ApiFootballRoundsResponse = {
  results?: number;
  errors?: string[] | Record<string, string>;
  paging?: {
    current?: number;
    total?: number;
  };
  response?: string[];
};

type ApiFootballBaseResponse = {
  results?: number;
  errors?: string[] | Record<string, string>;
  paging?: {
    current?: number;
    total?: number;
  };
};

function getApiFootballConfig() {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error("Missing API_FOOTBALL_KEY env var.");
  }

  const baseUrl = process.env.API_FOOTBALL_BASE_URL ?? DEFAULT_BASE_URL;
  return { apiKey, baseUrl };
}

function normalizeErrors(errors: ApiFootballBaseResponse["errors"]): string[] {
  if (Array.isArray(errors)) {
    return errors.filter((value): value is string => typeof value === "string");
  }

  if (errors && typeof errors === "object") {
    return Object.values(errors).filter((value): value is string => typeof value === "string");
  }

  return [];
}

function buildDiagnostics(
  endpoint: string,
  query: Record<string, string>,
  payload: ApiFootballBaseResponse,
): ProviderApiRequestDiagnostics {
  return {
    endpoint,
    query,
    results: typeof payload.results === "number" ? payload.results : null,
    errors: normalizeErrors(payload.errors),
    paging: payload.paging
      ? {
          current: typeof payload.paging.current === "number" ? payload.paging.current : null,
          total: typeof payload.paging.total === "number" ? payload.paging.total : null,
        }
      : null,
  };
}

function buildUrl(pathname: string, baseUrl: string, query: Record<string, string>): URL {
  const url = new URL(pathname, baseUrl);

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

function toProviderStatus(shortCode: string | undefined): ProviderFixtureStatus {
  switch (shortCode) {
    case "NS":
    case "TBD":
    case "PST":
      return "scheduled";
    case "1H":
    case "2H":
    case "ET":
    case "P":
    case "BT":
      return "live";
    case "HT":
      return "halftime";
    case "FT":
    case "AET":
    case "PEN":
      return "finished";
    case "SUSP":
    case "INT":
      return "abandoned";
    case "CANC":
      return "cancelled";
    case "ABD":
      return "abandoned";
    case "AWD":
    case "WO":
      return "cancelled";
    case "LIVE":
      return "live";
    default:
      return "unknown";
  }
}

function normalizeFixture(input: ApiFootballFixtureEnvelope): ProviderFixture | null {
  const fixtureId = input.fixture?.id;
  const kickoffAt = input.fixture?.date;
  const leagueId = input.league?.id;
  const leagueName = input.league?.name;
  const homeTeamId = input.teams?.home?.id;
  const homeTeamName = input.teams?.home?.name;
  const awayTeamId = input.teams?.away?.id;
  const awayTeamName = input.teams?.away?.name;

  if (
    typeof fixtureId !== "number" ||
    typeof kickoffAt !== "string" ||
    typeof leagueId !== "number" ||
    typeof leagueName !== "string" ||
    typeof homeTeamId !== "number" ||
    typeof homeTeamName !== "string" ||
    typeof awayTeamId !== "number" ||
    typeof awayTeamName !== "string"
  ) {
    return null;
  }

  const statusShort = input.fixture?.status?.short ?? "UNKNOWN";

  return {
    provider: "api-football",
    providerFixtureId: fixtureId,
    kickoffAt,
    timezone: input.fixture?.timezone ?? null,
    status: toProviderStatus(statusShort),
    statusShort,
    elapsedMinutes: input.fixture?.status?.elapsed ?? null,
    competition: {
      providerCompetitionId: leagueId,
      name: leagueName,
      country: input.league?.country ?? null,
      season: input.league?.season ?? null,
      round: input.league?.round ?? null,
    },
    homeTeam: {
      providerTeamId: homeTeamId,
      name: homeTeamName,
      winner: input.teams?.home?.winner ?? null,
    },
    awayTeam: {
      providerTeamId: awayTeamId,
      name: awayTeamName,
      winner: input.teams?.away?.winner ?? null,
    },
    goals: {
      home: input.goals?.home ?? null,
      away: input.goals?.away ?? null,
    },
    score: {
      halftime: {
        home: input.score?.halftime?.home ?? null,
        away: input.score?.halftime?.away ?? null,
      },
      fulltime: {
        home: input.score?.fulltime?.home ?? null,
        away: input.score?.fulltime?.away ?? null,
      },
      extratime: {
        home: input.score?.extratime?.home ?? null,
        away: input.score?.extratime?.away ?? null,
      },
      penalty: {
        home: input.score?.penalty?.home ?? null,
        away: input.score?.penalty?.away ?? null,
      },
    },
  };
}

async function fetchApiFootball(pathname: string, query: Record<string, string>): Promise<ProviderFixture[]> {
  const { apiKey, baseUrl } = getApiFootballConfig();
  const url = buildUrl(pathname, baseUrl, query);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API-Football request failed (${response.status}) for ${pathname}.`);
  }

  const payload = (await response.json()) as ApiFootballResponse;
  const fixtures = payload.response ?? [];

  return fixtures
    .map(normalizeFixture)
    .filter((fixture): fixture is ProviderFixture => fixture !== null);
}

async function fetchApiFootballStringList(
  pathname: string,
  query: Record<string, string>,
): Promise<ProviderFixtureRoundsResult> {
  const { apiKey, baseUrl } = getApiFootballConfig();
  const url = buildUrl(pathname, baseUrl, query);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API-Football request failed (${response.status}) for ${pathname}.`);
  }

  const payload = (await response.json()) as ApiFootballRoundsResponse;
  return {
    rounds: (payload.response ?? []).filter((round): round is string => typeof round === "string"),
    diagnostics: buildDiagnostics(pathname, query, payload),
  };
}

function normalizeLeague(input: ApiFootballLeagueEnvelope): ProviderLeague | null {
  const leagueId = input.league?.id;
  const leagueName = input.league?.name;

  if (typeof leagueId !== "number" || typeof leagueName !== "string") {
    return null;
  }

  const seasonYears = (input.seasons ?? [])
    .map((season) => season.year)
    .filter((year): year is number => typeof year === "number");

  return {
    providerLeagueId: leagueId,
    name: leagueName,
    type: input.league?.type ?? null,
    country: input.country?.name ?? null,
    countryCode: input.country?.code ?? null,
    seasonYears,
  };
}

async function fetchApiFootballLeaguesRequest(
  query: Record<string, string>,
): Promise<ProviderLeague[]> {
  const { apiKey, baseUrl } = getApiFootballConfig();
  const url = buildUrl("/leagues", baseUrl, query);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API-Football request failed (${response.status}) for /leagues.`);
  }

  const payload = (await response.json()) as ApiFootballLeaguesResponse;
  const leagues = payload.response ?? [];

  return leagues
    .map(normalizeLeague)
    .filter((league): league is ProviderLeague => league !== null);
}

export async function fetchApiFootballFixturesByDate(date: string): Promise<ProviderFixture[]> {
  return fetchApiFootball("/fixtures", { date });
}

export async function fetchApiFootballFixturesByLeague(
  params: FetchFixturesByLeagueParams,
): Promise<ProviderFixture[]> {
  return fetchApiFootball("/fixtures", {
    league: String(params.leagueId),
    season: String(params.season),
    from: params.from ?? "",
    to: params.to ?? "",
    status: params.status ?? "",
  });
}

export async function fetchApiFootballFixtureById(fixtureId: number): Promise<ProviderFixture | null> {
  const fixtures = await fetchApiFootball("/fixtures", { id: String(fixtureId) });
  return fixtures[0] ?? null;
}

export async function fetchApiFootballLeagues(
  params: FetchLeaguesParams,
): Promise<ProviderLeague[]> {
  return fetchApiFootballLeaguesRequest({
    country: params.country ?? "",
    search: params.search ?? "",
    season: params.season ? String(params.season) : "",
    id: params.id ? String(params.id) : "",
  });
}

export async function fetchApiFootballFixtureRounds(
  params: FetchFixtureRoundsParams,
): Promise<ProviderFixtureRoundsResult> {
  return fetchApiFootballStringList("/fixtures/rounds", {
    league: String(params.leagueId),
    season: String(params.season),
    current: typeof params.current === "boolean" ? String(params.current) : "",
    dates: typeof params.dates === "boolean" ? String(params.dates) : "",
    timezone: params.timezone ?? "",
  });
}
