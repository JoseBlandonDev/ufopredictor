import type {
  AtypicalFixtureDetectorInput,
  AtypicalFixtureFlag,
  AtypicalFixtureFlagCode,
  AtypicalFixtureSeverity,
  ClassificationCertainty,
  SuspectedPrimaryCause,
  SuspectedPrimaryCauseCode,
} from "./types";

function buildCause(
  code: SuspectedPrimaryCauseCode,
  certainty: ClassificationCertainty,
  rationale: string,
  supportingFlagCodes: AtypicalFixtureFlagCode[],
  alternativeCauseCodes: SuspectedPrimaryCauseCode[],
): SuspectedPrimaryCause {
  return {
    code,
    certainty,
    rationale,
    supportingFlagCodes,
    alternativeCauseCodes,
  };
}

function inferClassificationCertainty(args: {
  flags: AtypicalFixtureFlag[];
  familyCodes: Set<string>;
  sourceIntegrityDirect: boolean;
}) {
  if (args.sourceIntegrityDirect) {
    return "HIGH" as const;
  }

  if (args.familyCodes.size >= 2) {
    return "HIGH" as const;
  }

  const strongFlags = args.flags.filter((flag) => flag.severity === "CRITICAL" || flag.points >= 18).length;
  if (strongFlags >= 1 || args.flags.length >= 2) {
    return "MEDIUM" as const;
  }

  return "LOW" as const;
}

export function classifySuspectedCause(
  severity: AtypicalFixtureSeverity,
  flags: AtypicalFixtureFlag[],
): SuspectedPrimaryCause | null {
  if (severity === "NONE") {
    return null;
  }

  const codes = new Set(flags.map((flag) => flag.code));
  const families = new Set(flags.map((flag) => flag.family));
  const certainty = inferClassificationCertainty({
    flags,
    familyCodes: families,
    sourceIntegrityDirect:
      codes.has("ALIAS_UNRESOLVED") ||
      codes.has("SOURCE_AFTER_PREMATCH_CUTOFF") ||
      codes.has("SOURCE_QUALITY_FAILED"),
  });

  if (codes.has("ALIAS_UNRESOLVED")) {
    return buildCause(
      "TEAM_IDENTITY_OR_ALIAS_DEFECT",
      certainty,
      "Canonical team identity evidence is unresolved for this fixture.",
      ["ALIAS_UNRESOLVED"],
      ["SOURCE_DATA_DEFECT", "INSUFFICIENT_EVIDENCE"],
    );
  }

  if (
    codes.has("SOURCE_AFTER_PREMATCH_CUTOFF") ||
    codes.has("SOURCE_QUALITY_FAILED") ||
    codes.has("SOURCE_PROVENANCE_MISSING") ||
    codes.has("INVALID_PROBABILITY_BUNDLE") ||
    codes.has("INVALID_XG_BUNDLE") ||
    codes.has("INVALID_MODAL_SCORE") ||
    codes.has("REQUIRED_EVIDENCE_MISSING")
  ) {
    return buildCause(
      "SOURCE_DATA_DEFECT",
      certainty,
      "Core source, validation, or provenance evidence is incomplete or inconsistent.",
      flags
        .filter((flag) => flag.family === "SOURCE_INTEGRITY")
        .map((flag) => flag.code),
      ["INSUFFICIENT_EVIDENCE", "TEAM_IDENTITY_OR_ALIAS_DEFECT"],
    );
  }

  const presentationFlags = flags.filter((flag) => flag.family === "PRESENTATION").map((flag) => flag.code);
  if (presentationFlags.length > 0 && families.size === 1) {
    return buildCause(
      "CONFIDENCE_OR_RISK_PRESENTATION_DEFECT",
      certainty,
      "Confidence or risk presentation looks inflated relative to the public probability shape.",
      presentationFlags,
      ["MODEL_FORMULA_LIMITATION"],
    );
  }

  if (
    codes.has("SIGNAL_DIRECTION_CONFLICT") ||
    codes.has("STRONG_SIGNAL_MOVEMENT")
  ) {
    return buildCause(
      "SIGNAL_AGGREGATION_DEFECT",
      certainty,
      "Signal direction or movement points toward an aggregation issue rather than a pure external disagreement.",
      flags
        .filter((flag) => flag.family === "SIGNAL_DYNAMICS" || flag.family === "INTERNAL_COHERENCE")
        .map((flag) => flag.code),
      ["MODEL_FORMULA_LIMITATION", "ELO_MODEL_DISAGREEMENT"],
    );
  }

  const internalFlags = flags.filter((flag) => flag.family === "INTERNAL_COHERENCE");
  if (internalFlags.length >= 2) {
    return buildCause(
      "MODEL_FORMULA_LIMITATION",
      certainty,
      "Multiple internal coherence checks agree that the current formula compresses or contradicts the bundle.",
      internalFlags.map((flag) => flag.code),
      ["ELO_MODEL_DISAGREEMENT", "LEGITIMATE_UFO_DISAGREEMENT"],
    );
  }

  const externalFlags = flags.filter((flag) => flag.family === "EXTERNAL_COHERENCE");
  if (externalFlags.length > 0) {
    const internallyCoherent = internalFlags.length === 0 && presentationFlags.length === 0;
    if (internallyCoherent) {
      return buildCause(
        "LEGITIMATE_UFO_DISAGREEMENT",
        certainty,
        "Elo disagrees, but the UFO bundle remains internally coherent and free of source problems.",
        externalFlags.map((flag) => flag.code),
        ["ELO_MODEL_DISAGREEMENT"],
      );
    }

    return buildCause(
      "ELO_MODEL_DISAGREEMENT",
      certainty,
      "External Elo disagreement is material, but the evidence does not yet prove a source defect.",
      externalFlags.map((flag) => flag.code),
      ["MODEL_FORMULA_LIMITATION", "LEGITIMATE_UFO_DISAGREEMENT"],
    );
  }

  return buildCause(
    "INSUFFICIENT_EVIDENCE",
    certainty,
    "The available evidence is not strong enough to support a more specific primary classification.",
    flags.map((flag) => flag.code),
    ["MODEL_FORMULA_LIMITATION", "ELO_MODEL_DISAGREEMENT"],
  );
}

