type ReadyAccessSummary = {
  status: "ready";
  entitlements: readonly unknown[];
  matchUnlocks: readonly unknown[];
};

type AccessSummary = ReadyAccessSummary | { status: "unavailable" };

export function hasCurrentPremiumAccess(summary: AccessSummary | null | undefined) {
  return (
    summary?.status === "ready" &&
    (summary.entitlements.length > 0 || summary.matchUnlocks.length > 0)
  );
}
