# 20 — Geo Search & Points of Interest

The prototype's filter sheet already sketches the interaction: a map, a draggable pin, a
radius. Production generalizes it into the real thing: **pick any anchor on a real map — a
point of interest (universities first: TEC, UCR, UNA…), or any arbitrary pin — stretch a
visible circle around it, and search listings inside that circle** combined with the normal
filters. This doc decides where the map comes from, where the POI data comes from (we do not
build a worldwide catalog — OSM has one), and how anchored search plugs into the existing
feed.

New **geo module** (Ring 2, read-only for the rest of the domain). PostGIS mechanics are
already specified in doc 05 §6; this doc adds the anchor model and the POI catalog on top.

## 1. The anchor model

**Decision.** A search anchor is nothing but `(lat, lng, radiusM)` plus an optional
`poiId` for provenance ("anchored on TEC" vs "anchored on a dropped pin"). Sources of an
anchor, all producing the same shape:

1. a **POI** the user picked (center = POI location, default radius per category),
2. an **arbitrary pin** dropped/dragged anywhere on the map,
3. the **device location** (with permission),
4. a **named zone** (the prototype's Escazú/San Pedro chips — kept as sugar that snaps to a
   zone centroid + preset radius).

The feed/search API (doc 07 §5) gains three optional parameters — `anchorLat`, `anchorLng`,
`radiusM` (server-clamped, e.g. 250 m–15 km) — feeding the existing `ST_DWithin` filter and
`ST_Distance` ordering from doc 05 §6. **The anchor is a filter input, not state**: nothing
about it is stored on the request path. Saved anchors live in preferences
(`user_preferences.preferredLat/Lng` already exist; add `preferredRadiusM` and nullable
`preferredPoiId`), so "my university" can be the standing default of the feed.

Results carry `distanceM` from the anchor so the UI can say "a 1.2 km de TEC" on each card —
computed in the same query, never persisted.

## 2. Map rendering (client decision, recorded here)

**Decision.** MapLibre GL JS with OSM-based vector tiles from a configurable tile endpoint
(OpenFreeMap/Protomaps-class free hosting to start; env-swappable to MapTiler or self-hosted
Protomaps if volume demands). The circle is a real geodesic circle layer with a drag-to-resize
handle (plus pinch), not a screenshot trick.

**Alternatives.** Google Maps SDK — best data, but per-load pricing, ToS restrictions on
storing/deriving data, and lock-in; rejected while OSM coverage of the GAM is good (it is).
Leaflet + raster tiles — fine fallback, worse gesture feel for the circle interaction.
**Revisit when** tile traffic outgrows free tiers (self-host Protomaps: one static file on
object storage) or map quality complaints appear in a new launch city.

**License rule (non-negotiable):** OSM data and OSM-derived tiles require visible
"© OpenStreetMap contributors" attribution on the map UI, and our imported POI table is an
ODbL derivative — attribution ships with the feature from day one.

## 3. The POI catalog — imported, not proxied

**Context.** We need "find Tecnológico de Costa Rica" to work instantly and reliably in the
filter sheet. Live calls to Overpass/Nominatim on the hot path would put a rate-limited,
best-effort community API inside our p95.

**Decision.** **Import into our own table, serve from Postgres.** A scheduled job
(`poi.refresh`, doc 09 §4) queries Overpass for each *enabled category × launch region*
(Costa Rica first), and upserts by OSM id. Search and map markers read only our table.

```prisma
model PointOfInterest {
  id          String   @id                    // UUIDv7
  osmType     String   @map("osm_type")       // node | way | relation
  osmId       BigInt   @map("osm_id")
  category    PoiCategory                     // §4 registry
  name        String
  aliases     String[]                        // "TEC", "Tecnológico de Costa Rica", "ITCR"
  lat         Float
  lng         Float                           // + geography(Point) column, GiST (doc 05 §6)
  city        String?
  countryCode String   @db.Char(2) @map("country_code")
  verified    Boolean  @default(false)        // curated by ops (§4)
  hidden      Boolean  @default(false)        // ops kill-switch for junk data
  source      String   @default("osm")        // osm | manual
  metadata    Json?                           // raw useful tags (website, operator)
  refreshedAt DateTime @map("refreshed_at")

  @@unique([osmType, osmId])
  @@index([category, countryCode])
  @@map("points_of_interest")
}
```

