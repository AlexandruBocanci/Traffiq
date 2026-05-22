# Mobile Route Input Flow

## Purpose

Task 15 adds the mobile route input flow required before real route calculation.

The goal is to let a user start a route preview from the Drive screen by choosing an origin and a destination inside Suceava.

This task prepares the UI and state flow. It does not calculate route geometry yet.

## Scope

This task adds:

- route planner bottom sheet
- editable `From` field
- editable `To` field
- Suceava destination suggestions
- `Preview route` action
- selected route draft summary on the Drive screen
- quick selection from existing demo route recommendations

This task does not add:

- external routing API calls
- backend route calculation endpoint
- map polyline rendering
- route markers
- turn-by-turn navigation
- multi-city search

## Implementation

Updated file:

- `mobile/src/screens/DriveScreen.tsx`

New route state:

- `routeOrigin`
- `routeDestination`
- `plannedRoute`

Default origin:

```text
Current location
```

Suceava destination suggestions:

- Iulius Mall Suceava
- Stefan cel Mare University
- Suceava Fortress
- Suceava Railway Station
- City Center

When the user taps `Preview route`, the app stores the selected origin and destination locally and shows a `Route preview ready` card on Drive.

## Why This Is Separate From Routing

A real route feature has two different parts:

1. The product flow where the user chooses origin and destination.
2. The backend/routing logic that calculates route geometry, distance, and duration.

Task 15 implements the first part only.

Task 16 will connect this UI to a routing API through the backend.

Task 17 will render the resulting route line and markers on the map.

## Validation

Commands used:

```powershell
npx.cmd tsc --noEmit
npx.cmd expo export --platform android --output-dir .expo-export-task15
git diff --check
```

Results:

- TypeScript compilation passed.
- Expo Android export passed.
- `git diff --check` reported no whitespace errors, only expected Windows CRLF/LF warnings.

## Manual Phone Test

Open the app in Expo Go and verify:

1. Tap `Where to?`.
2. The route planner bottom sheet opens.
3. The `From` and `To` fields are editable.
4. Tapping a Suceava suggestion fills the destination.
5. `Preview route` is disabled while destination is empty.
6. `Preview route` closes the sheet and shows a route draft card.
7. Tapping `Edit` opens the planner again.

## Explanation For Presentation

The app now has the user-facing route request flow.

At this stage, the app captures what the user wants: origin and destination. It does not yet calculate the real route.

This is the correct product sequence because the routing API should receive a clean request from the mobile app after the user has selected route parameters.
