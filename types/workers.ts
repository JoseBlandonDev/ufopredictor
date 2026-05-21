export type WorkerRunStatus = "running" | "success" | "failed" | "queued";

export type WorkerRun = {
  id: string;
  workerName: string;
  status: WorkerRunStatus;
  startedAt: string;
  finishedAt?: string;
  recordsProcessed: number;
  errorMessage?: string;
  metadata: Record<string, string | number | boolean>;
};
