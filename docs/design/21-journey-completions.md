# 21 — Journey Completions: Viewings, Alerts, Safety & Seeker Tools

Product review of the end-to-end journey (2026-07-18) approved a wave of features that close
real gaps between the designed modules: **nobody could schedule a viewing, save a search,
report a user, bring a fiador, or compare two favorites.** This doc specs them. Monetization
infrastructure approved in the same review lives in doc 22.

Ownership: property viewings, saved searches, roommate-seeker matching, rental CV, and
guarantors form a new **seeker-tools module** (Ring 3); report & block form a new **safety
module** (Ring 0 — everything consults it). House rules and listing verification extend
properties; the termination notice extends leases.

## 1. Property viewings (visitas)

The rental journey's missing step: propose → confirm → show up. Mechanics deliberately mirror
maintenance visits (doc 19 §4) — same shape, different domain.

```prisma
model PropertyVisit {
  id             String   @id                      // UUIDv7
  propertyId     String   @map("property_id")
  conversationId String   @map("conversation_id")  // born from a match conversation
  requesterId    String   @map("requester_id")     // the tenant
  status         VisitStatus                       // PROPOSED → CONFIRMED → COMPLETED
                                                   //   | DECLINED | CANCELLED | NO_SHOW
  scheduledStart DateTime @map("scheduled_start")
  scheduledEnd   DateTime @map("scheduled_end")    // window
  reminder24hSentAt DateTime? @map("reminder_24h_sent_at")
  reminder1hSentAt  DateTime? @map("reminder_1h_sent_at")
  createdAt      DateTime @default(now())
  @@index([propertyId, status])
  @@index([status, scheduledStart])
  @@map("property_visits")
}
```

- Either party proposes from the conversation; the other **confirms, declines, or
  counter-proposes** (counter replaces the window, not the row). A `VISIT_PROPOSAL` card
  (doc 07 §7 message-type set) renders live status; transitions post system lines.
- **Reminders at 24 h and 1 h** to both parties — the `visits.reminders` job shares its
  dedup pattern (and eventually its code) with `maintenance.visit-reminders` (doc 09 §4).
- **No-show**: reportable by either side after the window; recorded (a repeat-no-show signal
  feeds trust later — signal recorded now, scoring wired when trust v2 lands).
- **Safety layer**: before a confirmed visit, the tenant sees the visit-safety guidance
  (business doc 07) and a one-tap "share visit details" (property address, time, landlord
  public profile) to a contact of their choice. Post-visit, a light prompt ("¿Cómo te fue?")
  updates the listing's process stage (doc: FE PropertyDetail stages).

## 2. Saved searches & alerts

Waiting lists (doc 17) watch *one listing*; saved searches watch *the market*.

```prisma
model SavedSearch {
  id            String   @id
  userId        String   @map("user_id")
  name          String                              // "Cerca del TEC"
  filters       Json                                // budget, types, amenities, anchor+radius+poiId (doc 20)
  cadence       AlertCadence @default(INSTANT)      // INSTANT | DAILY | OFF
  lastAlertAt   DateTime?  @map("last_alert_at")
  createdAt     DateTime @default(now())
  @@index([userId])
  @@map("saved_searches")
}
```

- Cap: **10 per user**. Filters are the exact feed-filter shape — one serializer, no drift.
- **Matching is event-driven**: a `property.created|updated`(→ACTIVE) listener evaluates the
  new listing against saved searches (candidate pre-filter by city/price bounds in SQL, full
  filter check in code); `INSTANT` sends a push per hit (deduped per search×listing —
  `alert_hits(search_id, property_id)` unique), `DAILY` batches into a digest job at 18:00.
  The listener is idempotent by event id like every Ring-0 consumer (doc 09).
- Mute/frequency management in-app; alert notifications deep-link to the listing with the
  matched search named ("Coincide con: Cerca del TEC").

## 3. Compare favorites

Pick 2–3 favorites → side-by-side **attribute matrix**: price, price/m², rooms, baths, area,
**binary amenities as ✓/✗ rows** (parking, pets, furnished, wifi…), distance to the user's
anchor (doc 20), landlord rating + badges, availability date. Differences highlighted;
identical rows collapsible. Pure client feature over a batch-get endpoint
(`GET /properties?ids=`) — the attribute row set derives from the unit-type registry
attributes (doc 15 §3) + listing services, so new amenities appear in compare automatically.

## 4. Roommate-seeker matching (tenant ↔ tenant)

Docs 17/18 cover joining an *existing* shared unit. This covers two students finding each
other *first*, then hunting together.

- **Opt-in seeker profile** (`roommate_seeker_profiles`): short bio, budget range, preferred
  zones, move-in window, lifestyle tags from a fixed vocabulary (sleep schedule, cleanliness,
  guests, smoking, pets) — fixed tags, not free text, so matching is filterable and the
  discrimination surface stays low.
- **Seeker feed**: browse/filter seekers by budget overlap, zone overlap, tags; profiles show
  public projection + badges (verified, student). Mutual like → **seeker match** → a
  conversation with context `ROOMMATE_SEEKER` (extends the doc 18 §5 context enum).
- Inside the chat, either can **share listings** (existing share flow, FR-PROP-013) — v1 of
  "search together" is a shared conversation with listing cards; joint applications are a
  future iteration, noted not specced.
