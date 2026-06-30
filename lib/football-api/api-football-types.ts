export type ProviderFixtureStatus =
  | "scheduled"
  | "live"
  | "halftime"
  | "finished"
  | "postponed"
  | "cancelled"
  | "abandoned"
  | "unknown";

export type ProviderCompetition = {
  providerCompetitionId: number;
  name: string;
  country: string | null;
  season: number | null;
  round: string | null;
};

export type ProviderTeam = {
  providerTeamId: number;
  name: string;
  winner: boolean | null;
};

export type ProviderScore = {
  home: number | null;
  away: number | null;
};

export type ProviderScoreBreakdown = {
  halftime: ProviderScore;
  fulltime: ProviderScore;
  extratime: ProviderScore;
  penalty: ProviderScore;
};

export type ProviderFixtureDecision = "regulation" | "extra_time" | "penalties" | "unknown";

export type ProviderFixture = {
  provider: "api-football";
  providerFixtureId: number;
  kickoffAt: string;
  timezone: string | null;
  status: ProviderFixtureStatus;
  statusShort: string;
  elapsedMinutes: number | null;
  competition: ProviderCompetition;
  homeTeam: ProviderTeam;
  awayTeam: ProviderTeam;
  goals: ProviderScore;
  scoreBreakdown?: ProviderScoreBreakdown | null;
  decision?: ProviderFixtureDecision | null;
};

export type FetchFixturesByLeagueParams = {
  leagueId: number;
  season: number;
  from?: string;
  to?: string;
  status?: string;
};

export type ProviderLeague = {
  providerLeagueId: number;
  name: string;
  type: string | null;
  country: string | null;
  countryCode: string | null;
  seasonYears: number[];
};

export type FetchLeaguesParams = {
  country?: string;
  search?: string;
  season?: number;
  id?: number;
};

export type FetchFixtureRoundsParams = {
  leagueId: number;
  season: number;
  current?: boolean;
  dates?: boolean;
  timezone?: string;
};

export type FetchStandingsParams = {
  leagueId: number;
  season: number;
};

export type ProviderApiPaging = {
  current: number | null;
  total: number | null;
};

export type ProviderApiRequestDiagnostics = {
  endpoint: string;
  query: Record<string, string>;
  results: number | null;
  errors: string[];
  paging: ProviderApiPaging | null;
};

export type ProviderFixtureRoundsResult = {
  rounds: string[];
  diagnostics: ProviderApiRequestDiagnostics;
};

export type ProviderStandingsScope = {
  providerLeagueId: number;
  name: string;
  country: string | null;
  season: number | null;
};

export type ProviderStandingsRow = {
  rank: number;
  team: {
    providerTeamId: number;
    name: string;
    logo: string | null;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  status: string | null;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  update: string | null;
};

export type ProviderStandingsGroup = {
  groupLabel: string;
  rows: ProviderStandingsRow[];
};

export type ProviderStandingsResult = {
  league: ProviderStandingsScope;
  groups: ProviderStandingsGroup[];
  diagnostics: ProviderApiRequestDiagnostics;
  httpStatus: number;
  rawPayload: unknown;
};
