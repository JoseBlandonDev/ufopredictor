# MVP2 Parallel Delivery and Operations Automation Runbook

_Last refreshed: 2026-06-23._

## Purpose

Allow the product, model, and operations tracks to advance simultaneously without forcing production to wait for v2.

## Track ownership

### Production continuity track

Base: `main`

- upcoming fixture coverage;
- result verification/evaluation;
- bounded production fixes;
- current-model publications.

### V2 integration track

Base: `integration/prediction-intelligence-v2`

- normalized data/schema;
- model/replay/calibration;
- stage sync;
- development predictions;
- release decision.

### UI/UX track

Base: current `main`

- independent microreleases;
- no migration 0038 dependency;
- no v2 table consumption until approved.

### Ops automation track

Base: current `main` unless a task specifically requires v2 schema.

- fixture discovery/storage;
- status/result polling;
- pending-review creation;
- run logs/notifications;
- batch evaluation assistance.

## MVP2 automation increments

### Increment 1 - fixture registry

- obtain all remaining group-stage fixture IDs;
- reconcile official/provider schedule;
- store canonical links;
- report missing/duplicate/conflicting rows.

### Increment 2 - bounded refresh command

- accept competition/date/fixture manifest;
- refresh statuses and terminal scores;
- dry-run/report/apply modes;
- exact target guards;
- idempotency.

### Increment 3 - scheduled polling

- run once/twice daily;
- poll only relevant fixtures;
- create pending-review rows;
- notify operator;
- no auto-verification.

### Increment 4 - review/evaluation assistance

- select verified result rows;
- batch persist evaluations;
- produce summary/errors;
- retain human control.

### Increment 5 - recurring signal refresh

After v2 stage stabilization:

- refresh current signals before approved cutoffs;
- persist source/provenance/reliability;
- generate only not-started immutable versions;
- compare v1/v2.

## Release discipline

Each increment must be deployable and useful independently. Do not bundle worker infrastructure, new model, internationalization, payment providers, and frontend redesign into one PR, because that is how a roadmap becomes a hostage situation.
