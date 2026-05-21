#!/usr/bin/env python3
"""
Build a lightweight SQLite catalog of realistic rental listings from Inside Airbnb.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import io
import json
import os
import re
import sqlite3
import sys
import textwrap
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterable
from urllib.parse import quote, urlparse, urlsplit, urlunsplit


INSIDE_AIRBNB_INDEX_URL = "https://insideairbnb.com/get-the-data/"
DEFAULT_CITIES = ["Mexico City", "Rio De Janeiro"]
DEFAULT_OUTPUT = Path("data/seed/inside-airbnb.sqlite")
USER_AGENT = "bilo-backend/inside-airbnb-seed (+https://insideairbnb.com/get-the-data/)"
LISTING_URL_RE = re.compile(
    r"https?://data\.insideairbnb\.com/[^\"'\s<>]+/data/listings\.csv\.gz",
    re.IGNORECASE,
)
COUNTRY_CURRENCY = {
    "argentina": "ARS",
    "brazil": "BRL",
    "canada": "CAD",
    "chile": "CLP",
    "colombia": "COP",
    "costa-rica": "CRC",
    "mexico": "MXN",
    "peru": "PEN",
    "spain": "EUR",
    "united-states": "USD",
    "uruguay": "UYU",
}


@dataclass(frozen=True)
class MarketSnapshot:
    country_slug: str
    region_slug: str
    city_slug: str
    snapshot_date: str
    download_url: str

    @property
    def display_city(self) -> str:
        return slug_to_title(self.city_slug)

    @property
    def display_country(self) -> str:
        return slug_to_title(self.country_slug)

    @property
    def currency_code(self) -> str:
        return COUNTRY_CURRENCY.get(self.country_slug, "USD")


def slug_to_title(value: str) -> str:
    words = value.replace("-", " ").strip().split()
    return " ".join(word.capitalize() for word in words)


def normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def fetch_bytes(url: str) -> bytes:
    split = urlsplit(url)
    safe_url = urlunsplit(
        (
            split.scheme,
            split.netloc,
            quote(split.path, safe="/"),
            split.query,
            split.fragment,
        )
    )
    request = urllib.request.Request(safe_url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def fetch_text(url: str) -> str:
    return fetch_bytes(url).decode("utf-8", errors="replace")


def discover_markets(index_url: str) -> dict[str, MarketSnapshot]:
    html = fetch_text(index_url)
    discovered: dict[str, MarketSnapshot] = {}

    for raw_url in sorted(set(LISTING_URL_RE.findall(html))):
        parsed = urlparse(raw_url)
        parts = parsed.path.strip("/").split("/")
        if len(parts) < 6:
            continue
        snapshot = MarketSnapshot(
            country_slug=parts[0],
            region_slug=parts[1],
            city_slug=parts[2],
            snapshot_date=parts[3],
            download_url=raw_url,
        )
        discovered[normalize_key(snapshot.display_city)] = snapshot

    return discovered


def parse_boolish(value: str | None) -> int | None:
    if value is None:
        return None
    cleaned = str(value).strip().lower()
    if cleaned in {"t", "true", "yes", "1"}:
        return 1
    if cleaned in {"f", "false", "no", "0"}:
        return 0
    return None


def parse_int(value: str | None) -> int | None:
    if value is None:
        return None
    cleaned = re.sub(r"[^\d\-]", "", str(value).strip())
    if not cleaned:
        return None
    try:
        return int(cleaned)
    except ValueError:
        return None


def parse_price(value: str | None) -> int | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    if not cleaned:
        return None

    cleaned = re.sub(r"[^\d,.\-]", "", cleaned)
    if not cleaned:
        return None

    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(",", "")
    elif "," in cleaned and "." not in cleaned:
        cleaned = cleaned.replace(",", ".")

    try:
        return int(round(float(cleaned)))
    except ValueError:
        return None


def parse_float(value: str | None) -> float | None:
    if value is None:
        return None
    cleaned = str(value).strip().replace(",", ".")
    if not cleaned:
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", cleaned)
    if not match:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


def parse_amenities(raw_value: str | None) -> list[str]:
    if not raw_value:
        return []

    stripped = raw_value.strip()
    if stripped.startswith("{") and stripped.endswith("}"):
        inner = stripped[1:-1]
        reader = csv.reader([inner], skipinitialspace=True)
        return [item.strip() for item in next(reader, []) if item.strip()]

    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
    except json.JSONDecodeError:
        pass

    return [item.strip() for item in stripped.split(",") if item.strip()]


def infer_pets_allowed(amenities: Iterable[str], description: str) -> int | None:
    haystack = " ".join(list(amenities) + [description]).lower()
    if "pets allowed" in haystack or "pet friendly" in haystack or "mascota" in haystack:
        return 1
    if "no pets" in haystack:
        return 0
    return None


def infer_parking(amenities: Iterable[str], description: str) -> int | None:
    haystack = " ".join(list(amenities) + [description]).lower()
    if any(term in haystack for term in ("parking", "garage", "carport", "free driveway")):
        return 1
    return None


def estimate_monthly_price(nightly_price: int | None, minimum_nights: int | None, room_type: str) -> int | None:
    if nightly_price is None or nightly_price <= 0:
        return None

    min_stay = minimum_nights or 1
    if min_stay >= 28:
        factor = 0.72
    elif min_stay >= 14:
        factor = 0.80
    elif min_stay >= 7:
        factor = 0.88
    else:
        factor = 0.92

    if room_type.lower() == "private room":
        factor *= 0.85

    return int(round(nightly_price * 30 * factor))


def ensure_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS source_runs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_name TEXT NOT NULL,
          source_url TEXT NOT NULL,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          status TEXT NOT NULL,
          city_count INTEGER NOT NULL DEFAULT 0,
          listing_count INTEGER NOT NULL DEFAULT 0,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS rental_listings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_name TEXT NOT NULL,
          source_market TEXT NOT NULL,
          source_listing_id TEXT NOT NULL,
          source_url TEXT,
          snapshot_date TEXT,
          title TEXT NOT NULL,
          description TEXT,
          city TEXT,
          country TEXT,
          neighborhood TEXT,
          latitude REAL,
          longitude REAL,
          property_type TEXT,
          room_type TEXT,
          accommodates INTEGER,
          bedrooms REAL,
          bathrooms REAL,
          beds REAL,
          nightly_price INTEGER,
          monthly_price_estimate INTEGER,
          currency TEXT NOT NULL DEFAULT 'USD',
          minimum_nights INTEGER,
          maximum_nights INTEGER,
          furnished INTEGER NOT NULL DEFAULT 1,
          pets_allowed INTEGER,
          parking INTEGER,
          host_name TEXT,
          host_is_superhost INTEGER,
          host_identity_verified INTEGER,
          review_score REAL,
          review_count INTEGER,
          image_url TEXT,
          amenities_json TEXT,
          metadata_json TEXT,
          ingested_at TEXT NOT NULL,
          UNIQUE(source_name, source_listing_id)
        );

        CREATE INDEX IF NOT EXISTS idx_rental_listings_market
          ON rental_listings(source_market);
        CREATE INDEX IF NOT EXISTS idx_rental_listings_city
          ON rental_listings(city);
        CREATE INDEX IF NOT EXISTS idx_rental_listings_neighborhood
          ON rental_listings(neighborhood);
        CREATE INDEX IF NOT EXISTS idx_rental_listings_monthly_price
          ON rental_listings(monthly_price_estimate);
        """
    )


