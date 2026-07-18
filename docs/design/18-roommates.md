# 18 — Shared Units & Roommate Approval

A landlord rents a two-person apartment; one slot is filled, one is open. Applicants for the
open slot are not just picking an apartment — they are picking a kitchen-mate, and the person
already living there gets a real say: see the applicant's profile, talk to them in chat, and
**approve or reject** them before the landlord closes the deal. This doc specifies shared
occupancy, the application ("solicitud") flow, and the consent rules around showing the current
resident to strangers.

New **roommates module** (Ring 3). Builds directly on inventory capacity (doc 15 §4).

## 1. Occupancy model: per-slot leases

**Decision.** A shareable unit (registry flag, doc 15 §3) has `capacity` N; each occupant gets
their **own lease** with the landlord (`occupancyMode = SLOT`, doc 15 §9). Occupancy is
derived: the active `SLOT` leases on the unit. There is no separate `occupancies` table — the
lease *is* the occupancy (one source of truth; doc 07 §8's machinery — payments, deposits,
termination — applies per person for free, which is exactly what shared student housing
needs: your roommate's missed rent is not your problem, and their move-out doesn't touch your
contract).

**Alternative rejected (for now):** a joint lease with N co-tenants and shared liability. It is
how much of the world formally rents, but it couples payment obligations and termination in
ways the product doesn't want for the student niche. **Revisit when** landlords demand joint
liability; it becomes `lease_parties(lease_id, user_id, role)` on top of the same lease core.

## 2. The current-resident card — consent first

**Context.** Product asked: "the landlord can make public the person who is already there."
The landlord owns the property; they do **not** own the resident's identity. Showing a real
person's profile on a public listing is the resident's call, always.

**Decision.** Two switches, both required:

1. Landlord enables **roommate matching** on the listing (`roommateMatching = true` — implies
   the unit is shareable with free capacity).
2. Each current occupant controls their own visibility:
   `PATCH /leases/:id/occupant-visibility { visible }` — an occupant-only toggle on their
   lease (`occupantVisible`, default **false**).

Applicants then see, per occupant: the **public profile projection** (doc 07 §2 — name,
avatar, bio, badges, trust score) if visible; otherwise an anonymized card ("1 current
resident · verified ✓" — badge shown, identity withheld, and only if the occupant allowed
even that: `occupantVisible` is a tri-state `HIDDEN | BADGES_ONLY | PROFILE`). The landlord
UI can *request* visibility (sends the occupant a nudge notification); it can never set it.

## 3. The application (solicitud)

```prisma
model RoommateApplication {
  id          String   @id                     // UUIDv7
  propertyId  String   @map("property_id")     // the listing
  unitId      String   @map("unit_id")         // denormalized (doc 15)
  applicantId String   @map("applicant_id")
  status      RoommateApplicationStatus        // §4
  message     String?                          // intro, ≤ 1000 chars
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  resolvedAt  DateTime?

  reviews RoommateApplicationReview[]          // one per current occupant, §4
  @@unique([propertyId, applicantId])          // one live application per listing+person
  @@index([propertyId, status])
  @@map("roommate_applications")
}

model RoommateApplicationReview {
  id            String   @id
  applicationId String   @map("application_id")
  occupantId    String   @map("occupant_id")   // reviewer (active SLOT lease holder)
  decision      ReviewDecision                 // PENDING | APPROVED | REJECTED
  decidedAt     DateTime?
  @@unique([applicationId, occupantId])
  @@map("roommate_application_reviews")
}
```

Submitting requires: listing has `roommateMatching`, free slot exists (doc 15 §5), applicant
has no active lease on that unit. Review rows are created for **every active occupant at
submission time**; an occupant who moves out mid-review has their pending row voided by a
`lease.terminated` listener.

## 4. The decision chain

`RoommateApplicationStatus`:
`SUBMITTED → OCCUPANT_REVIEW → OCCUPANT_APPROVED → ACCEPTED | REJECTED_BY_LANDLORD`,
with `→ REJECTED_BY_OCCUPANT` from the two review states, `→ WITHDRAWN` (applicant, any
non-terminal state), `→ EXPIRED` (job, §6).

