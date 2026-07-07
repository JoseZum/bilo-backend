# bilo — Startup Plan (Business Docs)

The business counterpart to [`docs/design/`](../design/README.md). Where the design docs answer
*how we build it*, these answer *why it wins, how it makes money, and in what order we attack
the market*. Same discipline: every claim is either evidence-backed (linked source), a named
assumption to validate, or an explicit decision with trade-offs.

| # | Doc | What it answers |
|---|-----|-----------------|
| 01 | [Market & Beachhead](./01-market-and-beachhead.md) | Why Costa Rica university students first, market structure, the SINPE advantage |
| 02 | [Monetization](./02-monetization.md) | Every revenue stream, take-rate math, unit economics per phase, what stays free and why |
| 03 | [Go-To-Market](./03-go-to-market.md) | The campus-by-campus launch playbook, marketing channels, liquidity metrics, expansion gates |
| 04 | [Lessons: Winners & Dead Startups](./04-lessons-winners-and-dead.md) | Researched case studies (Airbnb, Uber, Uniplaces, RadPad, Homejoy, HubHaus, Campus…) and the specific bilo decision each one drives |

## The strategy in one paragraph

bilo launches as **the housing app for university students in Costa Rica** — a dense, underserved,
trust-starved niche we can dominate campus by campus — and uses it to build the three assets the
big vision needs: supply of verified landlords, a trust graph nobody else has, and rent flowing
through our rails. Monetization follows liquidity, never precedes it: matching stays free, we
earn on the payment rail (SINPE-first, which costs us near-zero) and on booking conversion,
exactly like the student-housing marketplaces that survived — and we never touch inventory,
never subsidize payments we can't afford, and never let the relationship leak off-platform
without a reason to stay. Expansion is gated by measured liquidity, Uber-style: a campus is our
"city", and we don't open the next one until the current one clears thresholds.

## Priority change this plan encodes

**AI features are deferred to very late stages** (post-national-scale). The AI module in the
backend design remains specced (doc 07 §14) but drops out of every launch epic; `AI_PROVIDER`
ships as `mock`. Rationale in [02-monetization §6](./02-monetization.md) and the roadmap deltas
in design doc 13: at the beachhead stage, every engineering hour goes to liquidity, trust, and
payments — the things the case studies say kill or crown rental startups. AI answers none of the
beachhead risks.
