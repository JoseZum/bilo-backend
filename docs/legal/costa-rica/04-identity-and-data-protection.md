# 04 — Identity Verification & Data Protection (Ley 8968)

*Desk research, not legal advice — see the [folder README](./README.md) disclaimer.*

Our identity feature (design doc 16: cédula/DIMEX/passport + photos, one government ID = one
account) is the trust moat — and the highest-fine surface we operate. Costa Rica's **Ley
8968** and its agency **PRODHAB** regulate everything about it: consent, sensitive data,
registration, transfers, retention. The good news: the design already made the right
architectural calls; what's missing is the *paper and screens* layer.

Sources: [Ley 8968 text](https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=70975&nValor3=85989),
[PRODHAB](https://www.prodhab.go.cr/),
[compliance guide](https://www.recordinglaw.com/world-laws/world-data-privacy-laws/costa-rica-data-privacy-laws/),
[bufete overview](https://bufetedecostarica.com/ley-de-proteccion-de-la-persona-frente-al-tratamiento-de-sus-datos-personales-de-costa-rica/),
[Access Now on biometrics in CR](https://www.accessnow.org/el-estado-actual-de-la-proteccion-de-los-datos-biometricos-en-costa-rica/).

## 1. The ground rules of Ley 8968

- **Express, informed consent** before collecting/processing personal data — CR is stricter
  than GDPR here: consent is the workhorse basis, and it should be explicit (written or
  equivalent electronic act), specific, and revocable.
- **User rights:** access, rectification, deletion — our existing export/erase endpoints
  (D05 §4, FR-USER-004/007) are the technical half; response duties are the process half.
- **Security & confidentiality duties** on whoever runs the database.
- **Enforcement:** PRODHAB fines roughly **US$3,000–18,000 per infraction** plus the power to
  **suspend database use for 1–6 months** — the operational death penalty for a platform.

## 2. The biometric landmine (why we designed it the way we did)

CR practice treats **biometric data used for identification as sensitive data** — the
strictest category, where processing is prohibited save narrow exceptions and consent burdens
are highest. The live controversy proves the stakes: **PRODHAB ruled the TSE's own paid
identity-verification platform (VID) illegal** for validating fingerprints/photos for
companies without the data subject's prior express consent
([El Financiero](https://www.elfinancierocr.com/economia-y-politica/es-legal-la-comercializacion-de-los-datos/4L3MVOTVOFHGTNFAJXDTA56LWQ/story/),
[SURCOS on the TSE–PRODHAB clash](https://surcosdigital.com/el-debate-por-los-datos-sensibles-en-costa-rica-los-argumentos-que-enfrentan-al-tse-y-a-la-prodhab/)).

Consequences for bilo:

1. **Do not integrate TSE VID or any registry-photo verification service** while that fight
   is unresolved — even though it looks like the obvious "official" shortcut.
2. **Stage-1 manual review** (a human compares the selfie to the cédula photo, decides,
   images deleted after 90 days) keeps us at the lightest defensible end of biometric
   processing — no algorithmic template, no biometric database accumulating.
3. **Stage-2 automated verification** happens through a **specialized provider under a data
   processing agreement** (Didit/Truora-class) with the consent capture on our side — never a
   home-built face matcher (D16 already says this; now it has the legal why).
4. The **consent screen is a feature, not a checkbox**: separate from ToS acceptance,
   specific to verification, naming what is collected (document photos, selfie), the purpose
   (identity confirmation + one-account rule), retention (photos 90 days post-decision; hash
   indefinitely for the anti-evasion rule), the processor if any, and revocation limits
   (revoking consent removes the badge; the uniqueness hash survives — this must be *said*).

## 3. What our existing design already gets right (keep citing this)

| Design decision (D16) | Legal effect |
|---|---|
| Raw document number never stored — HMAC hash + last4 | Data minimization; breach blast-radius reduction |
| Photos in private storage, deleted 90 days after decision | Retention proportionality — the strongest answer to "why do you still have my cédula?" |
| Hash survives erasure (anti-ban-evasion) | Defensible as a legitimate, minimized retention **if disclosed in the consent text** — explicit counsel check (L9) |
| Verification optional (badge, not gate) | Consent is genuinely free — no service denial for refusing |
| PII redaction in logs; scrub on erasure | Security duty + deletion right implementation |
| Single-writer badge projection; no module reads identity records | Purpose limitation, enforced architecturally |

**Landlord verification** uses the same flow + one addition: authority over the property.
The **Registro Nacional is a public registry** — checking a landlord's claimed title against
it processes public data and is the right, low-risk signal (manual at Stage 1).

## 4. PRODHAB registration — do we need it?

Ley 8968 requires registering databases **"destined to distribution, dissemination, or
commercialization"** (annual canon ~US$200); databases for **internal use** are exempt from
registration (not from the law's duties!). bilo's user database is internal-use by policy —
we never sell, rent, or distribute user data (README fence #4). Public profile projections
shown *inside the service* are not data commercialization in the ordinary reading, but this
is exactly the kind of reading counsel confirms (**L9**), because getting it wrong is a
"serious infraction."

Also note: a **reform of Ley 8968 has been under legislative discussion for years**
([IPANDETEC](https://www.ipandetec.org/2021/02/09/reforma-datos-personales/)) — GDPR-style
duties (DPO, breach notification) may arrive; our GDPR-shaped design (D05 §4) means we're
already ahead of the likely direction.

## 5. Cross-border processing

Our cloud runs outside CR. Ley 8968's framework expects the data subject's consent to cover
the transfer and equivalent protection guarantees. Practical stack: name hosting location
and processors in the Privacy Policy, cover the transfer in the consent language, and keep
processor agreements (cloud, storage, future IDV provider) on file. (Counsel: exact wording,
L9.)

## 6. Privacy Policy skeleton (Spanish headings, drafts with counsel)

1. **Responsable del tratamiento** — the S.R.L., contact, data-protection contact.
2. **Datos que recolectamos** — account, profile, preferences, listings, messages, payment
   *records* (not card data), verification data (separate emphasized section), device/usage.
3. **Finalidades y base** — service operation; verification & one-account rule (express
   consent); legal duties (tax, invoicing).
4. **Datos sensibles y verificación de identidad** — the §2 consent content, in policy form.
5. **Plazos de conservación** — per data class: photos 90 days; ledger/audit per tax law;
   hash indefinitely (stated reason); chat scrubbed on erasure.
6. **Transferencias y encargados** — cloud/processors, locations, guarantees.
7. **Derechos** (acceso, rectificación, supresión, revocación) — how to exercise, response
   times, PRODHAB as authority.
8. **Seguridad** — measures summary (no security theater specifics).
9. **Menores** — 18+ only.
10. **Cambios** — versioning + re-acceptance (mirrors FR-AUTH-009 mechanics).

## Questions for counsel (L9 pack)

- Confirm: manual selfie/cédula review = sensitive-data processing? Exact consent text.
- Hash retention post-erasure: disclosed-consent sufficiency vs any statutory limit.
- PRODHAB registration: confirm internal-use exemption applies to our model.
- Cross-border transfer wording; processor-agreement checklist for cloud + future IDV vendor.
- Student-email verification (roadmap 1.7): any additional consent nuance for minors-adjacent
  university populations (all users still 18+).
