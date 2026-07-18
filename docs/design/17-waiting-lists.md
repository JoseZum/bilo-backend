# 17 — Waiting Lists

Demanded listings (and rented ones about to free up) collect interested tenants into a
**waiting list** the landlord can review, filter — e.g. *verified profiles only* (doc 16) — and
invite from. An invite drops the chosen tenant into the existing match → chat → lease pipeline;
the waiting list itself never becomes a second contracting path.

New **waitlists module** (Ring 3, sits beside matches).

## 1. Pool, not queue — the fairness decision

**Context.** "Waiting list" suggests a numbered queue. A queue implies a promise ("you are
number 3") that the landlord's filtering immediately breaks — and landlords *must* be free to
choose their tenant (they filter by verified badge, trust, budget fit today; more later).

**Decision.** The waiting list is a **pool with landlord-side selection**. Entries have a
`joinedAt` (default sort, oldest first) but **no stored position**, and tenants see "you're on
the list (since {date})", never a number. This avoids making an ordering promise we do not
keep, and it is the honest version of the product.

**Trade-off.** Less gamified for tenants than "you're #2!". Accepted — a fake number is worse.
**Revisit when** product wants strict-FIFO lists for high-demand student housing; that becomes
a per-list `policy: OPEN | FIFO` flag, and `FIFO` disables filtering instead of lying about it.

## 2. Schema

```prisma
model WaitingList {
  id                     String   @id                    // UUIDv7
  propertyId             String   @unique @map("property_id") // one list per listing
  open                   Boolean  @default(true)          // landlord pauses joins
  requiresVerifiedIdentity Boolean @default(false) @map("requires_verified_identity") // §4
  maxEntries             Int      @default(200)
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  entries WaitingListEntry[]
  @@map("waiting_lists")
}

model WaitingListEntry {
  id            String    @id                             // UUIDv7
  waitingListId String    @map("waiting_list_id")
  userId        String    @map("user_id")
  status        WaitlistEntryStatus @default(ACTIVE)      // §3
  note          String?                                   // tenant's pitch, ≤ 500 chars
  joinedAt      DateTime  @default(now())
  invitedAt     DateTime?
  resolvedAt    DateTime?

  @@unique([waitingListId, userId])
  @@index([waitingListId, status, joinedAt])
  @@index([userId, status])
  @@map("waiting_list_entries")
}
```

The entry stores **no snapshot** of the tenant (no copied trust score or badge): the landlord's
view joins live user data, so a tenant who verifies after joining immediately appears under the
"verified only" filter. `UNIQUE(waitingListId, userId)` makes re-joining an upsert (reactivates
a `WITHDRAWN | EXPIRED` entry, preserving the original `joinedAt`? no — **rejoining resets
`joinedAt`**; you left the pool, you re-enter at the back of the default sort).

## 3. Entry lifecycle

`WaitlistEntryStatus`: `ACTIVE → INVITED → CONVERTED | DECLINED`, plus `ACTIVE → WITHDRAWN`
(tenant leaves), `ACTIVE → REMOVED` (landlord prunes, no reason shown to tenant beyond a
neutral notification), `ACTIVE | INVITED → EXPIRED` (job, §6).

- **Invite** (`POST .../invite`): entry → `INVITED`; in the same transaction, create a `Match`
  (`PENDING`) if none exists and auto-accept it landlord-side — which opens the conversation
  via the existing same-tx rule (doc 07 §6). The tenant gets a push: "The landlord of X invited
  you from the waiting list." From here it *is* the normal pipeline.
- **Converted**: a `lease.activated` listener resolves the inviting entry to `CONVERTED` and
  (same listener) marks the list's remaining `ACTIVE` entries `EXPIRED` when the listing's
  unit has no free capacity left (doc 15 §5) — with a "this one's gone" notification that
  suggests similar listings (recommendations facade).
- **Declined**: tenant dismisses the invite (or its match expires) → back to `ACTIVE`? No —
  `DECLINED` is terminal for that entry; they can rejoin. Keeps the state machine acyclic.

## 4. Landlord filtering — the point of the feature

`GET /properties/:id/waitlist?filters...` (owner only) returns entries joined with the public
profile projection (doc 07 §2) — name, avatar, **verified badge** (doc 16 §4), student badge,
trust score, ratings summary — plus the entry's note. Query-time filters, all optional and
composable:

| Filter | Source |
|---|---|
| `verifiedOnly=true` | `users.verificationStatus = VERIFIED` (the doc 16 badge) |
| `studentVerified=true` | student badge (roadmap 1.7) |
| `minTrustScore=70` | `users.trust_score` |
| `budgetFits=true` | tenant preference range covers listing price (`user_preferences`) |
| `joinedAfter/joinedBefore` | entry |

Filters are **views over the pool, never mutations of it** — unfiltered entries remain in the
pool untouched. Additionally `requiresVerifiedIdentity` on the list enforces the badge **at
join time** (unverified tenants see why and get a verification CTA — a deliberate verification
funnel driver).

Sorting: `joinedAt` (default), `trustScore`. The response is cursor-paginated (doc 12).

## 5. Tenant-side API & abuse limits

- `POST /properties/:id/waitlist { note? }` — join (listing must be `ACTIVE|RENTED`, list
  `open`, not the landlord themself, cap not hit)
- `DELETE /properties/:id/waitlist` — withdraw · `GET /waitlist/mine` — my entries + status
- A user holds at most **20 `ACTIVE` entries** platform-wide (config) — hoarding cap; joining
  the 21st returns the doc 12 error envelope with the cap explained.
- Landlord: `PATCH /properties/:id/waitlist { open, requiresVerifiedIdentity }`,
  `POST /properties/:id/waitlist/entries/:entryId/invite`, `DELETE .../entries/:entryId`.

## 6. Events, jobs, notifications

**Emits.** `waitlist.joined`, `waitlist.invited`, `waitlist.entry_converted`,
`waitlist.entry_expired`, `waitlist.spot_opened`.
**Listens.** `lease.activated` (§3 conversion) · `lease.terminated|completed` → if the unit
regains capacity and the list has `ACTIVE` entries, emit `waitlist.spot_opened` →
notifications fans out "a spot opened at X" to `ACTIVE` entries (batched, rate-limited: one
such push per user per list per 7 days).
**Job** (doc 09 §4 table): `waitlist.expire-entries` — daily; `INVITED` > 7 days without a
tenant response → `EXPIRED`; entries on archived listings → `EXPIRED`. Idempotency anchor:
status transition itself.

## 7. What this module refuses to do

No payments to join a list (legal risk, doc business/05), no landlord-visible rejection
reasons on `REMOVED` (discrimination surface — see business doc 07 trust & safety), no
auto-invite ("first verified profile wins") until product explicitly asks — the landlord's
judgment stays in the loop by design.
