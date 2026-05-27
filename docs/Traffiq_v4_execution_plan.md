# Traffiq v4 Execution Plan

## Purpose

Traffiq v4 is the final polish and license delivery phase.

It starts after v3 has delivered the main real-product upgrades:

```text
cloud backend + AWS database + auth + real map/routing + Suceava-specific product features
```

v4 originally focused on stability and delivery. After validating the installable
Android APK, the final scope was extended to replace controlled traffic/event
data in the user-facing product with real sources and to finish the mobile
experience around those sources.

---

## Epic 7 - Demo Stability

### Task 28. Add mobile cache for last successful API response

Goal:

- make demo safer if backend is slow or temporarily unavailable

Deliverables:

- cache latest drive overview
- cache latest route summary if needed
- clear cached-data label

Definition of done:

- app can show last successful data during demo failure

### Task 29. Add graceful error and empty states everywhere

Goal:

- avoid broken-looking screens

Deliverables:

- map error state
- auth error state
- route error state
- history empty state
- reports empty state

Definition of done:

- no screen shows raw technical errors to the user

---

## Epic 8 - Final UI Polish

### Task 30. Finalize mobile visual consistency

Goal:

- make app look coherent and premium

Deliverables:

- consistent spacing
- consistent cards
- consistent bottom sheets
- consistent buttons
- final color usage

Definition of done:

- app feels like one product, not separate screens

### Task 31. Polish map-oriented presentation layer

Goal:

- make Map / Drive the strongest screen

Deliverables:

- better route bottom sheet
- alert markers
- weather summary placement
- saved route action

Definition of done:

- Map / Drive is presentation-ready

---

## Epic 9 - Final Documentation

### Task 32. Update final architecture docs

Goal:

- make docs match the final implemented system

Deliverables:

- architecture walkthrough updated
- cloud workflow updated
- setup docs updated
- demo flow updated

Definition of done:

- docs match the actual app

### Task 33. Create final license/demo checklist

Goal:

- make presentation preparation repeatable

Deliverables:

- startup checklist
- demo checklist
- fallback checklist
- cost shutdown checklist

Definition of done:

- user can prepare demo without guessing commands

### Task 34. Create final project summary for license presentation

Goal:

- summarize the project in academic and technical language

Deliverables:

- problem statement
- architecture summary
- data model summary
- implementation summary
- limitations
- future work

Definition of done:

- text can be reused in license presentation

---

## Epic 10 - Final Validation And Release

### Task 35. Run full backend validation

Goal:

- confirm backend works locally and in cloud

Deliverables:

- health endpoint validated
- mobile overview validated
- auth validated
- map/routing validated
- reports/history validated
- pipeline status validated

Definition of done:

- all critical flows work

### Task 36. Run final mobile validation

Goal:

- confirm app works on phone

Deliverables:

- guest flow tested
- login flow tested
- route preview tested
- saved routes tested
- history tested
- error states tested

Definition of done:

- app is demo-ready on physical phone

### Task 36A. Build installable Android APK for demo

Goal:

- make the mobile app usable like a normal Android app without Expo Go, `npx expo start`, or the development PC

Deliverables:

- Expo EAS build configuration
- Android preview/internal APK build
- installed Traffiq app on a physical Android phone
- validation against the public AWS App Runner API
- documented install/demo steps

Definition of done:

- the user can open Traffiq from the Android launcher and use the app without Expo Go or a local development server
- the installed app uses the public AWS backend URL
- the app still works with the agreed cloud dependency model: phone internet, App Runner backend, and RDS database available

---

## Epic 11 - Real Mobility Data And Product Completion

### Task 36B. Add active-drive GPS telemetry experience

Goal:

- make the active drive map respond to real device movement without storing personal location history

Deliverables:

- current speed indicator in km/h while a drive is active
- live device-location movement on the expanded map
- recenter-on-current-location control
- GPS listener starts only during active drive and stops when the route ends

Definition of done:

- the installed APK shows real foreground GPS speed and map position during a physical-device drive test
- no GPS trace or live speed history is persisted or sent to the backend
- no new paid API, key, or billing dependency is introduced

### Task 36C. Replace controlled traffic and event data with real TomTom ingestion

Goal:

- remove seed/demo traffic and event claims from the final user-facing product by ingesting real Suceava traffic data

Deliverables:

