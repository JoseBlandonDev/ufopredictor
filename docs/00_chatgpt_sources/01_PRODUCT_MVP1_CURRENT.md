# Product and Commercial MVP1 - Current

_Last refreshed: 2026-06-29 after the Round-of-32 publication batch and the Free/Premium MVP 1.5 surface review._

## Product

UFO Predictor is a football-intelligence product that publishes probabilistic World Cup readings.

It:

- is not a sportsbook;
- does not accept bets;
- does not guarantee results;
- explains uncertainty instead of presenting certainty;
- preserves predictions and verified outcomes for review.

## Production MVP1 status

The commercial production loop is operational:

```text
visitor
-> account
-> checkout
-> Wompi approval webhook
-> entitlement grant
-> Premium access
```

The return page is informational. Premium access is granted by the validated server-side flow, not by browser state.

MVP1 remains live while V2 is developed separately.

## Owner-approved commercial target and operator-observed production presentation

Owner-approved and operator-confirmed production presentation:

```text
name: Pase Mundial 2026
base commercial price: US$10
current production/Wompi display observed by the owner: COP 35,000
payment model: one-time
coverage: published World Cup 2026 matches supported by the product
```

Repository implementation is not yet fully reconciled: migration history, UI fallback, and pricing tests still contain the previous US$20 / COP 68,700 contract. Treat that as MVP 1.5 implementation debt, not as the desired commercial decision.

Currency references outside the actual Wompi charge are estimates only.

Recommended public wording after repository reconciliation:

```text
US$10 one-time
Owner-observed production/Wompi display: COP 35,000
Reference values may vary with exchange rate and bank conversion.
```

Until repository code, fallback paths, and pricing tests are reconciled, this remains owner-approved commercial/product truth plus operator evidence, not tracked-repository implementation truth.

Do not imply that an approximate local value is the final charged amount unless checkout supports that currency.

## Access tiers

### Anonymous

- limited public browsing;
- public prediction preview;
- product and responsibility explanation;
- authentication required before purchase;
- visible but non-invasive upgrade path.

### Registered free

- published 1X2 probabilities;
- public confidence/risk context where allowed;
- public fixture detail;
- eligible verified history;
- saved matches;
- strong, clear upgrade path to Pase Mundial 2026.

### Premium

- representative scenarios;
- expected goals;
- BTTS and total-goals context;
- expanded confidence and risk explanation;
- full Premium match reading where published;
- saved matches and account status;
- Premium identity visible without repeating entitlement copy inside every card.

### Admin

- fixture publication queue;
- result review;
- evaluation operations;
- controlled entitlement and payment inspection;
- no public service-role path.

## Current production coverage

The following is operator-confirmed production evidence rather than a fact independently provable from tracked Git state alone.

The current public product includes 15 future Round-of-32 predictions.

The latest verified result corrections include:

- Croatia 2-1 Ghana, preserving and evaluating the original prediction;
- South Africa 0-1 Canada, stored as an official verified result without a retrospective prediction.

A verified result without a prior prediction is valid match history but must not be presented as a UFO prediction or included in model accuracy.

## Current Free/Premium surface assessment

The product is functional and coherent, but the current surfaces need a conversion and hierarchy pass before broader advertising.

### Confirmed issues

- Premium status is communicated repeatedly but not strongly branded.
- `/predictions` contains redundant calls to actions for users already on the page.
- cards repeat account-status text that should be global or contextual;
- `Estadio pendiente de confirmación` currently hides an ingestion limitation;
- kickoff is presented only in Bogotá/COT;
- the Free offer does not surface the US$10 price often enough;
- the Premium pass page and dashboard feel administrative rather than valuable;
- the Premium match response repeats scenario explanation;
- Transparency is accurate but too text-heavy;
- English/Spanish product names are inconsistent in places;
- `Sin vencimiento` may describe a technical grant but not the intended commercial promise.

## MVP 1.5 product objective

MVP 1.5 should make the current product polished enough to advertise while V2 remains in development.

The product must answer quickly:

- what is available free;
- what Premium unlocks;
- why the pass is useful;
- what it costs;
- how long the commercial offer applies;
- what the model believes;
- what could make the reading fail.

## Premium identity

Recommended persistent product badge:

```text
Pase Mundial 2026 · Activo
```

Use it in a bounded location such as navigation, account identity, or the Premium panel.

Do not repeat “Tu Pase Mundial 2026 está activo” inside every prediction card.

Premium access should be visible through:

- a badge;
- unlocked actions;
- clear Premium sections;
- a useful account summary.

## Registered-free conversion strategy

