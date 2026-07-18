# 19 — Maintenance Tickets in Chat

"The shower has no hot water" is a chat message today and a lost promise by Friday. This doc
turns it into a **ticket**: raised from inside the tenant↔landlord conversation with photos and
videos, categorized (plumbing, electrical, security, …), urgency-rated, tracked through an
explicit state machine — reported → in review → assigned → visit scheduled → resolved — with
visit **reminders** for the tenant and a **"technician is on the way"** notification.

Replaces the prototype's skeletal `maintenance_requests` with a new **maintenance module**
(Ring 3). The services marketplace (doc 07 §13) stays separate: services is *who can do work*;
maintenance is *what work a tenancy needs*. They meet at assignment (§4).

## 1. The ticket

```prisma
model MaintenanceTicket {
  id            String   @id                      // UUIDv7
  unitId        String   @map("unit_id")          // doc 15 — building-level issues roll up
  leaseId       String   @map("lease_id")         // the tenancy it belongs to
  reporterId    String   @map("reporter_id")      // tenant (or landlord logging on their behalf)
  category      TicketCategory                    // §2
  urgency       TicketUrgency                     // LOW | MEDIUM | HIGH | EMERGENCY
  status        TicketStatus                      // §3 state machine
  title         String                            // ≤ 120 chars
  description   String                            // ≤ 4000 chars
  rejectionReason String?  @map("rejection_reason")
  resolvedAt    DateTime? @map("resolved_at")
  closedAt      DateTime? @map("closed_at")
  version       Int      @default(0)              // optimistic lock (doc 05 §7)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  attachments TicketAttachment[]
  visits      MaintenanceVisit[]
  @@index([leaseId, status])
  @@index([unitId, status])
  @@map("maintenance_tickets")
}

model TicketAttachment {
  id        String  @id
  ticketId  String  @map("ticket_id")
  kind      AttachmentKind                        // PHOTO | VIDEO
  storageKey String @map("storage_key")           // private bucket, presigned (doc 08)
  createdAt DateTime @default(now())
  @@index([ticketId])
  @@map("ticket_attachments")
}
```

Attachments use the presigned-upload flow from doc 07 §4: ≤ 10 per ticket, photos ≤ 10 MB,
videos ≤ 100 MB / 60 s, mime allowlist, EXIF-stripped server-side. Attaching to the *unit*
(not the listing) means a burst pipe in `BUILDING` scope shows up for every affected tenancy's
landlord view, and a unit's ticket history survives relistings (doc 15 §1).

## 2. Category & urgency

`TicketCategory`: `PLUMBING | ELECTRICAL | APPLIANCE | HVAC | SECURITY | PEST_CONTROL |
STRUCTURAL | INTERNET | COMMON_AREA | CLEANING | OTHER` — a DB enum plus a code registry
(labels, icon, suggested provider type from doc 07 §13) so adding a category is enum value +
registry entry, the doc 15 §3 pattern.

Urgency is **tenant-declared, landlord-adjustable** (adjustment posts a system line in chat —
no silent downgrades), and drives response-time targets shown in the UI:

| Urgency | Examples | First response | Target resolution |
|---|---|---|---|
| `EMERGENCY` | gas leak, flooding, no water, break-in / broken lock | 2 h | 24 h |
| `HIGH` | no hot water, unit-wide power failure, fridge dead | 12 h | 72 h |
| `MEDIUM` | leaking faucet, one dead outlet, appliance limping | 24 h | 7 d |
| `LOW` | cosmetic: paint, squeaky door | 72 h | 30 d |

Targets are **product SLAs, not legal promises**: they trigger nudge notifications and feed the
landlord's responsiveness metric (a future trust input — *revisit when* trust v2 lands), they
are not contractual. `EMERGENCY` additionally shows "call 911" guidance before submission for
safety-of-life cases — the app is not an emergency service.

## 3. The state machine

`TicketStatus` (explicit machine class, doc 04 P2):

```
REPORTED → IN_REVIEW → ASSIGNED → VISIT_SCHEDULED → IN_PROGRESS → RESOLVED → CLOSED
    │           │                                                      │
    │           └→ REJECTED (landlord, reason required)                └→ REPORTED (reopen, ≤ 7d)
    └──────── CANCELLED (tenant, allowed until IN_PROGRESS)
```

- **REPORTED** — created by the tenant (or landlord). Ticket card appears in chat (§5).
- **IN_REVIEW** — landlord acknowledged ("being revised"). First-response SLA stops here.
- **ASSIGNED** — someone owns the fix: the landlord themself (`assignee = LANDLORD`) or a
  service provider (§4). `ASSIGNED → VISIT_SCHEDULED` when a visit is confirmed; small fixes
  may skip visits entirely (`ASSIGNED → IN_PROGRESS`).
- **RESOLVED** — fixer says done. The **tenant confirms** → `CLOSED`, or reopens (→ `REPORTED`,
  keeps history, increments a reopen counter). No confirmation within 7 days → auto-close job
  (§6) with prior warning notification. Tenant confirmation is the loop-closer: the person with
  the broken shower says when it's fixed, not the person who paid for the fix.
- **REJECTED** requires a reason (enum + optional text) — visible to the tenant, becomes
  dispute-input if contested (doc 07 §12 flow).
