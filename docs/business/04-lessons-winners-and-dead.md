# 04 — Lessons from Comparable Companies

Researched case studies, each ending in the **specific bilo decision it drives**. Sources
linked inline; where the record is thin or contested, that's said out loud.

---

## Winners

### Airbnb — trust and liquidity are bought with unscalable work

- **Craigslist harvest:** Airbnb piggybacked the incumbent channel — cross-posting listings to
  Craigslist and recruiting Craigslist advertisers — to bootstrap both sides at once
  ([growth study](https://growthhackers.com/growth-studies/airbnb/),
  [Craigslist strategy](https://www.startupstoic.com/p/airbnb-s-craigslist-hack-guerrilla-gtm-in-the-early-days-of-a-unicorn)).
- **Professional photography:** founders rented cameras and shot listings themselves; photo
  quality moved booking conversion, referral rate, and traffic together
  ([case study](https://www.cobbleweb.co.uk/airbnb-case-study/),
  [growth hacks](https://benchhacks.com/growthstudies/airbnb-growth-hacks.htm)).
- **Trust as monetizable product:** reviews, verified profiles, and the host guarantee turned
  "sleeping at a stranger's place" into a category.

**→ bilo decisions:** GTM doc §2 steps 1–2 (harvest FB housing groups *legally*; founder-shot
listing photos as a launch ritual); deposit protection as a paid trust product (doc 02 R3);
trust score as the centerpiece of positioning.

### Uber — expansion as process, liquidity as gate

- City-by-city playbook (~180 steps), local launcher/GM autonomy, supply seeded first with
  guarantees, dense core geography first, scale only after reliability thresholds
  ([expansion playbook](https://blog.kirnanitechnologies.com/ubers-market-expansion-playbook-launching-city-by-city-at-scale/),
  [cold-start analysis](https://medium.com/@cagdasbalci0/how-uber-solved-the-cold-start-problem-a-masterclass-in-network-effects-5315d2292166),
  [strategy study](https://www.cascade.app/studies/uber-strategy-study)).
- Counter-lesson: Uber's subsidy wars torched billions and its regulatory belligerence bought
  years of bans — the *aggression* is not the part to copy.

**→ bilo decisions:** campus = city; the playbook in GTM §2 with hard liquidity gates in §5;
supply-first sequencing; no pay-to-transact subsidies ever (doc 02 §2).

### Uniplaces / HousingAnywhere / Student.com — our niche's living proof

- Student-housing marketplaces monetize with **commission on confirmed bookings only** (no
  listing fees, no enquiry fees); Uniplaces takes ~8% split between both sides
  ([business model](https://vizologi.com/business-strategy-canvas/uniplaces-business-model-canvas/),
  [marketplace comparison](https://www.onlinemarketplaces.com/articles/spotahome-vs-housing-anywhere-vs-uniplaces/),
  [PBSA insight](https://studenthousingconsultancy.com/2021/12/10/student-accommodation-marketplaces/)).
- They won the **international/exchange student wedge** — the segment that can't inspect in
  person and therefore *needs* platform trust.

**→ bilo decisions:** R1 booking-fee shape and size (doc 02 §1); exchange-student offices as a
priority channel (GTM §2 step 5). **Our differentiator vs. them:** they stop at booking; bilo
owns the recurring rent rail (R2) and the domestic market they never cracked.

---

## Companies that failed — and the contributing factors

### RadPad (rent payments, †2017/2021) — the closest corpse to our thesis

Raised $12M+ to let tenants pay rent by card. Died of: **card interchange economics** (moving
rent at ~2%+ COGS with thin fees), a **runaway promotion** (free Android Pay rent payments,
modeled too low, no exit clause), a **fatal legal gray hack** (Craigslist scraping lawsuit,
$60M judgment), and end-stage **payment reliability failures** (bounced rent checks — the one
thing a rent app can never do)
([Wikipedia](https://en.wikipedia.org/wiki/RadPad),
[CEO explanation](https://www.doctorofcredit.com/radpad-deal-shut-early-explanation-ceo/),
[TechCrunch](https://techcrunch.com/2017/01/12/radpad-gets-acquired-by-landlord-station-after-nearly-shutting-down/)).

**→ bilo decisions:** SINPE-first rail (near-zero COGS — [BCCR fees](https://www.bccr.fi.cr/en/payments-system/sinpe-fees-and-charges)); the doc 02 rule that no payment
method ships whose cost exceeds its revenue; every promo gets an end date and an exit clause;
no scraping, ever (GTM §2 step 1); and the design docs' obsession with the payment ledger,
reconciliation, and idempotency (design doc 07 §9) — *a rent platform dies the day a rent
payment silently fails*.

### Homejoy (home services, †2015) — discounts and leakage

Acquired users with deep first-clean discounts → deal-seekers who never retained; customers met
a cleaner they liked and went direct (**leakage**); software leadership "threw software at every
problem on the periphery" but couldn't fix the core service; contractor-classification lawsuits
finished the fundraise
([Sunset postmortem](https://www.sunsethq.com/blog/why-did-homejoy-fail),
[former-employee analysis](https://www.linkedin.com/pulse/pondering-homejoys-failure-hunter-davis)).

**→ bilo decisions:** no discount-led acquisition (waivers are launch pricing, not bribes);
leakage fought with value that only exists on-rail — trust score growth, deposit protection,
payment history, landlord bookkeeping (doc 02 §2, [leakage research](https://platformchronicles.substack.com/p/platform-leakage)); and the AI deferral —
Homejoy is the canonical "peripheral software doesn't save a broken core transaction" case.

### HubHaus (†2020), Campus (†2015), WeLive (†2021) — the inventory trap

Co-living operators that **took on lease/property liability** (master leases, furnishing,
operations): Campus "could not make the model economically viable" even pre-downturn; HubHaus
was under-paying homeowners months before collapsing when funding dried up post-WeWork;
WeLive never scaled past two buildings
([Campus reflection](https://medium.com/@rossgarlick/thoughts-on-campus-the-failed-startup-that-almost-reinvented-how-we-live-eaaa931dce22),
[SFist](https://sfist.com/2015/06/18/housing_startup_campus_to_close_its/),
[HubHaus failure](https://www.failory.com/cemetery/hubhaus),
[Sunset on HubHaus](https://www.sunsethq.com/blog/why-did-hubhaus-fail)).

**→ bilo decision (structural, permanent):** bilo **never owns, leases, or guarantees
inventory**. We are matchmaking + trust + rails. Zero balance-sheet housing risk; deposit
escrow is segregated flow-through, never working capital. If co-living demand appears, we serve
it as listings, not as an operator.

### Patterns shared by failed companies

Across CB Insights' post-mortem corpus, the recurring causes are: insufficient market need,
cash depletion, team conflict, competitive pressure, and pricing or cost-structure failure
([CB Insights](https://www.cbinsights.com/research/startup-failure-post-mortem/)). Marketplace-
specific: monetizing before liquidity, subsidizing liquidity you can't retain, and letting the
recurring relationship walk off-platform ([leakage prevention](https://www.sharetribe.com/academy/how-to-discourage-people-from-going-around-your-payment-system/)).

**→ bilo meta-decision:** the phase gates in doc 02 §4 and GTM §5 exist so that *money, product
scope, and geography all expand only on measured evidence* — the single discipline most of
these companies lacked.

---

## Comparative summary

| Case | Lesson | Where it's encoded |
|---|---|---|
| Airbnb | High-touch trust work can resolve an initial marketplace cold start | GTM §2 (photos, founder-led onboarding) |
| Uber | Expansion follows a repeatable, threshold-based process | GTM §5 gates; campus=city |
| Uniplaces | Booking commission is viable in student housing | Doc 02 R1 |
| RadPad | Payment COGS, legally questionable acquisition tactics, and payment failures compound risk | SINPE-first; promo rules; ledger discipline |
| Homejoy | Discounts can attract low-retention demand; off-platform migration weakens recurring revenue | No-subsidy rule; on-rail-only value; AI deferral |
| HubHaus/Campus/WeLive | Inventory ownership creates a materially different risk profile | Never own inventory — permanent rule |
