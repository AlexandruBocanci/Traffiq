# Mobile Route Condition Summary

## Purpose

Task 18 adds a Suceava route condition summary to the Drive screen.

The goal is to make a calculated route feel like a traffic intelligence feature, not only a line drawn on a map.

The summary combines:

- route preview ETA and distance from `POST /routes/preview`
- weather context from `/mobile/drive-overview`
- congestion score from the existing serving data
- active city alerts from the existing map events feed

## What The User Sees

After selecting a route, the Drive screen shows:

- route condition label
- route ETA
- weather context
- congestion context
- active alert count
- short natural-language explanation

Example labels:

- `Light traffic`
- `Moderate traffic`
- `Heavy traffic expected`

## How The Summary Is Calculated

The mobile app builds the summary locally in `mobile/src/screens/DriveScreen.tsx`.

The calculation uses data that is already loaded by the screen:

- `routePreview.duration_minutes`
- `weatherImpact.weather_label`
- `topCongestedSegment.congestion_score`
- `data.events`

The condition level is intentionally simple:

- high alert or congestion score >= 70 -> heavy traffic
- medium alert or congestion score >= 40 -> moderate traffic
- otherwise -> light traffic

This is enough for the v3 demo because the project goal is a realistic Suceava traffic intelligence proof-of-concept, not a full navigation engine.

## Why This Is Mobile-Side

No backend endpoint was added for this task.

Reason:

- the backend already exposes the required route, weather, congestion, and alert data
- Task 18 is about product presentation and user-facing interpretation
- keeping the logic mobile-side avoids adding unnecessary API complexity before the data model becomes more route-specific in later tasks

## Current Limitation

The summary is based on Suceava city-level traffic signals.

It does not yet perform segment-by-segment traffic matching against every street in the selected route.

That deeper data realism belongs to later v3 work:

- Task 19: Suceava route and street seed dataset
- Task 22: improved Suceava event data

## Validation

Run:

```powershell
npx.cmd tsc --noEmit
npx.cmd expo export --platform android --output-dir .expo-export-task18
git diff --check
```

Expected result:

- TypeScript passes
- Expo export succeeds
- no whitespace errors are reported
- selecting a route shows the condition summary under the route preview card
