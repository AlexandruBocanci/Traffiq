# Mobile Validation Results

## Purpose

This document records final physical-phone validation for the Traffiq v4 mobile application before building the installable Android APK.

Validation date:

```text
2026-05-26
```

## 1. Technical Validation

The mobile configuration was checked before the physical-phone flow.

Result:

```text
EXPO_PUBLIC_TRAFFIQ_API_BASE_URL = unset
default API target = https://eguwdq6puz.eu-central-1.awsapprunner.com
```

This confirms that normal mobile validation uses the public AWS App Runner backend rather than a FastAPI process on the development PC.

Commands executed:

```powershell
npx.cmd tsc --noEmit
npx.cmd expo config --type public
npx.cmd expo export --platform android --output-dir .expo-export-task36
```

Results:

```text
TypeScript validation -> passed
Expo public configuration -> passed
Android Expo export -> passed
generated .expo-export-task36 validation artifact -> deleted after validation
```

## 2. Cloud-Backed Physical Phone Validation

The application was opened on the physical phone through Expo Go while using the default public App Runner API.

User-confirmed result:

```text
All tested mobile flows work correctly after restoring the cloud API configuration.
```

Validated critical flow scope:

- public Drive flow loads cloud-backed Suceava context
- login/personal flows are available when the cloud API is reachable
- route preview and Drive flow are usable
- saved route behavior is usable
- personal ride history is usable
- personal settings and saved route list are usable

## 3. Error And Cached Fallback Validation

To simulate an unavailable backend, Expo was started with an intentionally invalid API URL:

```powershell
$env:EXPO_PUBLIC_TRAFFIQ_API_BASE_URL='http://127.0.0.1:1'
npx.cmd expo start --clear
```

Observed result on the phone:

```text
Showing the last successful Drive snapshot from 26 May 10:56
```

This is correct behavior:

- Drive public data falls back to the last successful cached snapshot
- the user sees an explicit cached-data label instead of a broken screen
- the application remains readable when the backend cannot be reached

Observed protected feature behavior while backend access was unavailable:

- ride history could not be loaded
- a route could not be saved
- personal settings could not be changed
- the personal saved route list could not be loaded

This is also correct behavior. Personal features require authenticated backend access and are intentionally not served from the public Drive cache.

Security interpretation:

```text
Public read-only demo context can use a cached fallback.
Personal account data must remain protected and backend-authoritative.
```

## 4. Cloud Restoration Validation

The invalid override was cleared and Expo was restarted:

```powershell
Remove-Item Env:EXPO_PUBLIC_TRAFFIQ_API_BASE_URL -ErrorAction SilentlyContinue
npx.cmd expo start --clear
```

User-confirmed result:

```text
Cloud-backed mobile behavior returned to normal and all tested functionality worked correctly.
```

## 5. Result For Task 36

Overall result:

```text
passed
```

The application is ready for the next release task:

```text
Task 36A. Build installable Android APK for demo
```

Important requirement for Task 36A:

- the installed application must open from the Android launcher without Expo Go
- it must not require `npx expo start`
- it must use the public AWS App Runner backend by default
- mobile install branding must use `Traffiq`, not the generic Expo project name `mobile`

