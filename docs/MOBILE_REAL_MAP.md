# Mobile Real Map

## Purpose

Task 14 replaces the static map-like UI from the Drive screen with a real mobile map component.

The goal is not to build full navigation yet. The goal is to create the real map foundation required by the next routing tasks.

## Scope

This task adds:

- a real map rendered in the Expo mobile app
- a default viewport centered on Suceava city
- foreground location permission request
- current-location marker when permission is granted
- fallback to the Suceava viewport when permission is denied
- existing congestion summary overlay on top of the map

This task does not add:

- route search
- route polyline rendering
- turn-by-turn navigation
- Waze-like real-time traffic
- multi-city map support
- user-generated reports

## Libraries Used

Mobile packages:

- `react-native-maps`
- `expo-location`

Why:

- `react-native-maps` gives the app a native map surface inside React Native.
- `expo-location` handles foreground location permission and current device coordinates.

No paid routing or map account is required for this task.

## Implementation

New component:

- `mobile/src/components/SuceavaMap.tsx`

Updated screen:

- `mobile/src/screens/DriveScreen.tsx`

Updated Expo configuration:

- `mobile/app.json`

The Drive screen now renders `SuceavaMap` instead of the previous manually drawn static map panel.

The map uses these default Suceava coordinates:

```text
latitude: 47.6514
longitude: 26.2556
```

If the user allows location access, the map centers on the current device location and shows the user marker.

If the user denies location access or location lookup fails, the app keeps the default Suceava viewport.

## App Permissions

Android permissions:

- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`

iOS permission message:

```text
Traffiq uses your location to center the Suceava map when permission is granted.
```

## Validation

Commands used:

```powershell
npx.cmd tsc --noEmit
npx.cmd expo config --type public
git diff --check
npx.cmd expo export --platform android --output-dir .expo-export-task14
npm.cmd audit --omit=dev
```

Results:

- TypeScript compilation passed.
- Expo config includes the location permissions.
- Android Expo bundle export passed.
- `git diff --check` reported no whitespace errors.
- `npm audit --omit=dev` still reports moderate Expo/Metro dependency advisories that require a breaking Expo upgrade to fully resolve.

`npm audit fix --force` was not used because it would upgrade Expo to a new major version and is outside this task's scope.

## Manual Phone Test

Open the app in Expo Go and verify:

1. The Drive screen shows a real map, not the old drawn placeholder.
2. The map starts around Suceava if location is denied.
3. The app asks for foreground location permission.
4. If location is allowed, the map can show the current device location.
5. The congestion overlay still appears on top of the map.

## Explanation For Presentation

The app now has a real map layer in the mobile client.

This means Traffiq is no longer only showing a designed placeholder. It has the map surface required for the next product features: destination input, route calculation, route polyline rendering, markers, and route condition summaries.

This is still intentionally not a production navigation engine. It is a data engineering portfolio app with a real mobile map interface connected to backend traffic intelligence.
