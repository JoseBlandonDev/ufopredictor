# Open Decisions - UFO Predictor

_Last refreshed: post PR #71 plus parallel work planning._

## Decisions closed recently

### E10D direction

Decision: E10D was implemented as expected-goals/scoreline calibration using E10C enriched national-team metadata.

Rationale: the model needed to stop behaving like a fallback-only engine that overproduced `1-1`, especially for clear mismatches.

### Prelaunch refresh for finished fixtures

Decision: allow exact admin-only append refresh for already-public scheduled/finished fixtures during prelaunch.

Rationale: before public launch, some first fixtures had been published with incomplete model/data context. Refreshing with the current model/data is acceptable when not using final results as hidden prediction input.

Boundary: this is append-only and does not mutate results or internal evaluations.

### Public verified result display

Decision: verified final scores can be shown publicly as public-safe match data.

Boundary: do not expose `prediction_results`, exact-score correctness internals, raw evaluation payloads, or Lab payloads.

### Lab legacy fixtures

Decision: do not delete legacy/pilot fixtures yet. Relegate/collapse them in the Lab UI.

Rationale: preserves audit/history while making current operations usable.

### Documentation refresh ownership

Decision: ChatGPT generates project-source documentation refreshes. The user manually copies files into `docs/`. Codex verifies docs-only consistency afterward.

Rationale: ChatGPT holds broader cross-conversation context. Codex is better suited to repo verification, status checks, and diff auditing.

### Parallel work track

Decision: define Epic G as a parallel-safe Product Platform and Monetization Foundations track.

Rationale: another contributor can work on account/plans/billing/product shell tasks while main work continues on data/model/fixtures.

Boundary: Epic G must avoid prediction engine, ingest, signal packs, result verification, and internal prediction result exposure unless explicitly scoped.

## Open decisions

### Premium MVP content

Need to decide exact public-safe premium fields and layout.

Likely included:

- top 3 scorelines with probabilities;
- expected goals;
- BTTS;
- Over/Under 2.5;
- key model factors;
- confidence/risk explanation.

Need to avoid:

- raw Lab payloads;
- `prediction_results`;
- provider predictions;
- odds as hidden input.

### Venue/stadium metadata

Need to decide source and storage:

- API-Football venue data;
- manual World Cup canonical venue map;
- hybrid approach;
- fallback copy when venue is unknown.

### Signal refresh strategy

Need to decide cadence and ownership:

- daily refresh during World Cup;
- semi-manual checkpoints;
- no per-match panic updates;
- later worker/cron automation.

### Payment provider

Need to choose provider before real billing implementation:

- Stripe Checkout;
- Mercado Pago;
- Wompi;
- other provider based on market/support.

This decision requires up-to-date provider research before implementation.

### Subscription/entitlement model

Need to decide schema and gating model before real premium enforcement.

Possible concepts:

- plans;
- subscriptions;
- entitlements;
- billing events;
- account profile state.

### Lineup/injury context

`lineupContextScore` remains neutral. Need source and update strategy.

### Market context

`marketScore` remains neutral. If implemented, must avoid using betting odds or provider predictions as hidden prediction inputs unless the product direction explicitly changes and legal/product boundaries are revisited.

## Decisions not to reopen casually

- Do not expose `prediction_results` publicly.
- Do not use odds/provider predictions as hidden model input.
- Do not commit `codex-inputs/`.
- Do not automate broad API-Football writes without a dedicated safety design.
- Do not document every microchange.
