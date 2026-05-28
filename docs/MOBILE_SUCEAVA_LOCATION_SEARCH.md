# Mobile Suceava Location Search

## Purpose

The route planner now behaves closer to a production traffic app:

- the full list of destinations is not shown when the sheet opens
- suggestions appear only after the user starts typing
- search works through aliases, not only exact names
- the route preview can resolve the same destinations in mobile and backend

## Scope

This is a local, no-cost location catalog.

It does not use:

- Google Places API
- TomTom Search API
- paid autocomplete
- live geocoding from the phone

This keeps the feature stable for APK demos and avoids new cost/security
surface area.

## Mobile Catalog

Catalog file:

```text
mobile/src/data/suceavaLocations.ts
```

Each location contains:

```text
name
category
latitude
longitude
aliases
```

Examples:

```text
mall -> Iulius Mall Suceava, Shopping City Suceava
aero -> Suceava Airport
gara -> Suceava Railway Station
usv -> Stefan cel Mare University
spital -> Suceava County Hospital
obcini -> Obcini
```

The catalog covers:

- shopping locations
- transport locations
- education
- healthcare
- institutions
- landmarks
- parks
- districts
- major streets

## Backend Catalog

Backend route preview was also extended in:

```text
src/api/routing_service.py
```

This keeps direct API route previews aligned with the mobile search catalog.

## UX Behavior

Route planner behavior:

1. User opens `Where to?`
2. Destination list is hidden while input is blank
3. User types at least two characters
4. Matching places appear below the input
5. User taps a result
6. Destination is filled with the canonical location name
7. `Preview route` calculates the route

## Validation

Task 36G1 validation:

```text
python -m compileall -q src tests -> passed
tests/unit/test_routing_service.py -> passed
npx.cmd tsc --noEmit -> passed
public POST /routes/preview City Center -> aero -> Suceava Airport
npx.cmd expo-doctor --verbose -> 18/18 checks passed
npx.cmd expo export --platform android --output-dir .expo-export-task36g1 -> passed
temporary export artifact -> deleted
```

No APK was generated in this task.
