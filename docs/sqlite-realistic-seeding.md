# SQLite realistic seeding

Este flujo agrega una fuente de datos paralela al backend principal para poblar un archivo SQLite con listings reales o semirrealistas, sin tocar PostgreSQL ni el schema Prisma productivo.

## Fuente elegida

Se usa [Inside Airbnb](https://insideairbnb.com/get-the-data/), que publica snapshots descargables por HTTP (`listings.csv.gz`) para varias ciudades y bajo licencia Creative Commons Attribution 4.0. Para el objetivo de demo es mejor opción que scrappear directamente portales como Encuentra24 porque:

- es accesible por HTTP sin login;
- publica datos tabulares estables;
- reduce el riesgo técnico de antibot o markup cambiante;
- tiene un marco de reutilización mucho más claro para demos y prototipos.

## Qué genera

El script crea un SQLite independiente, por defecto en `data/seed/inside-airbnb.sqlite`.

Tablas:

- `source_runs`: historial de ejecuciones.
- `rental_listings`: catálogo normalizado listo para exploración o posterior mapeo a `properties`.

## Ejecución

Desde `C:\Users\jfzum\Downloads\BILO\bilo-backend`:

```bash
python scripts/inside_airbnb_to_sqlite.py --overwrite
```

Con parámetros:

```bash
python scripts/inside_airbnb_to_sqlite.py ^
  --cities "Mexico City,Rio De Janeiro" ^
  --limit 250 ^
  --output data/seed/demo.sqlite ^
  --overwrite
```

También queda expuesto en `package.json`:

```bash
npm run seed:sqlite:inside-airbnb
```

## Variables opcionales

```env
INSIDE_AIRBNB_CITIES=Mexico City,Rio De Janeiro
SQLITE_SEED_PATH=./data/seed/inside-airbnb.sqlite
SQLITE_SEED_LIMIT_PER_CITY=250
```

## Lógica de normalización

- Descubre automáticamente los snapshots actuales desde `https://insideairbnb.com/get-the-data/`.
- Descarga `listings.csv.gz` por ciudad.
- Filtra por `room_type` residencial utilizable para demo: `Entire home/apt` y `Private room`.
- Excluye filas sin precio o sin coordenadas.
- Convierte el precio nocturno a un `monthly_price_estimate` heurístico.
- Infiere `pets_allowed` y `parking` a partir de amenities y descripción.
- Conserva metadata útil en JSON para futuras transformaciones.

## Limitaciones técnicas

- Inside Airbnb modela alquiler temporal, no alquiler residencial puro. `monthly_price_estimate` es una aproximación, no una renta contractual real.
- Algunas ciudades no tienen cobertura en Inside Airbnb.
- Algunas ciudades publicadas no traen `price` utilizable en el snapshot actual. Por ejemplo, el snapshot de Buenos Aires resuelto el 21 de mayo de 2026 aparece en el índice pero llega con `price` vacío en las primeras filas inspeccionadas, así que no es buen default para demo automática.
- `city` y `neighborhood` dependen de la calidad del snapshot de origen.
- Los amenities no son completamente homogéneos entre mercados.
- El script usa un schema SQLite propio; no inserta directo en Prisma porque el datasource principal está fijado a PostgreSQL.

## Limitaciones legales

- No asumas que esta data sirve para producción comercial sin revisar licencia, atribución y términos de uso.
- Si luego quieren usar Encuentra24, Zonaprop u otra fuente comercial, conviene revisar TOS, robots, rate limits y permisos de reutilización antes de automatizar scraping.
- Para demo interna y prototipado, Inside Airbnb tiene una postura mucho más clara que un portal clasificado convencional.

## Uso sugerido dentro de bilo

- poblar demos sin Postgres;
- analizar barrios, precios y cobertura;
- generar CSV o JSON curados antes de importarlos al backend principal;
- crear un pipeline posterior de mapeo `rental_listings -> properties`.
