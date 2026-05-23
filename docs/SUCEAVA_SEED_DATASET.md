# Suceava Route And Street Seed Dataset

## Purpose

Task 19 defines the controlled Suceava dataset used by Traffiq v3.

The app remains Suceava-only. The seed data now uses Suceava streets and route corridors instead of generic demo names such as `Unirii`, `Dorobanti`, `Victoriei`, and `Romana`.

This dataset supports:

- local route analytics
- top congested street reports
- traffic alert examples
- ride history examples
- route planner manual street lookup

## Source Files

The current seed files are:

- `data/raw/traffic_raw.csv`
- `data/raw/route_reference.csv`
- `data/raw/events_raw.csv`
- `data/raw/rides_history_raw.csv`

These files are intentionally small and controlled. They are demo seed data for a portfolio project, not official live traffic feeds.

## Street Catalog

The v3 seed street catalog is:

| Street or corridor | Used for |
| --- | --- |
| `Calea Unirii` | traffic observations, route reference, route planner lookup |
| `Bulevardul George Enescu` | traffic observations, route reference, route planner lookup |
| `Strada Universitatii` | traffic observations, route reference, route planner lookup |
| `Strada Stefan cel Mare` | traffic observations, route reference, route planner lookup |
| `Calea Burdujeni` | traffic observations, route reference, route planner lookup |
| `Strada Traian Vuia` | traffic observations, route reference, route planner lookup |
| `Strada Ana Ipatescu` | traffic observations, route reference, route planner lookup |
| `Strada Mitropoliei` | traffic observations, route reference, route planner lookup |
| `Strada Marasesti` | traffic observations, route reference, route planner lookup |

All names are stored without Romanian diacritics to keep CSV parsing and terminal output simple on Windows.

## Route Reference Dataset

The seed route references are:

| Route ID | Route |
| --- | --- |
| 1 | `Calea Unirii to Bulevardul George Enescu` |
| 2 | `Strada Universitatii to Strada Stefan cel Mare` |
| 3 | `Calea Burdujeni to Strada Traian Vuia` |
| 4 | `Strada Ana Ipatescu to Strada Mitropoliei` |
| 5 | `Bulevardul George Enescu to Calea Unirii` |
| 6 | `Strada Marasesti to Strada Universitatii` |

These routes are not turn-by-turn navigation routes. They are controlled analytical corridors used by the Bronze/Silver/Gold pipeline.

## Traffic Observations

`traffic_raw.csv` contains timestamped speed observations for the Suceava street catalog.

The current sample covers:

- morning traffic
- midday traffic
- clear, cloudy, rain, and fog weather labels
- repeated observations for core corridors
- one duplicate row kept intentionally so the transform layer can still demonstrate deduplication

## Events Dataset

`events_raw.csv` contains Suceava-specific traffic alert examples:

- accident
- roadwork
- hazard
- police checkpoint

Severity values remain:

- `low`
- `medium`
- `high`

## Ride History Dataset

`rides_history_raw.csv` mirrors the same Suceava route references.

In v3, this is still demo ride history. Later tasks will make ride history user-specific and authenticated.

## Routing Catalog Alignment

`src/api/routing_service.py` now includes representative Suceava coordinates and aliases for the seed streets.

This lets the route planner resolve manually typed Suceava street names, not only the existing POI suggestions.

The coordinates are representative demo points for the selected streets. They are good enough for a portfolio demo and OSRM route previews, but they are not a substitute for a full GIS street-segment model.

## What This Does Not Claim

This dataset does not claim:

- official city traffic coverage
- Waze-like real-time traffic
- live incident reporting
- full Suceava street network coverage
- user-generated traffic reports

It is a realistic, controlled seed dataset for a Suceava traffic intelligence proof-of-concept.

## Validation

Run:

```powershell
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe tests\unit\test_extract_traffic_csv.py
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe tests\unit\test_transform_traffic_data.py
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe tests\unit\test_routing_service.py
```

Expected result:

- traffic CSV extraction still works
- traffic transform still cleans and deduplicates records
- routing service still resolves existing POIs
- routing service also resolves the new Suceava street aliases
