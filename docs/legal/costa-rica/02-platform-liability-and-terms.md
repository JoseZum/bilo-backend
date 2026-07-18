# 02 — Platform Liability & Terms (the Airbnb playbook, adapted to CR)

*Desk research, not legal advice — see the [folder README](./README.md) disclaimer.*

How do marketplaces avoid owning every problem between their users? Airbnb's legal stack is
the industry reference; this doc dissects it, filters it through Costa Rican law (which does
**not** allow everything Airbnb does in the US), folds in the brand-new **Ley 10946**, and
ends with the skeleton of our own Terms of Service.

## 1. The Airbnb playbook, clause by clause

From Airbnb's public [Terms of Service](https://www.airbnb.com/help/article/2908) and
analyses ([ConductAtlas](https://conductatlas.com/platform/airbnb/airbnb-terms-of-service/),
[AIgree summary](https://aigr.ee/service/airbnb)):

| Mechanism | What it does | Does it work in CR? |
|---|---|---|
| **Intermediary posture** — "we are a marketplace; hosts, not Airbnb, provide the stay" repeated everywhere: ToS, UI copy, receipts | The single most important protection: Airbnb is not a party to the accommodation contract | ✅ Yes, and Ley 10946 now codifies a tiered intermediary-liability model (§2). Posture must be *real*: the more we control price, terms, and performance, the more we look like a party |
| **Indemnification** — users defend and hold Airbnb harmless from claims arising from their conduct or user-to-user interactions | Shifts litigation cost to the user at fault | ⚠️ Enforceable between businesses; against *consumers*, aggressive indemnities risk being an abusive clause under Ley 7472 — draft narrow (user's own unlawful conduct), counsel review (L13) |
| **Releases/waivers** — users release Airbnb from claims arising from stays/experiences ([guest release](https://www.airbnb.com/help/article/2871)) | Cuts off user-vs-platform claims for user-caused harm | ⚠️ Same 7472 limit: cannot waive platform liability for its *own* negligence toward consumers; can disclaim responsibility for *other users'* conduct |
| **Limitation of liability** — caps damages, excludes consequential damages | Bounds worst-case exposure | ⚠️ Valid inter-business; consumer-facing caps are vulnerable — keep, but don't rely on |
| **Mandatory arbitration + class waiver** (US users) | Kills class actions | ❌ Do not copy: forcing arbitration in a consumer adhesion contract is a classic abusive clause in CR; consumers keep CNC/court access. Offer *optional* mediation (Ley RAC) instead |
| **Payments via licensed subsidiaries** ("limited payment collection agent") | Money handling sits in regulated entities | ✅ Same lesson, our version: Phase A funds never touch us; Phase B goes through licensed CR PSPs ([business 05](../../business/05-legal-and-regulatory.md)) |
| **Verification "as-is"** — ID checks described as limited, no endorsement of any user | Verification without guaranteeing users | ✅ Copy this exactly: the badge means "document checked", never "we vouch for this person" |
| **AirCover / Host Damage Protection** ([terms](https://www.airbnb.com/help/article/2869)) | A *product* (insurance-backed) that absorbs disputes without admitting legal duty | 🕐 Later: an INS-backed deposit/damage product is the CR analog — Phase B+, never improvised |
| **Notice-and-takedown + moderation** | Acting on reports sustains the intermediary defense | ✅ Now mandatory-shaped under Ley 10946 (§2) |

**The meta-lesson:** Airbnb survives not because one clause is magic but because *posture,
product, and paper agree*: the platform genuinely behaves like an intermediary, the money
flows through licensed rails, verification is honest about its limits, and there's a funded
path (insurance) for the disputes that will happen anyway.

## 2. Ley 10946 — the new e-commerce constitution (our compliance clock)

Published **June 24, 2026**; in force **~June 2027** (12-month window while regulations
issue) — i.e., likely *before or right at our launch*. Building compliance in now is nearly
free; retrofitting is not
([El Financiero guide](https://www.elfinancierocr.com/negocios/nueva-ley-de-comercio-electronico-en-costa-rica/L56LV7WKPFFKHHECACWRLRJUKQ/story/),
[KPMG](https://kpmg.com/cr/es/insights/2026/06/newsflash-jun-30.html),
[ECIJA](https://www.ecija.com/actualidad-insights/costa-rica-aprueba-ley-de-gobernanza-de-los-servicios-digitales-y-el-comercio-electronico/),
[BLP](https://blplegal.com/es/newsflash-costa-rica-aprueba-nueva-ley-sobre-servicios-digitales-y-comercio-electronico/)).

What it demands from a platform like bilo:

1. **Tiered intermediary liability** (DSA-style): no automatic liability for user content
   *if* we lack actual knowledge of illegality and act diligently once notified → we need a
   real **notice-and-action flow** (report listing/user → review → reasoned decision →
   record). Maps to FR-ADMIN-004 + a takedown-request intake.
2. **Terms in clear Spanish** — plain-language ToS, no burying material terms.
3. **Free complaint channel** — cost-free claims/complaints intake with managed follow-up
   (and consumer-evaluation management). Product feature, not a mailbox.
4. **Dark patterns expressly prohibited** — no manipulative UI (pre-ticked boxes, shame
   prompts, hidden costs). Add to design-review checklist.
5. **Pre-contract transparency** — merchant identity, full price breakdown with taxes, and a
   **transaction summary before consent** on any purchase (our fees).
6. **Protocols for court orders** — documented process to block/remove content on judicial
   order.
7. **Enforcement:** Comisión Nacional del Consumidor, through Ley 7472's sanction machinery.

## 3. Ley 7472 + e-commerce regulation (already in force today)

The consumer-protection baseline that applies from day one
([golegal overview](https://golegalcr.com/regulacion-comercio-electronico-en-costa-rica/),
[reglamento cap. X](https://www.micitt.go.cr/sites/default/files/marco_juridico_legal/03.%20Decreto%20Ejecutivo%20n.%C2%B0%2037899-MEIC%20Reglamento%20a%20la%20Ley%20de%20Promoci%C3%B3n%20de%20la%20Competencia%20y%20Defensa%20Efectiva%20del%20Consumidor%20n.%C2%B0%207472..pdf)):

- **Derecho de retracto (8 days):** consumers in distance sales may rescind within 8 days of
  contract perfection, refunded by the same payment means. **Analysis for bilo:** our
  consumer-facing *fees* (e.g., a tenant-side booking fee) plausibly fall under this →
  refund policy must honor it, and the flow should get "service fully rendered" checkpoints
  (retracto generally extinguishes when the service is consumed with consent — exact
  boundaries are counsel question **L11**).
- **Total price display** including all charges before purchase.
- **Free, transparent complaint mechanism** with response deadlines — same feature as
  10946 §3 above; build once.
- **Abusive-clause doctrine** in adhesion contracts — the filter every Airbnb-inspired
  clause must pass (L13).

## 4. Our own policy layer (beyond ToS)

- **Anti-discrimination policy.** CR constitutional equality principles + reputational
  reality. The design already encodes the safe pattern (neutral rejections, no free-text
  reasons to applicants — D17 §7, D18 §4); the policy text states protected grounds and that
  screening tools are for *suitability*, not exclusion classes.
- **Moderation & community rules.** What gets a listing/user removed; pairs with the
  notice-and-action flow.
- **Landlord platform agreement.** The (few) business-to-platform terms: listing truthfulness
  warranty, ownership/authority representation, fee schedule, verification consent,
  anti-discrimination adherence.

## 5. ToS skeleton (draft outline for counsel, Spanish headings)

1. **Identificación del prestador** — the S.R.L., cédula jurídica, contact (10946 §5).
2. **Naturaleza del servicio** — bilo es un intermediario tecnológico; **no es parte** de los
   contratos de arrendamiento; no garantiza propiedades ni personas.
3. **Cuentas y elegibilidad** — one account per person (links to identity policy), age 18+,
   truthful information duty.
4. **Verificación de identidad** — what the badge means and does not mean; "as-is" limits
   (mirrors Airbnb's honest-verification language).
5. **Publicaciones y conducta** — listing truthfulness, prohibited content, moderation and
   notice-and-action, reasoned removals.
6. **Tarifas de bilo** — fee schedule, e-invoicing, **retracto** procedure and its limits,
   transaction summary before payment.
7. **Pagos entre usuarios** — Phase A reality: rent/deposits flow directly tenant↔landlord;
   bilo records and verifies but never holds funds.
8. **Contratos de arrendamiento** — templates provided as forms; parties are responsible;
   pointer to regime disclosures (doc 03).
9. **Limitación de responsabilidad e indemnidad** — narrow, 7472-proofed versions (§1).
10. **Datos personales** — pointer to Privacy Policy (doc 04 skeleton).
11. **Quejas y resolución de disputas** — free complaint channel, response times, optional
    mediation (Ley RAC), CNC/court rights preserved.
12. **Modificaciones, terminación, ley aplicable** (CR law, CR courts) — versioned
    acceptance (FR-AUTH-009).

## Questions for counsel

- L10 (10946 gap review once regulations publish), L11 (retracto on fees), L13
  (indemnity/limitation clauses vs 7472) — see [README](./README.md) table.
- Whether providing lease *templates* could be construed as unauthorized legal practice or
  as making us a party — and the disclaimer language that prevents both.
