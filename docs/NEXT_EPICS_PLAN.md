# UFO Predictor — Next Epics Plan

Last refreshed: after PR #40.

This document defines the next executable blocks. It is intentionally shorter than `ROADMAP_AND_BACKLOG.md`.

## Current next block

### D06 — Friendly Pilot / Calibration Batch

Status: next active block.

Goal: select and operate 3-5 exact adult national-team friendly fixtures before the World Cup to validate the full internal loop and model v0.1.

D06 starts read-only and no-code unless evidence shows a gap.

## D06 sequence

### D06A — Candidate discovery

Read-only discovery of pre-World-Cup friendlies.

Command pattern:

```bash
npm run spike:api-football -- --mode beta-candidates --competition friendlies --from <YYYY-MM-DD> --to <YYYY-MM-DD> --limit 20 --prioritize true --report true
```

### D06B — Pilot matrix selection

Select 3-5 exact fixtures.

Criteria:

- adult national-team friendlies;
- before World Cup official matches;
- enough time before kickoff to save prediction;
- API-Football coverage looks normal;
- exact fixture ID available;
- not already finished for pre-match prediction;
- varied teams/styles if possible.

### D06C — Pre-match operation

For each fixture:

```bash
npm run spike:api-football -- --mode fixture --fixtureId <providerFixtureId>
npm run spike:api-football -- --mode ingest-dry-run --competition friendlies --fixtureId <providerFixtureId> --from <YYYY-MM-DD> --to <YYYY-MM-DD> --limit 1 --report true
```

Only after review/approval:

```bash
npm run spike:api-football -- --mode ingest-dry-run --competition friendlies --fixtureId <providerFixtureId> --from <YYYY-MM-DD> --to <YYYY-MM-DD> --limit 1 --apply true --report true
```

Then save internal prediction in `/admin/real-fixture-lab`.

### D06D — Post-match operation

After final score exists:

- exact post-match dry-run;
- exact guarded apply;
- verify result;
- persist/refresh evaluation;
- capture readback.

### D06E/F — Evidence and model review

Capture:

- winner correctness;
- BTTS correctness;
- over/under correctness;
- exact score correctness;
- goal error;
- confidence/risk notes;
- failure patterns.

## After D06

### D07 — Emergency Model Calibration

Use D06 evidence to decide minimum viable model changes before World Cup launch.

No large model rewrite before pilot evidence.

### D08 — Minimum Launch Polish

Fix only the admin/public UI pieces that block useful MVP 1 launch.

### Epic E/F/G — MVP 1 launch preparation

After MVP 0 evidence:

- Epic E — World Cup Data & Prediction Launch.
- Epic F — Public Experience & Trust Layer.
- Epic G — Auth, Paywall, and One-Time Payment Gateway Slice.

Payment note:

- Do not assume Stripe.
- Use PayPal or selected payment gateway.
- For the World Cup, prefer one-time package / tournament pass over recurring subscription complexity.

## Parallel work recommendation

If another contributor joins:

- Jonathan continues D06/D07.
- Second contributor starts G01/G02/G04 recognition/design or F01/F03 public UX/trust layer.

Recognition/design first. No payment implementation without plan review.

## Current no-go list

- no broad friendlies apply;
- no World Cup apply yet;
- no provider predictions;
- no odds;
- no public exposure of Lab outputs;
- no workers before manual pilot evidence;
- no service-role app routes;
- no manual result creation UI;
- no score-editing UI.
