# MODEL V01 — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


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

`/predictions` shows public 1X2 probabilities from DB-backed public prediction versions.

`/matches/[slug]` can show the same public/basic prediction summary when a public prediction exists.

After C05 Gate 2A:

- Anonymous still sees full public 1X2.
- Anonymous sees confidence/risk as a basic presentation signal/teaser.
- Registered Free sees confidence/risk fully rendered with more account context.

This is not a model change.

## What Is Not Yet Modeled In Production

- real sports data ingestion;
- real odds integration;
- production-grade calibration;
- automated workers;
- LLM narratives;
- premium market projections;
- real Trust/Transparency public metrics.

## Trust / Transparency Guidance

Before larger beta promotion:

- validate predictions against real results;
- separate pre-alignment and post-alignment metrics;
- distinguish Lab/internal, beta calibration, and trust-eligible public predictions;
- document model confidence and risk language;
- avoid overpromising accuracy;
- keep disclaimers visible.

Early beta matches are for calibration and learning. Do not pretend the first noisy sample is a glorious statistical cathedral. It is not.