- TomTom Traffic Flow backend ingestion for monitored Suceava road segments
- TomTom Traffic Incidents backend ingestion for the Suceava bounding area
- secure TomTom key handling in backend/cloud configuration only, never in the APK or Git
- Bronze/Silver/Gold/Serving pipeline path for real traffic and incidents
- controlled caching/request frequency and documented free-tier/cost guardrails
- mobile route/map/traffic surfaces driven by real served observations instead of seed values

Definition of done:

- TomTom coverage and free-tier conditions are verified before cloud activation
- real traffic and real incidents are returned through the Traffiq backend and shown in the installed APK
- final user-facing traffic/event information no longer uses the controlled seed dataset
- request volume is bounded and cost risk is documented before scheduled ingestion is enabled

Implementation status:

- implemented and cloud-validated on `May 27, 2026`
- App Runner serves TomTom flow and incident data loaded through RDS
- final rebuilt APK regression validation is intentionally deferred until the remaining mobile tasks are complete

### Task 36D. Refresh real traffic on app use with server-side 15-minute rate limit

Goal:

- keep real traffic information recent while the app is actively used, without wasting TomTom requests when no demo/user session is running

Deliverables:

- public Lambda refresh worker triggered by the mobile app, with a protected
  FastAPI ingestion callback because App Runner's RDS VPC connector has no
  public internet egress without a NAT Gateway
- refresh occurs on initial app data load and while the app remains open, but no more than once per 15 minutes globally
- TomTom key, ingestion token, and database credential stored through AWS SSM
  Parameter Store `SecureString`, never in Git or APK
- DynamoDB conditional lock so repeated app opens cannot start duplicate external ingestion runs
- mobile refresh trigger and visible observation timestamp
- request-volume and AWS cost guardrails documented before activation

Definition of done:

- the phone never calls TomTom directly and contains no TomTom key
- if the current snapshot is older than 15 minutes, the backend can update TomTom Flow, TomTom Incidents, and Open-Meteo before returning fresh data
- maximum designed TomTom volume remains bounded at `384` non-tile requests/day for one global 15-minute refresh cadence
- refresh behavior works in the final installed APK

Implementation status:

- implemented and cloud-validated on `May 27, 2026`
- first cloud refresh completed as pipeline run `9`; immediate repeat was
  rejected as `rate_limited`
- bundle compatibility was validated through Android Expo export
- physical installed-APK regression validation remains deferred to the final
  APK build requested after the remaining mobile tasks

### Task 36E. Build historical hourly traffic profile for monitored corridors

Goal:

- show typical hourly traffic behavior by weekday using historical real observations, not generated demo data

Deliverables:

- TomTom Traffic Stats / MOVE validation for three representative Suceava corridors
- verification of available sample coverage, trial cost constraints, and allowed result usage
- weekday selector (`Mon` through `Sun`)
- 24-hour chart for the selected weekday
- metric labelled as traffic on monitored corridors, not total Suceava traffic

Definition of done:

- task proceeds only if TomTom MOVE returns usable Suceava corridor data and the usage/cost conditions are acceptable
- graph is backed by real historical TomTom results processed and served through the backend
- feature works in the installed APK

### Task 36F. Implement Dark, Light, and System appearance modes

Goal:

- make the user preference for display mode functional throughout the mobile application

Deliverables:

- global light and dark theme tokens
- functional `dark`, `light`, and `system` modes
- preference persisted for authenticated users through the existing preferences flow
- guest-compatible local behavior where required

Definition of done:

- all primary screens render correctly in all three modes on physical Android hardware
- appearance mode works in the installed APK without additional paid services

### Task 36G. Run final mobile UI/UX polish after real-data features

Goal:

- complete the presentation-level mobile experience only after the final features are in place

Deliverables:

- refined layouts and hierarchy for Drive, History, Account, and Pipeline
- coherent presentation of GPS controls, real traffic/incidents, historical chart, and appearance modes
- polished loading, error, empty, and offline/cached states
- physical-device and installable APK visual validation

Definition of done:

- the application is visually coherent and usable across its final feature set
- user confirms the final APK presentation flow

Rejected scope decisions:

- continuous remaining ETA recalculation during an active drive is excluded because it creates unnecessary routing request and reliability risk
- live remaining-route-distance recalculation is excluded for the same reason and will not be approximated with misleading straight-line distance

---

## Epic 12 - Final Cleanup And Release

### Task 37. Final cleanup and release commit

Goal:

- finish the project cleanly after real-data and final mobile experience work is validated

Deliverables:

- final README
- final docs
- clean git status
- final branch merged to main

Definition of done:

- project is ready for license presentation
