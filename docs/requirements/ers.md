# bilo — Software Requirements Specification (ERS)

**Version 1.2 — 2026-07-18 · Status: DRAFT for product review**
*(v1.1: added GEO module — anchored map search & OSM POI catalog, FR-GEO-001…015, per D20)*
*(v1.2: added FR-APP-009 (conditional ads, C) and §5.1 release gates per the bootstrap plan, B11)*

This is the complete, numbered inventory of what bilo must do. Its job is to put the project's
scope **into numbers**: every functional requirement (FR) has an ID, a priority, and a source,
so we can count what launch actually costs, plan epics against it, and trace every line of code
back to a requirement (see the [delivery process](./sdlc-plan.md) for how FRs become tickets,
branches, and tests).

**Sources consolidated here:**
- Design docs `docs/design/01–19` (cited as `D07§6` = design doc 07, section 6)
- Business docs `docs/business/01–10` (cited as `B02`)
- The **bilo-frontend prototype** (`github.com/JoseZum/bilo-frontend` — cited as `FE:Screen`),
  which pins down the launch UX: onboarding, swipe discovery, solicitudes, chat cards,
  contracts, payments, landlord dashboard, publish wizard
- The backend prototype in this repo (validated flows)

## 1. How to read this document

- **FR ID format:** `FR-<MODULE>-<NNN>`. IDs are permanent — never renumbered, never reused.
  Deleted requirements are struck through with a note, so counts stay honest over time.
- **Priority (MoSCoW):**
  - **M** (Must) — launch blocker; the Stage-1 product does not ship without it.
  - **S** (Should) — launch-adjacent; targeted immediately after (or riding along with) launch.
    Docs 15–19 features (inventory, identity, waitlists, roommates, maintenance) live here.
  - **C** (Could) — Stage-2 backlog; designed, not scheduled.
  - **W** (Won't now) — explicitly deferred (all AI features, per B02 §6: AI builds only at
    national scale).
- Each FR is a testable statement. Detailed behavior (state machines, schemas, edge cases)
  lives in the cited design doc — the FR is the *contract*, the doc is the *spec*.
- §5 totals everything up — that table is the scope of the project in numbers.

## 2. Product overview & actors

bilo is a rental platform: swipe-based discovery + trust layer + the monthly payment rail,
launching in Costa Rica for the university-student niche (B01). One account can act in two
modes (FE role switch "Cliente/Admin"):

| Actor | Description |
|---|---|
| **Tenant** (inquilino) | Searches, applies, chats, signs, pays rent, reports issues |
| **Landlord** (arrendador) | Publishes units, screens applicants, manages contracts and collections |
| **Occupant** | A tenant currently in a shared unit, screening roommate applicants (D18) |
| **Service provider / Technician** | Fixes maintenance tickets, confirms visits (D19) |
| **Platform admin (ops)** | Identity review, disputes, moderation, reconciliation |
| **System** | Jobs, notifications, score computation — requirements it must satisfy unattended |

---

## 3. Functional requirements

### 3.1 AUTH — Authentication & sessions (D06)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-AUTH-001 | Sign in with Google (OAuth id-token exchange; no passwords stored) | M | D06§2, FE:Splash |
| FR-AUTH-002 | Sign in with Apple (nonce validation, relay emails, first-auth name capture) | M | D06§2 |
| FR-AUTH-003 | Token exchange issues short-lived access JWT + refresh token | M | D06§3 |
| FR-AUTH-004 | Refresh-token rotation with family reuse detection (reuse revokes the family) | M | D06§3 |
| FR-AUTH-005 | Logout (current session) and logout-all (every device) | M | D06§3 |
| FR-AUTH-006 | Accounts from different OAuth providers with the same verified email link to one bilo account | M | D06§2 |
| FR-AUTH-007 | Mock login exists for dev/demo only, gated by env flag; production boot refuses it | M | D06§1 |
| FR-AUTH-008 | All API endpoints require auth except an explicit `@Public` allowlist | M | D07 |
| FR-AUTH-009 | Terms & privacy acceptance is recorded (version + timestamp) at first sign-in | M | FE:Splash, B05 |
| FR-AUTH-010 | The app silently refreshes expired access tokens; a dead refresh token routes to re-login | M | D06§3 |
| FR-AUTH-011 | A user holds both tenant and landlord capabilities and switches mode in-app without re-login | M | FE:App (RoleChip) |
| FR-AUTH-012 | Banned/suspended accounts are blocked at token exchange with a support-contact response | S | D16§5, B07 |

### 3.2 APP — Client app shell (frontend cross-cutting)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-APP-001 | First-run onboarding: 3 swipeable slides (discover / chat / pay), skippable | M | FE:Onboarding |
| FR-APP-002 | Splash screen with brand + single-tap Google sign-in CTA | M | FE:Splash |
| FR-APP-003 | Bottom tab navigation, role-dependent: tenant (Explorar, Chats, Contratos, Pagos, Perfil) vs landlord (Panel, Chats, Solicitudes, Pagos, Perfil) | M | FE:App |
| FR-APP-004 | Role switch (Cliente ⇄ Admin) available from profile and header chip, re-scoping all tabs/data | M | FE:App, FE:Profile |
| FR-APP-005 | Light/dark theme support | S | FE:App (tweaks) |
| FR-APP-006 | Non-blocking toast feedback for every user action (success/info/danger) | M | FE:* |
| FR-APP-007 | Graceful degraded mode when API is unreachable: cached/last-known data + visible indicator | C | FE:data-layer |
| FR-APP-008 | All amounts render as CRC (₡) with locale formatting; dates in es-CR | M | D01§1, FE:* |
| FR-APP-009 | In-app ads (if ever enabled per the B11 decision rule): clearly labeled as advertising, never in chat or payment-adjacent screens | C | B11§2, Ley 10946 |

