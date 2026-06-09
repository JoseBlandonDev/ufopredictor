# UFO Predictor — Model v0.1

Last refreshed: after PR #40.

## Current status

Model v0.1 is the current internal prediction model used by Real Fixture Lab.

It is usable for internal trial predictions, but it has not yet been calibrated from a 3-5 friendly pilot sample.

D06 is expected to generate the first compact pilot evidence set.

## Known characteristics

Current Real Fixture Lab outputs include:

- 1X2 probabilities;
- BTTS probabilities;
- over/under 2.5 probabilities;
- top scoreline candidates;
- confidence/risk notes;
- model input summaries;
- notes/factors.

Many inputs can still be default or neutral when provider/team signal data is incomplete.

The model does not use provider predictions or betting odds.

## Friendly match caveat

Friendlies are noisy:

- many substitutions;
- rotation-heavy lineups;
- teams protecting key players;
- unclear tactical intensity;
- late experimentation.

Therefore D06 friendlies should be used for:

- validating the operational flow;
- rough calibration;
- identifying obvious model failures;
- checking confidence/risk behavior.

They should not be treated as final proof of World Cup match accuracy.

## D06 evidence targets

For each pilot fixture, capture:

- winner correctness;
- BTTS correctness;
- over/under 2.5 correctness;
- exact score correctness;
- goal error;
- confidence/risk usefulness;
- recurring failure patterns.

## D07 purpose

D07 is Emergency Model Calibration.

It should use D06 evidence to decide minimum viable changes before World Cup launch.

Possible D07 scope:

- confidence/risk tuning;
- top scoreline sanity;
- neutral/friendly uncertainty handling;
- default signal weighting review;
- model copy/disclaimer improvements.

No large model rewrite before pilot evidence.