Refresh is upsert-only and **never clobbers curated fields** (`aliases`, `verified`,
`hidden`); a POI vanished from OSM is flagged, not deleted (ops decides). Manual POIs
(`source=manual`) exist for the inevitable campus OSM doesn't map well.

**Alternatives.** Live Overpass/Nominatim — rejected for the hot path (kept as the *import*
mechanism, where rate limits don't hurt). Google Places — good data we are contractually not
allowed to store; per-call cost forever; rejected. Building our own worldwide catalog —
obviously not; we import the world's crowdsourced one, scoped to where we operate.

## 4. The category registry — universities first, anything later

Same pattern as unit types (doc 15 §3) and ticket categories (doc 19 §2): `PoiCategory` enum
+ a code registry that owns behavior. Enabling a new category = enum value + registry entry +
next `poi.refresh` run. **No schema or query changes.**

```ts
// geo/poi-category-registry.ts — normative shape
interface PoiCategorySpec {
  category: PoiCategory;
  osmSelectors: string[];   // Overpass tag queries, e.g. ['amenity=university']
  defaultRadiusM: number;   // circle preset when anchoring here
  icon: string;
  launchEnabled: boolean;
}
```

Initial catalog: `UNIVERSITY` (launch-enabled; `amenity=university` + `amenity=college`,
default radius 3 km — the student thesis, B01) · pre-registered but off until product asks:
`SCHOOL`, `HOSPITAL`, `TRANSIT_STATION`, `SUPERMARKET`, `PARK`, `GYM`, `BUS_TERMINAL`,
`SHOPPING_MALL`. Universities additionally get a **curated seed pass**: ops verifies the ~15
launch-relevant campuses (TEC Cartago/San José, UCR, UNA, ULatina, ULACIT, Veritas…) and adds
the aliases students actually type ("TEC", "ITCR").

## 5. API & UX contract

- `GET /geo/poi/categories` — enabled categories with icons/presets
- `GET /geo/poi?category=&q=&near=&bbox=&cursor=` — typeahead search by name/alias
  (trigram index, doc 05 §6) and/or markers-in-viewport for the map
- `GET /geo/poi/:id`
- Feed: `GET /recommendations/feed?...&anchorLat=&anchorLng=&radiusM=` (doc 07 §5 amendment);
  same params on any future search endpoint — the anchor contract is shared
- Admin: `PATCH /geo/poi/:id { aliases, verified, hidden }`, `POST /geo/poi` (manual)

UX contract the frontend implements (source for the ERS GEO requirements): category chips on
the map (🎓 Universidades) → markers appear → tap a marker or search "TEC" → circle centers
there at the category preset → drag the rim to resize → result count updates live → "Buscar
en esta zona" applies anchor + the ordinary filters (budget, type, pets…). Dropping a pin on
empty map does exactly the same without a POI. Distance-to-anchor renders on result cards.

## 6. What this module refuses to do

No routing/directions, no travel-time isochrones (Stage-3 candy; **revisit when** "20 min by
bus from campus" beats radius in user interviews), no reverse-geocoded addresses as a service
to other modules (properties keep their own address fields), and no storing anchors on the
request path (§1). The geo module stays read-only reference data + query helpers.

## 7. Ripples

- **preferences (doc 07 §3):** + `preferredRadiusM`, `preferredPoiId` (nullable FK).
- **recommendations/feed (doc 07 §5):** anchor params; distance term in scoring already
  exists (`w2·distance_decay`) — anchored searches simply sharpen it.
- **properties (doc 07 §4 / doc 15):** untouched — geo reads unit/listing coordinates.
- **jobs (doc 09 §4):** `poi.refresh` weekly per region; upsert idempotent by `(osmType,
  osmId)`.
- **frontend:** FilterSheet's stylized map is replaced by the real map component; the
  draggable pin + radius interaction it prototyped is the spec (FE:FilterSheet).
