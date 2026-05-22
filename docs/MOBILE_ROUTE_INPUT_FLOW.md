# Mobile Route Input Flow

## Purpose

Task 15 adds the mobile route input flow required before real route calculation.

The goal is to let a user start a route preview from the Drive screen by choosing an origin and a destination inside Suceava.

This task prepares the UI and state flow. It does not calculate route geometry yet.

## Scope

This task adds:

- route planner bottom sheet
- explicit `From` selector
- current-location GPS option
- manual origin input option
- editable `To` field
- Romanian Suceava destination suggestions
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

- `routeOriginMode`
- `manualRouteOrigin`
- `routeDestination`
- `plannedRoute`
- `currentRouteLocation`
- `currentLocationMessage`

Default origin:

```text
Current location
```

Suceava destination suggestions:

- Iulius Mall Suceava
- Universitatea Stefan cel Mare
- Cetatea de Scaun
- Gara Suceava
- Centru

The `From` flow is intentionally not a free text field for `Current location`.

The user chooses between:

- `Current location`
- `Type location`

If `Current location` is selected, the app asks for phone GPS permission. If the app cannot determine the location, it switches back to manual origin mode and shows an inline message.

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
3. The `From` area shows `Current location` and `Type location`.
4. Selecting `Current location` uses phone GPS when permission is granted.
5. If GPS is unavailable, an inline message appears and manual origin remains available.
6. The `To` field is editable.
7. Tapping a Romanian Suceava suggestion fills the destination.
8. `Preview route` is disabled while destination is empty.
9. `Preview route` closes the sheet and shows a route draft card.
10. Tapping `Edit` opens the planner again.

## Explanation For Presentation

The app now has the user-facing route request flow.

At this stage, the app captures what the user wants: origin and destination. It does not yet calculate the real route.

This is the correct product sequence because the routing API should receive a clean request from the mobile app after the user has selected route parameters.
