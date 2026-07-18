# 12 — PSP Landscape (Costa Rica): Can We Implement the Split?

Research (July 2026) into Costa Rican payment service providers for the bilo rail: who can
charge tenants, who can settle to landlords, whether anyone offers **Airbnb/Uber-style split
settlement** (structure C in [doc 11 §1](./11-bootstrap-plan.md)), and what it takes to
integrate. Bottom line up front: **every candidate supports structure B (two separate
charges) today; nobody publicly documents true split settlement — that answer requires sales
conversations, and the questions to ask are at the end.**

## 1. The candidates

| Provider | Rails | Pricing (published/reported) | API | Settlement | Notes |
|---|---|---|---|---|---|
| **ONVO Pay** ([site](https://onvopay.com/), [docs](https://docs.onvopay.com/en)) | Cards + SINPE/SINPE Móvil | ~1.5%/tx SINPE (reported) | REST + webhooks + sandbox, recurring, WooCommerce/SDKs | To merchant | CR startup, PCI DSS, **SUGEF-registered entity** — exactly the "licensed middle" we want; digital onboarding |
| **Tilopay** ([site](https://www.tilopay.com/), [WooCommerce listing](https://woocommerce.com/products/tilopay/)) | Cards (V/MC/Amex) + SINPE Móvil | ~2% + $0.35 (reported); no monthly fee | API (integration key/user/password), tokenization, **subscriptions/recurring**, payment links, QR | Daily/weekly/manual to merchant | Central America coverage; 3DS2 + fraud tooling; 100% online affiliation |
| **GreenPay** ([overview](https://giniem.com/en/ecommerce/pasarelas-de-pago-en-costa-rica/)) | Cards | $15–30/mo + ~3.8% cards; $2 per settlement transfer | API + plugins | Flexible: T+1/weekly/biweekly/monthly | ⚠️ **Auto-applies Hacienda withholdings (~7.07%) on card settlements** — see §3 |
| **LAFISE e-commerce** | Cards | 2% + $0.15 local; ~$135–150 one-time affiliation | Bank gateway | To merchant account | Bank-grade, cheapest per-tx card rate found |
| **BNCR / PlacetoPay (Evertec)** ([dev portal](https://placetopay.dev/)) | Cards | Bank-negotiated | Evertec platform | To merchant | State-bank channel; heavier onboarding |
| *(Reference)* PAYCOMET | — | — | True marketplace split (multi-vendor, commission deduction, distribution rules) | — | **Spain/EU only** — listed as proof the product category exists; no CR equivalent found |

## 2. Findings that shape the architecture

1. **No CR PSP publicly advertises split settlement / sub-merchant marketplace payouts.**
   The Uber model (structure C) is not an off-the-shelf CR product as of this research. It
   may exist as an enterprise/negotiated feature — unknowable from docs alone → **L7 sales
   calls** (§4).
2. **Structure B works everywhere today.** Recurring billing (Tilopay subscriptions, ONVO
   recurring) means bilo can charge its own fees/subscriptions cleanly the day the S.R.L. +
   Hacienda stack exists. **Monetization is therefore never blocked by the split question.**
3. **PSP onboarding requires a registered merchant** (business/taxpayer). Two consequences:
   - bilo can't integrate any PSP until **M2 step 3** is done (cédula jurídica + Hacienda) —
     the roadmap gating in [doc 11 §4](./11-bootstrap-plan.md) is confirmed from the PSP side.
   - **Landlords as merchants = only formalized landlords.** A "Cobro Automático" where the
     landlord is the PSP merchant excludes informal landlords (most of the initial market).
4. **The withholding gotcha (GreenPay finding, likely rail-wide for cards):** card acquirers
   apply Hacienda tax withholdings (~7% advance) on merchant settlements. A landlord
   receiving rent through a card rail gets visibly withheld — a hard sell to informal
   landlords and a real reason rent stays on **direct SINPE** (no acquirer, no withholding
   mechanics, bank-to-bank) for a long time. Our fee revenue, by contrast, absorbs
   withholding as ordinary formal-business life.

## 3. What bilo builds, phased (PaymentGatewayPort adapters)

| Phase | Adapter | What it does | Prereqs |
|---|---|---|---|
| A (now→M2) | `DirectSinpeVerificationAdapter` | Rent tenant→landlord direct; bilo verifies + records (already specced, D14 §3) | None — no PSP |
| B1 (M2, first revenue) | `TilopaySubscriptionAdapter` *or* `OnvoRecurringAdapter` | Charges **bilo's own** subscriptions/fees (structure B); webhook → ledger | S.R.L., Hacienda, e-invoicing |
| B2 (Cobro Automático v1) | Payment-links flavor of B1 | bilo generates the rent payment link; funds settle **to the landlord's own PSP merchant account**; bilo bills its fee separately | Formalized landlords only (opt-in premium) |
| C (only if confirmed) | Split-settlement adapter | One charge, PSP splits rent→landlord / fee→bilo | **Written L7 confirmation** that beneficiary = landlord and bilo never holds funds |

The port absorbs all four — this table is why it exists (design 08).

## 4. The L7 question sheet (take this to ONVO + Tilopay sales)

1. Do you support marketplace/multi-recipient payments: one charge, settlement split between
   a merchant (landlord) and a platform commission (bilo)? If yes: who is the merchant of
   record, and does the platform portion require the platform to be the merchant?
2. If no split: can a **platform integrator** manage payment links / charges **on behalf of
   many merchants** (landlords) from one API relationship, with settlement always direct to
   each landlord?
3. Merchant onboarding for individuals: can a natural-person landlord (persona física with
   Hacienda activity) be a merchant, or corporate only? Fully digital KYB? How long?
4. Recurring SINPE (not just cards): supported for monthly rent? Off-session?
5. Withholding treatment per rail (cards vs SINPE) on merchant settlements — exact
   percentages and who reports what to Hacienda.
6. Fees at our volumes; sandbox access before affiliation; webhook signing + idempotency
   semantics (our D07 §9 machinery assumes both).
7. Contractually: confirm funds flow **never** touches bilo's account in any product we use
   (our L2 legal requirement).

**Decision rule:** first provider giving a written *yes* to (1) or a workable (2)+(3) wins
Phase B2/C; if both stall, Phase B1 (our own fees only) proceeds regardless — structure B
needs nobody's permission but Hacienda's.

## 5. Open items

- Sales conversations (L7) — blocked until there's an S.R.L. to sign with; schedule for M2.
- Verify ONVO/Tilopay current pricing sheets at signature time (published numbers here are
  reported figures from 2025–2026 sources and drift).
- dLocal/Wompi-class regional processors: revisit if bilo expands beyond CR (out of scope for
  the beachhead).
