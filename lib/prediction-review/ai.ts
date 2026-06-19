import { z } from "zod";
import { REVIEW_DECISION_OPTIONS } from "./constants";
import type { PredictionReviewAiAvailability, PredictionReviewAiResponse } from "./types";

export const predictionReviewAiResponseSchema = z.object({
  decision: z.enum(REVIEW_DECISION_OPTIONS),
  rationale: z.string().trim().min(1),
  evidenceUsed: z.array(z.string().trim().min(1)),
  contradictions: z.array(z.string().trim().min(1)),
  confidence: z.enum(["low", "medium", "high"]),
  proposedHomeXg: z.number().finite().min(0).nullable(),
  proposedAwayXg: z.number().finite().min(0).nullable(),
  warnings: z.array(z.string().trim().min(1)),
  humanApprovalRequired: z.boolean(),
}).strict();

export type PredictionReviewAiProvider = {
  provider: string;
  model: string;
  runReview(input: {
    prompt: string;
    context: Record<string, unknown>;
  }): Promise<PredictionReviewAiResponse>;
};

export function discoverPredictionReviewAiAvailability(): PredictionReviewAiAvailability {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const openAiModel = process.env.OPENAI_PREDICTION_REVIEW_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  if (openAiApiKey) {
    return {
      status: "available",
      provider: "openai",
      model: openAiModel,
    };
  }

  return {
    status: "unavailable",
    reason: "No supported AI provider key is configured.",
  };
}

export function createPredictionReviewAiProvider(): PredictionReviewAiProvider | null {
  const availability = discoverPredictionReviewAiAvailability();
  if (availability.status !== "available") {
    return null;
  }

  return {
    provider: availability.provider,
    model: availability.model,
    async runReview() {
      throw new Error("AI provider integration is intentionally disabled until a configured provider is wired in.");
    },
  };
}
