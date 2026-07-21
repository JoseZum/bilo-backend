# 01 — Market & Initial Segment

## 1. Why begin with a narrow segment

Every rental marketplace dies the same first death: no liquidity. Tenants open the app, see
nothing relevant, never return; landlords list, get no leads, never return. The researched
antidote (see [doc 04](./04-lessons-winners-and-dead.md)) is **density before breadth**: Airbnb
won city by city and event by event; Uber's launch playbook explicitly picked "the geographic
core where density would be easiest" and only scaled a city after reliability thresholds were
met ([Uber expansion playbook](https://blog.kirnanitechnologies.com/ubers-market-expansion-playbook-launching-city-by-city-at-scale/),
[cold-start analysis](https://medium.com/@cagdasbalci0/how-uber-solved-the-cold-start-problem-a-masterclass-in-network-effects-5315d2292166)).

Our density unit is **the university campus**.

## 2. Why Costa Rica university students specifically

1. **Recurring, predictable demand on a calendar.** Every February/March and July, thousands of
   students need housing near campus at the same time. Demand concentration by date and by
   geography is the cheapest liquidity a marketplace can buy.
2. **Trust-starved market.** Student rentals in CR run on Facebook groups, WhatsApp chains, and
   campus notice boards: no verification, no recourse, deposit horror stories on both sides.
   Trust is bilo's core product — the gap is exactly our shape.
3. **Small, repeat-friendly tickets.** Student rooms/apartments (roughly ₡120k–₡450k/month)
   mean landlords with multiple units and tenants who re-rent every semester/year — high
   transaction frequency builds the trust graph fast.
4. **Verifiable identity for free.** University e-mail domains (`@ucr.ac.cr`, `@una.ac.cr`,
   `@itcr.ac.cr`, `@estudiantec.cr`, private universities' domains) give us a **student
   verification** signal at zero marginal cost — a trust badge no Facebook group can match.
5. **The payment rail is a gift.** SINPE Móvil covers **over 80% of Costa Ricans over 15**, with
   ~65M transactions/month; transfers are free under ₡100,000/day and cost cents above
   ([BIS paper on SINPE Móvil](https://www.bis.org/publ/bppdf/bispap152_d_rh.pdf),
   [Fintech News](https://fintechnews.am/costa-rica/52549/fast-payment-system-sinpe-movil-driving-financial-inclusion-efficiency-in-costa-rica/),
   [BCCR fees](https://www.bccr.fi.cr/en/payments-system/sinpe-fees-and-charges)). A rent rail
   built on SINPE has near-zero payment COGS — card interchange has undermined several
   rent-payment startups
   interchange (~2–2.4% just to move money — see RadPad in doc 04); ours starts structurally
   profitable. The BIS notes request-to-pay and recurring-payment features are on SINPE's
   roadmap — exactly the primitive monthly rent needs.
6. **Students become the general market.** Today's verified student tenant is next year's young
   professional renter with a portable bilo trust score — the niche seeds the expansion, like
   Facebook's college rollout.

**Named assumptions to validate in the first 90 days** (each gets a real number before we scale):
university-adjacent supply is reachable (target: 150+ listings within 2 km of campus #1);
landlords will accept SINPE-through-bilo (target: 70%+ of pilot leases paid on-rail); students
will pay a booking-time fee (measured at pilot, see doc 02 §3).

## 3. The campus map (attack order — validate with field data before committing)

| Wave | Campus zone | Why |
|---|---|---|
| 1 | **UCR San Pedro (San José)** | Largest student population in the country; "Barrio La U" is a dense, walkable rental zone; team proximity |
| 2 | **UNA Heredia** | Second dense student-housing cluster; 25 min away — operations can share staff |
| 3 | **TEC Cartago** | High out-of-town student share (housing need is near-universal) |
| 4 | Private universities SJ metro (ULatina, ULACIT, Veritas, UAM) | Higher budgets, same geography as wave 1 — mostly supply reuse |
| 5 | Regional campuses (UCR/UNA/TEC sedes) | Only after SJ metro liquidity proves the model |

A campus "opens" only when the previous one passes the liquidity gates in
[doc 03 §5](./03-go-to-market.md). This is the Uber rule applied to our unit.

## 4. Expansion arc (the "standard for renting" path, honestly staged)

1. **Initial segment (year 1):** CR student housing, SJ metro campuses. Product = rooms + small
   apartments, student verification, roommate matching, SINPE rent rail.
2. **Adjacent (year 2):** general young-professional rentals in San José metro — same landlords,
   graduating users, same rail. Then CR-wide.
3. **Regional (year 3+):** replicate the *playbook* (not just the app) in one more Central
   American / LATAM market chosen by rail quality (a SINPE-like national instant-payment system
   is a hard selection criterion — e.g. PIX makes Brazil attractive but hyper-competitive;
   Guatemala/Panama/DR to be studied). Each country = new payment adapter + new lease rules
   config, which the backend design already isolates (design docs 07 §8, 08 §2).
4. **Global standard (the ambition):** only after the model prints in ≥2 countries. The domain
   model already avoids hard-coding housing (design doc 01) so "renting anything monthly" stays
   open, but we do not build for it before then.

## 5. What this changes in the product (backend deltas)

- **Student verification** (Stage 1, new): verify university e-mail via magic code →
  `verificationStatus=STUDENT_VERIFIED` + badge; the `verificationStatus` field already exists.
- **Room-level listings** (Stage 1): `PropertyType.ROOM` with shared-space attributes in
  `metadata.amenities` — the dominant student inventory type.
- **Roommate matching** (Stage 1.5): `wantsRoommate`/`roommateOk` fields already exist; feed
  filter + roommate-seeking discovery view.
- **Semester-term leases** (Stage 1): `RentSchedule` already supports arbitrary end dates;
  add 5–6 month term presets and semester-aligned availability filters.
- **AI features: deferred to post-national scale** (see README priority change).