def create_run(connection: sqlite3.Connection, city_count: int) -> int:
    cursor = connection.execute(
        """
        INSERT INTO source_runs (source_name, source_url, started_at, status, city_count)
        VALUES (?, ?, ?, ?, ?)
        """,
        ("inside_airbnb", INSIDE_AIRBNB_INDEX_URL, datetime.now(UTC).isoformat(), "running", city_count),
    )
    return int(cursor.lastrowid)


def finalize_run(connection: sqlite3.Connection, run_id: int, listing_count: int, status: str, notes: str = "") -> None:
    connection.execute(
        """
        UPDATE source_runs
        SET completed_at = ?, listing_count = ?, status = ?, notes = ?
        WHERE id = ?
        """,
        (datetime.now(UTC).isoformat(), listing_count, status, notes, run_id),
    )


def should_keep_row(row: dict[str, str]) -> bool:
    room_type = (row.get("room_type") or "").strip().lower()
    if room_type not in {"entire home/apt", "private room"}:
        return False

    nightly_price = parse_price(row.get("price"))
    latitude = parse_float(row.get("latitude"))
    longitude = parse_float(row.get("longitude"))
    if nightly_price is None or nightly_price <= 0:
        return False
    if latitude is None or longitude is None:
        return False
    return True


def ingest_market(connection: sqlite3.Connection, snapshot: MarketSnapshot, limit: int | None) -> int:
    gz_bytes = fetch_bytes(snapshot.download_url)
    text_stream = io.TextIOWrapper(gzip.GzipFile(fileobj=io.BytesIO(gz_bytes)), encoding="utf-8", errors="replace")
    reader = csv.DictReader(text_stream)

    ingested = 0
    now = datetime.now(UTC).isoformat()

    for row in reader:
        if not should_keep_row(row):
            continue

        listing_id = str(row.get("id") or "").strip()
        if not listing_id:
            continue

        amenities = parse_amenities(row.get("amenities"))
        description = (row.get("description") or "").strip()
        nightly_price = parse_price(row.get("price"))
        minimum_nights = parse_int(row.get("minimum_nights"))
        maximum_nights = parse_int(row.get("maximum_nights"))
        metadata = {
            "source": "inside_airbnb",
            "snapshot_date": snapshot.snapshot_date,
            "host_id": row.get("host_id"),
            "host_url": row.get("host_url"),
            "availability_365": parse_int(row.get("availability_365")),
            "number_of_reviews_ltm": parse_int(row.get("number_of_reviews_ltm")),
            "instant_bookable": parse_boolish(row.get("instant_bookable")),
            "license": row.get("license"),
        }

        connection.execute(
            """
            INSERT INTO rental_listings (
              source_name, source_market, source_listing_id, source_url, snapshot_date,
              title, description, city, country, neighborhood, latitude, longitude,
              property_type, room_type, accommodates, bedrooms, bathrooms, beds,
              nightly_price, monthly_price_estimate, currency, minimum_nights, maximum_nights,
              furnished, pets_allowed, parking, host_name, host_is_superhost,
              host_identity_verified, review_score, review_count, image_url,
              amenities_json, metadata_json, ingested_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(source_name, source_listing_id) DO UPDATE SET
              source_market = excluded.source_market,
              source_url = excluded.source_url,
              snapshot_date = excluded.snapshot_date,
              title = excluded.title,
              description = excluded.description,
              city = excluded.city,
              country = excluded.country,
              neighborhood = excluded.neighborhood,
              latitude = excluded.latitude,
              longitude = excluded.longitude,
              property_type = excluded.property_type,
              room_type = excluded.room_type,
              accommodates = excluded.accommodates,
              bedrooms = excluded.bedrooms,
              bathrooms = excluded.bathrooms,
              beds = excluded.beds,
              nightly_price = excluded.nightly_price,
              monthly_price_estimate = excluded.monthly_price_estimate,
              currency = excluded.currency,
              minimum_nights = excluded.minimum_nights,
              maximum_nights = excluded.maximum_nights,
              furnished = excluded.furnished,
              pets_allowed = excluded.pets_allowed,
              parking = excluded.parking,
              host_name = excluded.host_name,
              host_is_superhost = excluded.host_is_superhost,
              host_identity_verified = excluded.host_identity_verified,
              review_score = excluded.review_score,
              review_count = excluded.review_count,
              image_url = excluded.image_url,
              amenities_json = excluded.amenities_json,
              metadata_json = excluded.metadata_json,
              ingested_at = excluded.ingested_at
            """,
            (
                "inside_airbnb",
                snapshot.display_city,
                listing_id,
                (row.get("listing_url") or "").strip() or snapshot.download_url,
                snapshot.snapshot_date,
                (row.get("name") or f"{snapshot.display_city} listing {listing_id}").strip(),
                description or (row.get("neighborhood_overview") or "").strip(),
                (row.get("neighbourhood_group_cleansed") or row.get("city") or snapshot.display_city).strip(),
                snapshot.display_country,
                (row.get("neighbourhood_cleansed") or row.get("neighborhood") or "").strip() or None,
                parse_float(row.get("latitude")),
                parse_float(row.get("longitude")),
                (row.get("property_type") or "").strip() or None,
                (row.get("room_type") or "").strip() or None,
                parse_int(row.get("accommodates")),
                parse_float(row.get("bedrooms")),
                parse_float(row.get("bathrooms")) or parse_float(row.get("bathrooms_text")),
                parse_float(row.get("beds")),
                nightly_price,
                estimate_monthly_price(nightly_price, minimum_nights, row.get("room_type") or ""),
                snapshot.currency_code,
                minimum_nights,
                maximum_nights,
                1,
                infer_pets_allowed(amenities, description),
                infer_parking(amenities, description),
                (row.get("host_name") or "").strip() or None,
                parse_boolish(row.get("host_is_superhost")),
                parse_boolish(row.get("host_identity_verified")),
                parse_float(row.get("review_scores_rating")),
                parse_int(row.get("number_of_reviews")),
                (row.get("picture_url") or "").strip() or None,
                json.dumps(amenities, ensure_ascii=False),
                json.dumps(metadata, ensure_ascii=False),
                now,
            ),
        )

        ingested += 1
        if limit is not None and ingested >= limit:
            break

    return ingested


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download public Inside Airbnb listings and persist a normalized subset into SQLite.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent(
            """
            Examples:
              python scripts/inside_airbnb_to_sqlite.py
              python scripts/inside_airbnb_to_sqlite.py --cities "Buenos Aires,Mexico City" --limit 250
              python scripts/inside_airbnb_to_sqlite.py --output data/seed/demo.sqlite --overwrite
            """
        ),
    )
    parser.add_argument(
        "--cities",
        default=os.getenv("INSIDE_AIRBNB_CITIES", ",".join(DEFAULT_CITIES)),
        help="Comma-separated market names. Default: Mexico City,Rio De Janeiro",
    )
    parser.add_argument(
        "--output",
        default=os.getenv("SQLITE_SEED_PATH", str(DEFAULT_OUTPUT)),
        help=f"SQLite output path. Default: {DEFAULT_OUTPUT}",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=parse_int(os.getenv("SQLITE_SEED_LIMIT_PER_CITY")) or 250,
        help="Maximum listings per city after filtering. Default: 250",
    )
    parser.add_argument("--overwrite", action="store_true", help="Delete the target SQLite file before ingestion.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    selected_cities = [item.strip() for item in args.cities.split(",") if item.strip()]
    if not selected_cities:
        print("No cities selected.", file=sys.stderr)
        return 1

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if args.overwrite and output_path.exists():
        output_path.unlink()

    markets = discover_markets(INSIDE_AIRBNB_INDEX_URL)
    requested: list[MarketSnapshot] = []
    missing: list[str] = []
    for city in selected_cities:
        snapshot = markets.get(normalize_key(city))
        if snapshot:
            requested.append(snapshot)
        else:
            missing.append(city)

    if missing:
        available_preview = ", ".join(sorted(snapshot.display_city for snapshot in markets.values())[:15])
        print(f"Markets not found: {', '.join(missing)}", file=sys.stderr)
        print(f"Available sample: {available_preview}", file=sys.stderr)
        return 1

    connection = sqlite3.connect(output_path)
    run_id: int | None = None
    try:
        ensure_schema(connection)
        run_id = create_run(connection, len(requested))
        total = 0
        for snapshot in requested:
            print(f"Downloading {snapshot.display_city} ({snapshot.snapshot_date})")
            inserted = ingest_market(connection, snapshot, args.limit)
            connection.commit()
            total += inserted
            print(f"  inserted {inserted} listings")

        finalize_run(connection, run_id, total, "completed")
        connection.commit()
        print(f"SQLite catalog ready at: {output_path.resolve()}")
        print(f"Total listings ingested: {total}")
        return 0
    except Exception as exc:  # noqa: BLE001
        connection.rollback()
        if run_id is not None:
            try:
                finalize_run(connection, run_id, 0, "failed", f"{type(exc).__name__}: {exc}")
                connection.commit()
            except Exception:
                pass
        print(f"{type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    finally:
        connection.close()


if __name__ == "__main__":
    raise SystemExit(main())