The pass should be visible across Free surfaces without becoming an advertisement on every line.

### Home

Show:

- free value;
- Premium difference;
- US$10 one-time price;
- direct CTA to the pass;
- next published match.

### Predictions

Replace account-state copy with a compact commercial summary.

Avoid a button that links to the page the user is already viewing.

### Prediction cards

Keep public value visible.

Use a small contextual line such as:

```text
Pase Mundial: scenarios, xG, and the complete reading.
```

Do not place identical sales copy in every card when one section-level explanation is sufficient.

### Match detail

The locked Premium block should show:

- exactly what unlocks;
- US$10 one-time price;
- current charge currency;
- coverage;
- purchase CTA.

### Panel

Show:

- current account tier;
- saved matches;
- pass value;
- next action;
- consistent product naming.

### Transparency

Use a soft conversion block that links interpretation to a real match and the Premium depth, without turning a methodology page into a checkout funnel.

## Premium match-response direction

The Premium detail should be organized as:

1. main UFO reading;
2. key indicators;
3. principal scenario;
4. compact alternatives;
5. what could change the reading;
6. model/cutoff/update metadata.

Avoid repeating the same explanatory paragraph across three scenario cards.

Example structure:

```text
Main reading
Brazil begins with a clear advantage because of stronger expected attacking output.
The draw remains the main alternative.

Key indicators
Home / Draw / Away
xG
BTTS
Over/Under 2.5

Main scenario
2-0

Alternative scenarios
1-0
2-1

What could change the reading
A lower-tempo game or efficient defensive block can increase the draw probability.
```

## Venue display

The tournament venues and kickoff times are not inherently unknown.

The current product lacks venues because the ingestion pipeline ignores provider venue fields.

MVP 1.5 venue work should:

- read provider venue ID/name/city;
- upsert the existing `venues` table;
- set `matches.venue_id`;
- show stadium and city;
- use an honest fallback only when provider data is truly missing.

## Time presentation

Preferred behavior:

1. display the viewer-local kickoff time when available from browser time-zone detection;
2. provide a small expandable reference set;
3. fall back to:
   - Mexico;
   - Colombia / Peru;
   - Argentina / Chile;
   - Spain.

Use IANA zones and the actual match date.

Only group country labels when the rendered local time matches.

Do not request GPS for this feature.

## Localized price presentation

Preferred behavior:

1. display the actual commercial base and charge;
2. show one local approximation when country/locale can be inferred safely;
3. keep the actual charged currency explicit;
4. label approximations.

Country detection priority:

- stored profile country when implemented;
- explicit user choice;
- trusted request country/edge metadata when already available;
- browser locale only as a weak fallback;
- otherwise US$10.

Do not infer country from language alone as an authoritative billing decision.

## Terms and commercial clarity

MVP 1.5 should add or clarify:

- one-time payment;
- covered product and tournament;
- commercial validity;
- actual charge currency;
- approximate conversion disclaimer;
- refund/support path;
- no guaranteed results;
- no sportsbook relationship.

The technical entitlement may remain active without an expiry timestamp, but public copy should describe the purchased product honestly. Do not promise “lifetime” access merely because a current row has no end date.

## Public history behavior

Prediction history must contain only matches with a genuine public prediction version.

A separate future surface may show:

```text
Official verified results without a UFO prediction
```

That surface must not create:

- a prediction version;
- an evaluation;
- a success/failure claim;
- retrospective accuracy.

## MVP 1.5 priorities

### P0 before advertising

- improve Free pass visibility;
- make US$10 explicit;
- add a Premium badge;
- remove redundant account-state text from cards;
- remove redundant `/predictions` actions;
- clarify pass coverage and validity;
- simplify Premium scenario hierarchy;
- unify Spanish product terminology;
- replace ambiguous venue copy.

### P1

- persist and display venues;
- viewer-local kickoff plus compact references;
- stronger pricing and panel presentation;
- redesign Transparency for scanning;
- improve landing conversion;
- mobile/accessibility pass;
- better empty states.

### P2

- explicit country/time preference;
- local price approximation service;
- public results without prediction;
- model-change history display;
- annotated Transparency example.

## Boundaries with V2

MVP 1.5 may change:

- copy;
- layout;
- component hierarchy;
- badges;
- pricing presentation;
- venue ingestion/display;
- time formatting;
- public product explanations.

It must not change:

- prediction calculations;
- signal selection;
- calibration;
- V2 storage;
- candidate generation;
- original prediction history.

## Product verdict

MVP1 is operational.

MVP 1.5 is now the declared polish and conversion track needed before broad advertising.

V2 remains a separate model-development and release track.