### 3.3 USER — Users & profiles (D07§2)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-USER-001 | View and edit own profile: name, avatar, phone, bio | M | D07§2, FE:Profile |
| FR-USER-002 | Avatar upload (presigned, size/mime capped) | S | D07§4 pattern |
| FR-USER-003 | Public profile projection: name, avatar, badges, trust score, ratings summary, response time — never the full record | M | D07§2, FE:PropertyDetail |
| FR-USER-004 | Delete my account: soft delete + PII scrub job; ledger/audit rows survive anonymized | M | D05§4 |
| FR-USER-005 | Profile shows verification badge (Verificado/Pendiente) and trust score pill | M | FE:Profile, D16§4 |
| FR-USER-006 | "Mis documentos" section: user's contracts, invoices, and identity submissions in one place | S | FE:Profile |
| FR-USER-007 | Privacy & security settings screen (sessions, data export request, delete account) | S | FE:Profile, D05§4 |
| FR-USER-008 | Help & support entry point (contact channel + FAQ) | S | FE:Profile, B07 |
| FR-USER-009 | Terms & privacy documents viewable in-app | M | FE:Profile, B05 |
| FR-USER-010 | Admin: list/search users, change roles, ban/suspend (audited) | M | D07§2 |

### 3.4 PREF — Tenant preferences (D07§3)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-PREF-001 | Set budget range (min–max, CRC) | M | FE:FilterSheet |
| FR-PREF-002 | Set preferred location as map pin + radius, with named-zone snapping (Escazú, San Pedro, …) | M | FE:FilterSheet |
| FR-PREF-003 | Set lifestyle preferences: pets, parking, furnished, wants-roommate | M | D07§3 |
| FR-PREF-004 | Set minimum bedrooms | S | D07§3 |
| FR-PREF-005 | Preferences persist server-side and feed the ranking engine immediately on change | M | D07§5 |
| FR-PREF-006 | In-feed filter adjustments (budget, radius, type chips) apply instantly and show active-filter count | M | FE:Discover |

### 3.5 INV — Rentable inventory: the unit hierarchy (D15)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-INV-001 | Create a rentable unit with a type from the catalog (BUILDING, HOUSE, APARTMENT, STUDIO, ROOM, BED, PARKING_SPOT, STORAGE_UNIT, COMMERCIAL_UNIT, COMPLEX, FLOOR) | S | D15§3 |
| FR-INV-002 | Units nest per registry containment rules (room ⊂ apartment/house ⊂ building ⊂ complex); invalid parent/child pairs are rejected | S | D15§2–3 |
| FR-INV-003 | Adding a new unit type requires only an enum value + registry entry (no schema change) | S | D15§3 |
| FR-INV-004 | Unit carries physical attributes (area, address, geo) + type-specific attributes validated against the registry schema | S | D15§2–3 |
| FR-INV-005 | Shareable unit types support capacity > 1 (slots) | S | D15§4 |
| FR-INV-006 | View my units as roots + expandable tree (depth-capped) | S | D15§7 |
| FR-INV-007 | Move/re-parent a unit with ownership + containment validation | S | D15§7 |
| FR-INV-008 | Archive (soft-delete) a unit; refused while subtree has active leases or listings | S | D15§7 |
| FR-INV-009 | A unit cannot be leased if an ancestor holds an active exclusive lease, and cannot be exclusively leased while a descendant holds one | S | D15§4 |
| FR-INV-010 | Slot leases on a unit never exceed capacity (checked under lock at activation) | S | D15§4 |
| FR-INV-011 | Availability is derived (type listable + no blocking lease + free slots), never stored | S | D15§5 |
| FR-INV-012 | One unit has at most one active listing at a time | S | D15§9 |
| FR-INV-013 | Every existing listing is backfilled with a corresponding unit (migration) | S | D15§8 |

### 3.6 PROP — Listings & publishing (D07§4, D15§1)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-PROP-001 | Landlord publishes a listing through a 4-step wizard: Photos → Details → Services → Preview | M | FE:Publish |
| FR-PROP-002 | Photo upload via presigned URLs; first photo is the cover; reorder and delete; minimum 1, recommended 4+ | M | FE:Publish, D07§4 |
| FR-PROP-003 | Listing type selection (Apartamento, Casa, Estudio, Penthouse, Loft — mapped to unit types) | M | FE:Publish |
| FR-PROP-004 | Attributes: bedrooms, bathrooms, m², parking, furnished, pets allowed | M | FE:Publish |
| FR-PROP-005 | Included services/amenities selection (wifi, water, electricity, security, pool, gym, …) | M | FE:Publish |
| FR-PROP-006 | Monthly price (slider input) + deposit with 1-month suggestion | M | FE:Publish |
| FR-PROP-007 | Preview step renders the listing exactly as tenants will see it | M | FE:Publish |
| FR-PROP-008 | Listing lifecycle: DRAFT → ACTIVE ⇄ PAUSED → ARCHIVED; RENTED set/cleared by lease events | M | D07§4 |
| FR-PROP-009 | Edit any listing field after publishing (audited) | M | D07§4 |
| FR-PROP-010 | Listing detail view: photo gallery with indicators, specs row, description, services grid, availability | M | FE:PropertyDetail |
| FR-PROP-011 | Listing detail shows landlord card: name, verified badge, years on platform, response time, rating + review count, chat CTA | M | FE:PropertyDetail |
| FR-PROP-012 | Listing detail shows the viewer's process stage (Disponible → Aplicando → Negociando → Contrato) | S | FE:PropertyDetail |
| FR-PROP-013 | Share a listing via link | S | FE:PropertyDetail |
| FR-PROP-014 | Landlord "my properties" view with per-property lifecycle pipeline (Listing → Solicitud → Negociación → Activo) | M | FE:Dashboard |
| FR-PROP-015 | Listing analytics for the owner: views, likes, matches | S | D07§4 |
| FR-PROP-016 | Set available-from date | M | D07§4 |
| FR-PROP-017 | Listing creation requires/creates a rentable unit (inline single-unit flow for simple landlords) | S | D15§8 |
| FR-PROP-018 | AI price suggestion for the zone/size while publishing | W | FE:Publish, B02§6 |
| FR-PROP-019 | AI demand prediction on preview ("8–12 solicitudes la primera semana") | W | FE:Publish |

