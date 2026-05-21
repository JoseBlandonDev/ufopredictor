import type { Match } from "@/types/football";
import type { MockUser } from "@/types/plans";

export function canAccessMatch({
  user,
  match,
  requiredAccess = "basic",
}: {
  user: MockUser;
  match: Match;
  requiredAccess?: "basic" | "premium";
}) {
  if (requiredAccess === "basic") {
    return true;
  }

  if (user.planSlug === "world-cup-pass" || user.planSlug === "premium-monthly") {
    return true;
  }

  return user.matchUnlocks.some((unlock) => unlock.matchId === match.id);
}
