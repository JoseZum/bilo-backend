# bilo — Legal (Costa Rica)

Deep-dive legal research for operating bilo in Costa Rica: what we must register, what we must
pay, what we must never do, how platforms like Airbnb legally protect themselves, and the
paper (ToS, privacy, consents, contracts) we need before real users touch real money.

> **⚠️ DISCLAIMER — read this first.** This is **desk research written by a non-lawyer** (an
> AI assistant, from public sources linked throughout). It is a *map for decision-making and a
> briefing pack for counsel*, not legal advice. Every doc ends with the questions a Costa
> Rican attorney must answer before we rely on it. Business doc
> [`05-legal-and-regulatory`](../../business/05-legal-and-regulatory.md) is the executive
> summary; this folder is the detail behind it and extends its counsel brief (items L8+).

## Docs

| Doc | What it covers |
|---|---|
| [01 — Entity & registrations](./01-entity-and-registrations.md) | S.R.L. formation, every mandatory registration (Hacienda, municipal patente, RTBF, CCSS), the real startup + annual cost in colones |
| [02 — Platform liability & terms](./02-platform-liability-and-terms.md) | How Airbnb shields itself and what transfers to CR law; **Ley 10946** (new, June 2026 — our compliance clock is ticking); Ley 7472 consumer rules; ToS + policy skeletons |
| [03 — Tenancy & hospedaje](./03-tenancy-and-hospedaje.md) | Ley 7527 (3-year minimum!), the hospedaje structuring play and its **Ley 9742/ICT trap**, product consequences for the lease module |
| [04 — Identity & data protection](./04-identity-and-data-protection.md) | Ley 8968/PRODHAB, cédula + selfie verification done legally, biometric-data landmines, consent screens, retention |
| [05 — Money, tax & criminal exposure](./05-money-tax-and-criminal-exposure.md) | The jail map: captación, tax duties (IVA, e-invoice), AML/SUGEF 15 bis analysis, deposits, e-signatures (Ley 8454) |

## The threat map — what can actually hurt us

Ranked by "college students with no money" severity: **jail > company-killing fine >
lawsuit > fixable compliance gap**.

| # | Threat | Severity | Where | Status |
|---|---|---|---|---|
| T1 | **Holding/pooling rent or deposits without a license** (captación — criminal) | 🔴 jail | 05 §1 | Avoided by design: Phase A funds never touch bilo |
| T2 | **Tax non-compliance**: no e-invoices, uncollected IVA on our fees, no declarations | 🔴 criminal + fines | 05 §2 | Register before first colón of revenue; InvoicingPort |
| T3 | **Mishandling identity/biometric data** (Ley 8968: fines $3k–$18k + DB shutdown) | 🟠 company-killing | 04 | Design already minimizes (hash-only, retention); consent screens required |
| T4 | **Being deemed party to leases** → liable for the 3-year minimum, evictions, habitability | 🟠 lawsuit magnet | 02 §1, 03 | Intermediary-only posture in ToS + product copy |
| T5 | **Semester rentals structured as "hospedaje" sliding into Ley 9742/ICT territory** | 🟠 registration + tax | 03 §3 | Counsel question L8 — do not improvise this |
| T6 | **Ley 10946 non-compliance** (in force ~June 2027: Spanish ToS clarity, free complaint channel, dark-pattern ban, notice-and-action) | 🟡 fixable now | 02 §2 | Build into ToS + product before launch — cheaper than retrofitting |
| T7 | **Consumer-law gaps**: 8-day retracto on distance sales, total-price display, complaint mechanism | 🟡 fixable | 02 §3 | Fee refund policy + UI requirements |
| T8 | **Operating without patente municipal / unregistered company** | 🟡 fines, closure orders | 01 | Checklist + budget below |
| T9 | **Discrimination/harassment claims from screening features** (waitlist filters, roommate vetoes) | 🟡 reputational + civil | 02 §4 | Neutral-rejection design already in D17/D18; policy text needed |
| T10 | **User harm between users** (scams, fake listings, unsafe visits) | 🟡 civil + reputational | 02 §1 | Verification + Airbnb-style releases + moderation |

## What we refuse to do at MVP (scope fences that keep us safe)

1. **Never touch rent or deposit money** — no collection, no escrow, no "we'll hold it just
   this once." Fees are billed separately as our own invoice. (T1)
2. **No short-term/tourist stays** — minimum stay ≥ 1 month and marketed as housing, not
   tourism, until counsel clears the Ley 9742 boundary. (T5)
3. **No lease-party role** — bilo never signs, guarantees, or co-signs a lease; templates are
   provided "as forms," parties contract with each other. (T4)
4. **No selling or sharing user data** — keeps us out of PRODHAB's mandatory registration
   lane and out of the news. (T3)
5. **No real-estate *sales* brokerage** — keeps us outside SUGEF 15 bis APNFD registration. (05 §3)
6. **No storing raw cédula numbers or building our own biometric matcher** — hash + manual
   review at Stage 1, licensed provider later. (T3)
7. **No handling of keys, viewings, or physical property management** — pure software.

## Proposed ERS deltas (file after counsel review)

Legal requirements that should become numbered FRs: free complaint/claims channel with
tracked response times (Ley 10946/7472) · 8-day retracto refund flow on bilo fees ·
pre-payment transaction summary + total price breakdown · versioned consent capture screens
for identity verification (specific, separate from ToS acceptance — FR-AUTH-009 covers ToS
only) · notice-and-action takedown flow with reasoned decisions (extends FR-ADMIN-004) ·
3-month lease-renewal notice reminders (Ley 7527 — extends lease jobs). Dark-pattern review
becomes an NFR/design-review checklist item.

## Counsel engagement — additions to the business-doc brief (L1–L7)

| # | Question/deliverable | Blocks | Priority |
|---|---|---|---|
| L8 | Hospedaje structuring vs Ley 9742 scope: can semester student rooms avoid *both* 7527's 3-year term *and* ICT registration? | Lease templates | **P0** |
| L9 | Ley 8968 opinion: is our verification flow (cédula photo + selfie, human review, 90-day deletion) sensitive-data processing; exact consent text; PRODHAB registration yes/no | Identity launch | P1 |
| L10 | Ley 10946 gap review of ToS + product once regulations publish (law effective ~June 2027) | Public launch | P1 |
| L11 | Retracto applicability to booking fee & timing of "service rendered" | Fee monetization | P1 |
| L12 | Confirm rental-only intermediation is outside SUGEF 15 bis APNFD registration | — | P2 |
| L13 | Review ToS limitation-of-liability + indemnity clauses against 7472 abusive-clause doctrine | Public launch | P1 |
