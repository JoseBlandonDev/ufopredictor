# UFO Predictor — Next Epics Plan

Last refreshed: post-E05 / first public World Cup fixture publication.

This document defines the next executable blocks. It is intentionally shorter than `ROADMAP_AND_BACKLOG.md`.

## Current reality

The first real World Cup fixture is public:

- Mexico vs South Africa
- `api-football:fixture:1489369`
- match id `00ce2fbc-4ac1-4a47-a97e-c345745e31ef`
- public prediction version id `5787306d-ee3a-4167-88ab-ce669f1ed644`
- model `v0.2-prelaunch`

That means the next work is not “prove the path exists.” It exists. The next work is “make it launch-safe and repeatable without turning the database into soup.”

## Next Epic: E06 / F02 — Public Launch QA and Mock Cleanup

### Goal

Make the public product trustworthy now that a real World Cup fixture is visible.

### Why this is next

`/predictions` can show real published data and legacy/mock/previews close together. That is risky because users may not know what is real pipeline output and what is curated/demo content.

### Scope

- Audit public prediction list.
- Audit public match detail page.
- Confirm no Lab/internal fields leak.
- Decide mock/preview handling.
- Improve uncertainty/risk copy.
- Keep data/model/payment logic unchanged unless a bug is found.

### Suggested branch

```bash
git checkout main
git pull origin main
git status --short
git checkout -b feature/e06-public-launch-qa-mock-cleanup
git status --short
git branch --show-current
```

### Suggested recognition prompt for Codex

```text
Read-only recognition for E06 / F02 public launch QA and mock cleanup.

Context:
- First real World Cup fixture is public: api-football:fixture:1489369, Mexico vs South Africa.
- Match is public and has a public_product prediction version.
- We need to audit public UX and decide how to handle legacy/mock/preview cards.

Scope:
- Inspect /predictions, /matches/[slug], dashboard/public routes, and relevant Supabase query helpers.
- Do not modify files.
- Do not run SQL writes.
- Do not use service-role.
- Do not change model logic.
- Do not touch payment logic.

Questions:
1. Which public pages can show real published predictions?
2. Which pages can still show mock/preview predictions?
3. Are real and mock predictions visually mixed?
4. Does Mexico vs South Africa public detail page have enough safe context?
5. Does any public route expose internal_lab, prediction_results, provider predictions, or odds?
6. What is the smallest safe UI/query cleanup for MVP 1?
7. Should mocks be hidden, separated, or clearly labeled?
8. What files would need changes?
9. What tests/build validation should run?

Return a read-only report and a minimal implementation recommendation. Do not edit files.
```

## Next after E06: E07 — Second Exact World Cup Fixture Publication

### Goal

Repeat the proven exact fixture flow for a second selected World Cup fixture.

### Preconditions

- E06 public surface QA completed.
- Mock/preview decision made.
- Public detail for Mexico vs South Africa verified.
- Current branch clean and based on updated `main`.

### Flow

```text
fixture read
-> ingest dry-run
-> exact apply
-> Real Fixture Lab internal prediction
-> manual public publication
-> public QA
```

### Boundaries

- exact fixture only;
- no broad apply;
- no batch publication;
- no model changes;
- no prediction_results exposure;
- no markets copy unless a separate epic explicitly approves it.

## Optional parallel: Epic G — Payment/Tournament Pass Discovery

### Goal

Prepare payment/product monetization without blocking core prediction launch.

### Constraints

- do not assume Stripe;
- evaluate PayPal or selected available gateway;
- one-time tournament pass first;
- recurring subscriptions later.

### Best parallel shape

Read-only discovery first. No checkout implementation until public prediction surface is stable.

## Later: Epic H — Live Evaluation

### Trigger

Open after at least one public World Cup fixture has a final result.

### Goal

Verify real outcome, persist evaluation, and decide how/when to show aggregate public accuracy.

### Boundary

Do not expose `prediction_results` directly. Any public accuracy layer must be aggregated and reviewed.

## Current no-go list

- broad World Cup apply;
- automatic publication;
- batch publication;
- service-role in app routes;
- provider predictions;
- betting odds as hidden model input;
- model rewrite;
- premium market copy;
- public `prediction_results`;
- editing already-applied migrations.
