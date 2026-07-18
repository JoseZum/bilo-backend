# 15 — Rentable Inventory: The Unit Hierarchy

The prototype's `properties` table conflates two different things: the **physical thing that
exists** (a building, an apartment, a room) and the **offer to rent it** (title, price, photos,
status). That works until the first landlord who owns a building with N apartments, each with N
rooms, wants to rent rooms individually this semester and whole apartments next year. This doc
splits the two and makes the physical side a **tree of rentable units** that can grow new unit
types without schema surgery.

**Requirement (from product):** anything rentable is a *rentable unit* — the minimum today is a
room. A room lives inside an apartment or house; an apartment or house can live inside a
building; a landlord can own a building with N apartments containing N rooms. The type list must
be open-ended: we will add unit types we have not thought of yet.

## 1. The core split: units vs listings

**Context.** One table cannot serve both inventory and marketing. A room gets listed, rented,
delisted, and relisted at a new price — the room is the same room; its history (leases,
maintenance tickets, photos of the actual space) must survive across listings.

**Decision.** Two entities with distinct lifecycles:

- **`rentable_units`** — the physical inventory tree. Owned by a new **inventory module**
  (Ring 2). A unit knows its type, its parent, its physical attributes, and its capacity.
  Units are long-lived; they are almost never deleted.
- **`properties`** — refitted as the **listing**: the market-facing offer of exactly one unit
  (`unit_id` FK). It keeps title, description, price, deposit, currency, images, status,
  `availableFrom`. The module keeps its name (`properties`) to avoid churn in doc 07/13 — but
  in design conversation, "property" means "listing" from now on.

Swipes, matches, and the feed keep pointing at listings (nothing in discovery changes). A lease
references the listing **and denormalizes `unit_id`** — occupancy is a fact about the unit, not
the ad that produced it (doc 18 builds on this).

**Alternatives.**
- *Flat `properties` + `parent_property_id`* — conflations multiply: relisting a room would
  duplicate the physical row, splitting its lease/maintenance history; "building" rows would be
  fake listings that must never appear in the feed. Rejected.
- *Full separation into a standalone inventory service* — violates doc 01 ("no microservices
  at Stages 1–3"). Rejected.

**Trade-off accepted.** One more join on the property-detail path (listing → unit). Cheap, and
the feed query still runs off the listing table alone.

## 2. Hierarchy representation

**Decision.** Adjacency list with denormalized tree metadata:

```prisma
model RentableUnit {
  id         String   @id                    // UUIDv7 (doc 05 §2)
  ownerId    String   @map("owner_id")       // landlord (User)
  parentId   String?  @map("parent_id")      // null = root
  rootId     String   @map("root_id")        // self for roots; denormalized
  depth      Int      @default(0)            // root = 0; CHECK (depth <= 6)
  type       UnitType                        // enum, see §3
  name       String                          // "Apt 4B", "Room 2", "Torre Este"
  capacity   Int      @default(1)            // max concurrent occupants (doc 18)
  areaM2     Int?     @map("area_m2")
  address    String?                         // usually only on roots
  lat        Float?
  lng        Float?
  attributes Json?                           // type-specific, validated by registry (§3)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  deletedAt  DateTime?                       // soft delete (doc 05 §4)

  parent   RentableUnit?  @relation("UnitTree", fields: [parentId], references: [id])
  children RentableUnit[] @relation("UnitTree")

  @@index([ownerId, type])
  @@index([parentId])
  @@index([rootId])
  @@map("rentable_units")
}
```

Subtree reads use a recursive CTE in `inventory.queries.ts` (raw SQL, same pattern as geo in
doc 05 §6); `rootId` answers "everything in this building" without recursion; `depth` caps the
tree and makes breadcrumbs cheap. `rootId`/`depth` are recomputed inside the transaction on
every create/move — app code is the writer, a `CHECK (parent_id IS NULL OR parent_id <> id)`
plus the depth cap bound the damage of a bug.

**Alternatives.**
- *Closure table* — O(depth) rows per node per move; pays off for deep/wide trees and frequent
  arbitrary-depth queries. Our trees are ≤ 6 deep and read-mostly. Not worth the write cost.
- *Materialized path / Postgres `ltree`* — attractive, but Postgres-specific operators leak
  into every query and Prisma support is raw-SQL-only. **Revisit when** subtree queries show up
  in the slow-query log (Stage 3), as a projection column, not a rewrite.
- *Nested sets* — moves rewrite half the table. Rejected outright.

## 3. The type registry — the extensibility seam

**Context.** "Add a lot of types, including ones nobody has thought of yet" must not mean
"redesign the schema." It must mean: one enum value + one registry entry.

**Decision.** `UnitType` is a real DB enum (doc 05 §1 rule) for integrity; all *behavior* per
type lives in a code registry the inventory service consults on create/move/list:

```ts
// inventory/unit-type-registry.ts — normative shape
export interface UnitTypeSpec {
  type: UnitType;
  kind: 'GROUPING' | 'DWELLING' | 'SUB_UNIT' | 'AUXILIARY';
  allowedParents: UnitType[] | 'ANY' | 'NONE_OR_ANY_GROUPING';
  listable: boolean;      // can a listing point at it?
  shareable: boolean;     // may capacity exceed 1? (doc 18)
  attributesSchema: ZodSchema; // validates the `attributes` JSONB
}
```

Initial catalog:

| Type | Kind | Allowed parents | Listable | Shareable | Notes |
|---|---|---|---|---|---|
| `COMPLEX` | GROUPING | none | no | — | gated community, multi-building campus |
| `BUILDING` | GROUPING | `COMPLEX` or none | no | — | |
| `FLOOR` | GROUPING | `BUILDING` | no | — | optional layer; big buildings only |
| `HOUSE` | DWELLING | `COMPLEX` or none | yes | yes | |
| `APARTMENT` | DWELLING | `BUILDING`, `FLOOR`, `COMPLEX`, none | yes | yes | |
| `STUDIO` | DWELLING | same as APARTMENT | yes | no | capacity 1–2, no sub-units |
| `ROOM` | SUB_UNIT | `HOUSE`, `APARTMENT` | yes | yes | the student-niche workhorse |
| `BED` | SUB_UNIT | `ROOM` | yes | no | hostel/co-living style |
| `PARKING_SPOT` | AUXILIARY | any GROUPING or DWELLING, or none | yes | no | |
| `STORAGE_UNIT` | AUXILIARY | any GROUPING or DWELLING, or none | yes | no | |
| `COMMERCIAL_UNIT` | AUXILIARY | `BUILDING`, `FLOOR`, `COMPLEX`, none | yes | no | ground-floor local |

Types we can already see coming and that this registry absorbs without schema change:
co-living pods, cabins/glamping, office desks (`SUB_UNIT` of `COMMERCIAL_UNIT`), event spaces,
rooftops, and — per doc 01's "don't hard-code housing" — non-spatial rentables (equipment,
vehicles) as parentless `AUXILIARY` types whose `attributes` schema carries the specifics.