export function selectAdvisoryAction(args: {
  severity: AtypicalFixtureSeverity;
  flags: AtypicalFixtureFlag[];
  cause: SuspectedPrimaryCause | null;
  input: AtypicalFixtureDetectorInput;
}) {
  const codes = new Set(args.flags.map((flag) => flag.code));
  const supportingFlagCodes = args.flags.map((flag) => flag.code);

  if (args.severity === "NONE") {
    return {
      code: "KEEP_CURRENT" as const,
      rationale: "No material anomaly reached the triage threshold.",
      supportingFlagCodes,
    };
  }

  if (args.flags.every((flag) => flag.family === "PRESENTATION")) {
    return {
      code: "KEEP_CURRENT" as const,
      rationale: "The anomaly is presentation-only and does not justify a correction workflow by itself.",
      supportingFlagCodes,
    };
  }

  if (
    !args.input.evidence.sourceIntegrity.centralProvenanceComplete &&
    args.input.evidence.referenceProjection.available &&
    (args.input.evidence.referenceProjection.favoriteChanged ||
      (args.input.evidence.referenceProjection.oneXtwoDeltaMaxPp ?? 0) >= 8 ||
      (args.input.evidence.referenceProjection.expectedGoalsDeltaMax ?? 0) >= 0.35)
  ) {
    return {
      code: "REGENERATE_CURRENT_MODEL" as const,
      rationale: "Current prediction provenance looks stale or incomplete, and the in-memory current-model reference changes materially.",
      supportingFlagCodes,
    };
  }

  if (
    codes.has("ALIAS_UNRESOLVED") ||
    codes.has("SOURCE_AFTER_PREMATCH_CUTOFF") ||
    codes.has("SOURCE_QUALITY_FAILED") ||
    (codes.has("ELO_FAVORITE_INVERSION") && args.severity === "CRITICAL") ||
    args.cause?.code === "INSUFFICIENT_EVIDENCE"
  ) {
    return {
      code: "HOLD_PUBLICATION" as const,
      rationale: "The evidence is too risky or too incomplete to support any correction workflow without human review.",
      supportingFlagCodes,
    };
  }

  if (
    codes.has("XG_1X2_DIRECTION_CONFLICT") ||
    codes.has("BTTS_XG_MISMATCH") ||
    codes.has("OVER_UNDER_XG_MISMATCH") ||
    codes.has("STRONG_FAVORITE_LOW_XG")
  ) {
    return {
      code: "PROPOSE_REVIEWED_XG" as const,
      rationale: "The dominant anomaly is xG-driven, so a reviewed-xG preview is the narrowest deterministic next step.",
      supportingFlagCodes,
    };
  }

  if (
    args.cause?.code === "MODEL_FORMULA_LIMITATION" &&
    args.flags.filter((flag) => flag.family === "INTERNAL_COHERENCE").length >= 2
  ) {
    return {
      code: "MODEL_EXPERIMENT_REQUIRED" as const,
      rationale: "Multiple coherence rules point to a formula-level limitation that should be isolated in a separate experiment.",
      supportingFlagCodes,
    };
  }

  return {
    code: "KEEP_CURRENT" as const,
    rationale: "The current version should stay in place until a later manual or experimental review is approved.",
    supportingFlagCodes,
  };
}
