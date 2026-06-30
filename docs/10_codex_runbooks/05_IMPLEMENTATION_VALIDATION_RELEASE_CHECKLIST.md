# Implementation, Validation, and Release Checklist

_Last refreshed: 2026-06-29._

## Every task

- verify branch/base/upstream;
- prove tracked worktree status;
- declare environment/write scope;
- keep scope bounded;
- add focused tests;
- run lint/build where applicable;
- inspect diff;
- report exact behavior and commit SHA;
- do not include operational artifacts accidentally.

## Production operator task

- API-Football exact lookup;
- exact dry-run;
- exact allowlist;
- one apply;
- one idempotency verification;
- admin/public smoke;
- no Codex unless path is broken;
- no secondary-source write authority.

## MVP 1.5 branch creation

- branch from current `main`;
- no unfinished V2 dependency;
- declare intended shared files;
- define synchronization checkpoint;
- avoid broad redesign in one PR.

## MVP 1.5 P0 release

Validate:

- anonymous;
- registered free;
- Premium;
- admin;
- desktop;
- mobile;
- keyboard/focus basics;
- no entitlement regression;
- no Wompi regression;
- no public history regression;
- no prediction recalculation.

## Pricing/copy release

- owner-approved US$10 / operator-observed COP 35,000 presentation reconciled with authoritative runtime pricing, repository code, fallback paths, and tests;
- stale US$20 / COP 68,700 migration/fallback/test references resolved through an approved forward change;
- actual Wompi charge currency/amount shown;
- approximate currencies labeled;
- no false lifetime claim;
- no duplicated CTA to current route;
- no repeated entitlement sentence in every card;
- Spanish product naming consistent.

## Venue release

- provider venue fields optional;
- exact provider venue identity;
- venue upsert idempotent;
- match linkage correct;
- provider-missing venue remains null;
- public projection returns stadium/city;
- no model/V2 probability change;
- shared types synchronized to V2 after main merge.

## Time-zone release

- UTC source unchanged;
- viewer-local detection safe;
- no GPS;
- Mexico reference correct;
- Colombia/Peru grouping conditional;
- Argentina/Chile grouping conditional;
- Spain uses Madrid;
- DST tests cover relevant match dates;
- hydration/server-client output stable;
- fallback works without browser time zone.

## Premium response release

- main reading first;
- indicators correct;
- scenario probabilities unchanged;
- no duplicated explanatory paragraphs;
- locked Free view still protects Premium fields;
- Premium access remains server-authorized.

## Transparency/panel release

- no internal table/run-scope terminology;
- no ambiguous venue state;
- no misleading access validity;
- conversion path visible but not invasive;
- responsible-product language retained.

## Main synchronization into MVP 1.5

After meaningful `main` change:

- fetch;
- inspect divergence;
- merge/rebase according to repository policy;
- resolve manually;
- rerun affected tests/build;
- record synchronization SHA.

## MVP 1.5 merge to main

- current main merged into branch first;
- PR focused and reviewable;
- production-safe migration policy;
- smoke plan;
- rollback notes;
- owner approval.

## Main synchronization into V2

After accepted shared product changes:

- merge current `main` into V2 integration;
- preserve V2 stage-only boundaries;
- resolve shared frontend/types manually;
- run public prediction tests;
- run V2 focused tests;
- lint/build;
- no production write.

## V2 task

- expected V2 branch/SHA;
- stage target proof;
- production deny ref;
- source/cutoff proof;
- no original V1 mutation;
- idempotency;
- candidate unpublished unless approved.

## Production promotion

- accepted stage/product state;
- rollback plan;
- commercial/public/admin regression suite;
- documentation refresh;
- owner approval.
