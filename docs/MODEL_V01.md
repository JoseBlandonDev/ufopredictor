# Model V01 - UFO Predictor

_Last refreshed: post PR #71 plus parallel work planning._

## Current model status

The model is no longer in the early fallback-only state.

E10C and E10D are complete:

- E10C enriched the 48 canonical World Cup teams with real signals.
- E10D recalibrated expected-goals and scoreline behavior using enriched metadata.

The model still remains an MVP model. It should be described as probabilistic and experimental, not as a guarantee engine. Humans keep asking for certainty from football. The sport has spent a century saying no.

## Current signal inputs

Available enriched national-team signals:

- FIFA rank / points;
- Elo rank / rating;
- Elo average rank / rating;
- historical goals for per match;
- historical goals against per match;
- recentMatchCount;
- neutral `marketScore: 50`;
- neutral `lineupContextScore: 50`.

## E10D calibration meaning

E10D improved the way enriched metadata affects expected goals and scoreline output.

Goal:

- reduce lazy/default `1-1` behavior for clear mismatches;
- keep draws plausible for balanced teams;
- keep changes bounded and explainable;
- avoid hardcoding outcomes.

Non-goals:

- no use of final results as prediction input;
- no betting odds/provider prediction input;
- no claim of professional-grade calibration;
- no lineup/injury completeness;
- no market context.

## Known limitations

- `marketScore` is still neutral.
- `lineupContextScore` is still neutral.
- Venue/stadium effects are incomplete.
- Signal freshness strategy is not formalized.
- Calibration sample is still small.
- Premium explanations are not implemented.

## Monitoring priorities

Track over more finished fixtures:

- winner correctness;
- exact score behavior;
- draw frequency;
- xG spread for mismatches;
- over/under distribution;
- confidence/risk calibration.

Monitoring should remain internal unless a public-safe product view is explicitly designed.

## Next model/data work

1. Signal refresh strategy.
2. Lineup/injury context.
3. Market context strategy without hidden odds/provider predictions.
4. Confidence/risk calibration review.
5. Broader calibration monitoring after more fixtures.