**Rules.**
- Adding a type = enum migration + registry entry + tests. Nothing else. A PR that adds a type
  and touches any other inventory code needs an ADR.
- The registry is the **only** place that knows containment rules. Service code asks
  `registry.canContain(parent.type, child.type)`; it never switches on `UnitType` inline
  (lint-banned, same mechanism as doc 04's boundary rules).
- `attributes` JSONB is validated against `attributesSchema` on write — flexible storage,
  strict at the door (same philosophy as doc 07 §4's metadata seam).

## 4. Occupancy semantics: exclusive vs shared

A lease on a unit is either **exclusive** (whole unit — the default) or **per-slot** (one of
`capacity` places in a shareable unit; doc 18). Two invariants keep the tree honest:

1. **No ancestor/descendant double-rent.** A unit cannot get a new active lease if any
   *ancestor* has an active exclusive lease (the whole apartment is already rented — its rooms
   are not yours to rent), nor an exclusive lease if any *descendant* has one (you cannot rent
   out the whole apartment while Room 2 is under contract).
2. **Slots never oversell.** Active per-slot leases on a unit ≤ `capacity`.

Both are checked in the lease-activation transaction (doc 07 §8) via the inventory facade
(`inventory.assertLeasable(tx, unitId, mode)`) — a sanctioned same-tx cross-module call, added
to the short list in doc 07's closing note. The check runs `SELECT ... FOR UPDATE` on the
unit's ancestor path so two concurrent activations serialize.

## 5. Availability is derived, never stored

A unit is *available* iff: its type is `listable` · it has no blocking lease per §4 · (shared
mode) free slots > 0. Listings expose availability; the inventory module computes it. There is
no `is_available` column — a stored flag would need a sweep and can contradict the lease table;
deriving cannot (same reasoning as `OVERDUE` in doc 07 §9).

## 6. Ownership & management

`ownerId` lives on every unit and **must equal the parent's** — enforced on create/move. One
tree, one owner; co-ownership and property managers are a `unit_roles(unit_id, user_id, role)`
table pre-named for Stage 2 (**revisit when** the first property-management company signs up).
Transferring a building = transferring the subtree in one transaction (admin endpoint,
audited).

## 7. API (inventory module, Ring 2)

- `POST /units { type, parentId?, name, capacity?, attributes?, address?, ... }` — registry-validated
- `GET /units/mine?rootsOnly=true` · `GET /units/:id` (with children summary + active-lease flags)
- `GET /units/:id/tree` — full subtree (recursive CTE, depth-capped)
- `PATCH /units/:id` · `POST /units/:id/move { newParentId }` (registry + ownership checks)
- `DELETE /units/:id` — soft; refused while the subtree has active leases or listings

**Emits.** `unit.created`, `unit.updated`, `unit.archived`.

## 8. Migration from the prototype (expand → migrate → contract, doc 05 §8)

1. **Expand:** create `rentable_units`; add nullable `properties.unit_id`.
2. **Migrate:** backfill job — every existing property row spawns one unit (`type` from
   `property.type`, physical columns copied), links it. New listing creation requires a unit
   (create-inline UX for the single-unit landlord: one call creates unit + listing).
3. **Contract (one release later):** `unit_id` NOT NULL; physical columns
   (`bedrooms`, `bathrooms`, `areaM2`, `address`, `lat/lng`, `furnished`, `petsAllowed`,
   `parking`) become reads from the unit; property columns dropped in the release after that.
   Geo/PostGIS (doc 05 §6) moves to `rentable_units` — the feed joins listing → unit for
   distance.

## 9. Ripples through existing modules

- **properties (doc 07 §4):** creation takes `unitId`; one unit may have at most one
  **active** listing (`UNIQUE (unit_id) WHERE status IN ('ACTIVE','PAUSED')` partial index).
- **leases (doc 07 §8):** gains `unit_id` + `occupancyMode` (`EXCLUSIVE | SLOT`); activation
  calls `inventory.assertLeasable` (§4).
- **feed (doc 07 §5):** unchanged contract; physical filters read unit columns after contract
  step.
- **maintenance (doc 19):** tickets attach to units, so a building-level issue (elevator,
  water) rolls up correctly.
- **waiting lists (doc 17) & roommates (doc 18):** both key off listings whose units carry
  capacity.
