import type {
  ProviderApiRequestDiagnostics,
  FetchStandingsParams,
  FetchFixtureRoundsParams,
  FetchLeaguesParams,
  FetchFixturesByLeagueParams,
  ProviderFixture,
  ProviderFixtureStatus,
  ProviderFixtureRoundsResult,
  ProviderLeague,
  ProviderStandingsGroup,
  ProviderStandingsResult,
  ProviderStandingsRow,
} from "./api-football-types";

const DEFAULT_BASE_URL = "https://v3.football.api-sports.io";

export type ApiFootballDetailedFailureKind =
  | "http_error"
  | "transport_error"
  | "response_invalid";

export type ApiFootballFixtureLookupDetailedResult = {
  fixture: ProviderFixture | null;
  diagnostics: ProviderApiRequestDiagnostics | null;
  httpStatus: number | null;
  retryAfterSeconds: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  failureKind: ApiFootballDetailedFailureKind | null;
};

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

type ApiFootballStandingsRowEnvelope = {
  rank?: number;
  team?: {
    id?: number;
    name?: string;
    logo?: string | null;
  };
  points?: number;
  goalsDiff?: number;
  group?: string;
  form?: string | null;
  status?: string | null;
  description?: string | null;
  all?: {
    played?: number;
    win?: number;
    draw?: number;
    lose?: number;
    goals?: {
      for?: number;
      against?: number;
    };
  };
  home?: {
    played?: number;
    win?: number;
    draw?: number;
    lose?: number;
    goals?: {
      for?: number;
      against?: number;
    };
  };
  away?: {
    played?: number;
    win?: number;
    draw?: number;
    lose?: number;
    goals?: {
      for?: number;
      against?: number;
    };
  };
  update?: string | null;
};

type ApiFootballStandingsLeagueEnvelope = {
  id?: number;
  name?: string;
  country?: string | null;
  season?: number | null;
  standings?: ApiFootballStandingsRowEnvelope[][];
};

type ApiFootballStandingsEnvelope = {
  league?: ApiFootballStandingsLeagueEnvelope;
};

type ApiFootballStandingsResponse = {
  results?: number;
  errors?: string[] | Record<string, string>;
  paging?: {
    current?: number;
    total?: number;
  };
  response?: ApiFootballStandingsEnvelope[];
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
  };
}

async function fetchApiFootball(pathname: string, query: Record<string, string>): Promise<ProviderFixture[]> {
  const response = await performApiFootballJsonRequest<ApiFootballResponse>(pathname, query);
  if (!response.ok) {
    throw new Error(`API-Football request failed (${response.httpStatus}) for ${pathname}.`);
  }

  const payload = response.payload;
  const fixtures = payload.response ?? [];

  return fixtures
    .map(normalizeFixture)
    .filter((fixture): fixture is ProviderFixture => fixture !== null);
}

