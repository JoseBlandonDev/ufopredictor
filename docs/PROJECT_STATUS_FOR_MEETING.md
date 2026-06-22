# Project Status for Meeting - UFO Predictor

_Last refreshed: 2026-06-22._

## Executive summary

UFO Predictor's production commercial loop is operational. A new Prediction Intelligence v2 branch now adds a durable historical/rating/schedule database, strict replay, richer scenarios and explanations, and a conservative gated probability candidate.

The important honest conclusion: v2 has not demonstrated a major accuracy jump over v1. Its strongest current value is better data, recency, provenance, scenario interpretation, localization, venues, and premium explainability.

## Delivered on the v2 branch

- 1,392 historical facts;
- 3,028 Elo timeline entries;
- 244 Elo teams;
- 211 FIFA rows;
- complete 104-match official schedule;
- 16 venues;
- 48/48 World Cup teams;
- 36/36 historical replay readiness;
- bounded high-confidence probability candidate;
- scenario/evidence contract;
- Task 3A dry-run migration/import/signal/publication/export tooling.

## Model result

Selected release candidate:

```text
gated_v2_probability_v2_analysis
```

Exact v1 and gated v2 are near parity on holdout. The candidate is appropriate for stage testing, not a claim of superior predictive power.

## Environment readiness

- production and stage use separate Supabase projects;
- stage domain and Auth work;
- stage schema/data are not yet synchronized;
- no v2 database write or publication has occurred;
- production remains untouched.

## Immediate next milestone

Task 3B:

- read-only stage schema/migration audit;
- approved synchronization;
- migration 0038;
- idempotent data load;
- signals and immutable development predictions;
- Torneo development export;
- RLS/public/localization/venue/UI validation.

## Following milestone

Premium/public UI:

- evidence-backed scenarios;
- recent form/opponent quality;
- FIFA/Elo/attack/defense/conversion;
- source cutoff/reliability;
- anonymous/free/premium segmentation;
- Spanish names and official venues;
- English-ready architecture.

## Main risks

1. stage migration drift may require reconciliation;
2. development data must not clone production personal/payment data;
3. gated v2 must not be marketed as materially more accurate;
4. production promotion requires rollback and cross-role smoke;
5. current source refresh still depends on deterministic prepared snapshots where live extraction is unreliable.
