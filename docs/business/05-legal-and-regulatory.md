# 05 — Legal & Regulatory (Costa Rica)

The research below changes real architecture and business decisions — two prior assumptions
(Stripe, pooled rent collection) don't survive contact with Costa Rican law. Everything here is
**desk research to be validated by local counsel before the pilot signs its first lease**; the
"Action items" table at the end is the engagement brief for that lawyer.

## 1. Entity & payments reality check

### Finding 1: Stripe does not operate in Costa Rica

Stripe supports ~46 countries; CR is not one. CR businesses use it only via a foreign entity
(e.g., US LLC + US bank) ([Stripe global](https://stripe.com/global),
[supported countries guide](https://www.cs-cart.com/blog/stripe-supported-countries/),
[doola on CR](https://www.doola.com/stripe-guide/how-to-open-a-stripe-account-in-costa-rica/)).
Local card processing exists via CR PSPs (Tilopay, Greenpay, ONVO, Placetopay — fees typically
well above US interchange) ([CR gateway overview](https://payatlas.com/countries/costa-rica-cr),
[local options](https://www.notjustbiz.com/blog/best-payment-gateways-in-costa-rica)).

### Finding 2: bilo must not hold rent money without a license

In CR, **captación** (holding third-party funds at sight) is legally reserved to banks and
expressly authorized entities supervised by SUGEF; payment service providers must keep **100%
of third-party funds in custody in their SINPE accounts at the BCCR**, and a licensing regime
for "entidades de recepción de pago" has been under discussion
([El Financiero on fintech captación](https://www.elfinancierocr.com/finanzas/las-fintech-pueden-captar-dinero-procuraduria-se/5OSIKE3SXFFP3E3WCDNIELKMNQ/story/),
[BCCR payment system rules](https://www.bccr.fi.cr/marco-legal/DocReglamento/Reglamento_Sistema_Pagos.pdf),
[GLC Legal fintech overview](https://glclegal.com/blog/fintech-in-costa-rica/)).

### Decision: the rail is phased to stay clean

- **Phase A (pilot → P2): funds never touch bilo.** Tenant pays landlord **directly** via SINPE
  (deep link / request-to-pay when available); bilo verifies and records the payment (the
  `record-manual`/confirmation flow already specced in design doc 14 §3) and the ledger, trust
  score, receipts, and dashboard all run on *verified* payments. bilo's own fees (booking fee,
  rail fee) are **billed separately** to the landlord/tenant via e-invoice and charged as an
  ordinary bilo receivable — we are a software + verification company, not a funds intermediary.
- **Phase B (scale):** partner with a licensed local PSP (or become a registered payment
  receiver if the regime materializes) for true collect-and-disburse, card support via local
  PSP and/or a US entity + Stripe for international/exchange students. This is when design
  doc 14 §3's payouts table becomes operative.
- **Engineering consequence:** `PaymentGatewayPort` is unchanged (this is exactly why it's a
  port); Phase A binds a `DirectSinpeVerificationAdapter` instead of a charging gateway.
  Design docs ADR-09 and 14 §3 carry amendment notes pointing here.

### Entity structure (proposed, for counsel to confirm)

CR **S.R.L.** as the operating company from day one (contracts, invoicing, hiring). Defer any
US entity until Phase B genuinely needs Stripe — don't pay two accountants before there's card
volume to justify it.

## 2. Tenancy law — Ley 7527 shapes the product

Key rules ([law text](https://www.asamblea.go.cr/sd/Documents/BIBLIOTECADIGITAL/DOCUMENTOS/LEYES/LEY%207527-LEY%20GENERAL%20DE%20ARRENDAMIENTOS%20URBANOS%20Y%20SUBURBANOS.pdf),
[práctica guide](https://www.highlandscr.com/post/ley-de-arrendamientos-costa-rica-guia-propietarios-inquilinos),
[bufete summary](https://bufetedecostarica.com/ley-general-de-arrendamientos-urbanos-y-suburbanos-de-costa-rica/)):

| Rule | Product consequence |
|---|---|
| **Housing leases: 3-year minimum**; shorter clauses are null (tenant may leave earlier with 3-month notice; the *landlord* is bound) | A "semester lease" as a plain housing lease is legally a 3-year lease. **Critical counsel question #1:** structuring student room rentals as *hospedaje* (guest-house/boarding regime, excluded from Ley 7527) — likely viable for rooms with services, which is most of our pilot inventory. Lease templates must exist in both flavors; `LeaseTerminationRules` (design doc 07 §8) gets a `regime` dimension (VIVIENDA \| HOSPEDAJE) |
| **Deposit: capped at ~1 month** (housing); return within ~30 days | Deposit-protection product (R3) must respect the cap; deposit ledger gets a 30-day return SLA timer feeding disputes |
| **Rent increases: CPI cap for colones contracts; foreign-currency contracts fixed for the whole term** | `RentSchedule` gains an indexation policy per currency; USD student leases cannot auto-increase — pricing tools must warn landlords at listing time |
| **Auto-renewal for 3 more years unless 3-month pre-expiry notice** | Lease expiry job (design doc 09) sends the 3-month-notice reminder to both parties — a genuinely valuable feature the law hands us |

## 3. Tax & invoicing

- **IVA 13%** applies to bilo's service fees. Residential rent itself is IVA-exempt below a
  threshold (~1.5 base salaries) — landlord-facing docs must not give tax advice beyond linking
  Hacienda guidance.
- **Factura electrónica v4.4 is mandatory** (since Sept 2025) for invoicing in CR — every
  booking fee and rail fee needs a compliant XML e-invoice via an authorized provider
  ([Sovos overview](https://sovos.com/es/iva/reglas-fiscales/factura-electronica-costa-rica/),
  [v4.4 changes](https://www.deloitte.com/latam/es/services/tax/perspectives/cr-comprobante-electronico-4-4-cinco-cambios-relevantes.html)).
  **Engineering:** an `InvoicingPort` (same pattern as every other port, design doc 08) wrapping
  a local e-invoicing API (Alegra/Facturele-class provider); invoices generated on every fee
  charge from P1 on. Added to the roadmap.
- Monthly IVA declaration cadence → accountant retained before P1 (first colón of revenue).

## 4. Data protection — Ley 8968 / Prodhab

CR's data-protection law requires consent for personal-data processing and Prodhab registration
for certain databases. The backend design already builds the right shape (PII redaction,
soft-delete + scrub, export/delete endpoints — design docs 05 §4, 10 §1). Counsel confirms:
Prodhab registration need, consent text, cross-border processing terms (our cloud is abroad),
and retention periods for ledger/audit data.

## 5. Contracts & policies to produce (with counsel — the paper product)

1. Terms of Service + Privacy Policy (ES, CR law).
2. **Lease templates**: vivienda (7527-compliant) and hospedaje variants — these templates *are*
   the product's legal moat at the beachhead; nobody in the FB-group market has them.
3. Landlord platform agreement (verification consent, fee schedule, anti-discrimination).
4. Deposit handling terms (Phase A: deposit goes landlord↔tenant directly, bilo records;
   any future escrow waits for Phase B licensing).
5. Dispute-resolution policy referencing CR mediation law (Ley RAC) — disputes module's
   structured outcomes (design doc 07 §12) must map to it.

## 6. Action items (the counsel engagement brief)

| # | Question/deliverable | Blocks | Priority |
|---|---|---|---|
| L1 | Hospedaje vs vivienda structuring for semester room rentals | Pilot lease templates | **P0** |
| L2 | Confirm Phase A fee-billing model creates no captación/PSP exposure | Rail launch | **P0** |
| L3 | S.R.L. incorporation + shareholder agreement | Everything | **P0** |
| L4 | ToS + Privacy + Prodhab assessment | Public launch | P1 |
| L5 | Lease templates (both regimes) + deposit terms | First lease | **P0** |
| L6 | IVA treatment of each revenue stream + e-invoicing provider selection | P1 monetization | P1 |
| L7 | Phase B licensing/PSP-partnership memo | P2 | P2 |