### 3.7 DISC — Discovery: feed & swipes (D07§5)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-DISC-001 | Tenant home is a swipeable card stack of ranked listings (next cards visible behind) | M | FE:Discover |
| FR-DISC-002 | Ranking: hard filters (city, budget ±15%, constraints, ACTIVE, not swiped) then scored by budget fit, distance decay, freshness, landlord trust; weights configurable and logged | M | D07§5 |
| FR-DISC-003 | Feed excludes own listings and already-swiped listings | M | D07§5 |
| FR-DISC-004 | Swipe left = pass; recorded, removed from deck | M | FE:Discover |
| FR-DISC-005 | Swipe right (or ♥) = interest: opens optional-message modal before submitting | M | FE:Discover, FE:InterestModal |
| FR-DISC-006 | Interest modal offers quick-suggestion messages ("¿Sigue disponible?", visit request, pets) | S | FE:InterestModal |
| FR-DISC-007 | Star action saves a listing to favorites without swiping it away | M | FE:Discover |
| FR-DISC-008 | "Guardados" strip of saved listings on home; full favorites list | M | FE:Discover |
| FR-DISC-009 | One swipe per (user, listing) enforced; re-swipe updates within a grace window, else conflict | M | D07§5 |
| FR-DISC-010 | Empty-deck state explains why and offers filter adjustment | M | FE:Discover |
| FR-DISC-011 | Feed header shows result count + active zone; drag shows APARTAR/PASAR affordances | M | FE:Discover |
| FR-DISC-012 | Feed responses cacheable per user (noop cache at Stage 1, Redis at Stage 2) | C | D08§3 |

### 3.8 MATCH — Solicitudes & matches (D07§6)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-MATCH-001 | A right-swipe creates a solicitud (interest, with optional message) to the landlord | M | FE:Discover, D07§6 |
| FR-MATCH-002 | Landlord Solicitudes inbox: new/answered states, "Interés" vs "Mensaje" badges, applicant name + trust rating + property + age | M | FE:Requests |
| FR-MATCH-003 | Landlord accepts a solicitud → match ACCEPTED → conversation opens instantly (same transaction) | M | D07§6 |
| FR-MATCH-004 | Landlord rejects a solicitud → applicant gets a neutral notification (no reason text) | M | FE:Requests, D18§4 |
| FR-MATCH-005 | Landlord can open a chat from a solicitud before deciding | M | FE:Requests |
| FR-MATCH-006 | One active solicitud per (tenant, listing) | M | D07§6 |
| FR-MATCH-007 | Pending matches expire after 14 days (job) to keep the inbox honest | S | D07§6 |
| FR-MATCH-008 | Both parties see their matches list, role-aware | M | D07§6 |
| FR-MATCH-009 | Applicant sees solicitud status reflected in the listing's process stage | S | FE:PropertyDetail |

### 3.9 WAIT — Waiting lists (D17)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-WAIT-001 | Landlord enables/disables a waiting list per listing (open/close joins) | S | D17§2 |
| FR-WAIT-002 | Tenant joins a listing's waiting list with an optional note (≤500 chars); sees "on the list since {date}" (pool, not a numbered queue) | S | D17§1–3 |
| FR-WAIT-003 | One entry per (list, user); rejoining after leaving resets join date | S | D17§2 |
| FR-WAIT-004 | Tenant withdraws from a list; views all their entries + statuses | S | D17§5 |
| FR-WAIT-005 | A user holds at most 20 active entries platform-wide | S | D17§5 |
| FR-WAIT-006 | Landlord list view joins live profiles: name, badges, trust, note — filterable by verified-only, student-verified, min trust, budget-fits, join date; sortable; paginated | S | D17§4 |
| FR-WAIT-007 | Optional join requirement: verified identity only (unverified joiner gets verification CTA) | S | D17§4 |
| FR-WAIT-008 | Landlord invites an entry → pre-accepted match + conversation open + tenant notification | S | D17§3 |
| FR-WAIT-009 | Entry statuses: ACTIVE→INVITED→CONVERTED/DECLINED, WITHDRAWN, REMOVED, EXPIRED — transitions per spec | S | D17§3 |
| FR-WAIT-010 | Lease activation converts the inviting entry and expires remaining entries when capacity fills (with "spot gone" notification) | S | D17§3 |
| FR-WAIT-011 | When a unit regains capacity, active entries get a "spot opened" notification (rate-limited: 1/user/list/7d) | S | D17§6 |
| FR-WAIT-012 | Daily job expires stale invites (>7d) and entries on archived listings | S | D17§6 |

