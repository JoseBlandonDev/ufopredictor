# MODEL V01 — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

This is a secondary model reference.

## Principle

The statistical model calculates.

The AI explains.

Prediction probabilities should come from deterministic model code and persisted prediction versions, not from LLM narratives.

## Current Model State

The project has a deterministic prediction engine prototype and model evaluation utilities.

Lab Admin can persist evaluation results using `lib/model-evaluation`.

Public predictions read persisted `prediction_versions` from Supabase.

## Public Product Current Use

`/predictions` shows public 1X2 probabilities, confidence, and risk from DB-backed public prediction versions.

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
