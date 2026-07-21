# 02 — Responsabilidad de la plataforma y términos

> **Advertencia legal.** Investigación documental, no asesoría legal. Consulte la advertencia del [índice de esta carpeta](./README.md).

Este documento analiza mecanismos contractuales utilizados por Airbnb, evalúa con cautela su posible aplicación bajo el derecho costarricense e incorpora la Ley 10946. Termina con una estructura preliminar para los términos de servicio de bilo, sujeta a revisión jurídica.

## 1. The Airbnb playbook, clause by clause

From Airbnb's public [Terms of Service](https://www.airbnb.com/help/article/2908) and
analyses ([ConductAtlas](https://conductatlas.com/platform/airbnb/airbnb-terms-of-service/),
[AIgree summary](https://aigr.ee/service/airbnb)):

| Mechanism | What it does | Does it work in CR? |
|---|---|---|
| **Intermediary posture** — "we are a marketplace; hosts, not Airbnb, provide the stay" repeated everywhere: ToS, UI copy, receipts | The single most important protection: Airbnb is not a party to the accommodation contract | Aplicable con reservas: la Ley 10946 establece un modelo escalonado de responsabilidad (§2). La posición debe reflejar la operación real; controlar precio, condiciones y ejecución puede acercar a la plataforma al rol de parte contractual. |
| **Indemnification** — users defend and hold Airbnb harmless from claims arising from their conduct or user-to-user interactions | Shifts litigation cost to the user at fault | Requiere revisión: frente a consumidores, una indemnidad amplia puede considerarse abusiva bajo la Ley 7472. Debe limitarse a la conducta ilícita propia del usuario y revisarse en L13. |
| **Releases/waivers** — users release Airbnb from claims arising from stays/experiences ([guest release](https://www.airbnb.com/help/article/2871)) | Cuts off user-vs-platform claims for user-caused harm | Requiere revisión bajo la Ley 7472: no debe excluirse la responsabilidad de la plataforma por negligencia propia frente a consumidores; sí puede delimitarse la responsabilidad por conductas de otros usuarios. |
| **Limitation of liability** — caps damages, excludes consequential damages | Bounds worst-case exposure | Su validez puede diferir entre relaciones empresariales y de consumo; no debe considerarse una protección suficiente por sí sola. |
| **Mandatory arbitration + class waiver** (US users) | Kills class actions | No recomendado sin criterio jurídico: el arbitraje obligatorio en contratos de adhesión de consumo puede ser abusivo. Debe preservarse el acceso a la CNC y los tribunales; puede ofrecerse mediación voluntaria bajo la Ley RAC. |
| **Payments via licensed subsidiaries** ("limited payment collection agent") | Money handling sits in regulated entities | Aplicación propuesta: en la fase A, bilo no custodia fondos; una fase posterior utilizaría proveedores de pago autorizados en Costa Rica ([business 05](../../business/05-legal-and-regulatory.md)). |
| **Verification "as-is"** — ID checks described as limited, no endorsement of any user | Verification without guaranteeing users | La comunicación debe limitar el alcance de la insignia a la comprobación documental y evitar cualquier garantía sobre la persona. |
| **AirCover / Host Damage Protection** ([terms](https://www.airbnb.com/help/article/2869)) | A *product* (insurance-backed) that absorbs disputes without admitting legal duty | Alternativa futura: evaluar un producto de depósito o daños respaldado por una aseguradora autorizada, nunca una cobertura informal. |
| **Notice-and-takedown + moderation** | Acting on reports sustains the intermediary defense | Debe alinearse con el mecanismo de notificación y acción previsto por la Ley 10946 (§2). |

**Conclusión operativa:** la protección no depende de una cláusula aislada, sino de la coherencia entre la posición contractual, el producto y la operación. La plataforma debe comportarse como intermediaria, utilizar canales financieros autorizados, explicar los límites de la verificación y disponer de mecanismos formales para gestionar controversias.

## 2. Ley 10946 — gobernanza de servicios digitales y comercio electrónico

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

## Preguntas para asesoría jurídica

- L10 (10946 gap review once regulations publish), L11 (retracto on fees), L13
  (indemnity/limitation clauses vs 7472) — see [README](./README.md) table.
- Whether providing lease *templates* could be construed as unauthorized legal practice or
  as making us a party — and the disclaimer language that prevents both.