- Every transition writes who/when/what into the audit log (doc 07 §16) and posts a system
  line into the conversation (§5). Optimistic `version` guards the landlord-vs-provider race.

## 4. Assignment & visits

Assignment links the services domain: `assignedProviderId → service_providers` (doc 07 §13) or
self-assignment by the landlord. Stage 1 providers are manually onboarded; the monetization
hook (charging the fix through the payment rail) stays exactly where doc 07 §13 left it —
built when product asks, the `payment_id` seam already named.

```prisma
model MaintenanceVisit {
  id             String   @id
  ticketId       String   @map("ticket_id")
  providerId     String?  @map("provider_id")    // null = landlord visits
  scheduledStart DateTime @map("scheduled_start")
  scheduledEnd   DateTime @map("scheduled_end")  // arrival window, not duration
  status         VisitStatus                     // PROPOSED → CONFIRMED → EN_ROUTE → ON_SITE
                                                 //   → COMPLETED | NO_SHOW | CANCELLED
  reminder24hSentAt DateTime? @map("reminder_24h_sent_at")   // job dedup anchors (§6)
  reminder1hSentAt  DateTime? @map("reminder_1h_sent_at")
  createdAt      DateTime @default(now())
  @@index([ticketId])
  @@index([status, scheduledStart])
  @@map("maintenance_visits")
}
```

- **PROPOSED → CONFIRMED**: the landlord/provider proposes a window; the **tenant confirms**
  (someone has to open the door). Tenant can propose alternative windows; re-proposal replaces
  the visit row's times, not the row.
- **EN_ROUTE** — the technician (provider account) or landlord taps "on my way"
  (`POST /visits/:id/en-route`) → push to the tenant: *"El técnico va en camino"* with optional
  ETA minutes. `ON_SITE` on arrival. Provider-side UX is a bare-bones authenticated page at
  Stage 1 (providers are not full app users yet — **revisit when** provider volume justifies a
  provider app/portal).
- **NO_SHOW** (tenant-reported after window end) feeds the provider's internal quality record.
- Multiple visits per ticket are normal (diagnose, then fix with parts).

## 5. Chat integration — the ticket lives where the relationship lives

Tickets are raised **from the conversation** and the conversation tracks them:

- The tenant's chat composer gets "Report an issue" → `POST /maintenance/tickets` (with
  `leaseId`; media pre-uploaded via presign). The service posts a `MAINTENANCE_TICKET` card
  message into the lease conversation — extending the structured-card set of doc 07 §7 / doc 14
  §1 (`TEXT | CONTRACT_PROPOSAL | PAYMENT_REQUEST | SYSTEM | MAINTENANCE_TICKET`). Card payload
  (`messages.metadata`): `ticketId`, category, urgency, status, title, first-photo thumbnail.
  The card is a **live view** — clients render current ticket status fetched by id, so one card
  stays accurate forever (no per-transition card spam).
- State transitions post one-line `SYSTEM` messages ("Visit scheduled: Thu 14:00–16:00").
- Uses the `LEASE` conversation context from the doc 18 §5 amendment: on lease activation the
  match conversation continues as the lease conversation (context re-pointed, participants
  unchanged) — the tenant has one thread with their landlord for the life of the tenancy.

## 6. Events, jobs, notifications (the recordatorios)

**Emits.** `ticket.reported`, `ticket.acknowledged`, `ticket.assigned`,
`ticket.visit_scheduled`, `ticket.visit_en_route`, `ticket.resolved`, `ticket.reopened`,
`ticket.closed`, `ticket.rejected`, `ticket.cancelled`.

**Notification map additions** (doc 07 §15): every emit above notifies the counterparty;
`EMERGENCY` tickets escalate through every enabled channel at once (in-app + push + email).

**Jobs** (doc 09 §4 table additions):

| Job | Schedule | What it does (idempotency anchor) |
|---|---|---|
| `maintenance.visit-reminders` | every 15 min | `CONFIRMED` visits entering the 24 h / 1 h windows → remind tenant + fixer (`reminder24hSentAt` / `reminder1hSentAt` set in same tx) |
| `maintenance.auto-close` | daily | `RESOLVED` > 7 d without tenant action → `CLOSED` (warning notification at day 5; anchor: status transition) |
| `maintenance.sla-nudge` | hourly | tickets past first-response target still `REPORTED` → nudge landlord (dedup: `sla_nudged_at` on ticket) |

## 7. API summary

**Tenant.** `POST /maintenance/tickets` · `GET /maintenance/tickets/mine` ·
`POST /maintenance/tickets/:id/cancel` · `POST /maintenance/tickets/:id/confirm-resolution` ·
`POST /maintenance/tickets/:id/reopen` · `POST /maintenance/visits/:id/respond
{ confirm | proposeWindow }` · `POST /maintenance/visits/:id/no-show`.
**Landlord.** `GET /maintenance/tickets?unitId=&status=` (rolls up subtree via doc 15) ·
`POST /maintenance/tickets/:id/acknowledge | assign | reject | resolve` ·
`POST /maintenance/tickets/:id/visits { window }` · urgency adjust (§2).
**Fixer.** `POST /maintenance/visits/:id/en-route | on-site | complete`.
