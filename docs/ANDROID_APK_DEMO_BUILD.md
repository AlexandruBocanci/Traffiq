# Android Installable APK Demo Build

## Purpose

This document covers the installable Android demo version of Traffiq.

The installed APK runs from the Android launcher without Expo Go, without
`npx expo start`, and without a development PC. It is still a cloud-backed
application: the phone needs internet access and the AWS App Runner API and
Amazon RDS database must be available.

## Architecture Meaning

Development mode:

```text
Phone -> Expo Go -> Metro development server on PC -> Traffiq JavaScript bundle
```

Installable demo mode:

```text
Android Traffiq APK -> HTTPS -> AWS App Runner FastAPI -> Amazon RDS PostgreSQL
                                      |
                                      -> Amazon Cognito for personal features
```

The APK packages the mobile application code and assets. It does not package
the backend database or ETL data. This separation matches a normal mobile
product architecture: the client is installed on the device, while secured
data and business logic are served from cloud APIs.

## Configured Android Build

The mobile project uses:

- application name: `Traffiq`
- Android application ID: `com.traffiq.mobile`
- current version name: `1.0.1`
- current Android version code: `2`
- EAS build profile: `preview`
- EAS distribution mode: `internal`
- Android artifact type: `apk`
- default backend: public AWS App Runner URL configured in the mobile client

The first APK exposed a native-map packaging issue: Android terminated the
application at startup because the native Google Maps component required a
Google API key. The repaired APK does not depend on Google Maps or Google
Cloud billing. It renders the Suceava map through `react-native-webview` with
Leaflet and OpenStreetMap tiles.

`APK` is intentional: an Android Package can be installed directly on a
physical Android phone. An `AAB` is mainly intended for Google Play
distribution and cannot be installed directly as the demo artifact.

## Build Prerequisites

- Node.js and mobile dependencies already installed
- an Expo account controlled by the project owner
- no local API URL override active during the cloud demo build

Do not put Expo credentials, signing files, tokens, AWS credentials, or
database passwords in the repository.

## Map Rendering In The Installable APK

The mobile application renders maps using:

- `react-native-webview` as the mobile rendering surface
- Leaflet for map interaction, route lines, and event markers
- OpenStreetMap tiles for the cartographic base layer

This keeps the installable demo independent from a Google Maps API key and a
Google Cloud billing account. It still requires internet access because the
phone retrieves map tiles and the application data comes from the public AWS
API.

OpenStreetMap attribution remains visible in the map, as required by its
licensing and tile usage policy, on the full expanded map used for map
inspection. The compact preview omits the cramped attribution overlay while
the expanded map preserves the required attribution. This direct tile source
is suitable for a low-volume student demo, not a high-traffic commercial
production rollout.

## Google Maps Attempt Cleanup

The Google Maps investigation confirmed the original APK crash through Android
logs, but the final application no longer consumes the Google Maps key.

Before closing Task 36A:

1. Remove `GOOGLE_MAPS_API_KEY` from the Expo project `preview` environment.
2. Disable or delete the API keys created in the Google Cloud map projects.
3. Delete the unused Google Cloud map projects after confirming they do not
   contain resources required by another application.
4. Do not delete Google organizations or payment profiles as part of project
   cleanup.

This cleanup avoids retaining an unused secret or an unnecessary cloud project.

## Create the APK

Run the following commands from the `mobile/` workspace:

```powershell
Remove-Item Env:EXPO_PUBLIC_TRAFFIQ_API_BASE_URL -ErrorAction SilentlyContinue
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest whoami
npx.cmd eas-cli@latest build --platform android --profile preview
```

Interactive choices on the first build:

1. Authenticate in your own Expo account when `eas login` prompts you.
2. If EAS asks to create or link an Expo project for `Traffiq`, accept.
3. If EAS asks how Android signing credentials should be managed, allow EAS
   to generate and manage a new Android keystore.

The Android keystore signs the APK so Android can identify future updates as
coming from the same application owner. It is a sensitive signing credential:
keep it managed by EAS and do not commit, paste, or publish it.

The APK build does not deploy a new AWS resource and does not change RDS data.
Expo build availability and pricing depend on the active Expo account plan.

## Install On A Physical Android Phone

After EAS reports a successful build:

1. Open the EAS build URL on the Android phone.
2. Download the `.apk` artifact.
3. When Android requests permission to install an app from the browser, allow
   it only for this trusted build installation.
4. Install the APK.
5. Confirm `Traffiq` appears in the Android launcher with the branded icon.

An internal distribution URL may be accessible to anyone who receives the
URL, depending on Expo project settings. Do not publish the link publicly.
For tighter access control, require Expo sign-in for internal build access in
the Expo project settings.

## Validation Without Development Tools

Stop any running Expo development server on the PC. Then test from the
installed Android app:

1. Open `Traffiq` directly from the launcher.
2. Verify the Drive screen loads Suceava data through the public cloud API.
3. Calculate a route and verify route preview, distance, ETA, and map line.
4. Log in through Cognito with your test user.
5. Save a route and verify it is visible in personal saved routes.
6. Start a drive and verify the ride is visible in personal history.
7. Expand the map without a route and verify the live speed card and compact
   `Plan a route` prompt are aligned without overlapping and use the available
   width.
8. Press `Later`, close and reopen the expanded map, and verify the route
   prompt is shown again.
9. Start a drive and verify pressing the live-speed card recenters the map
   and `End drive` is available on the active route map.
10. Verify the expanded map has OpenStreetMap attribution but does not show
    Leaflet `+` / `-` zoom controls.
11. Press `End drive` and verify live GPS telemetry stops with the active route.
12. Optionally switch the phone from Wi-Fi to mobile data and reopen the app.

Expected result:

```text
Traffiq opens and works on the phone without Expo Go, Metro, or the PC.
Cloud-backed features work while App Runner and RDS are available.
```

## Cost And Security Notes

- The installed APK itself has no AWS runtime cost.
- Requests from the APK reach the existing App Runner API; keeping App Runner
  and RDS available can continue to incur AWS cost.
- The map does not use Google Maps billing or a Google API key.
- Expanded-map and active-drive speed and position use foreground-only device
  GPS through `expo-location`; no GPS trace is written to the backend or stored
  in history.
- The demo uses public OpenStreetMap tiles with visible attribution and must
  remain low-volume; a scaled product would use a managed tile provider.
- Cognito protects personal data with authenticated access tokens.
- Do not embed secrets in the APK. The public API URL and Cognito public app
  client configuration are not passwords; privileged credentials must remain
  outside the mobile client.

## Official Expo References

- <https://docs.expo.dev/build/setup/>
- <https://docs.expo.dev/build-reference/apk/>
- <https://docs.expo.dev/build/internal-distribution/>
- <https://docs.expo.dev/versions/v54.0.0/sdk/webview/>
- <https://operations.osmfoundation.org/policies/tiles/>