The rules, in order of who holds which card:

1. **Occupants screen first.** All current occupants must approve (unanimous). One rejection →
   `REJECTED_BY_OCCUPANT`, **final** — the landlord cannot override it. This is the product's
   core promise to the person already living there: nobody is moved into your kitchen over
   your veto.
2. **Landlord decides last.** After `OCCUPANT_APPROVED`, the landlord accepts or rejects.
   `ACCEPTED` creates (same transaction) a landlord-side pre-accepted `Match` for the
   applicant — opening the landlord↔applicant conversation (doc 07 §6) where the actual
   `SLOT` lease gets drafted through the normal pipeline (doc 07 §8). The roommates module
   never creates leases.
3. Landlords may disable screening per listing (`occupantApprovalRequired = false`, default
   **true**) — e.g. purpose-built student residences where the operator curates. The listing
   badge then says so ("landlord-screened"), because applicants and residents both deserve to
   know the rule of the house. When off, `SUBMITTED → ACCEPTED | REJECTED_BY_LANDLORD` directly.
4. Rejections carry **no free-text reason to the applicant** — a neutral "not selected"
   notification. Reasons are a discrimination/harassment surface (business doc 07); internal
   optional reason enums feed trust & safety analytics only.

Applicant's own trust surface: occupants see the applicant's **public projection + verified
badge + their message** — never contact details before acceptance (safety: no off-platform
pressure channel while a veto is pending).

## 5. Applicant ↔ occupant chat — the conversations amendment

The screening conversation ("do we fit?") happens **on-platform**, per occupant review row:
opening a review creates a conversation between applicant and that occupant.

Prototype conversations are hard-wired to a match (`conversations.match_id UNIQUE`). This
feature (and maintenance cards, doc 19 §5) generalizes them — **amendment to doc 07 §7**:

```
conversations: match_id  →  (context_type, context_id) UNIQUE
               context_type: MATCH | ROOMMATE_REVIEW | LEASE
conversation_participants(conversation_id, user_id, joined_at, left_at)
```

Migration: existing rows become `('MATCH', match_id)` with the two participants backfilled.
Everything else in §7 (pagination, read markers, message types, PII scrubbing, the Stage-2
WebSocket seam) applies unchanged; authorization moves from "match parties" to "row in
`conversation_participants`". `ROOMMATE_REVIEW` conversations are frozen (read-only) when
their application resolves.

## 6. API, events, jobs

**Applicant.** `POST /properties/:id/roommate-applications { message }` ·
`GET /roommate-applications/mine` · `POST /roommate-applications/:id/withdraw`.
**Occupant.** `GET /roommate-applications/for-review` ·
`POST /roommate-applications/:id/review { approve | reject }` ·
visibility toggle (§2).
**Landlord.** `GET /properties/:id/roommate-applications` (status board with per-occupant
review states) · `POST /roommate-applications/:id/respond { accept | reject }` ·
`PATCH /properties/:id { roommateMatching, occupantApprovalRequired }`.

**Emits.** `roommate.application_submitted`, `roommate.review_decided`,
`roommate.application_accepted`, `roommate.application_rejected`, `roommate.application_expired`.
**Listens.** `lease.activated` (slot filled → expire other applications when capacity hits 0,
mirror of doc 17 §3) · `lease.terminated` (§3 review voiding; may reopen `roommateMatching`).
**Job** (doc 09 §4): `roommate.expire-applications` — daily; review states idle > 14 days →
`EXPIRED` (nudge notifications at day 7 to whoever is sitting on the decision).

## 7. Relationship to the waiting list (doc 17)

They compose: a shared listing can run both. The waiting list is interest in the **listing**
(landlord-picked); a roommate application is a **screened request for a specific open slot**
(occupant-vetoed). A landlord may invite from the waiting list *into* a roommate application
(invite CTA creates the application instead of a direct match when `occupantApprovalRequired`)
— one code path, decided by the listing's flags.
