import type { Match } from "./football";
import type { Plan, UserEntitlement, UserMatchUnlock } from "./plans";
import type { Prediction } from "./prediction";
import type { WorkerRun } from "./workers";

export type DatabaseMock = {
  matches: Match[];
  predictions: Prediction[];
  plans: Plan[];
  userEntitlements: UserEntitlement[];
  userMatchUnlocks: UserMatchUnlock[];
  workerRuns: WorkerRun[];
};
