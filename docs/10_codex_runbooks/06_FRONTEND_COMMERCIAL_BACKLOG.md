# Frontend and Commercial Backlog

_Last refreshed: 2026-06-29._

## Canonical-status note

This is a derived execution backlog.

Current truth is owned by:

```text
docs/00_chatgpt_sources/01_PRODUCT_MVP1_CURRENT.md
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
docs/00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md
```

## MVP 1.5 objective

Polish the existing product for advertising while Prediction Intelligence V2 continues separately.

MVP 1.5 is not a model release.

## Product states reviewed

- registered Premium;
- registered Free;
- landing;
- predictions;
- match detail;
- Pase Mundial/pricing;
- panel;
- Transparency;
- public history.

Anonymous and mobile should receive a final focused pass before release.

## P0 - Before advertising

### Premium identity

- add persistent `Pase Mundial 2026 · Activo` badge;
- remove repeated pass-active copy from cards;
- make Premium access visible through unlocked behavior;
- keep authorization server-side.

### Free conversion

- after pricing reconciliation, show the owner-approved US$10 one-time offer on home;
- strengthen predictions-page pass banner;
- strengthen locked match-detail block;
- improve panel upgrade block;
- use a clear purchase CTA;
- avoid repeated identical sales copy in every card.

### Pricing clarity

- owner-confirmed production presentation: US$10;
- owner-observed production/Wompi display: COP 35,000;
- reconcile stale repository references to US$20 / COP 68,700;
- approximate local display only when available;
- label exchange/bank variation;
- clarify one-time coverage;
- remove stale US$20 / COP 68,700 fallback and test expectations through an approved forward implementation;
- remove or qualify `Sin vencimiento`.

### Copy cleanup

- remove redundant `Explorar predicciones` on `/predictions`;
- remove `Tu Pase Mundial 2026 está activo` from each card;
- replace internal/ambiguous state copy;
- unify `Pase Mundial 2026`;
- localize `Round of 32` where product style requires Spanish;
- avoid technical/run-scope wording.

### Premium response hierarchy

- main reading;
- key indicators;
- principal scenario;
- compact alternatives;
- what can change the reading;
- model/cutoff/update metadata;
- no repeated scenario paragraph.

## P1 - Utility and trust

### Venues

- normalize API-Football venue ID/name/city;
- upsert `venues`;
- link matches;
- display stadium and city;
- distinguish provider-missing from ingestion-missing.

### Time zones

Primary:

- viewer-local time.

Compact references:

- Mexico;
- Colombia/Peru;
- Argentina/Chile;
- Spain.

Requirements:

- IANA zones;
- actual kickoff date;
- conditional grouping;
- no GPS;
- no long country list.

### Pricing personalization

- explicit user/profile country first;
- trusted request country when available;
- browser locale only as weak fallback;
- show one relevant approximate value;
- retain actual charge currency.

### Pase Mundial page

- stronger price hierarchy;
- clearer benefits;
- actual charge;
- coverage;
- one-time payment;
- comparison with Free;
- support/terms link.

### Panel

Premium:

- pass badge;
- coverage/validity;
- benefits;
- saved matches;
- quick links.

Free:

- account state;
- saved matches;
- next recommended action;
- owner-approved US$10 pass value after repository reconciliation.

### Transparency

Reorganize into:

1. what UFO calculates;
2. what data it uses now;
3. what it does not use yet;
4. how to read a prediction;
5. confidence and risk;
6. verified history;
7. limitations;
8. model/version changes;
9. FAQ.

Add:

- annotated card example;
- glossary;
- update/version date;
- soft product CTA.

## P2 - Follow-up

- explicit time-zone/country preference;
- official verified results without prediction;
- model change history;
- conversion analytics;
- advanced empty/loading/error states;
- ES/EN/PT localization rollout;
- richer saved-match experience.

## Surface matrix

| Surface | Free priority | Premium priority | Main cleanup |
|---|---|---|---|
| Home | show value and US$10 pass | next match and active badge | reduce oversized branding/redundant CTAs |
| Predictions | stronger upgrade banner | compact active-pass state | remove current-route CTA and repeated card copy |
| Match detail | sell locked depth | clearer reading hierarchy | venue/time and metadata |
| Pase Mundial | price/benefits/coverage | active pass summary | clarify actual charge and validity |
| Panel | upgrade next step | pass identity and benefits | improve empty states |
| Transparency | education plus soft CTA | same methodology | reduce text density |
| History | show genuine predictions | same plus Premium detail | separate results without prediction |

## Boundaries

Do not touch:

- model probabilities;
- calibration;
- V2 signal generation;
- original predictions;
- entitlement authority;
- Wompi webhook semantics

unless the task is explicitly a backend task.

## Branch/release rule

- create from current `main`;
- small bounded PRs;
- sync `main` regularly;
- merge accepted changes to `main`;
- sync updated `main` into V2;
- do not wait for one large final merge.
