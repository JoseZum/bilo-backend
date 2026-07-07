# 10 — Risk Register

The consolidated register. Format: risk → likelihood/impact → mitigation (what we do now) →
trigger & response (what we do if it fires) → owner. Reviewed at the Friday scorecard
(doc 09 §4); a risk without a current mitigation is a to-do, not a note.

| # | Risk | L | I | Mitigation now | Trigger → response | Owner |
|---|---|---|---|---|---|---|
| R1 | **Payments regulation** — Phase A fee-billing model deemed captación / PSP activity | M | **Fatal** | Doc 05 §1 architecture (funds never touch us); counsel item L2 answered before rail launch | Regulator contact → pause rail (matching keeps working — graceful degradation is designed in), execute Phase B partnership memo (L7) | Founders + counsel |
| R2 | **Tenancy-law structuring fails** — hospedaje route rejected; semester leases = 3-year leases | M | High | Counsel item L1 is P0; both lease templates drafted; product works with annual leases too (10-month unit economics already assume ~1 year) | L1 negative → pivot pilot messaging to annual+ leases & exchange students (whose stays fit hospedaje hotels-style regimes regardless) | Founders |
| R3 | **Liquidity failure at campus #1** — supply or demand doesn't materialize | M | High | Supply-first playbook with founder-led onboarding; gates catch it in weeks not months (doc 03 §5); assumption checkpoints at T−6 | <60% of listing target at T−4 → delay demand launch one cycle rather than launch empty; re-examine niche assumptions honestly | Founders |
| R4 | **Leakage** — matches close off-platform, rail adoption stalls <40% | M | High | On-rail-only value design (doc 02 §2); rail priced under annoyance threshold | Rail adoption <40% after 2 months → founder interviews with every leaked pair; adjust value/price before adding friction | Ops |
| R5 | **Trust incident goes viral** (scam, safety event at a visit) | M | High | Verification ladder V3 on all pilot listings; visit-safety features; incident runbook pre-written (doc 07 §2–4) | Execute runbook: victim outcome first, platform rule published, founders face it personally | Founders |
| R6 | **Incumbent inertia** — FB groups are free and good enough; nobody switches | M | High | We don't fight the channel, we harvest it (doc 03 §3); differentiation = verification + templates + rail that FB can't copy | Activation strong but retention weak → the trust product isn't landing; go deeper on the two golden journeys, not wider | Founders |
| R7 | **Seasonality** — between matrículas, demand craters | **H** | M | Known and planned: burn floors between waves (doc 08); off-cycle demand = exchange students (year-round) + mid-semester moves | Treat as calendar, not surprise: ship product between waves, market during them | Ops |
| R8 | **Single-campus concentration** — pilot campus idiosyncrasies mislead us | M | M | Wave-2 campus (UNA Heredia) validates transferability early; playbook post-mortem per wave (doc 09 §4) | Metrics diverge wildly at campus 2 → isolate which assumptions were UCR-specific before wave 3 | Founders |
| R9 | **Key-person dependency** — founder-led everything | H | M | These docs exist precisely to de-bus-factor the architecture & playbook; hire 1 shadows all campus ops (doc 08 §4) | — | Founders |
| R10 | **Data breach / PII leak** | L | High | Design docs security posture (OAuth-only, no passwords, redaction, audit); doc 05 §4 compliance; security pass in Epic 6 | Breach runbook: Prodhab notification path confirmed with counsel (L4); user comms honest and fast | Eng |
| R11 | **University relations sour** (ambassadors seen as commercial intrusion) | L | M | Partner through official channels (federations, exchange offices) with value (housing data reports gratis), not around them | Pushback → retreat to off-campus channels; the zona U is public | Ops |
| R12 | **Funding gap** — pre-seed doesn't close before matrícula window | M | High | Raise starts T−6 months; bootstrap-shaped pilot variant pre-planned (halve ambassador+marketing, founders unpaid — extends personal-capital runway to one full campus) | Window missed → run the small variant one cycle later; never launch half-funded into a matrícula | Founders |
| R13 | **SINPE dependency** — outage, rule change, or fee change on the rail | L | M | Phase A records any payment method (transferencia, cash marked manual); rail-agnostic ledger by design | Fee/rule change → re-run doc 02 COGS math before panic | Eng |

## Standing review rules

1. New risk discovered → added here in the same week, with owner, or it doesn't exist.
2. Any **Fatal**-impact risk must always have its mitigation *done or in progress* — a planned
   mitigation on a fatal risk is the register's only red-alert state.
3. Post-incident: the runbook that handled it gets updated (design doc 10 §6 rule, applied to
   business ops too).
