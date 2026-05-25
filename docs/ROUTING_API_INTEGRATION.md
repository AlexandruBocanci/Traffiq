# Routing API Integration

## Purpose

Task 16 adds route calculation support for Suceava route previews.

The goal is to turn the route input flow from Task 15 into a real route preview flow with:

- distance
- estimated duration
- route geometry
- routing provider information

## Provider

Primary routing provider:

```text
OSRM Route Service
```

OSRM means:

```text
Open Source Routing Machine
```

It is an open-source routing engine that can calculate routes over OpenStreetMap-based road data.

Official API reference:

- https://project-osrm.org/docs/v5.24.0/api/

## Backend Endpoint

New endpoint:

```text
POST /routes/preview
```

Request body:

```json
{
  "origin_name": "City Center",
  "destination_name": "Iulius Mall Suceava"
}
```

Request body when using the phone's current GPS location:

```json
{
  "origin_name": "Current location",
  "origin_latitude": 47.475,
  "origin_longitude": 26.25,
  "destination_name": "Iulius Mall Suceava"
}
```

Response shape:

```json
{
  "origin": {
    "name": "City Center",
    "latitude": 47.6514,
    "longitude": 26.2556
  },
  "destination": {
    "name": "Iulius Mall Suceava",
    "latitude": 47.6592,
    "longitude": 26.2698
  },
  "distance_km": 4.02,
  "duration_minutes": 7.1,
  "geometry": {
    "type": "LineString",
    "coordinates": []
  },
  "provider": "OSRM"
}
```

## Suceava Location Catalog

The routing integration uses a controlled Suceava location catalog instead of unrestricted global geocoding.

Supported locations:

- City Center
- Iulius Mall Suceava
- Stefan cel Mare University
- Suceava Fortress
- Suceava Railway Station

This keeps the app inside the agreed v3 scope:

```text
Suceava city only
```

Exception:

- `Current location` can use the phone's live GPS coordinates as the route origin.
- `Current location` is not treated as a catalog alias for `City Center`.
- The destination remains constrained to supported Suceava locations.
- If GPS permission is denied, the app can still use the controlled location catalog fallback.

## Cloud Networking Note

The App Runner backend uses a VPC Connector to reach RDS.

Because the project intentionally avoids NAT Gateway for cost control, public outbound calls from App Runner to OSRM may not be available.

For that reason:

- backend tries OSRM first
- backend returns a local Suceava fallback route if OSRM is unreachable
- mobile app tries direct OSRM if backend returns `local_suceava_fallback`
- mobile app keeps the backend fallback if direct OSRM also fails

This keeps the demo usable without adding NAT Gateway cost.

## Files Changed

Backend:

- `src/api/routing_service.py`
- `src/api/routes/routes.py`

Mobile:

- `mobile/src/services/traffiqApi.ts`
- `mobile/src/types/api.ts`
- `mobile/src/screens/DriveScreen.tsx`

Tests:

- `tests/unit/test_routing_service.py`

## Validation

Commands used:

```powershell
.venv\Scripts\python.exe tests\unit\test_routing_service.py
.venv\Scripts\python.exe -m compileall src\api tests\unit\test_routing_service.py
npx.cmd tsc --noEmit
npx.cmd expo export --platform android --output-dir .expo-export-task16-final
git diff --check
```

Local backend endpoint validation:

```text
POST /routes/preview -> 200
provider -> OSRM
geometry.type -> LineString
```

Explicit current-location validation:

```text
POST /routes/preview with origin_latitude/origin_longitude -> 200
origin.name -> Current location
origin coordinates -> request coordinates
Current location without coordinates -> rejected as unknown catalog location
```

Public App Runner validation:

```text
GET /health -> 200
POST /routes/preview -> 200
provider -> local_suceava_fallback
```

The public fallback result is expected while App Runner has no NAT Gateway.

## What This Enables

Task 17 can now render:

- origin marker
- destination marker
- route polyline from `geometry.coordinates`
- route summary bottom sheet

## What This Does Not Do

This task does not add:

- visual route polyline on the map
- destination marker rendering
- turn-by-turn navigation
- real-time traffic routing
- unrestricted city/global search
