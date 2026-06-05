export function buildApiFootballLeagueExternalId(leagueId: number): string {
  return `api-football:league:${leagueId}`;
}

export function buildApiFootballTeamExternalId(teamId: number): string {
  return `api-football:team:${teamId}`;
}

export function buildApiFootballVenueExternalId(venueId: number): string {
  return `api-football:venue:${venueId}`;
}

export function buildApiFootballFixtureExternalId(fixtureId: number): string {
  return `api-football:fixture:${fixtureId}`;
}
