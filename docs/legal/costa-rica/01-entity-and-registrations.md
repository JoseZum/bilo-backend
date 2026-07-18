# 01 — Entity & Registrations (Costa Rica)

*Desk research, not legal advice — see the [folder README](./README.md) disclaimer.*

What it takes — and costs — to exist legally as a company in Costa Rica before the first
colón of revenue. Written for our actual situation: students, minimal cash, wanting the
personal-asset shield without burning runway.

## 1. Why an S.R.L., and why before launch

Operating as individuals means **personal, unlimited liability** for everything in the threat
map — a lawsuit or tax debt follows each of us personally. An S.R.L. (Sociedad de
Responsabilidad Limitada) caps that at the company. S.R.L. over S.A.: simpler governance (no
board of directors required, one or more *gerentes*), quotas instead of shares, cheaper to
maintain, and the standard choice for startups
([BGA on S.R.L.](https://bgacorp.com/sociedad-responsabilidad-limitada-costa-rica/),
[comparison FAQ](https://lawyersofcostarica.com/pdfs/FAQs-Sociedades-Costa-Rica.pdf)).

Incorporate **before** public launch and before any revenue: ToS must name a legal entity,
invoices must come from one, and retrofitting contracts from personal to corporate is pain.

**Founder hygiene (cheap now, priceless later):** a short quota-holder agreement (vesting,
what happens if someone leaves mid-degree, IP assignment of everything built pre- and
post-incorporation into the company). IP assignment matters most — the code in these repos
must be owned by the S.R.L., not by whichever of us pushed the commit.

## 2. Formation: steps & one-time costs

Formation is a notary act (all CR company formation goes through a notary public) —
([process overview](https://www.bizlatinhub.com/10-steps-register-company-costa-rica-incorporation-agent/),
[cost breakdown](https://adj-cr.com/cuanto-cuesta/constituir-empresa-costa-rica/),
[El Financiero guide](https://www.elfinancierocr.com/finanzas/como-se-crea-una-sociedad-en-costa-rica-estos-son/FCE6LI6B4VB3PMJUTEVSCMARFE/story/)):

| Step | Cost (approx, 2026) |
|---|---|
| Notary drafting + incorporation deed (honorarios) | ₡180,000–300,000 |
| Registro Nacional registration stamps (timbres) | ~₡46,000 |
| Legalization of corporate books (libros legales) | ~₡16,000 |
| Edicto in La Gaceta | ₡25,000–50,000 |
| **Total one-time** | **~₡270,000–410,000 (≈ US$530–800)** |

Shop the notary fee — student-friendly notaries and online incorporation services exist at
the lower end. Timeline: roughly 1–3 weeks once the deed is signed.

## 3. The registration checklist (each one is mandatory)

1. **Registro Nacional** — the incorporation itself (§2). Gets us the *cédula jurídica*.
2. **Hacienda (Ministerio de Hacienda)** — register as taxpayer in the ATV/TRIBU-CR system
   with the correct economic activity code *before starting activity*; this activates IVA and
   income-tax obligations and enables **factura electrónica v4.4** (mandatory for all
   invoicing — see [doc 05 §2](./05-money-tax-and-criminal-exposure.md)).
3. **Patente municipal (business license)** — required for **any lucrative activity,
   including fully online businesses with no physical storefront**; issued by the
   municipality of our fiscal domicile; cost and paperwork vary by municipality
   ([requirement overview](https://blog.officiumlegal.com/es/derecho-comercial/que-es-una-patente-comercial-y-como-se-solicita-en-costa-rica),
   [VUI](https://vui.cr/tramite/patente-comercial-municipalidades/)). Do not skip this
   because "we're just an app" — the obligation attaches when income starts.
4. **RTBF (Registro de Transparencia y Beneficiarios Finales)** — annual declaration of
   ultimate beneficial owners via Central Directo (BCCR), due every April (and within 20 days
   of ownership changes) ([obligations calendar](https://www.ecija.com/actualidad-insights/obligaciones-corporativas-y-tributarias-2026-costa-rica/)).
5. **CCSS (Caja)** — employer registration **only once someone is on payroll** (including
   founders taking salary). Social charges are heavy (~26%+ employer side) — while we take no
   salary, no CCSS employer duty; the moment we pay ourselves or anyone, register first.
6. **PRODHAB** — only if our database is *distributed/commercialized* (it is not, by policy);
   analysis in [doc 04 §5](./04-identity-and-data-protection.md).
7. **ICT (tourism registry)** — **not applicable** while we stay out of short-term lodging;
   boundary analysis in [doc 03 §3](./03-tenancy-and-hospedaje.md).
8. **SUGEF** — **not applicable** to rental-only intermediation (analysis in
   [doc 05 §3](./05-money-tax-and-criminal-exposure.md)); revisit if we ever add sales
   brokerage or touch funds.

## 4. Annual fixed costs of existing (the "even if we make ₡0" bill)

| Obligation | When | Amount (2026 figures) |
|---|---|---|
| **Impuesto a Personas Jurídicas** (corporate entity tax) | January 31 | Inactive: ₡69,330 · Active, gross income < 120 base salaries: ₡115,550 · 120–280: ₡138,660 · ≥ 280: ₡231,100 ([BDO 2026](https://www.bdo.cr/es-cr/publicaciones/2026/impuesto-a-las-personas-juridicas-2026), [Hacienda](https://www.hacienda.go.cr/docs/CP042025.pdf)) |
| Timbre de Educación y Cultura | Feb–Mar | small (₡5,000–18,000 range by capital) |
| RTBF declaration | April | free (fines if skipped) |
| Municipal patente tax | quarterly | % of gross income, municipality-specific |
| Income tax declaration + monthly IVA declarations | monthly/annual | filing duty exists even at ₡0 IVA; accountant ~₡40,000–80,000/month once active |
| Inactive-company informative declaration (if ever dormant) | per Hacienda calendar | free ([AG Legal](https://aglegal.com/es/sociedades-inactivas-costa-rica/)) |

**Planning number: ~₡400k (≈US$800) to be born + ~₡200–300k/year to stay alive before
revenue**, plus accountant fees once invoicing starts. That is the real "cost of being
legal" — cheap insurance against every personal-liability scenario in the threat map.

## 5. Sequencing for broke founders

1. **Now (pre-launch, pre-revenue):** incorporate S.R.L. + founder agreement + IP assignment.
   Register with Hacienda (no revenue = simple filings). Skip CCSS (no payroll).
2. **Before first paying user:** patente municipal, e-invoicing provider connected
   (InvoicingPort), accountant retained, ToS naming the S.R.L.
3. **Before first hire/founder salary:** CCSS employer registration.
4. **Only if/when triggered:** PRODHAB (data commercialization — policy: never), ICT
   (short-term stays — policy: not at MVP), SUGEF (sales brokerage/funds — policy: no).

## Questions for counsel

- Confirm S.R.L. over S.A. for our cap-table plans (future investors/SAFE-equivalents in CR).
- Cheapest compliant fiscal domicile / registered-agent setup for a fully remote company.
- Municipal patente classification for a pure software marketplace (which activity code, which
  municipality strategy).
- Founder vesting + IP assignment drafted CR-valid.
