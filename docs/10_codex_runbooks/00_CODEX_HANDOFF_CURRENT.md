# Codex Handoff Current

_Last refreshed: 2026-06-23._

## Repo baselines

```text
Production main after PR #109:
e0191607d46484d13d0771b4508da3b05722dcb5

Prediction Intelligence v2 branch:
feature/prediction-intelligence-v2-data-foundation

Draft PR #106 head:
eefcff709e80209215b25b90fb870aa5c080d735
```

PR #106 must remain Draft.

## Production MVP1 truth

- PR #108 merged/deployed the polished freemium experience.
- PR #109 merged/deployed time-derived match lifecycle classification.
- Auth/Wompi/webhook/entitlement premium flow is already proven in production.
- Recent results including Norway 3-2 Senegal and Jordan 1-2 Algeria were verified.
- The pending evaluation queue was cleared in the latest operator pass.
- Result and evaluation operations remain manual.

## Environment contract

```text
ufopredictor.com       -> production Railway/Supabase
stage.ufopredictor.com -> development Railway/Supabase stage
```

Do not create another environment. Do not require Docker.

## Routine admin surface map

- Prediction Review Gate: selected anomaly review and human decision records.
- Real Fixture Publish Queue: exact public publication path.
- Result Review Queue: pending provider final results.
- Evaluation Queue: persist post-match comparisons.
- Torneo Export: public-safe partner export.
- Real Fixture Lab exact-detail: optional deeper diagnostics, not required for routine operations.

Do not manually rewrite probabilities in Review Gate or make routine work depend on Real Fixture Lab.

## Exact next technical task

Task 3B for Prediction Intelligence v2:

1. update/fetch branch context safely;
2. run read-only remote stage audit;
3. report migration/schema drift and non-destructive plan;
4. stop for human approval;
5. only then execute authorized stage synchronization.

## Hard boundaries

- no production writes;
- no merge of PR #106;
- no production migration 0038;
- no production user/payment/entitlement cloning;
- no secrets in output;
- no code changes during a docs-only reorganization unless explicitly requested;
- no reopening completed MVP1 commercial work.

## Reporting contract

Return:

- branch/status/base SHA;
- files inspected/changed;
- exact before/after behavior;
- commands and test results;
- blockers only when concrete;
- final verdict;
- commit SHA when changes are committed.
