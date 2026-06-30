# Workflow Guardrails and Documentation Policy

_Last refreshed: 2026-06-29 after the production Round-of-32 operations and the declaration of the synchronized MVP 1.5 track._

## Source hierarchy

### Shared canonical truth

The exact 10 files under:

```text
docs/00_chatgpt_sources/
```

own current product, environment, roadmap, model, operation, and workflow truth.

Replace the complete set after an approved refresh. Do not keep conflicting “current” copies.

### Runbooks

```text
docs/10_codex_runbooks/
```

Runbooks own stable procedure.

They reference canonical sources for live status and must be updated when an active procedure changes.

### Archive and artifacts

Archives preserve evidence.

Operational artifacts are not canonical product truth.

Untracked JSON reports remain outside commits unless an explicit review package requires them.

## Documentation authorship

### ChatGPT

ChatGPT:

- authors canonical sources;
- authors affected runbooks;
- integrates owner decisions and runtime evidence;
- distinguishes fact, inference, debt, and future work;
- preserves exact filenames.

### Codex

Codex may:

- inspect repository evidence;
- implement bounded code;
- review authored replacements once;
- apply accepted documents exactly when delegated;
- run consistency checks.

Codex does not own canonical documentation authoring.

### Operator

The operator:

- approves scope;
- provides runtime evidence;
- performs Git/PowerShell/admin operations;
- places accepted files in the repository;
- approves remote writes and releases.

## Branch discipline

```text
production: main
V2: integration/prediction-intelligence-v2
MVP 1.5: future bounded branch from current main
```

Rules:

- create MVP 1.5 from current `main`;
- merge current `main` into MVP 1.5 at defined checkpoints;
- merge accepted MVP 1.5 slices into `main`;
- merge updated `main` into V2;
- do not merge unfinished V2 work broadly into MVP 1.5;
- do not manually reimplement the same accepted change in multiple branches;
- prefer small PRs;
- verify live SHAs before work.

Recommended synchronization checkpoint:

- after each MVP 1.5 PR that touches shared public components, queries, types, or navigation;
- before a V2 candidate/release gate;
- before production release when branches have diverged materially.

## Environment safety

```text
stage: yfmklapgjrupctgxaako
production: gcpdffkgsdomzyoenalg
```

Rules:

- no production writes from V2 workflows;
- no production user/payment/entitlement cloning;
- no service-role browser path;
- no secrets in reports;
- no third normal stage environment;
- migration files do not prove remote application;
- remote writes require explicit target confirmation.

## API-Football operator-first rule

Routine production path:

```text
PowerShell provider lookup
-> exact dry-run
-> exact allowlisted apply
-> idempotency verification
-> admin/public smoke
```

API-Football is operational write authority for fixture identity, kickoff, provider state, venue when supplied, and result.

Official FIFA information may be used as a canonical tournament cross-check.

Wikipedia and secondary pages are not write authority.

Codex is not required for:

- fixture discovery;
- score lookup;
- routine dry-run;
- routine apply;
- admin publication;
- admin result verification.

Codex is used when:

- code is broken;
- a supported path is missing;
- a migration is required;
- a focused implementation/test is needed.

## Bounded-operation rule

Default:

```text
one preflight
one dry-run
one exact apply
one verification
one smoke
```

Repeat only for a concrete blocker, provider absence, ambiguity, or approved recovery.

A successful remote write is not repeated because a local display command failed afterward.

## No retrospective prediction rule

Do not create a public prediction after kickoff merely to fill history.

A verified result without a prior prediction:

- remains valid match/result data;
- is excluded from prediction accuracy;
- may appear in a separate official-result surface;
- does not receive a fabricated evaluation.

Historical replay requires explicit labeling and a pre-kickoff data reconstruction.

## Venue and time rule

Venue absence must be classified correctly:

- provider missing;
- ingestion discarded;
- linkage missing;
- public projection missing.

Do not label all venue absence as “pending confirmation.”

UTC remains the source kickoff.

Public display may use:

- viewer-local time;
- Mexico;
- Colombia/Peru;
- Argentina/Chile;
- Spain.

Use IANA zones and actual match date.

Do not request GPS for time formatting.

## Price and localization rule

Owner-approved commercial target and operator-observed production presentation:

```text
US$10 one-time
current production/Wompi display observed by the owner: COP 35,000
```

Repository code/tests still contain stale US$20 / COP 68,700 references. Documentation must label this drift until implementation is reconciled.

Local prices are estimates unless actually charged.

Always distinguish:

- base commercial price;
- actual checkout currency/amount;
- approximate local reference.

Do not infer billing country authoritatively from browser language.

## Review sufficiency

- reconnaissance defines scope once;
- implementation receives one focused review;
- corrections address concrete findings;
- a correction does not restart all reconnaissance;
- closed evidence is not re-proved ceremonially;
- no review of the review without contradictory evidence.

## Prediction immutability

- no post-result rewrite;
- no post-kickoff evidence in original versions;
- new predictions require new immutable versions;
- verified results reference original versions;
- replay is labeled;
- V1 remains comparison baseline.

## Data/source governance

- preserve source identity, observed time, cutoff, version, and reliability;
- distinguish historical baseline from current data;
- update incrementally;
- keep external raw workspaces outside Git when appropriate;
- no secrets/personal payment data in artifacts;
- no secondary-source silent correction.

## Closed production checkpoint

Closed in this refresh:

- 15 Round-of-32 future fixture ingests;
- 15 internal prediction saves;
- 15 public publications;
- empty publication queue;
- Croatia 2-1 Ghana exact refresh/evaluation/idempotency;
- South Africa 0-1 Canada verified without retrospective prediction;
- clean tracked `main` worktree.

Do not rerun these operations without a concrete defect.

## Documentation refresh package rule

A documentation package should:

- preserve canonical paths;
- include only intended changed runbooks;
- include a package manifest;
- identify owner decisions versus repository evidence;
- avoid secrets;
- be reviewed before repository replacement.

## Ownership summary

### ChatGPT

Canonical documents, runbooks, roadmap, interpretation.

### Codex

Inspection, bounded implementation, tests, exact evidence.

### Operator

Git, PowerShell, admin, provider, remote write, release approval.
