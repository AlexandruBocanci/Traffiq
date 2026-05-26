# Traffiq v4 Execution Plan

## Purpose

Traffiq v4 is the final polish and license delivery phase.

It starts after v3 has delivered the main real-product upgrades:

```text
cloud backend + AWS database + auth + real map/routing + Suceava-specific product features
```

v4 should not add large new product scope. It should make the app stable, polished, documented, and ready for presentation.

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

### Task 37. Final cleanup and release commit

Goal:

- finish the project cleanly

Deliverables:

- final README
- final docs
- clean git status
- final branch merged to main

Definition of done:

- project is ready for license presentation
