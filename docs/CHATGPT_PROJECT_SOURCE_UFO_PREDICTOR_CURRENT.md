# ChatGPT Project Source — UFO Predictor Current

Last refreshed: post-E10C / PR #66 real national-team signal enrichment.

This is the high-signal project source for ChatGPT conversations. It should prevent new conversations from improvising the roadmap, because stale documentation is basically a fog machine with commit history.

## Product summary

UFO Predictor is a football prediction product focused on probabilistic match forecasts, transparent methodology, and safe public/free/premium presentation.

Current launch focus:

- World Cup 2026 selected fixtures;
- public basic predictions;
- authenticated probable-score value;
- protected internal Lab/evaluation data;
- controlled exact-fixture operations before automation;
- improving model credibility through real team-strength signals.

## Current milestone

MVP 1 has moved beyond first-public-fixture proof. It now has:

- selected World Cup fixtures public;
- authenticated probable-score gating;
- finished-result verification for public fixtures;
- a 48-team canonical World Cup catalog;
- real FIFA/Elo/recent-form signal enrichment for all 48 canonical teams.

Recent merged PRs:

| PR | Title | Project meaning |
|---:|---|---|
| #63 | `feat: gate probable score to authenticated match detail` | probable score gated to authenticated match detail; public teaser for anonymous users |
| #64 | `Feature/e10b real team strength snapshots` | 48-team canonical World Cup catalog and complete snapshot coverage foundation |
| #65 | `feat: support public finished fixture result verification` | admin Lab can verify public finished results and persist internal evaluation |
| #66 | `feat: enrich national team strength signals` | E10C wired real FIFA/Elo/recent-form signal pack into national-team snapshots |

## Public fixture state

Initial controlled fixtures:

| Match | Fixture | Slug / status note |
|---|---:|---|
| Mexico vs South Africa | `api-football:fixture:1489369` | public; finished result verified 2-0 |
| South Korea vs Czechia | `api-football:fixture:1538999` | public; finished result verified 2-1 |
| Canada vs Bosnia & Herzegovina | `api-football:fixture:1539000` | public; finished result verified 1-1 |
| USA vs Paraguay | `api-football:fixture:1489370` | public World Cup match; publication path proved |

Core publication path:

```text
API-Football exact fixture
-> guarded exact ingest
-> Real Fixture Lab internal prediction
-> manual publication
-> public_product prediction
-> public match visibility
```

Public result verification path:

```text
finished public fixture
-> exact Real Fixture Lab load
-> pending_review result write
-> admin verification
-> internal prediction evaluation
-> public final status/result remains safe
```

## MVP stage map

### MVP 0 — Pre-World-Cup Calibration Lab

Status: complete / operational PASS.

Includes:

- D05 Real Fixture Lab loop;
- D06 5-fixture friendly pilot;
- D07 v0.2-prelaunch model sanity;
- D08A admin navigation cleanup.

Important interpretation:

- operational loop proved;
- sample too small for strong public performance claims;
- model remains in prelaunch family until dedicated calibration work lands.

### MVP 1 — World Cup Launch MVP

Status: active / public baseline established.

Completed:

- F01 UI polish;
- E03 exact World Cup ingest hardening;
- E04 first exact World Cup fixture ingest;
- E05 manual public prediction publication runtime pass;
- E06/F02 public surface QA and mock cleanup;
- E07 selected fixture expansion, fallback signals, and exact public refresh;
- E09A authenticated probable-score gating;
- E10B canonical World Cup catalog and 48-team strength snapshot foundation;
- H01A public finished result verification;
- E10C real signal enrichment for all 48 teams.

Next:

- post-E10C docs rebaseline;
- E10D xG/scoreline calibration using E10C signals;
- optional data-quality cleanup for encoding/source labels;
- lineups/injury context planning;
- market-signal decision only if explicitly scoped and product-safe.

### MVP 1.5 — Live World Cup Iteration

Likely work:

- scoreline calibration;
- better public explanations powered by metadata;
- final-result UX polish;
- accuracy dashboard once sample size is not laughably small.

## Active architecture summary

### Ingest / Lab / Public boundary

- API-Football ingest remains controlled and exact-fixture based.
- Real Fixture Lab remains internal/admin.
- Manual publication creates `public_product` rows.
- Public surfaces never expose `prediction_results` or internal evaluation payloads.

### Signal enrichment boundary

E10C added:

```text
lib/prediction-engine/national-team-strength-signal-pack.ts
```

It is a generated static source module. It must not depend on `codex-inputs/`, filesystem reads, runtime JSON imports, or external web calls.

The snapshot layer now builds canonical World Cup snapshots using the generated pack while preserving legacy/test-only snapshot keys.

## Active model input state

The model now has real signal fields for the 48 canonical teams:

- `fifaRank`
- `fifaPoints`
- `eloRank`
- `eloRating`
- `eloAverageRank`
- `eloAverageRating`
- derived historical goals for/against per match
- recent-form availability via `recentMatchCount`
- neutral `marketScore: 50`
- neutral `lineupContextScore: 50`

Raw Elo totals and fixture-expectancy data were part of the source-preparation context, but E10C did not expose them as active runtime snapshot fields.

Important: E10C improved inputs, not scoreline calibration. Expected goals and scoreline distribution are still conservative and must be handled in E10D.

## Current model limitations

- Market signal is neutral placeholder.
- Lineup/injury signal is neutral placeholder.
- Some source-label encoding/mojibake may remain in generated metadata.
- Recent form exists but weighting and effect on xG may need calibration.
- Scoreline generation can still overfavor `1-1` because E10D has not happened.

## Red lines and settled constraints

- `prediction_results` remains internal only.
- Public rows must remain public-safe.
- No betting odds/provider predictions as hidden model input.
- No broad/batch apply.
- No service-role app routes.
- No manual stored row edits.
- No committed `codex-inputs/`.
- No scoreline/xG tuning without explicit E10D scope.

## Recommended next task

First, ensure local cleanup after PR #66:

```powershell
git checkout main
git pull origin main
git status --short
git branch -d feature/e10c-real-signal-enrichment
git push origin --delete feature/e10c-real-signal-enrichment
Remove-Item -Recurse -Force codex-inputs
git status --short
```

Then proceed with:

```text
E10D — calibrate expected goals and scoreline distribution using the E10C real signal layer
```

E10D should start read-only. It must compare current outputs before changing model math. No more tuning by vibes, humanity has caused enough damage that way.
