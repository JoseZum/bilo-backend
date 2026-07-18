# 05 — Money, Tax & Criminal Exposure

*Desk research, not legal advice — see the [folder README](./README.md) disclaimer.*

The short version of "how do we not end up broke or in jail": there are exactly two realistic
jail vectors for a platform like ours — **handling other people's money without a license**
and **tax fraud** — plus one heavy regulatory regime (AML) we stay out of by scope. All three
are avoidable by design decisions we have already made; this doc writes down why they stay
avoided.

## 1. Captación — the money-handling red line (threat T1)

Already established in [business 05 §1](../../business/05-legal-and-regulatory.md), restated
here as the operating rule because it is the single most dangerous mistake available to us:
in CR, receiving/holding third-party funds is reserved to licensed, SUGEF-supervised
entities; unauthorized financial intermediation is a **criminal offense**, and PSPs must keep
client funds in BCCR custody
([El Financiero on fintech captación](https://www.elfinancierocr.com/finanzas/las-fintech-pueden-captar-dinero-procuraduria-se/5OSIKE3SXFFP3E3WCDNIELKMNQ/story/),
[BCCR payment rules](https://www.bccr.fi.cr/marco-legal/DocReglamento/Reglamento_Sistema_Pagos.pdf)).

**Operating rules (non-negotiable, enforced by architecture):**
1. Rent and deposits flow **tenant → landlord directly** (SINPE). bilo verifies and records;
   `PaymentGatewayPort` binds a verification adapter, not a charging one, in Phase A.
2. bilo's own fees are **our receivables, invoiced by us** — never deducted from money
   passing through us, because no money passes through us.
3. **No escrow, no "we hold the deposit," no marketplace balance/wallet feature** — each of
   these is captación with better UX. Any future escrow/deposit product happens through a
   licensed partner (bank/PSP/INS) or not at all.
4. Phase B PSP integrations must settle **directly to the landlord** (landlord as
   beneficiary); a PSP that can only settle to bilo is rejected (business 05, L7).

## 2. Tax — boring, mandatory, criminal if ignored (threat T2)

| Duty | Detail |
|---|---|
| **IVA 13% on bilo's fees** | Every service fee we charge carries IVA; monthly declarations once registered. (Residential rent itself is IVA-exempt below ~1.5 base salaries — the landlord's issue, not ours; our UI links Hacienda guidance and gives no tax advice) |
| **Factura electrónica v4.4** | Mandatory e-invoicing ([Sovos](https://sovos.com/es/iva/reglas-fiscales/factura-electronica-costa-rica/), [Deloitte on v4.4](https://www.deloitte.com/latam/es/services/tax/perspectives/cr-comprobante-electronico-4-4-cinco-cambios-relevantes.html)): every fee charge emits a compliant XML invoice via an authorized provider — the `InvoicingPort` (FR-PAY-008) is a launch blocker for monetization, not polish |
| **Income tax** | Annual declaration; keep books from day one (accountant, [doc 01 §4](./01-entity-and-registrations.md)) |
| **Withholding traps** | None at MVP scale, but flag: paying foreign contractors/services can trigger withholding duties — ask the accountant before wiring anything abroad |

Tax fraud (Ley 9416 regime) is the second jail vector; the defense is unglamorous:
**register before revenue, invoice everything, declare monthly, pay an accountant.**

## 3. AML / SUGEF 15 bis — why we're (probably) outside it

Ley 7786 arts. 15/15 bis oblige designated non-financial activities (APNFD) to register with
SUGEF for AML supervision: casinos, **professional purchase/sale of real estate (brokers,
intermediaries, developers)**, dealers in precious metals, certain lawyers/notaries/
accountants, etc.
([SUGEF APNFD info](https://www.sugef.fi.cr/sujetos%20inscritos%20ley%207786%20-%20(%20apnfds)/Informacion%20sobre%20APNFDs%20y%20ayuda%20para%20su%20gestion.aspx),
[Crowe](https://www.crowe.com/cr/noticias/301---list-with-filter/sugef),
[Magnalex](https://magnalexabogados.com/inscripcion-articulo-15-sugef/)).

**Analysis:** the real-estate APNFD category targets *compra y venta* (sales transactions).
bilo does **rental matchmaking only** — no sales brokerage, no fund handling — which reads as
outside the enumerated activities. Two tripwires that would change the answer:
adding **property-sales features**, or **receiving/moving client funds** (which is a bigger
problem than AML anyway, §1). Counsel confirms the negative (**L12**) — a short written
opinion to keep on file, because "we asked and documented it" is itself protection.

## 4. E-signatures — Ley 8454 and how our leases get signed

([Law 8454](https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=55666&nValor3=60993&strTipM=TC),
[golegal explainer](https://golegalcr.com/firma-electronica-y-firma-digital-en-costa-rica/),
[viafirma summary](https://www.viafirma.com/en/faqs/electronic-signature-in-costa-rica/))

- **Electronic documents and signatures are valid** for private legal acts (functional
  equivalence + party autonomy); leases require no notary and can even be verbal (Ley 7527),
  so a digitally-signed lease is legally comfortable territory.
- **Firma digital certificada** (BCCR-anchored certificate) enjoys a **presumption of
  authorship** — evidentiary gold, effectively notarization-grade.
- **Simple electronic signature** (our Stage-1 in-app consent: who, when, IP, document hash —
  D07 §8) is valid but carries the burden of proving authorship if challenged.

**Strategy:** Stage 1 ships the in-app consent record with a rich evidence pack (verified
identity + OTP at signing + document hash + full audit trail — each element strengthens
authorship proof). The **Firma Digital certificada integration is the natural Stage-2
`SignaturePort` adapter** — many CR adults (and banks) already hold the certificate, and
"sign your lease with Firma Digital" is a trust feature competitors won't match quickly.

## 5. The criminal-exposure map (completeness check)

| Vector | Trigger | Our defense |
|---|---|---|
| Captación ilegal | Holding third-party funds | §1 rules; architecture makes it impossible, not just forbidden |
| Tax fraud | Undeclared revenue, fake/absent invoices | §2 discipline |
| AML violations | Being an unregistered APNFD | §3 scope fence + L12 opinion |
| Data crimes (Ley 9048) & 8968 sanctions | Selling data, breaches through negligence | Doc 04 controls |
| Fraud facilitation | Knowingly hosting scam listings | Verification + notice-and-action + moderation records (doc 02) — *diligence documented is diligence provable* |

None of these require money to avoid. They require the fences in the
[README](./README.md#what-we-refuse-to-do-at-mvp-scope-fences-that-keep-us-safe) and the
paperwork cadence in [doc 01](./01-entity-and-registrations.md).

## Questions for counsel

- L2 (Phase A fee-billing creates no captación/PSP exposure — written confirmation).
- L12 (rental-only intermediation outside 15 bis — written opinion).
- Evidence-pack sufficiency for simple e-signature on leases; when to prioritize the Firma
  Digital integration.
- Any municipal/canton-specific levies on rental intermediation we haven't mapped.
