const WORLD_CUP_2026_SLUG = "world-cup-2026";
const WORLD_CUP_2026_MATCH_PREFIX = "world-cup-2026-";

export function isLaunchSafePublicMatch(matchSlug: string, competitionSlug: string) {
  return (
    competitionSlug === WORLD_CUP_2026_SLUG &&
    matchSlug.startsWith(WORLD_CUP_2026_MATCH_PREFIX)
  );
}