### 3.10 ROOM — Shared units & roommate approval (D18)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-ROOM-001 | A shareable unit's listing can enable roommate matching when slots are free | S | D18§2 |
| FR-ROOM-002 | Each occupant of a shared unit holds their own per-slot lease (independent payments/termination) | S | D18§1 |
| FR-ROOM-003 | Occupant controls own visibility to applicants: HIDDEN / BADGES_ONLY / PROFILE — landlord can request, never set | S | D18§2 |
| FR-ROOM-004 | Applicant submits a roommate application (solicitud) with intro message (≤1000 chars); one live application per (listing, applicant) | S | D18§3 |
| FR-ROOM-005 | Every current occupant gets a review card per application: applicant public profile + badges + message (never contact details) | S | D18§3–4 |
| FR-ROOM-006 | Application approval requires all occupants (unanimous); any occupant rejection is final — landlord cannot override | S | D18§4 |
| FR-ROOM-007 | After occupant approval, landlord accepts (→ pre-accepted match → lease pipeline) or rejects | S | D18§4 |
| FR-ROOM-008 | Landlord may disable occupant screening per listing (default on); listing badge discloses the house rule | S | D18§4 |
| FR-ROOM-009 | Each occupant review opens a dedicated applicant↔occupant chat; frozen read-only when the application resolves | S | D18§5 |
| FR-ROOM-010 | Rejections deliver a neutral notification; no free-text reasons to the applicant | S | D18§4 |
| FR-ROOM-011 | Occupant move-out voids their pending reviews; capacity filling expires other applications | S | D18§3,6 |
| FR-ROOM-012 | Daily job expires idle applications (>14d) with day-7 nudges to whoever is sitting on the decision | S | D18§6 |
| FR-ROOM-013 | Waitlist invites can route into a roommate application when occupant screening is on | S | D18§7 |

### 3.11 CHAT — Conversations & messages (D07§7, D18§5)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-CHAT-001 | Conversations list: avatar, name, property context, last message, time, unread badge, online dot | M | FE:Chats |
| FR-CHAT-002 | Search conversations by text | S | FE:Chats |
| FR-CHAT-003 | Filter conversations by segment (Todos / Arrendadores / AI) | S | FE:Chats |
| FR-CHAT-004 | Conversation view: bubbles, timestamps, day separators, newest-first cursor pagination | M | FE:Conversation, D07§7 |
| FR-CHAT-005 | Send text messages (≤4k chars); Enter sends; optimistic append | M | FE:Conversation |
| FR-CHAT-006 | Read markers: opening a conversation marks messages read up to now | M | D07§7 |
| FR-CHAT-007 | Property context strip pinned atop each conversation with link to the listing | M | FE:Conversation |
| FR-CHAT-008 | Structured card: contract proposal (monthly, deposit, term, total) with "view full contract" | M | FE:Conversation, D14§1 |
| FR-CHAT-009 | Structured card: payment request with amount + due date + accept/reject actions | M | FE:Conversation |
| FR-CHAT-010 | Structured card: maintenance ticket (live status view) + system lines on transitions | S | D19§5 |
| FR-CHAT-011 | System messages for domain events rendered distinctly | M | D07§7 |
| FR-CHAT-012 | Conversations are participant-based with contexts MATCH / ROOMMATE_REVIEW / LEASE; the match thread continues as the lease thread | S | D18§5 |
| FR-CHAT-013 | Message delivery via REST polling at Stage 1; WebSocket gateway at Stage 2 with identical persistence | C | D07§7 |
| FR-CHAT-014 | Message bodies PII-scrubbed on account erasure | M | D07§7 |
| FR-CHAT-015 | Free-form chat has no attachments until a moderation story exists (media rides on tickets) | M | D07§7 |
| FR-CHAT-016 | Voice notes (mic input) | W | FE:Conversation |

### 3.12 LEASE — Contracts (D07§8)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-LEASE-001 | Landlord drafts a lease from an accepted match: monthly amount, deposit, currency, start/end, due day | M | D07§8 |
| FR-LEASE-002 | Sending the draft posts a contract-proposal card in the conversation (→ PENDING_SIGNATURE) | M | FE:Conversation |
| FR-LEASE-003 | Tenant opens and reads the full contract from the card | M | FE:Conversation |
| FR-LEASE-004 | Digital signature: in-app consent record (who, when, IP, contract snapshot hash) activates the lease | M | D07§8, FE:Contracts |
| FR-LEASE-005 | Lease lifecycle: DRAFT → PENDING_SIGNATURE → ACTIVE → COMPLETED/TERMINATED, with CANCELLED and unsigned-draft EXPIRED | M | D07§8 |
| FR-LEASE-006 | Activation atomically creates deposit payment, first rent payment, and the rent-period skeleton | M | D07§8 |
| FR-LEASE-007 | Rent schedule handles due-day month-length edges and first-month proration (documented formula) | M | D07§8 |
| FR-LEASE-008 | Contracts screen: counts by status (activos/pendientes/vencidos) + list with property, landlord, dates, monthly, deposit, status pill | M | FE:Contracts |
| FR-LEASE-009 | Contract document rendered as downloadable PDF | S | FE:Contracts |
| FR-LEASE-010 | Terminate a lease with reason; notice/deposit rules from a per-country policy class | M | D07§8 |
| FR-LEASE-011 | Lease records its unit and occupancy mode (EXCLUSIVE/SLOT); activation checks unit leasability | S | D15§9 |
| FR-LEASE-012 | Property status flips RENTED/ACTIVE driven by lease events | M | D07§4 |
| FR-LEASE-013 | Lease history retained for both parties after completion | M | D07§8 |
| FR-LEASE-014 | Lease renewal flow (new term proposed from existing lease) | C | — |
| FR-LEASE-015 | AI clause analysis with alerts on contract screen | W | FE:Contracts, B02§6 |

