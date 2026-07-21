# 03 — Go-To-Market

The operating guide for opening campuses. Informed by Uber's city expansion process — a repeatable,
step-numbered process with a local owner and hard gates ([Uber expansion playbook](https://blog.kirnanitechnologies.com/ubers-market-expansion-playbook-launching-city-by-city-at-scale/),
[strategy study](https://www.cascade.app/studies/uber-strategy-study)) — and Airbnb's two
founding tricks: harvest the incumbent channel, and do unscalable things that fix conversion
([Craigslist strategy](https://www.startupstoic.com/p/airbnb-s-craigslist-hack-guerrilla-gtm-in-the-early-days-of-a-unicorn),
[growth study](https://growthhackers.com/growth-studies/airbnb/)).

## 1. The core sequencing rule

**Supply first, demand second, payments third — per campus.** A student who opens an empty app
is lost for a year (their lease locks them out of the market). So supply builds *quietly*
before any student-facing noise, demand launches into a stocked app timed to the enrollment
window, and the payment rail is sold to matched pairs (when both sides already got value).

## 2. Campus launch playbook (repeat per campus)

**T−10 to T−6 weeks — supply (target: 150+ live listings ≤2 km from campus):**
1. Map the incumbent channel: the campus's Facebook housing groups, WhatsApp chains, pulperia
   notice boards — this is our Craigslist. Source landlords from where they already advertise
   (harvest the channel; **do not** post scraped listings or auto-cross-post — that's the exact
   legal trap that helped kill RadPad, [Craigslist lawsuit](https://en.wikipedia.org/wiki/RadPad)).
2. Door-to-door "zona U" landlord onboarding: we (founders — this stage is founder-led sales)
   photograph the property, write the listing, set it live in one visit. This is Airbnb's
   professional-photography lesson run as a founding ritual — their photo program moved
   conversion, referrals, and traffic simultaneously ([case study](https://www.cobbleweb.co.uk/airbnb-case-study/)).
3. Landlord promise at this stage: free, verified-students-only leads, you keep your other
   channels. (Exclusivity is earned later by the dashboard + rail, never demanded.)

**T−6 to T−0 — demand machinery:**
4. Recruit 3–5 paid **campus ambassadors** (student associations, residence advisors).
5. Partner where students already ask: student federation (FEUCR etc.), faculty groups,
   international/exchange offices (exchange students are the highest-pain, highest-willingness
   segment — the wedge Uniplaces/HousingAnywhere built entire companies on,
   [HousingAnywhere history](https://www.onlinemarketplaces.com/articles/spotahome-vs-housing-anywhere-vs-uniplaces/)).
6. Content seeding: "cuánto cuesta vivir cerca de la U" rent-map posts for the campus zone —
   the SEO/social asset that keeps paying (and the data comes from our own listings).

**T−0 (matrícula window, Feb & Jul) — launch blitz:**
7. Two weeks of concentrated presence: campus activation stands, ambassador pushes into every
   group chat, launch offer = booking fee waived for cohort 1 (time-boxed, doc 02 §2).
8. Founders personally shepherd the first ~50 matches end-to-end (visit scheduling, lease
   signing, first SINPE payment) — Airbnb-style unscalable care; every friction found here is
   a backlog item with a face attached.

**T+0 onward — retention & rail:**
9. Weekly supply/demand balance review (see §5); recruit supply or demand accordingly.
10. Sell the rail to matched pairs: receipts, deposit protection, trust-score growth, landlord
    dashboard. Target: 70% of leases on-rail within one semester.

## 3. Channels (ranked by expected CAC, cheapest first)

1. **Ambassadors + student orgs** — trust transfer, ~free.
2. **The supply itself as marketing** — every "se alquila" sign gets a bilo QR rider; every
   listing we photograph credits bilo in the incumbent FB groups (the legal version of the
   Craigslist hack: landlords post *their own* bilo link where they already advertise).
3. **Referrals** (in-product, P1): both-sides credit on completed lease — copy Airbnb/Uber's
   double-sided structure, cap it, watch for fraud.
4. **Hyperlocal paid social** (IG/TikTok geofenced to campus, only during matrícula windows).
5. **PR**: "startup tica digitaliza la vivienda estudiantil" is an easy national-press story;
   free, credibility with landlords (an older demographic that reads the news).

No broad paid acquisition before P2. The reviewed marketplace cases show that acquisition
spending before retention and liquidity are established creates material risk for
doc 04.

## 4. The pilot (campus #1, one semester) — questions to resolve

The pilot exists to convert doc 01 §2 and doc 02 §3 assumptions into numbers: listings
reachable, booking-fee willingness, on-rail adoption, match→lease conversion, CAC per side,
week-4 tenant retention, landlord multi-property share. Instrumentation is already in the
backend design (analytics counters, domain events — design docs 07, 10); the pilot adds a
one-page weekly scorecard, reviewed founders-only, every Friday.

## 5. Liquidity gates (a campus is "open" — next one may start — when…)

- ≥150 live listings within 2 km, ≥60% with photos we took or approved
- Median first-relevant-result for a new student search: < 30 seconds
- ≥8% of matches convert to a signed lease within 21 days
- ≥70% of new leases paying on-rail
- Supply/demand ratio between 1:3 and 1:8 (listings:active seekers) — outside band, fix before
  expanding
- Support load < 15 tickets/week/1000 users (else the ops model doesn't scale yet)

Uber's rule, our numbers: scale *only* when core reliability thresholds are met
([cold-start masterclass](https://medium.com/@cagdasbalci0/how-uber-solved-the-cold-start-problem-a-masterclass-in-network-effects-5315d2292166)).
The gates are reviewed after each campus — they are hypotheses too.

## 6. Marketing positioning (one line per audience)

- **Students:** "Alquilá verificado, sin sustos" — verified landlords, real photos, deposit
  protection, no more strangers from Facebook.
- **Landlords:** "Inquilinos estudiantes verificados y la renta puntual en tu cuenta" —
  verified-student leads, automated SINPE collection, one dashboard.
- **Later (general market):** the trust score graduates with the user: "tu historial de buen
  inquilino, portátil".

## 7. Expansion beyond CR (gate, not date)

Enter market #2 only when: CR is at P3 monetization, the playbook has opened ≥4 campuses with
declining time-to-liquidity each time, and the target market passes the checklist: national
instant-payment rail (SINPE-analog), lease law reviewed, local ops lead hired. Country choice is
a research project with this doc's §2 as the template — the *playbook* is the product being
exported, exactly as Uber converted projects into process ([lesson](https://youexec.com/questions/what-lessons-can-startups-learn-from-uber-s-approach-to)).
