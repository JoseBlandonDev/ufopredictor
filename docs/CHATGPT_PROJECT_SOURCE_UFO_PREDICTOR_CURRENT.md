# ChatGPT Project Source - UFO Predictor Current

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Product summary

UFO Predictor is a probabilistic football prediction product. It publishes controlled World Cup predictions, verifies final results, keeps internal evaluation private, and offers premium public-safe model detail. It does not receive bets and does not guarantee outcomes.

## Current production state

- `/predictions` publishes launch-safe World Cup predictions and verified result history.
- `/matches/[slug]` provides public match detail.
- Premium model detail is available through a protected public-safe projection.
- Wompi payment flow is operational and verified payments activate premium access automatically.
- Premium users receive premium-active presentation rather than free-user upgrade prompts.
- Admin payment and pricing controls exist.
- `/admin/real-fixture-result-review-queue` is the result verification path.
- `/admin/real-fixture-evaluation-queue` is the evaluation persistence path.
- `/admin/real-fixture-publish-queue` is the lightweight publication path.
- Torneo Mundialista admin export is implemented.
- Real Fixture Lab exact-detail remains a separate stack-overflow follow-up.

## Accepted model state

PR #94 merged the current accepted model/data slice:

- SIGNAL04 refreshed national-team FIFA/Elo and reviewed aggregate strength signals.
- DRAW01 added a conservative draw top-outcome reconciliation.
- `Cape Verde Islands` alias resolution was fixed.
- `expected-goals.ts` was deliberately left unchanged after three XG01A candidates failed acceptance guardrails.

The model was updated and improved modestly in 1X2/draw handling. Exact-score prediction did not improve, and the model still underestimates some blowouts and compresses some favorites toward close scorelines.

## Evaluation evidence

Fair stored-prediction scope: latest evaluated `internal_lab` + `pre_match_24h` row per unique fixture.

- raw evaluation rows: 31;
- unique launch-safe fixtures: 28;
- 1X2: 16/28;
- exact score: 7/28;
- BTTS: 16/27;
- O/U 2.5: 16/28;
- average total-goal error: 1.821.

A fair DRAW01 overlay on 26 stored fixtures changed 1X2 from 14/26 to 15/26, captured one additional draw, and introduced zero false top draws.

Do not present refreshed-signal recomputations over past fixtures as fair backtests.

## Latest verified/evaluated results

- Canada 6-0 Qatar, fixture `1489387`.
- Mexico 1-0 South Korea, fixture `1489388`.

Both are verified, publicly projected, and internally evaluated. Result Review Queue and Evaluation Queue are empty.

## Current public upcoming runway

Current count: 4.

- United States vs Australia
- Scotland vs Morocco
- Brazil vs Haiti
- Türkiye vs Paraguay

## Public/premium boundaries

Public surfaces may show public-safe 1X2 probabilities, confidence/risk according to viewer policy, and verified final results. Premium detail may include expected goals, top scorelines, BTTS, O/U 2.5, confidence, and risk through the protected projection.

Never expose `prediction_results`, raw evaluation payloads, raw Lab payloads, service-role data, provider predictions/odds, payment secrets, or Torneo human picks as model inputs.

## Signal refresh source workflow

The first SIGNAL04 source package was generated from:

- `Ranking FIFA - Hoja 2.csv`;
- `ranking ELO.html`;
- `results.html`.

It covered 48 World Cup teams but was not fully runtime-safe. It contained invalid/future dates, unresolved aliases, incomplete recent lists, and leakage risk. SIGNAL04 therefore used reviewed safe fields and aggregates, not the raw `last5` arrays.

Future refreshes require a quality report before Codex implementation. See `SIGNAL_REFRESH_PLAYBOOK.md`.

## UIHISTORY01 state

Recognition complete; no implementation changes exist yet.

Recommended MVP: 4 recent results on `/predictions`, dedicated `/predictions/history`, server pagination of 12, verified finished rows only, existing card reuse.

## Launch-parallel Epic G work

Safe parallel launch tasks include:

- G09 mobile/responsive polish;
- G10 PWA installability MVP;
- G11 update/offline safety planning;
- G12 accessibility/performance pass;
- G13 cross-device production smoke;
- G14 ownership/coordination.

Parallel frontend/PWA branches must not modify canonical docs, model/ingest/result code, Supabase migrations, Wompi webhook logic, or entitlement activation without explicit assignment.

## Next sequence

Documentation refresh -> update project sources -> new conversation -> result monitoring / next runway publication -> UIHISTORY01 or launch-polish slices under isolated ownership.