### 3.13 PAY — Payments, ledger & collections (D07§9, B02, B05, D14§3)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-PAY-001 | Tenant Pagos home: next-due hero (amount, concept) with "Pagar ahora" | M | FE:Payments |
| FR-PAY-002 | Month calendar marking paid days and due days; today highlighted | M | FE:Payments |
| FR-PAY-003 | Paid-this-month and pending totals | M | FE:Payments |
| FR-PAY-004 | Payment history list: date, concept, method, amount, status | M | FE:Payments |
| FR-PAY-005 | Receipt per payment: e-invoice view (number, date, method, total) + PDF download | M | FE:Payments, B05 |
| FR-PAY-006 | Phase A rail: direct tenant→landlord SINPE with bilo verification/confirmation flow (no pooled funds) | M | B05, D13-Epic4 |
| FR-PAY-007 | Booking-fee collection: SINPE to bilo's account gates contract issuance on confirmed receipt | M | B02 |
| FR-PAY-008 | E-invoicing on bilo fee charges (`InvoicingPort`, CR compliance) | M | B05 |
| FR-PAY-009 | Ledger: payment + transaction + event rows, append-only; integer minor units; fee split with CHECK constraint | M | D05§3 |
| FR-PAY-010 | Charge sequence is idempotent (Idempotency-Key), optimistically locked, crash-recoverable | M | D07§9 |
| FR-PAY-011 | Rent generation job creates upcoming periods/payments idempotently (UNIQUE lease+period) | M | D09§4 |
| FR-PAY-012 | Overdue is derived (pending past due), never stored; overdue sweep emits dunning events day 0/3/7 | M | D07§9 |
| FR-PAY-013 | Reconciliation job compares ledger vs provider records nightly; orphans page a human | M | D07§9 |
| FR-PAY-014 | Schedule a payment for a future date | S | FE:Payments |
| FR-PAY-015 | Deposit tracking: amount held, refundable status, % progress | S | FE:Payments |
| FR-PAY-016 | Payment methods management (add/remove/default) via PSP setup flow | C | FE:Profile, D07§9 |
| FR-PAY-017 | PSP "Cobro Automático" card/SINPE charging adapter (webhook-verified, deduped, fast-ack) | C | B02, D07§9 |
| FR-PAY-018 | Landlord Pagos: received vs expected this month with % progress bar | M | FE:AdminPayments |
| FR-PAY-019 | Landlord per-property payment status board: Recibido / Atrasado (days late) / Por venir, tenant, method, months-on-time | M | FE:AdminPayments |
| FR-PAY-020 | Landlord sends a payment reminder to a late tenant (rate-limited) | M | FE:AdminPayments |
| FR-PAY-021 | Landlord marks a payment received manually (Phase A verification records evidence; audited) | M | FE:AdminPayments, D14§4 |
| FR-PAY-022 | Landlord sends a payment link for an upcoming payment | S | FE:AdminPayments |
| FR-PAY-023 | Landlord exports payment data (CSV) | S | FE:AdminPayments |
| FR-PAY-024 | Payout request + payouts ledger (Stripe-Connect-class, Phase B) | C | FE:AdminPayments, D14§3 |
| FR-PAY-025 | Landlord recent-activity feed of payment events | S | FE:AdminPayments |

### 3.14 IDV — Identity verification (D16)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-IDV-001 | Submit identity verification: country, document type (CÉDULA/DIMEX/PASSPORT), number, document photos + selfie | S | D16§3 |
| FR-IDV-002 | Document numbers are never stored raw: HMAC hash + last4 only; photos in private storage, deleted 90 days after decision | S | D16§2 |
| FR-IDV-003 | One government ID links to at most one account ever (uniqueness on country+type+hash); conflicts fail into a support appeal | S | D16§1 |
| FR-IDV-004 | One account holds at most one identity record | S | D16§1 |
| FR-IDV-005 | Status flow NONE→SUBMITTED→IN_REVIEW→VERIFIED/REJECTED; resubmission capped 3/30d; admin REVOKED path | S | D16§3 |
| FR-IDV-006 | Stage-1 manual review queue for ops (checklist: photo match, checksum, registry lookup) | S | D16§3 |
| FR-IDV-007 | Provider-adapter verification (Didit/Truora-class) behind the same port | C | D16§3 |
| FR-IDV-008 | Verified badge appears on profile, feed cards, solicitudes, waitlist entries; feeds trust +10 | S | D16§4 |
| FR-IDV-009 | Identity record survives ban/erasure (PII scrubbed, hash kept) so banned users cannot re-register with the same ID | S | D16§1,5 |
| FR-IDV-010 | Student verification: university-email magic code grants STUDENT_VERIFIED badge (separate from identity) | M | D13-Epic1 |

### 3.15 TRUST — Trust score (D07§10)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-TRUST-001 | Every user has a trust score 0–100 (new users 50), updated only by the trust module | M | D07§10 |
| FR-TRUST-002 | Score reacts to events: on-time payment +, late payment −, ratings ±, dispute outcomes ±, verification +10, completed lease + | M | D07§10 |
| FR-TRUST-003 | Every change writes an event + history row; user can view score and its history ("why is my score X") | M | D07§10 |
| FR-TRUST-004 | Calculator is versioned; replaying events with new weights recomputes all scores | S | D07§10 |
| FR-TRUST-005 | Score/badge surfaces in: feed ranking, landlord solicitudes, waitlist filters, roommate reviews, profiles | M | D07§5, FE:* |

