# Roadmap, Epics, and Open Decisions

_Last refreshed: 2026-06-23._

## Now

### Documentation and operational baseline

- adopt the consolidated docs structure;
- keep the ChatGPT upload set under 25 sources;
- preserve all original docs in archive;
- continue manual fixture/result/evaluation operations while stable.

### Prediction Intelligence v2 Task 3B

- read-only stage audit;
- human-reviewed synchronization plan;
- stage migration 0038;
- idempotent data/signals/predictions;
- RLS/localization/venue/UI validation.

## Next

### V2 user-facing product

- evidence-based premium reading;
- representative scenario families;
- supporting and contradicting facts;
- confidence/reliability explanation;
- official venue/city display;
- Spanish-first structured narratives;
- English activation using the same keys/templates;
- free/premium/admin projection matrix.

### Operations automation

- scheduled relevant-fixture status refresh;
- terminal-score ingest into pending review;
- admin review notifications;
- evaluation queue assistance;
- recurring signal refresh;
- failure diagnostics and idempotency.

## MVP1 incremental backlog

- venue enrichment where reliable;
- remaining frontend/mobile/accessibility polish;
- dedicated legal/terms/privacy owner decision;
- clearer operational empty/error states;
- cross-device smoke;
- documentation update after each production milestone.

## Commercial expansion backlog

- provider-neutral payment/entitlement adapter;
- evaluate PayPal Business as a secondary direct checkout;
- evaluate regional alternatives only with robust webhook/refund support;
- treat Hotmart as a strategic distribution choice, not a drop-in gateway;
- preserve one canonical product, price, grant, and revocation truth.

## Later v3 research

- larger historical sample;
- tournament-round weighting;
- UFO effective-strength/ranking concept;
- stronger model acceptance criteria;
- market-odds data only with legal/product review;
- no v3 claim without a sufficiently large fair holdout.

## Decisions already made

- production and stage remain separate;
- no new Docker dependency;
- Task 3B starts read-only;
- production writes denied;
- v2 probability is near parity;
- v2 analysis is the main gain;
- scenarios are representative families, not prophecy;
- canonical identity is locale-neutral;
- Spanish now, English first-class-ready;
- official venue truth when available;
- MVP1 stays live while v2 is validated separately.

## Decisions still required

- exact stage migration reconciliation after audit;
- final stage seed scope;
- v1 probability + v2 analysis versus gated-v2 probability + v2 analysis;
- final public/free/premium signal matrix;
- structured deterministic narrative versus optional LLM polish;
- public proprietary boundary;
- legal/terms/privacy publication timing;
- second payment provider strategy;
- automation governance for verification/evaluation.
