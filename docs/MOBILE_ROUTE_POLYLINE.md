# Mobile Route Polyline And Markers

## Purpose

Task 17 renders the calculated route visually on the mobile map.

Task 16 produced route data:

- origin
- destination
- distance
- duration
- GeoJSON `LineString`

Task 17 consumes that route data in the mobile map UI.

## Scope

This task adds:

- route polyline on the Suceava map
- origin marker
- destination marker
- map overlay updated for active route previews
- route summary grid on the Drive screen

This task does not add:

- turn-by-turn navigation
- live traffic rerouting
- route alternatives
- full navigation mode
- saved routes

## Implementation

Updated files:

- `mobile/src/components/SuceavaMap.tsx`
- `mobile/src/screens/DriveScreen.tsx`

`SuceavaMap` now accepts:

```ts
routePreview?: RoutePreviewResponse | null;
```

The route geometry from OSRM/backend uses GeoJSON coordinate order:

```text
[longitude, latitude]
```

React Native Maps expects:

```text
{ latitude, longitude }
```

The component converts the coordinates before rendering the `Polyline`.

## Rendered Map Elements

When a route preview exists, the map renders:

- `Polyline` for the route path
- origin marker with route start coordinates
- destination marker with route destination coordinates
- route overlay showing destination, ETA, and distance

When no route preview exists, the map keeps the normal Suceava traffic overlay.

## Drive Summary

The Drive screen now shows a route summary grid with:

- From
- To
- Distance
- ETA

This makes the route preview readable even before a full navigation screen exists.

## Validation

Commands used:

```powershell
npx.cmd tsc --noEmit
npx.cmd expo export --platform android --output-dir .expo-export-task17
git diff --check
```

Results:

- TypeScript compilation passed.
- Expo Android export passed.
- `git diff --check` reported no whitespace errors, only expected Windows CRLF/LF warnings.

## Manual Phone Test

Open the app in Expo Go and verify:

1. Tap `Where to?`.
2. Select `Current location` or `Type location`.
3. Select a destination.
4. Tap `Preview route`.
5. The map shows a route line.
6. The map shows origin and destination markers.
7. The Drive screen shows ETA and distance.

## Explanation For Presentation

The app now turns route API output into a visual route preview.

This is not full navigation. It is a product-level route preview: the user chooses a route, the backend/mobile routing flow calculates route geometry, and the mobile map renders the route line and markers.
