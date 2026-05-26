# MODEL V01 — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

This is a secondary model reference.

## Principle

The statistical model calculates.

The AI explains.

Prediction probabilities should come from deterministic model code and persisted prediction versions, not from LLM narratives.

## Current Model State

The project has a deterministic prediction engine prototype and model evaluation utilities.

Lab Admin can persist evaluation results using `lib/model-evaluation`.

Public predictions and public match detail read persisted public `prediction_versions` from Supabase through approved public projections.

## Public Product Current Use

`/predictions` shows public 1X2 probabilities, confidence, and risk from DB-backed public prediction versions.

`/matches/[slug]` can show the same public/basic prediction summary when a public prediction exists.

## What Is Not Yet Modeled In Production

- real sports data ingestion;
- real odds integration;
- production-grade calibration;
- automated workers;
- LLM narratives;
- premium market projections.

## Future Considerations

Before larger beta promotion:

- validate predictions against real results;
- separate pre-alignment and post-alignment metrics;
- document model confidence and risk language;
- avoid overpromising accuracy;
- keep disclaimers visible.