### 3.16 RATE — Ratings & reviews (D07§11)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-RATE-001 | After a lease completes/terminates, each party may rate the other once (score + comment) | M | D07§11 |
| FR-RATE-002 | Ratings are immutable and unique per direction per lease | M | D07§11 |
| FR-RATE-003 | Anti-retaliation publishing: visible only after both rate or 14 days pass | S | D07§11 |
| FR-RATE-004 | Listing detail shows rating aggregate: average, count, 5-star distribution bars, review list | M | FE:PropertyDetail |
| FR-RATE-005 | Landlord card shows rating + review count; tapping opens all reviews | M | FE:PropertyDetail |

### 3.17 DISP — Disputes (D07§12)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-DISP-001 | Open a dispute against a counterparty with type, title, description (lease-linked when applicable) | M | D07§12 |
| FR-DISP-002 | Attach evidence (images/PDFs via presigned upload, capped) | S | D07§12 |
| FR-DISP-003 | Admin-driven lifecycle: OPEN → UNDER_REVIEW → RESOLVED/DISMISSED, all actions audited | M | D07§12 |
| FR-DISP-004 | Resolution records a structured outcome enum (trust reacts deterministically) + notes | M | D07§12 |
| FR-DISP-005 | Both parties are notified of dispute progress and outcome | M | D07§12 |

### 3.18 MAINT — Maintenance tickets (D19)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-MAINT-001 | Tenant reports an issue from the lease chat: category, urgency, title, description | S | D19§1,5 |
| FR-MAINT-002 | Categories: plumbing, electrical, appliance, HVAC, security, pest, structural, internet, common-area, cleaning, other — registry-extensible | S | D19§2 |
| FR-MAINT-003 | Attach photos (≤10MB) and videos (≤100MB/60s) to a ticket, presigned, EXIF-stripped, ≤10 files | S | D19§1 |
| FR-MAINT-004 | Urgency LOW/MEDIUM/HIGH/EMERGENCY with visible response-time targets; landlord may adjust with a system line (no silent downgrades) | S | D19§2 |
| FR-MAINT-005 | EMERGENCY submissions show safety-of-life guidance (call 911) first | S | D19§2 |
| FR-MAINT-006 | Ticket state machine: REPORTED→IN_REVIEW→ASSIGNED→VISIT_SCHEDULED→IN_PROGRESS→RESOLVED→CLOSED, + REJECTED(reason)/CANCELLED/reopen≤7d | S | D19§3 |
| FR-MAINT-007 | Ticket appears as a live-status card in the conversation; transitions post system lines | S | D19§5 |
| FR-MAINT-008 | Assignment to the landlord themself or a service provider | S | D19§4 |
| FR-MAINT-009 | Visit scheduling: proposer sets a window, tenant confirms or proposes alternatives | S | D19§4 |
| FR-MAINT-010 | Visit reminders to tenant and fixer at 24h and 1h (deduped job) | S | D19§6 |
| FR-MAINT-011 | "On my way": technician taps en-route → tenant push with optional ETA; on-site and completed marks | S | D19§4 |
| FR-MAINT-012 | Tenant reports NO_SHOW after the window; recorded against the provider | S | D19§4 |
| FR-MAINT-013 | Tenant confirms resolution to close; auto-close after 7d with day-5 warning; reopen keeps history | S | D19§3,6 |
| FR-MAINT-014 | SLA nudge job pings the landlord when first-response targets lapse | S | D19§6 |
| FR-MAINT-015 | Landlord ticket board filterable by unit/status; building-level tickets roll up the unit tree | S | D19§7, D15 |
| FR-MAINT-016 | A unit's full ticket history survives relistings (attached to unit, not listing) | S | D19§1 |

### 3.19 SERV — Services marketplace (D07§13)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-SERV-001 | Admin onboards service providers (name, type, contact) | S | D07§13 |
| FR-SERV-002 | Landlord links providers/services to properties | S | D07§13 |
| FR-SERV-003 | Service request lifecycle: PENDING→ACCEPTED→SCHEDULED→COMPLETED/CANCELLED | S | D07§13 |
| FR-SERV-004 | Maintenance assignment consumes the provider registry | S | D19§4 |
| FR-SERV-005 | Completed service charged through the payment rail | C | D07§13 |

### 3.20 NOTIF — Notifications (D07§15)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-NOTIF-001 | In-app notification center with unread badge on the bell | M | FE:Discover, D07§15 |
| FR-NOTIF-002 | Event→notification mapping table covers matches, messages, payments, leases, disputes, waitlists, roommates, tickets | M | D07§15 |
| FR-NOTIF-003 | Mark notifications read (single/all) | M | D07§15 |
| FR-NOTIF-004 | Push notifications (FCM/APNs) with device-token registry | S | D07§15 |
| FR-NOTIF-005 | Email channel behind a flag; channels fail independently (in-app write never fails) | C | D07§15 |
| FR-NOTIF-006 | Per-user notification preferences | S | FE:Profile |
| FR-NOTIF-007 | Batching/rate limits on fan-out notifications (e.g., spot-opened) | S | D17§6 |

### 3.21 AI — Assistant features (D07§14) — **all deferred to national scale (B02§6)**

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-AI-001 | Property Q&A assistant thread answering from landlord-provided context | W | FE:Chats, D07§14 |
| FR-AI-002 | Listing copy assist for landlords | W | D07§14 |
| FR-AI-003 | In-chat AI insight chips (landlord responsiveness, price context) | W | FE:PropertyDetail |
| FR-AI-004 | Lease clause review with alerts | W | FE:Contracts |
| FR-AI-005 | Publish-flow price/demand suggestions | W | FE:Publish |

