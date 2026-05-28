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

### Task 36E. Build hourly traffic profile for monitored corridors

Goal:

- show typical hourly traffic behavior by weekday for monitored Suceava corridors

Deliverables:

- TomTom Traffic Stats / MOVE validation
- baseline 7 x 24 traffic profile stored in Gold with realistic urban commute patterns
- observed TomTom flow values replacing baseline values as real snapshots accumulate
- weekday selector (`Mon` through `Sun`)
- animated 24-hour chart for the selected weekday
- metric labelled as traffic on monitored corridors, not total Suceava traffic

Definition of done:

- TomTom MOVE access is validated and documented as unavailable for the current key
- public backend serves `/mobile/traffic-profile` with 168 weekday/hour rows
- mobile chart opens on the current weekday and highlights the current hour
- graph is clearly scoped to monitored corridors, not full-city traffic
- installed-APK validation is deferred to the final APK build after the remaining tasks

Implementation result:

- completed after scope adjustment
- TomTom Traffic Stats / MOVE read-only access check returned `403 Forbidden`
- no fake TomTom historical claim was added
- the API computes TomTom-observed hourly values from `silver.tomtom_flow_observations`
  and falls back to `gold.corridor_hourly_traffic_profile` baseline rows where
  real observations are not available yet
- App Runner public validation returned `168` profile rows and preserved
  `/mobile/drive-overview`

### Task 36F. Implement Dark, Light, and System appearance modes

Goal:

- make the user preference for display mode functional throughout the mobile application

Deliverables:

- global light and dark theme tokens
- functional `dark`, `light`, and `system` modes
- preference persisted for authenticated users through the existing preferences flow
- guest-compatible local behavior where required

Definition of done:

- global theme provider applies `system`, `dark`, and `light` modes at runtime
- Account preferences can save appearance mode for authenticated users
- guest users can change appearance locally on the device
- primary screens and shared states consume the active theme
- Android bundle export passes without generating a new APK

Implementation result:

- completed without APK build, per current workflow
- `ThemeProvider` resolves `system` from the phone color scheme
- `dark` and `light` modes override the system theme
- Drive loads authenticated `theme_mode` along with the existing distance unit
- Account exposes Appearance settings for signed-in and guest users
- shared loading, error, empty, map, and chart components now use runtime theme colors

### Task 36G1. Add more real locations to choose from

Goal:

- make route destination search feel closer to a real traffic app without using
  paid Places APIs

Deliverables:

- expanded local Suceava location catalog
- aliases for practical searches such as `mall`, `aero`, `gara`, `usv`,
  `spital`, `obcini`
- destination suggestions appear only after the user starts typing
- mobile route preview and backend route preview resolve the same expanded
  locations
- no APK build in this task

Definition of done:

- typing a partial destination shows matching Suceava places
- blank destination field does not show the full catalog
- public `/routes/preview` resolves at least one newly added location
- Android bundle export passes without generating a new APK

Implementation result:

- completed
- added 40+ Suceava locations covering shopping, transport, education,
  healthcare, institutions, landmarks, parks, districts, and major streets
- deployed App Runner with ECR digest:

```text
sha256:fb2f529b60e8880b10e5190d6ff100cfce1e63086c7d4755aebe9b013048f45d
```

- public validation:

```text
POST /routes/preview City Center -> aero
destination -> Suceava Airport
GET /mobile/drive-overview -> traffic_source=tomtom, rides=0
```

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

Implementation result:

- polished the final mobile UI without adding new product features
- reduced developer-facing wording from normal user screens
- changed ride-history completed status into a green success badge
- simplified the traffic profile chart by removing the current-hour badge and
  the numeric score under the highlighted bar
- replaced the top-street `Observed traffic` card with a Suceava traffic
  summary based on the average of monitored corridors
- removed route provider wording such as `OSRM direct` from saved-route and
  route-preview surfaces
- added a `Use route` flow for saved routes so a saved route opens Drive with
  the route preview prepared
- converted the final mobile UI copy to Romanian for a coherent user-facing
  experience
- kept only technical product names where they describe the architecture, such
  as TomTom, Open-Meteo, FastAPI, RDS, and Pipeline
- colored Suceava alert severity labels to match their visual severity bar:
  green for `low`, yellow for `medium`, and red for `high`
- removed Cognito/User Pool technical details from the normal Account screen
- tightened Pipeline quality-check badge layout so long check names do not push
  the status outside the card
- added aligned delete actions for saved routes and ride history
- added protected backend support for deleting personal ride history records
- replaced the native ride-history delete alert with a custom confirmation
  modal styled with the Traffiq color system
- replaced the native saved-route delete alert with the same custom
  confirmation modal for consistent destructive actions
- restored Account theme labels to `System`, `Dark`, and `Light`
- redeployed App Runner with the backend required by the new delete action:
  `sha256:6ea9a28a76ad6ca45b186a82b23e7c46db8f6ae86c325809bab2888aa128a391`

Rejected scope decisions:

- continuous remaining ETA recalculation during an active drive is excluded because it creates unnecessary routing request and reliability risk
- live remaining-route-distance recalculation is excluded for the same reason and will not be approximated with misleading straight-line distance

### Task 36H. Prepare branded Cognito confirmation email and app icon

Goal:

- replace the default-looking account confirmation experience with Traffiq
  branding while keeping the AWS implementation low-cost and controlled

Deliverables:

- refreshed mobile app icon and splash branding
- prepared Cognito confirmation email HTML template
- documented AWS Console steps and Cognito/SES constraints

Definition of done:

- Expo Android export passes with the refreshed assets
- the email template is ready to paste after the logo has a public HTTPS URL
- AWS changes are not applied until the user confirms the console step

Implementation result:

- selected logo concept `I`, based on a traffic light with an abstract city
  background
- generated refreshed PNG assets:
  - `mobile/assets/traffiq-icon.png`
  - `mobile/assets/traffiq-adaptive-icon.png`
  - `mobile/assets/traffiq-splash-icon.png`
  - `mobile/assets/favicon.png`
- preserved the selected generated source in:
  - `mobile/assets/branding/traffiq-logo-variant-i-source.png`
- added the Cognito confirmation email HTML template:
  - `docs/cognito_email/traffiq_confirmation_email.html`
- documented the AWS constraints and console steps in:
  - `docs/COGNITO_CONFIRMATION_EMAIL_TEMPLATE.md`
- updated the Cognito setup documentation to reference the v4 email template
- uploaded the app icon to a public HTTPS S3 asset URL for email rendering
- verified the SES sender identity and switched Cognito email delivery from
  `COGNITO_DEFAULT` to `DEVELOPER`
- applied the branded Cognito confirmation email template in AWS
- validated delivery through a temporary Cognito SignUp test and deleted the
  temporary user after validation

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
