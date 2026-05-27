# Mobile Real Map

## Purpose

Task 14 originally replaced the static map-like UI from the Drive screen with
a real mobile map component. During Task 36A release validation, the map
implementation was migrated to the installable-APK-compatible rendering
described below.

The map now supports the route preview and active-drive presentation layer. It
is not turn-by-turn navigation and does not track location in the background.

## Scope

This task adds:

- a real map rendered in the Expo mobile app
- a default viewport centered on Suceava city
- foreground location permission request
- current-location marker when permission is granted
- fallback to the Suceava viewport when permission is denied
- route polyline and destination presentation
- expanded-map live GPS speed indicator in `km/h`
- expanded-map moving device-location marker
- tappable live-speed card that recenters the map on the current position
- dismissible `Plan a route` prompt aligned with live telemetry when no route
  is selected; it returns on the next expanded-map opening
- gesture-based expanded-map interaction without visible Leaflet zoom buttons
- OpenStreetMap attribution visible on the expanded map while omitted from the
  constrained compact preview surface
- explicit end-drive action that stops the foreground GPS subscription

This task does not add:

- turn-by-turn navigation
- background location collection
- persisted GPS route or speed history
- Waze-like real-time traffic conditions
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
- `expo-location` handles foreground location permission, current device
  coordinates, and the active-drive foreground subscription.
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

If the user allows location access, the map can center on the current device
location and shows the user marker.

If the user denies location access or location lookup fails, the app keeps the default Suceava viewport.

When the user expands the map, or confirms a route with `Drive`,
`DriveScreen` starts a foreground `Location.watchPositionAsync()`
subscription. This allows the speed card and moving device marker to work
both while viewing the map and during an active route. The application
converts the device speed from meters per second to kilometers per hour:

```text
speed_km_h = speed_m_s * 3.6
```

Only the latest in-memory coordinate and speed are supplied to the expanded
map. The Leaflet marker is moved through injected WebView JavaScript instead
of rebuilding the map document on every GPS update. Closing an expanded map
without an active drive removes the subscription; during an active route,
`End drive` removes it and clears the live telemetry state.

## App Permissions

Android permissions:

- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`

iOS permission message:

```text
Traffiq uses your location while the app is open to show your position and current speed on the expanded map.
```

Traffiq requests no background-location permission for this feature. This
avoids collecting movement when the user is not actively using the drive map.

## Validation

Commands used:

```powershell
npx.cmd tsc --noEmit
npx.cmd expo-doctor
npx.cmd expo config --type public
git diff --check
npx.cmd expo export --platform android --output-dir .expo-export-task36b-gps
npm.cmd audit --omit=dev
```

Results:

- TypeScript compilation passed.
- Expo Doctor dependency/configuration checks passed.
- Expo config includes the location permissions.
- Android Expo bundle export passed.
- `git diff --check` reported no whitespace errors.
- `npm audit --omit=dev` still reports moderate Expo/Metro dependency advisories that require a breaking Expo upgrade to fully resolve.

`npm audit fix --force` was not used because it would upgrade Expo to a new major version and is outside this task's scope.

## Manual Phone Test

Open the installed APK on a physical Android phone and verify:

1. The Drive screen shows a real map, not the old drawn placeholder.
2. The map starts around Suceava if location is denied.
3. The app asks for foreground location permission.
4. If location is allowed, the map can show the current device location.
5. The congestion overlay still appears on top of the map.
6. The compact preview does not show cramped attribution or zoom controls.
7. Expand the map without planning a route and verify the tappable speed card
   and the wider aligned `Plan a route` prompt are visible without overlapping.
8. Press `Later`, confirm the route prompt disappears, close and expand the
   map again, and confirm the route prompt returns.
9. Calculate a route and press `Drive`; verify that `End drive` also appears.
10. Tap the speed card labelled `Press to recenter` and confirm the map
    recenters on the current marker.
11. Outdoors or during a safe passenger test, the location marker and speed
   respond to device movement.
12. Confirm the expanded map preserves visible OpenStreetMap attribution and
    supports gesture zooming without `+` / `-` buttons.
13. Press `End drive` and confirm the active-drive telemetry UI closes.

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

Task 36B adds client-side GPS telemetry for expanded-map and active-drive
experiences. The speed value is device sensor data, not an external traffic
API result, and it is intentionally not stored in personal ride history or
the data pipeline.
