# V2 Branch and Environment Normalization Runbook

_Last refreshed: 2026-06-29._

## Current status

The original normalization is complete.

Current V2 work uses:

```text
integration/prediction-intelligence-v2
Draft PR #114
stage.ufopredictor.com
stage Supabase yfmklapgjrupctgxaako
```

Old branch and PR #106 remain preservation only.

Do not repeat the original nine-commit normalization unless a concrete recovery task requires it.

## Ongoing purpose

Preserve the V2 branch on top of current production behavior as `main` continues to receive:

- production operations;
- bounded fixes;
- MVP 1.5 product releases;
- security/commercial updates.

## Main synchronization procedure

1. verify clean V2 worktree;
2. fetch remote refs;
3. verify current V2 HEAD and expected Draft PR;
4. inspect `main..V2` and `V2..main`;
5. merge current `main` into V2 using repository policy;
6. resolve shared files manually;
7. preserve stage-only data/model work;
8. run affected production and V2 tests;
9. lint/build;
10. record synchronization SHA;
11. confirm no production write.

## Shared conflict zones

Review carefully:

- public display helpers;
- prediction cards;
- match detail;
- public query helpers;
- pricing/panel/navigation;
- shared database types;
- venue ingestion types;
- time-zone presentation helpers;
- docs.

Do not accept V2 copies that roll back newer production/MVP 1.5 behavior.

## MVP 1.5 interaction

MVP 1.5 does not merge unfinished V2 model work.

Flow:

```text
MVP 1.5 -> main
main -> V2
```

not:

```text
V2 -> broad MVP 1.5 merge
```

Shared changes are preserved through current `main`.

## Validation after synchronization

- public prediction/lifecycle tests;
- match detail tests;
- Auth/pricing/entitlement tests if touched;
- fixture/result tests if shared ingest code touched;
- venue/time tests if added;
- V2 focused tests;
- lint;
- production build;
- stage target guard;
- no production write.

## Environment contract

```text
production: ufopredictor.com / gcpdffkgsdomzyoenalg
stage: stage.ufopredictor.com / yfmklapgjrupctgxaako
```

Do not create another normal stage environment.

Do not clone production users/payments/entitlements into stage.

## Required output

- pre-sync branch/HEAD;
- main HEAD merged;
- conflict list/resolutions;
- tests/build;
- post-sync HEAD;
- no-production-write confirmation.
