# 02 — Monetization

Principle: **monetization follows liquidity.** Every dead-marketplace postmortem in
[doc 04](./04-lessons-winners-and-dead.md) either monetized nothing while burning cash on
subsidies (RadPad), or monetized in a way that pushed users off-platform (leakage). The model
below is phased: what is free, what earns, and when each stream switches on.

## 1. The streams (decided), and their evidence base

| # | Stream | Mechanics | Benchmark evidence | Phase |
|---|---|---|---|---|
| R1 | **Booking fee** (one-time, at lease signing) | % of one month's rent, split tenant/landlord — Uniplaces charges ~8% split 4/4; commission only on *confirmed booking*, never on enquiry ([Uniplaces model](https://vizologi.com/business-strategy-canvas/uniplaces-business-model-canvas/), [marketplace comparison](https://www.onlinemarketplaces.com/articles/spotahome-vs-housing-anywhere-vs-uniplaces/)) | bilo pilot: **6%, split 3% + 3%** | P1 |
| R2 | **Rent rail take rate** (recurring) | Fee per on-platform rent payment. SINPE cost ≈ 0 makes low % viable where card-based rails die on ~2–2.4% interchange ([interchange data](https://www.fool.com/money/research/average-credit-card-processing-fees-costs-america/), [take-rate benchmarks](https://www.tidemarkcap.com/vskp-chapter/marketplace-take-rates)) | **1.5% landlord-side** on SINPE; card payments pass processing cost + 1.5% | P2 |
| R3 | **Deposit protection / guarantee** | bilo escrows deposit + arbitrates via disputes module; fee ~5% of deposit or flat | Airbnb's guarantee is the canonical trust-monetization ([Airbnb case study](https://www.cobbleweb.co.uk/airbnb-case-study/)) | P2 |
| R4 | **Landlord Pro subscription** | Multi-property dashboard, analytics, priority placement, export — SaaS-priced (₡8–15k/month) | Vertical SaaS <1% GMV take rate but high margin ([Tidemark](https://www.tidemarkcap.com/vskp-chapter/marketplace-take-rates)) | P3 |
| R5 | **Value-added services** | Cleaning/moving/insurance via services module, commission per job | Standard attach model | P3 |
| R6 | **Tenant passport (premium)** | Verified profile + trust history export for external use — careful: must not undermine on-platform lock-in | — | P4, maybe never |

Explicitly **not** monetized: listing fees (kills supply at cold start — every surviving student
marketplace is free-to-list), featured-listing pay-to-win in the feed (corrupts the trust
positioning that differentiates us), selling user data (kills the trust brand, GDPR-shaped
liability).

## 2. Why this shape survives the known killers

- **Interchange death (RadPad):** RadPad moved rent on card rails, subsidized promos it
  couldn't exit, and died with ~2%+ COGS per transaction ([RadPad postmortem](https://www.doctorofcredit.com/radpad-deal-shut-early-explanation-ceo/), [Wikipedia](https://en.wikipedia.org/wiki/RadPad)). bilo's CR rail is SINPE
  (≈ free under ₡100k/day, cents above — [BCCR](https://www.bccr.fi.cr/en/payments-system/sinpe-fees-and-charges)); R2's 1.5% is nearly all gross margin, and card
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

Assumptions to validate: avg student rent ₡220,000 (~$430); avg lease 10 months; booking fee 6%;
rail take 1.5% from P2.

- **Per lease:** R1 = ₡13,200 (~$26) once + R2 = ₡3,300/month × 10 ≈ ₡33,000 (~$65) → **≈ $91
  revenue per lease-year**, at near-zero marginal COGS on SINPE.
- **Campus at maturity** (UCR-scale, target 1,500 active on-rail leases): ≈ $135k ARR/campus.
- **CR at maturity** (5 campus zones + general SJ young-professional expansion, ~10k on-rail
  leases): ≈ **$0.9–1.2M ARR** — the "million-dollar year" is a *Costa Rica alone, no AI, no
  magic* outcome; regional expansion multiplies it.
- Break-even sanity: a 4-person team + infra (~$25–35k/month CR cost base) needs ~3,500–4,500
  on-rail leases → roughly wave 1–3 campuses at target liquidity. That is the real gate for
  raising or bootstrapping decisions.

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