### 3.22 ADMIN — Back-office & operations (D07§16, B07)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-ADMIN-001 | Audit log records every significant mutation (actor, entity, diff, redacted PII); queryable by entity/actor/date | M | D07§16 |
| FR-ADMIN-002 | Identity review queue with approve/reject/revoke decisions | S | D16§6 |
| FR-ADMIN-003 | Dispute management console | M | D07§12 |
| FR-ADMIN-004 | Listing moderation: unpublish/takedown with reason (audited) | S | B07 |
| FR-ADMIN-005 | User ban/suspend with reason; feeds IDV ban semantics | M | B07, D16§5 |
| FR-ADMIN-006 | Payments reconciliation report view (daily orphans) | S | D07§9 |
| FR-ADMIN-007 | Ops metrics dashboards (business counters per B09) | S | B09 |
| FR-ADMIN-008 | Support tooling: look up user/lease/payment state for a support case | C | B07 |

### 3.23 PLAT — Platform & API requirements (D10–D12)

Technical requirements every module inherits — listed once, tested centrally.

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-PLAT-001 | Versioned REST API under `/api/v1` with OpenAPI spec | M | D12 |
| FR-PLAT-002 | Uniform error envelope with stable error codes | M | D12 |
| FR-PLAT-003 | Cursor pagination on every list endpoint | M | D12 |
| FR-PLAT-004 | Idempotency-Key support on money-moving endpoints | M | D12§4 |
| FR-PLAT-005 | Rate limiting tiers per endpoint class | M | D12§6 |
| FR-PLAT-006 | Health (liveness) + readiness endpoints, never behind auth | M | D07§17 |
| FR-PLAT-007 | Structured logs with PII redaction, metrics, traces, error tracking from day one | M | D10 |
| FR-PLAT-008 | Domain events published after commit; listeners idempotent; outbox upgrade path | M | D09 |
| FR-PLAT-009 | Scheduled jobs: advisory-locked, idempotent, observable (full catalog in D09§4) | M | D09§4 |
| FR-PLAT-010 | Soft delete with automatic filtering; GDPR-shaped export/erasure endpoints | M | D05§4 |

### 3.24 GEO — Map search & points of interest (D20)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-GEO-001 | Real interactive map in search filters (MapLibre + OSM-based tiles, pan/zoom) with visible "© OpenStreetMap contributors" attribution | M | D20§2, FE:FilterSheet |
| FR-GEO-002 | Drop or drag a pin anywhere on the map to set the search anchor | M | D20§1, FE:FilterSheet |
| FR-GEO-003 | Visible circle around the anchor, resizable by dragging its rim (or pinch); radius server-clamped | M | D20§1,5 |
| FR-GEO-004 | Feed/search accepts anchor + radius combined with all other filters; results ordered by distance and carrying `distanceM` ("a 1.2 km de TEC") | M | D20§1 |
| FR-GEO-005 | Result count updates live while the circle is adjusted; "Buscar en esta zona" applies the anchor | S | D20§5 |
| FR-GEO-006 | POI catalog imported from OSM into a platform table scoped to launch regions; weekly idempotent refresh that never clobbers curated fields | S | D20§3 |
| FR-GEO-007 | POI category registry with UNIVERSITY launch-enabled; adding a category = registry entry + import run, no schema change | S | D20§4 |
| FR-GEO-008 | POI typeahead search by name or alias ("TEC" resolves to Tecnológico de Costa Rica) | S | D20§5 |
| FR-GEO-009 | Map shows markers for the selected POI category within the viewport | S | D20§5 |
| FR-GEO-010 | Selecting a POI centers the circle on it with the category's default radius | S | D20§4–5 |
| FR-GEO-011 | Ops POI curation: verify/hide, edit aliases, add manual POIs; curated university seed pass (~15 launch campuses) | S | D20§3–4 |
| FR-GEO-012 | Save an anchor + radius (including its POI reference) as the tenant's default search location | S | D20§7 |
| FR-GEO-013 | Use device location as the anchor (with permission) | S | D20§1 |
| FR-GEO-014 | Additional POI categories (schools, hospitals, transit, supermarkets, parks, …) enabled progressively | C | D20§4 |
| FR-GEO-015 | Travel-time isochrone search ("20 min by bus from campus") | C | D20§6 |

---

## 4. Non-functional requirements (summary — normative detail in D01§4, D10–D12)

| ID | Requirement | Pri |
|---|---|---|
| NFR-001 | API availability ≥ 99.5% at Stage 1 (99.9% S2, 99.95% S3) | M |
| NFR-002 | p95 read latency < 300ms at Stage 1 | M |
| NFR-003 | Payment correctness: every money movement idempotent, ledgered, reconcilable — zero tolerance | M |
| NFR-004 | RPO ≤ 15min / RTO ≤ 4h at Stage 1; restore drills rehearsed | M |
| NFR-005 | OAuth-only auth; no stored passwords; tokens rotated | M |
| NFR-006 | PII: redacted in logs, scrubbed on erasure, identity documents never stored raw | M |
| NFR-007 | Scale envelope Stage 1: 50k users, 5k leases, 50 req/s — scaling by config, not rewrite | M |
| NFR-008 | All UI in Spanish (es-CR) at launch; codebase English; copy externalized for future locales | M |
| NFR-009 | Mobile-first responsive web app (phone frame UX per prototype); installable PWA | S |
| NFR-010 | Accessibility: touch targets ≥44px, contrast AA, screen-reader labels on interactive elements | S |
| NFR-011 | CI gate: typecheck, lint (boundary rules), unit + integration + e2e suites green before merge | M |
| NFR-012 | Every module ships with structured logs, metrics, domain events (observability = done) | M |
| NFR-013 | Migrations expand→migrate→contract; no locking migrations on hot tables | M |
| NFR-014 | Secrets in a manager, never in code/env files committed; identity HMAC key access-audited | M |
| NFR-015 | Feature flags/env toggles for every pluggable capability (cache, queue, push, gateways) | M |