- Safety module (§6) applies fully: block hides seeker profiles bidirectionally.

## 5. Rental CV (hoja de vida de inquilino) & guarantor (fiador)

**Rental CV** — the trust graph made portable, owned by the user:
- Opt-in aggregation view: badges, trust score, tenancy count, **payment punctuality**
  ("11/12 pagos a tiempo" — from the verified-payments ledger), landlord references.
- **References**: after a lease ends, the landlord may (optionally, in addition to the
  rating) write a short reference statement the tenant can attach; tenant controls
  visibility of every section.
- **Shareable link**: read-only public page behind a revocable token — built for the
  landlord *outside* bilo (the WhatsApp-market reality) and doubles as an acquisition
  channel. Never includes contact data or documents; view counts logged.

**Guarantor (fiador)** — CR landlords ask; students without one get filtered out informally.
- Listings gain `requiresGuarantor` (flag + feed filter both directions).
- **Consent-first attachment** (Ley 8968 — the tenant must not type a third party's data):
  the applicant sends the guarantor an **invite link**; the guarantor consents and fills
  their own mini-profile (name, relationship, optionally runs identity verification for a
  guarantor badge). Application shows "fiador: attached ✓ (verified)" to the landlord;
  details visible only after the landlord accepts into conversation.
- bilo never underwrites the guarantee — it transports the *existence and identity* of a
  fiador; the legal fianza happens in the parties' contract (intermediary posture, legal 02).

## 6. Report & block (safety module, Ring 0)

The user-facing half of the Ley 10946 notice-and-action machinery (legal 02 §2).

- **Block** (`user_blocks(blocker_id, blocked_id)` unique): bidirectional invisibility —
  feeds, seeker profiles, waitlists, applications; conversations freeze read-only. No
  notification to the blocked user.
- **Report** (`reports`): target `USER | LISTING | MESSAGE`, reason enum (scam, fake
  listing, harassment, discrimination, off-platform pressure, other) + details + optional
  evidence refs. Pipeline `OPEN → IN_REVIEW → ACTIONED | DISMISSED` in the admin console
  with **reasoned decisions recorded and the reporter notified of the outcome** (10946
  requirement); SLA target 72 h, EMERGENCY-class reports (safety) 24 h.
- Enforcement hooks everywhere: feed, chat send, application create, waitlist join all
  consult `safety.isBlocked(a, b)` (cheap indexed lookup; cached later).
- Repeat-offender aggregation (reports upheld per user) surfaces in the admin console and
  emits `safety.threshold_reached` for trust/ban workflows.

## 7. House rules (listing extension)

Structured fields on the listing — quiet hours, guests allowed, smoking, pets detail,
cleaning expectations — plus ≤500 free-text chars. Rendered on the detail page and pinned
into roommate-application review chats (doc 18), because "rules of the house" is exactly
what applicant screening argues about. Structured-first keeps them filterable later.

## 8. Verified-listing badge (listing extension)

Distinct from the verified *landlord*: this badge says **bilo checked the listing** —
photos original (reverse-image sanity check, manual at Stage 1), address plausible,
landlord's declared authority consistent with the public Registro Nacional entry (legal 04
§3). Flow: landlord requests → ops checklist → badge or reasoned rejection; badge revoked on
substantive edits (photos/address) until re-checked. Ships as a free ops-gated badge; the
MON hook (paid fast-track, doc 22) exists but is not enabled at launch.

## 9. Termination notice (lease extension)

Ley 7527's 3-month notice, executed in-app instead of by burofax folklore:
- Either party gives formal notice on an active lease: the system records who/when (full
  evidence pack: identity, session, document hash — same rigor as signing, doc 05 legal §4),
  computes the effective date (+3 months, month-end rules per counsel), notifies the
  counterparty on **every enabled channel**, and generates a **constancia PDF** both parties
  keep.
- Feeds the lease expiry machinery (auto-renewal doesn't fire once valid notice exists) and
  the deposit-return timer (doc 03 legal).
- Counsel note (L-item): electronic notice validity vs Ley 7527 formalities — the design
  assumes valid-with-evidence; the template text ships only after counsel confirms.

## 10. Parked (approved as future, kept visible)

| Feature | Where it lands later | ERS |
|---|---|---|
| Move-in/move-out photo inspection (acta de entrega), both-party acknowledged | Lease lifecycle; deposit-dispute evidence | FR-LEASE-018 (C) |
| Utilities breakdown on listings / roommate expense-split reminders | properties / roommates | FR-PROP-023, FR-ROOM-018 (C) |
| Payment-history constancia export (visa/credit PDF) | payments | FR-PAY-026 (C) |
| Joint seeker applications ("apply as a duo") | seeker-tools v2 | not yet numbered |

## Ripples

- **conversations (doc 07 §7):** message types += `VISIT_PROPOSAL`; contexts +=
  `ROOMMATE_SEEKER`; blocks freeze conversations.
- **notifications (doc 07 §15):** listens += `visit.*`, `alert.hit`, `report.resolved`,
  `seeker.matched`; WhatsApp channel added (doc 07 §15 amendment).
- **jobs (doc 09 §4):** `visits.reminders`, `alerts.daily-digest`.
- **feed (doc 07 §5):** consults safety blocks; `requiresGuarantor` filter.
- **trust (doc 07 §10):** future inputs registered: upheld reports, repeat no-shows.
