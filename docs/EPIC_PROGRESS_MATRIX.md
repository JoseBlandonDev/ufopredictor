# UFO Predictor — Epic Progress Matrix

Last refreshed: post-E10C / PR #66 real national-team signal enrichment.

## Legend

| Status | Meaning |
|---|---|
| Done | implemented, validated, merged or operationally complete |
| Active | current project focus |
| Next | should be planned next |
| Later | known future work, not current scope |
| Blocked/Open | requires decision or dependency |

## MVP 0 — Calibration Lab

| Epic / Task | Status | Notes |
|---|---:|---|
| A — project/app foundation | Done | base Next/Supabase app foundation |
| B — public prediction foundation | Done | public prediction display foundation |
| C — registered/premium foundation | Done | auth/user groundwork exists |
| D05 — Real Fixture Lab loop | Done | internal Lab path proved |
| D06 — friendly pilot | Done | small-sample operational pilot complete |
| D07 — `v0.2-prelaunch` model sanity | Done | frozen for MVP 1 launch baseline |
| D08A — admin navigation cleanup | Done | admin usability improved |

## MVP 1 — World Cup Launch

| Epic / Task | Status | Notes |
|---|---:|---|
| F01 — MVP 1 UI polish | Done | table/action polish complete |
| E03 — exact World Cup ingest hardening | Done | exact fixture guard foundations |
| E04 — first exact World Cup fixture ingest | Done | first real fixture path proved |
| E05 — manual public prediction publication | Done | stable RPC/manual publication path |
| E06/F02 — public launch QA / mock cleanup | Done | real fixture public surface safe |
| E07 — next World Cup fixture publication + public refresh | Done | PR #61 merged |
| E09A — authenticated probable score | Done | PR #63 merged, migration #0031 applied |
| E10B — canonical World Cup catalog / real team snapshot foundation | Done | PR #64 merged |
| H01A — public finished fixture result verification | Done | PR #65 merged, migration #0032 applied |
| E10C — real signal enrichment for 48 teams | Done | PR #66 merged |
| Post-E10C docs rebaseline | Active | refresh current docs after PR #66 |
| E10D — xG / scoreline calibration | Next | must use E10C signal layer, not blind tweaks |

## MVP 1.5 — Live World Cup Iteration

| Epic / Task | Status | Notes |
|---|---:|---|
| Result verification loop extension | Active/Later | continue verifying finished public fixtures exactly |
| Public-safe final-result polish | Later | improve user-facing final result presentation if needed |
| Accuracy dashboard | Later | needs sample size; do not fake significance |
| Richer explanation layer | Later | use signal metadata to explain without exposing internals |
| Encoding/source-label cleanup | Later | mojibake in generated metadata is non-blocking but ugly, naturally |

## Model / Data Epics

| Epic / Task | Status | Notes |
|---|---:|---|
| E10A — read-only model/data diagnosis | Done | discovery/diagnosis only, no PR |
| E10B — canonical catalog + 48-team snapshot coverage | Done | PR #64 merged |
| E10C — FIFA/Elo/recent-form signal enrichment | Done | PR #66 merged |
| E10D — expected-goals and scoreline calibration | Next | inspect outputs, calibrate distribution, reduce over-conservative `1-1` |
| E10E — lineup/injury context | Later | placeholder currently `50` |
| E10F — market context decision | Open/Later | must avoid hidden betting/provider-prediction input |

## Access / Monetization

| Epic / Task | Status | Notes |
|---|---:|---|
| Authenticated probable score | Done | PR #63 merged |
| Free vs premium detail strategy | Active/Later | probable score currently authenticated; premium deeper markets not implemented |
| Payments / tournament pass | Later | do not implement before value tiers settle |
| Premium markets | Later | BTTS/O-U/top scorelines remain future scope |

## Operational Guardrails

| Guardrail | Status | Notes |
|---|---:|---|
| `prediction_results` internal-only | Active | must remain protected |
| Exact fixture operations | Active | no broad/batch apply |
| Manual migrations | Active | Supabase SQL Editor workflow |
| No service-role app routes | Active | security boundary |
| No provider prediction copying | Active | no “borrowed model wearing UFO costume” |
| `codex-inputs/` uncommitted | Active | source packs are local inputs, not repo artifacts |