---

## 5. The scope, in numbers

Functional requirements by module and priority (counts generated from the tables above):

| Module | Area | M | S | C | W | Total |
|---|---|---|---|---|---|---|
| AUTH | Authentication & sessions | 11 | 1 | 0 | 0 | **12** |
| APP | Client app shell | 6 | 1 | 2 | 0 | **9** |
| USER | Users & profiles | 6 | 4 | 0 | 0 | **10** |
| PREF | Tenant preferences | 5 | 1 | 0 | 0 | **6** |
| INV | Rentable inventory | 0 | 13 | 0 | 0 | **13** |
| PROP | Listings & publishing | 13 | 4 | 0 | 2 | **19** |
| DISC | Discovery & swipes | 10 | 1 | 1 | 0 | **12** |
| MATCH | Solicitudes & matches | 7 | 2 | 0 | 0 | **9** |
| WAIT | Waiting lists | 0 | 12 | 0 | 0 | **12** |
| ROOM | Roommates | 0 | 13 | 0 | 0 | **13** |
| CHAT | Conversations | 10 | 4 | 1 | 1 | **16** |
| LEASE | Contracts | 11 | 2 | 1 | 1 | **15** |
| PAY | Payments & collections | 17 | 5 | 3 | 0 | **25** |
| IDV | Identity verification | 1 | 8 | 1 | 0 | **10** |
| TRUST | Trust score | 4 | 1 | 0 | 0 | **5** |
| RATE | Ratings & reviews | 4 | 1 | 0 | 0 | **5** |
| DISP | Disputes | 4 | 1 | 0 | 0 | **5** |
| MAINT | Maintenance tickets | 0 | 16 | 0 | 0 | **16** |
| SERV | Services marketplace | 0 | 4 | 1 | 0 | **5** |
| NOTIF | Notifications | 3 | 3 | 1 | 0 | **7** |
| AI | Assistant features | 0 | 0 | 0 | 5 | **5** |
| ADMIN | Back-office & ops | 3 | 4 | 1 | 0 | **8** |
| PLAT | Platform & API | 10 | 0 | 0 | 0 | **10** |
| GEO | Map search & POI | 4 | 9 | 2 | 0 | **15** |
| **Total FR** | | **129** | **110** | **14** | **9** | **262** |
| NFR | Non-functional | 13 | 2 | 0 | 0 | **15** |

**Reading the numbers:**
- **129 Must requirements** are the Stage-1 launch: the core loop (auth → discover → solicitud
  → chat → contract → pay) plus trust, disputes, notifications, anchored map search, and the
  platform floor. They map to roadmap Epics 0–6 (D13).
- **110 Should requirements** are the launch-adjacent wave — dominated by the five D15–D19
  features (maintenance 16, inventory 13, roommates 13, waitlists 12, identity 8) plus the POI
  catalog (9, D20) — mapping to roadmap Epic 7, the Epic 3 geo tasks, and scattered UX polish.
- **14 Could + 9 Won't** are consciously parked (Stage-2 seams, isochrones, conditional ads,
  and deferred AI); they cost
  nothing now because their seams are already in the design.
- Rule of thumb for sizing: prototype-validated M-requirements average ~0.5–1 dev-day each
  hardened-for-production; greenfield S-requirements (docs 15–19) average ~1–2. That puts
  launch at roughly **90–120 dev-days** of focused backend+frontend work and the full ERS at
  ~**250–350** — consistent with the epic sizing already in D13.

### 5.1 Release gates (bootstrap plan, B11)

MoSCoW priorities are unchanged — "Must" still means "required for the full Stage-1 product."
This table adds *when each module is allowed to ship* under the bootstrap strategy
([business doc 11](../business/11-bootstrap-plan.md)): legal/tax triggers gate releases, not
priorities.

| Gate | Modules / scope | Why gated |
|---|---|---|
| **M1 — marketplace launch** (stores, no revenue) | AUTH, APP, USER, PREF, PROP, DISC, GEO, MATCH, CHAT, NOTIF, TRUST (display basics), RATE (read path), PLAT + FR-IDV-010 (student badge) | Zero triggers: no money, no sensitive data, no contracts |
| **M2 — formalization + first revenue** (S.R.L. + Hacienda) | PAY subset: fee/subscription billing (structure B), landlord subscription features; ADMIN basics | Requires entity, Hacienda registration, e-invoicing |
| **Trigger-gated (post-M2)** | LEASE (needs L1/L8 counsel memo), IDV cédula flow (needs Ley 8968 consent screens), PAY rent-rail (needs PSP per B12), WAIT/ROOM/MAINT/INV wave, DISP full flow | Each names its own legal/partnership prerequisite |
| **Parked** | AI (W), isochrones, ads (FR-APP-009 decision rule) | B02 §6 deferral; B11 §2 ads rule |

## 6. Change control

- Adding/changing an FR = PR against this file + the counts table, reviewed like code.
- Every FR change names the roadmap epic it lands in (or explicitly parks it as C/W).
- The [delivery process](./sdlc-plan.md) defines how FR IDs flow into tickets, branches,
  commits, and tests so this document stays the single source of scope truth.
