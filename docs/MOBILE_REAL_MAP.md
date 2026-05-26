# Mobile Real Map

## Purpose

Task 14 originally replaced the static map-like UI from the Drive screen with
a real mobile map component. During Task 36A release validation, the map
implementation was migrated to the installable-APK-compatible rendering
described below.

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

Mobile packages and map resources:

- `react-native-webview`
- `expo-location`
- Leaflet `1.9.4`
- OpenStreetMap tile layer

Why:

- `react-native-webview` renders a local Leaflet map document inside the React Native application.
- `expo-location` handles foreground location permission and current device coordinates.
- Leaflet draws the route polyline, map markers, and expanded-map interaction.
- OpenStreetMap supplies map tiles with visible attribution for low-volume demo use.

No paid routing or Google Maps billing account is required for this map layer.
The public OpenStreetMap tile endpoint is appropriate for the low-volume
student demo only; a scaled production deployment would require a managed tile
provider or dedicated tile infrastructure.

## Implementation

New component:

- `mobile/src/components/SuceavaMap.tsx`

Updated screen:

- `mobile/src/screens/DriveScreen.tsx`

Updated Expo configuration:

- `mobile/app.json`

The Drive screen renders `SuceavaMap` instead of the previous manually drawn
static map panel. In the release-compatible implementation, `SuceavaMap`
embeds Leaflet in a WebView instead of mounting the native Google Maps-backed
component.

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
6. The visible attribution identifies OpenStreetMap contributors.

## Explanation For Presentation

The app now has a real map layer in the mobile client.

This means Traffiq is no longer only showing a designed placeholder. It has the map surface required for the next product features: destination input, route calculation, route polyline rendering, markers, and route condition summaries.

Task 22 now uses this map surface for geolocated controlled Suceava traffic
alert markers. Marker positions come from the events Serving/API flow and are
colored by severity.

During Task 36A, an installed Android APK test revealed that the earlier
native-map implementation terminated at startup without a Google Maps Android
API key. The WebView/Leaflet/OpenStreetMap implementation removes that
release-time Google billing dependency while retaining the Suceava map, route
geometry, event markers, and device-location features.

This is still intentionally not a production navigation engine. It is a data engineering portfolio app with a real mobile map interface connected to backend traffic intelligence.
