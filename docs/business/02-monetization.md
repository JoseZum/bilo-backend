# 02 — Monetization

Principle: **monetization follows liquidity.** Every dead-marketplace postmortem in
[doc 04](./04-lessons-winners-and-dead.md) either monetized nothing while burning cash on
subsidies (RadPad), or monetized in a way that pushed users off-platform (leakage). The model
below is phased: what is free, what earns, and when each stream switches on.

## 1. The streams (decided), and their evidence base

| # | Stream | Mechanics | Benchmark evidence | Phase |
|---|---|---|---|---|
| R1 | **Booking fee** (one-time, **rides existing money moments, service-gated**) | Paid **to bilo's own account** (our money — no license issue, and we *can* see our own account). Timing per the friction doctrine below: **tenant share at signing** (alongside deposit + first month, gates contract issuance); **landlord share due on first-rent confirmation** (they pay from received money; non-payment switches off services, not the lease). Sized as a **broker-fee (corretaje) replacement**, not a token: 25–40% of one month's rent, split evenly — still less than half a traditional broker's month, with verification + contract + trust layer included. Commission only on confirmed lease, never on enquiry ([Uniplaces model](https://vizologi.com/business-strategy-canvas/uniplaces-business-model-canvas/), [marketplace comparison](https://www.onlinemarketplaces.com/articles/spotahome-vs-housing-anywhere-vs-uniplaces/)) | Pilot: **30% of one month, split 15% + 15%** (willingness measured, doc 03 §4) | P1 |
| R2 | **Cobro Automático** (recurring, **deducted at source via licensed PSP**) | Tenant pays through a PSP-powered SINPE link/recurring charge; the licensed PSP (ONVO-class: SINPE at 1.5%, API + webhooks — [ONVO](https://onvopay.com/), [fee comparison](https://pymesmodernas.com/comisiones-tilopay-costa-rica/)) settles **directly to the landlord** and webhooks give bilo ground truth. Priced at **2.5% all-in landlord-side** (PSP cost inside) *or* flat ₡4,900/lease/month — landlord picks. The free alternative (manual SINPE + attestation) always exists; auto-mode sells itself on zero-chasing collection | Landlords choose mode; no goodwill invoices anywhere | P2 (PSP partnership permitting — doc 05 L7 is now P1 priority) |
| R3 | **Deposit protection / guarantee** | bilo escrows deposit + arbitrates via disputes module; fee ~5% of deposit or flat | Airbnb's guarantee is the canonical trust-monetization ([Airbnb case study](https://www.cobbleweb.co.uk/airbnb-case-study/)) | P2 |
| R4 | **Landlord Pro subscription** | Multi-property dashboard, analytics, priority placement, export — SaaS-priced (₡8–15k/month) | Vertical SaaS <1% GMV take rate but high margin ([Tidemark](https://www.tidemarkcap.com/vskp-chapter/marketplace-take-rates)) | P3 |
| R5 | **Value-added services** | Cleaning/moving/insurance via services module, commission per job | Standard attach model | P3 |
| R6 | **Tenant passport (premium)** | Verified profile + trust history export for external use — careful: must not undermine on-platform lock-in | — | P4, maybe never |

Explicitly **not** monetized: listing fees (kills supply at cold start — every surviving student
marketplace is free-to-list), featured-listing pay-to-win in the feed (corrupts the trust
positioning that differentiates us), selling user data (kills the trust brand, GDPR-shaped
liability).

> **Collection doctrine (the fix for "we can't intercept SINPE"):** bilo never bills a fee it
> must chase. Every revenue stream is either (a) **collected up-front into bilo's own account
> and service-gated** (R1: no fee, no contract issuance — and watching our *own* account needs
> no license), (b) **deducted at source by a licensed PSP partner** (R2 auto-mode), or
> (c) **a subscription whose service switches off on non-payment** (R4). Invoice-and-hope
> revenue is banned from the model. E-invoices are still issued for every fee (doc 05 §3) —
> as receipts, not as collection instruments.
>
> **Friction doctrine (the Uber lesson):** a fee must never be a standalone payment event —
> it always rides a money moment that already exists. Tenant booking fee: **at signing,
> alongside deposit + first month** (one moment, one more line). Landlord booking fee: **due
> only after first rent is confirmed received** ("le cobramos cuando usted ya cobró"),
> service-gated thereafter. Monthly: **exactly one payment ever** — manual mode is the rent
> SINPE alone (no monthly fee); auto-mode is one PSP payment whose **split settlement** routes
> rent to the landlord and fee to bilo in the same transaction. If the chosen PSP cannot split
> (verify in doc 05 L7), auto-mode monetizes via prepaid flat subscription instead — never via
> a second monthly payment act.

## 2. Why this shape survives the known killers

- **Interchange death (RadPad):** RadPad moved rent on card rails, subsidized promos it
  couldn't exit, and died with ~2%+ COGS per transaction ([RadPad postmortem](https://www.doctorofcredit.com/radpad-deal-shut-early-explanation-ceo/), [Wikipedia](https://en.wikipedia.org/wiki/RadPad)). bilo's margins survive by construction: R1 rides
  raw SINPE into our own account (≈ free — [BCCR](https://www.bccr.fi.cr/en/payments-system/sinpe-fees-and-charges)); R2 auto-mode is priced *above* its PSP cost
  (2.5% price vs 1.5% COGS) and the manual mode costs us nothing; card
  users pay their own processing. **Rule: no payment method ships whose fully-loaded cost
  exceeds its fee revenue.**
- **Leakage (Homejoy, every rental platform):** rent is a *recurring* relationship — the
  strongest disintermediation pull there is ([platform leakage research](https://platformchronicles.substack.com/p/platform-leakage), [prevention strategies](https://www.sharetribe.com/academy/how-to-discourage-people-from-going-around-your-payment-system/)). Our defense is
  value, not policing: the trust score **only grows from on-platform payments** (design doc 07
  §10), deposit protection only covers on-rail leases, receipts/payment history become the
  tenant's portable rental résumé, and the landlord dashboard (design doc 14 §3) makes bilo the
  landlord's bookkeeping. R1+R2 are priced *below* the annoyance threshold on purpose — 6% once
  + 1.5% monthly is cheaper than the risk of an unverified tenant.
- **Subsidy trap (Homejoy's discounts, Uber's burn):** Homejoy's discount-acquired users never
  retained ([Homejoy postmortem](https://www.sunsethq.com/blog/why-did-homejoy-fail)). bilo
  pilots may waive R1 for the first cohort per campus (measured, time-boxed, announced as
  launch pricing) but **never** pays users to transact.

## 3. Unit economics (planning numbers, CR student beachhead)

Assumptions to validate: avg student rent ₡220,000 (~$430); avg lease 10 months; booking fee
30% of one month split 15/15; auto-mode adoption 50% of on-rail leases at 2.5% (1.5% PSP COGS
inside); flat-subscription adopters equivalent.

- **Per lease:** R1 = ₡66,000 (~$130) once, up-front, gated + R2 (auto-mode net ≈ ₡2,200/month
  × 10, on half the base) ≈ ₡11,000 (~$22) blended → **≈ $150 net revenue per lease-year** —
  up from $91 in the pre-restructure model, with *every* colón either prepaid or
  PSP-deducted, none invoiced-and-chased.
- **Campus at maturity** (UCR-scale, target 1,500 active on-rail leases): ≈ $225k ARR/campus.
- **CR at maturity** (5 campus zones + general SJ young-professional expansion, ~10k on-rail
  leases): ≈ **$1.5M+ ARR** — the "million-dollar year" is a *Costa Rica alone, no AI, no
  magic* outcome; regional expansion multiplies it.
- Break-even sanity: a 4-person team + infra (~$25–35k/month CR cost base) needs ~2,000–2,800
  active leases/year flowing through R1+R2 → roughly wave 1–2 campuses at target liquidity.
  That is the real gate for raising or bootstrapping decisions.
- **The #1 willingness test moves to R1:** ₡33k per side (vs. a broker's full month, vs. free-
  but-scammy Facebook) is the pilot's most important measured number (doc 03 §4). If it
  measures low, the levers are size (25%), timing (half at match, half at signing), and side
  weighting (landlord-heavier) — not retreat to invoice-after revenue.

These are model inputs, not promises — the pilot's job (doc 03 §4) is to replace every
assumption with a measured number within two semesters.

## 4. Phase switch conditions (monetization follows liquidity — operationalized)

| Phase | Switches on | Condition (measured, per campus) |
|---|---|---|
| P0 pilot | everything free | — (one campus, one semester) |
| P1 | R1 booking fee | ≥60% of surveyed matches would have paid; ≥150 live listings; match→lease conversion ≥8% |
| P2 | R2 rail fee + R3 deposit protection | ≥70% of leases paying on-rail voluntarily; dispute resolution SLA < 7 days proven |
| P3 | R4 Pro + R5 services | ≥50 landlords with 3+ properties; organic service requests appearing |
| P4 | reassess R6 | national scale |

## 5. Pricing governance

Prices live in config (not code — design doc 04 P9), per-country from day one; every fee the
user sees shows its math (transparency is part of the trust brand); grandfathering rules are
decided *before* any price change ships.

## 6. Why AI is not in the monetization plan until very late

Direct instruction from the founder, and the evidence agrees: no surviving comparable monetized
AI at our stage; every beachhead risk (liquidity, leakage, payment COGS, trust) is unaffected by
AI; and Homejoy's lesson is literally "software layered on top doesn't fix the core transaction"
([former-employee analysis](https://www.linkedin.com/pulse/pondering-homejoys-failure-hunter-davis)).
AI re-enters at national scale as retention/efficiency tooling (lease clause review, support
deflection — already specced in design docs 07 §14 / 14 §1, kept behind the `AI_PROVIDER=mock`
port until then). Engineering consequence: **all AI tasks leave the launch roadmap** (design
doc 13 delta).