async function fetchApiFootballStringList(
  pathname: string,
  query: Record<string, string>,
): Promise<ProviderFixtureRoundsResult> {
  const response = await performApiFootballJsonRequest<ApiFootballRoundsResponse>(pathname, query);
  if (!response.ok) {
    throw new Error(`API-Football request failed (${response.httpStatus}) for ${pathname}.`);
  }

  const payload = response.payload;
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

function normalizeStandingsStatBlock(
  input: ApiFootballStandingsRowEnvelope["all"] | ApiFootballStandingsRowEnvelope["home"] | ApiFootballStandingsRowEnvelope["away"],
) {
  return {
    played: typeof input?.played === "number" ? input.played : 0,
    win: typeof input?.win === "number" ? input.win : 0,
    draw: typeof input?.draw === "number" ? input.draw : 0,
    lose: typeof input?.lose === "number" ? input.lose : 0,
    goals: {
      for: typeof input?.goals?.for === "number" ? input.goals.for : 0,
      against: typeof input?.goals?.against === "number" ? input.goals.against : 0,
    },
  };
}

function normalizeStandingsRow(input: ApiFootballStandingsRowEnvelope): ProviderStandingsRow | null {
  const rank = input.rank;
  const teamId = input.team?.id;
  const teamName = input.team?.name;
  const points = input.points;
  const goalsDiff = input.goalsDiff;
  const group = input.group;

  if (
    typeof rank !== "number" ||
    typeof teamId !== "number" ||
    typeof teamName !== "string" ||
    typeof points !== "number" ||
    typeof goalsDiff !== "number" ||
    typeof group !== "string"
  ) {
    return null;
  }

  return {
    rank,
    team: {
      providerTeamId: teamId,
      name: teamName,
      logo: input.team?.logo ?? null,
    },
    points,
    goalsDiff,
    group,
    form: input.form ?? null,
    status: input.status ?? null,
    description: input.description ?? null,
    all: normalizeStandingsStatBlock(input.all),
    home: normalizeStandingsStatBlock(input.home),
    away: normalizeStandingsStatBlock(input.away),
    update: input.update ?? null,
  };
}

function normalizeStandingsEnvelope(
  input: ApiFootballStandingsEnvelope,
): Omit<ProviderStandingsResult, "diagnostics" | "rawPayload" | "httpStatus"> | null {
  const leagueId = input.league?.id;
  const leagueName = input.league?.name;

  if (typeof leagueId !== "number" || typeof leagueName !== "string") {
    return null;
  }

  const standingsGroups = (input.league?.standings ?? [])
    .map((groupRows): ProviderStandingsGroup | null => {
      const rows = groupRows.map(normalizeStandingsRow).filter((row): row is ProviderStandingsRow => row !== null);
      const groupLabel = rows[0]?.group ?? null;
      if (!groupLabel || rows.length !== groupRows.length) {
        return null;
      }
      return {
        groupLabel,
        rows,
      };
    })
    .filter((group): group is ProviderStandingsGroup => group !== null);

  return {
    league: {
      providerLeagueId: leagueId,
      name: leagueName,
      country: input.league?.country ?? null,
      season: input.league?.season ?? null,
    },
    groups: standingsGroups,
  };
}

async function fetchApiFootballLeaguesRequest(
  query: Record<string, string>,
): Promise<ProviderLeague[]> {
  const response = await performApiFootballJsonRequest<ApiFootballLeaguesResponse>("/leagues", query);
  if (!response.ok) {
    throw new Error(`API-Football request failed (${response.httpStatus}) for /leagues.`);
  }

  const payload = response.payload;
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

type ApiFootballJsonRequestSuccess<T extends ApiFootballBaseResponse> = {
  ok: true;
  httpStatus: number;
  payload: T;
  retryAfterSeconds: number | null;
};

type ApiFootballJsonRequestFailure<T extends ApiFootballBaseResponse> = {
  ok: false;
  httpStatus: number | null;
  payload: T | null;
  retryAfterSeconds: number | null;
  errorMessage: string;
  failureKind: ApiFootballDetailedFailureKind;
};

function parseRetryAfterSeconds(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const seconds = Number(value);
  if (Number.isInteger(seconds) && seconds >= 0) {
    return seconds;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const delayMs = Math.max(0, timestamp - Date.now());
  return Math.ceil(delayMs / 1000);
}

async function performApiFootballJsonRequest<T extends ApiFootballBaseResponse>(
  pathname: string,
  query: Record<string, string>,
): Promise<ApiFootballJsonRequestSuccess<T> | ApiFootballJsonRequestFailure<T>> {
  const { apiKey, baseUrl } = getApiFootballConfig();
  const url = buildUrl(pathname, baseUrl, query);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "x-apisports-key": apiKey,
      },
      cache: "no-store",
    });
  } catch (error) {
    return {
      ok: false,
      httpStatus: null,
      payload: null,
      retryAfterSeconds: null,
      errorMessage: error instanceof Error ? error.message : "Unknown transport failure.",
      failureKind: "transport_error",
    };
  }

  const retryAfterSeconds = parseRetryAfterSeconds(response.headers.get("retry-after"));
  let payload: T | null = null;
  try {
    payload = (await response.json()) as T;
  } catch {
    if (!response.ok) {
      return {
        ok: false,
        httpStatus: response.status,
        payload: null,
        retryAfterSeconds,
        errorMessage: `API-Football request failed (${response.status}) for ${pathname}.`,
        failureKind: "http_error",
      };
    }

    return {
      ok: false,
      httpStatus: response.status,
      payload: null,
      retryAfterSeconds,
      errorMessage: `API-Football returned invalid JSON for ${pathname}.`,
      failureKind: "response_invalid",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      httpStatus: response.status,
      payload,
      retryAfterSeconds,
      errorMessage: normalizeErrors(payload.errors)[0] ?? `API-Football request failed (${response.status}) for ${pathname}.`,
      failureKind: "http_error",
    };
  }

  return {
    ok: true,
    httpStatus: response.status,
    payload,
    retryAfterSeconds,
  };
}

export async function fetchApiFootballFixtureByIdDetailed(
  fixtureId: number,
): Promise<ApiFootballFixtureLookupDetailedResult> {
  const pathname = "/fixtures";
  const query = { id: String(fixtureId) };
  const response = await performApiFootballJsonRequest<ApiFootballResponse>(pathname, query);

  if (!response.ok) {
    return {
      fixture: null,
      diagnostics: response.payload ? buildDiagnostics(pathname, query, response.payload) : null,
      httpStatus: response.httpStatus,
      retryAfterSeconds: response.retryAfterSeconds,
      errorCode: response.failureKind,
      errorMessage: response.errorMessage,
      failureKind: response.failureKind,
    };
  }

  const diagnostics = buildDiagnostics(pathname, query, response.payload);
  const fixtures = (response.payload.response ?? [])
    .map(normalizeFixture)
    .filter((fixture): fixture is ProviderFixture => fixture !== null);

  if ((response.payload.response ?? []).length > 0 && fixtures.length === 0) {
    return {
      fixture: null,
      diagnostics,
      httpStatus: response.httpStatus,
      retryAfterSeconds: response.retryAfterSeconds,
      errorCode: "response_invalid",
      errorMessage: "API-Football returned fixture data that could not be normalized.",
      failureKind: "response_invalid",
    };
  }

  return {
    fixture: fixtures[0] ?? null,
    diagnostics,
    httpStatus: response.httpStatus,
    retryAfterSeconds: response.retryAfterSeconds,
    errorCode: null,
    errorMessage: normalizeErrors(response.payload.errors)[0] ?? null,
    failureKind: null,
  };
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

export async function fetchApiFootballStandings(
  params: FetchStandingsParams,
): Promise<ProviderStandingsResult> {
  const pathname = "/standings";
  const query = {
    league: String(params.leagueId),
    season: String(params.season),
  };
  const response = await performApiFootballJsonRequest<ApiFootballStandingsResponse>(pathname, query);
  if (!response.ok) {
    throw new Error(`API-Football request failed (${response.httpStatus}) for ${pathname}.`);
  }

  const payload = response.payload;
  const normalized = (payload.response ?? [])
    .map(normalizeStandingsEnvelope)
    .filter((entry): entry is Omit<ProviderStandingsResult, "diagnostics" | "rawPayload"> => entry !== null);

  const first = normalized[0];
  if (!first) {
    throw new Error("API-Football returned standings data that could not be normalized.");
  }

  return {
    ...first,
    diagnostics: buildDiagnostics(pathname, query, payload),
    httpStatus: response.httpStatus,
    rawPayload: payload,
  };
}
