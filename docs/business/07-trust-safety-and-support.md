# 07 — Trust, Safety & Support Operations

Trust is the product; this doc is its operations manual. A single viral scam story ("me
estafaron por una app") can kill a campus launch — the mitigation is designed *before* launch,
not after the first incident.

## 1. Verification ladder (what each badge actually means)

| Level | Check | How | When |
|---|---|---|---|
| V0 | Email + phone | OAuth + SMS/WhatsApp OTP | Signup |
| V1 | **Student verified** | University e-mail magic code (domain allowlist) | Before first match (tenant side) |
| V2 | **Identity verified** | Cédula/DIMEX photo + selfie match — *manual review at pilot* (founder-reviewed queue); vendor automation (Truora-class) when volume > ~20/day | Landlords: before first listing goes live. Tenants: before first lease |
| V3 | **Property verified** | We visited, photographed, confirmed the owner/administrator relationship (ask for utility bill or registry extract at pilot) | Every pilot listing (we're there anyway taking photos) |

Rules: badges expire (student: annually; identity: on document expiry); verification state
changes are audited (design doc 07 §16); the `verificationStatus` field carries the level.

## 2. Fraud & abuse playbook (top scenarios, pre-scripted)

| Threat | Defense | Response if it happens |
|---|---|---|
| **Fake listing / not-the-owner** | V3 at pilot kills this; later: ownership evidence + reverse-image-search on photos + new-landlord listing caps | Freeze listing + landlord, refund any booking fee same day, file the evidence, notify affected chatters in-app |
| **Deposit scam ("pay to reserve before visiting")** | Product rule: **no money before a signed lease**, enforced in copy everywhere + chat warning banner when amounts/SINPE numbers are typed pre-lease | Ban + report; publicize the rule, not the incident |
| **Off-platform bait** (immediate "escribime al WhatsApp") | Soft: value keeps users on-rail (doc 02 §2). Detection: contact-info regex flags pre-match sharing → warning banner (never auto-block at pilot — false positives burn trust) | Pattern repeat → manual review |
| **Discrimination in responses** | Landlord agreement clause (doc 05 §5); monitor accept-rate disparities later | Education first, removal on repeat |
| **Harassment in chat** | Report button on every message (pilot: routes to founders' queue, SLA §4) | Freeze conversation, review, ban if warranted |
| **Account takeover** | OAuth-only + refresh-token reuse detection already in design (doc 06 §3) | Session-family revoke + audit trail |

## 3. Visit safety (the physical-world moment nobody else owns)

Pilot features (cheap, high-signal): in-app visit scheduling with confirmed time/address ·
"share my visit" link (WhatsApp-shareable — parents are a persona, §06) · post-visit check-in
prompt ("¿todo bien?") · landlord no-show tracking feeding trust score. Guidance page: visit
in daylight, bring a friend, never pay at a visit.

## 4. Disputes & incident operations

- Disputes module (design doc 07 §12) is the system of record; **pilot resolution is founders
  within 7 days**, structured outcomes only (the trust listener needs them).
- Escalation matrix: scam/safety → same-day founder response · money disagreement → 7-day SLA ·
  quality complaints → 72h first response.
- **Incident comms pre-written** (the "viral scam" runbook): acknowledge fast personally,
  fix the victim's outcome first (refund/rehousing help), publish the platform rule that would
  have prevented it. Never argue with a victim in comments.

## 5. Support model

- **Channel: WhatsApp Business first** — it's where CR users already are; in-app help center
  second; email last. Hours: 8–20 weekdays, matrícula weekends staffed.
- Pilot staffing: founders + 1 ambassador trained on FAQ; scripts in a shared doc from day one
  (they become the help center + future support-hire training).
- Support volume is a liquidity gate metric (doc 03 §5: <15 tickets/week/1000 users) — support
  isn't just cost, it's the product-quality thermometer and the #1 source of pilot learnings.
  Every ticket gets a category tag; weekly top-3 categories feed the eng backlog.

## 6. Backend deltas

- Report/flag endpoints (messages, listings, users) + moderation queue — joins the Epic 5
  admin back-office bundle (doc 06 §6).
- Contact-info detection on pre-match messages (regex service, warning event) — small task,
  Epic 3.
- Visit scheduling entity (property, match, datetime, status, no-show flag) — small module or
  matches extension; Epic 3 stretch.
- Verification review queue endpoints (approve/reject V2/V3 with reason) — Epic 5 bundle.
