# Catálogo realista en SQLite

Este flujo genera un catálogo auxiliar con anuncios reales o semirrealistas en un archivo SQLite independiente. No modifica la base principal de Prisma (`data/bilo.sqlite`) ni sus tablas.

## Fuente elegida

Se utiliza [Inside Airbnb](https://insideairbnb.com/get-the-data/), que publica instantáneas descargables por HTTP (`listings.csv.gz`) para distintas ciudades bajo licencia Creative Commons Attribution 4.0. Para una demostración es una fuente más estable que extraer información directamente de portales como Encuentra24 porque:

- es accesible por HTTP sin autenticación;
- publica datos tabulares estables;
- reduce el riesgo técnico de antibot o markup cambiante;
- tiene un marco de reutilización mucho más claro para demos y prototipos.

## Qué genera

El script crea una base SQLite independiente en `data/seed/inside-airbnb.sqlite` de forma predeterminada.

Tablas:

- `source_runs`: historial de ejecuciones.
- `rental_listings`: catálogo normalizado para exploración o transformación posterior al modelo `properties`.

## Ejecución

Desde la raíz del repositorio:

```bash
python scripts/inside_airbnb_to_sqlite.py --overwrite
```

Con parámetros:

```powershell
python scripts/inside_airbnb_to_sqlite.py `
  --cities "Mexico City,Rio De Janeiro" `
  --limit 250 `
  --output data/seed/demo.sqlite `
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
- Conserva metadatos útiles en JSON para transformaciones futuras.

## Limitaciones técnicas

- Inside Airbnb modela alquiler temporal, no alquiler residencial puro. `monthly_price_estimate` es una aproximación, no una renta contractual real.
- Algunas ciudades no tienen cobertura en Inside Airbnb.
- Algunas ciudades pueden publicar instantáneas sin un campo `price` utilizable; el script descarta esas filas y el resultado puede variar entre ejecuciones.
- `city` y `neighborhood` dependen de la calidad del snapshot de origen.
- Los amenities no son completamente homogéneos entre mercados.
- El script utiliza un esquema auxiliar propio y no inserta datos en las tablas administradas por Prisma. Aunque ambas bases usan SQLite, sus estructuras y objetivos son distintos.
- La ejecución requiere acceso a internet y puede fallar si Inside Airbnb modifica su índice, retira una ciudad o bloquea temporalmente una descarga.

## Limitaciones legales

- No se debe asumir que estos datos pueden utilizarse comercialmente sin revisar la licencia, la atribución y los términos de uso.
- Si luego quieren usar Encuentra24, Zonaprop u otra fuente comercial, conviene revisar TOS, robots, rate limits y permisos de reutilización antes de automatizar scraping.
- Para demo interna y prototipado, Inside Airbnb tiene una postura mucho más clara que un portal clasificado convencional.

## Uso sugerido dentro de bilo

- preparar catálogos de demostración sin alterar la base operativa;
- analizar barrios, precios y cobertura;
- generar conjuntos curados antes de importarlos al modelo principal;
- crear posteriormente un proceso de transformación de `rental_listings` a `properties`.
