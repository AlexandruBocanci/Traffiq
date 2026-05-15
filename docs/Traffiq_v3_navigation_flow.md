# Traffiq v3 Navigation Flow

## Status

This document defines the final navigation structure for Traffiq v3.

The goal is to make the app feel like one coherent Suceava traffic product, not a collection of disconnected analytics screens.

## Navigation Principle

Traffiq v3 should open directly into the useful product surface:

```text
App launch -> Map / Drive
```

The user should not land on a marketing page, dashboard menu, or login wall.

Public traffic features come first. Personal features stay accessible but require login when needed.

## Final Main Screens

The final v3 app has four normal user-facing screens:

- Map / Drive
- Reports
- History
- Account

Admin / Pipeline Status is not a normal user tab.

It should be accessible only through a developer/admin entry point, such as:

- Account -> Admin / Pipeline Status
- hidden demo button
- development-only route

## Screen Roles

| Screen | Purpose | Access |
| --- | --- | --- |
| Map / Drive | Main map-first traffic and route preview experience | Guest and authenticated |
| Reports | General Suceava traffic analytics and route summaries | Guest and authenticated |
| History | Personal ride history | Authenticated, with guest login prompt |
| Account | Login, register, preferences, account settings | Guest and authenticated states |
| Admin / Pipeline Status | ETL and backend operational visibility | Admin/demo only |

## Recommended Bottom Navigation

Use bottom navigation for the four normal product screens:

```text
Map
Reports
History
Account
```

Recommended labels:

- `Map`
- `Reports`
- `History`
- `Account`

Do not include `Pipeline` as a normal bottom tab.

Pipeline visibility is useful for license and portfolio demos, but normal users should not see it as a core product area.

## Initial App Flow

Default app launch:

```text
Open app
  -> Map / Drive
```

If the user is not logged in:

```text
Open app
  -> Map / Drive as guest
```

If the user is logged in:

```text
Open app
  -> Map / Drive with personal actions enabled
```

## Map / Drive Flow

Map / Drive is the main product surface.

Expected user flow:

```text
Map / Drive
  -> view Suceava map
  -> enter destination
  -> preview route
  -> view route condition summary
  -> optionally save route if logged in
```

Guest behavior:

- can preview route
- can see traffic/weather/alerts
- sees login prompt only when trying to save personal data

Authenticated behavior:

- can preview route
- can see traffic/weather/alerts
- can save route
- can create ride history later

## Reports Flow

Reports contains public analytical views.

Expected user flow:

```text
Reports
  -> view Suceava traffic summary
  -> inspect route reports
  -> inspect congestion windows
  -> inspect weather impact
```

Reports should not require login because it displays general city-level traffic intelligence.

## History Flow

History is personal.

Guest behavior:

```text
History
  -> login prompt
  -> Sign in / Create account / Continue as guest
```

Authenticated behavior:

```text
History
  -> personal ride history list
  -> ride detail
```

The app must not show global demo ride history as if it were personal user data after auth is introduced.

## Account Flow

Account has two states.

Guest state:

```text
Account
  -> Login
  -> Register
  -> Forgot password
```

Authenticated state:

```text
Account
  -> profile summary
  -> preferences
  -> saved routes
  -> saved destinations
  -> logout
```

Admin or demo-only links can live here if needed:

```text
Account
  -> Admin / Pipeline Status
```

## Admin / Pipeline Status Flow

Admin / Pipeline Status exists to support the Data Engineering portfolio story.

It should show:

- latest pipeline run
- last successful run
- records extracted
- records loaded
- latest data quality checks

It should not be positioned as a consumer-facing product screen.

Recommended access:

```text
Account -> Admin / Pipeline Status
```

or:

```text
development-only hidden route
```

## Navigation States

The navigator should support these states:

| State | Behavior |
| --- | --- |
| Guest | Map and Reports fully available, History and personal Account actions show login prompts |
| Authenticated | All public features plus personal features |
| Admin/demo | Pipeline Status available through restricted or hidden entry |

## Implementation Direction

Current v2 app has:

- `Drive`
- `Pipeline`

v3 should evolve toward:

```text
RootNavigator
  -> MainTabs
      -> Map / Drive
      -> Reports
      -> History
      -> Account
  -> Auth screens
      -> Login
      -> Register
      -> Forgot Password
      -> Reset Password
  -> Admin / Pipeline Status
```

This task only documents the final navigation flow.

Actual React Native navigation implementation belongs to later tasks.

## Non-Goals

Task 3 does not implement:

- React Navigation tab navigator
- auth screens
- map component
- route input UI
- Cognito integration
- pipeline status endpoint

Those are later v3 tasks.

## Definition Of Done

This task is complete when:

- the final v3 screen structure is documented
- Map / Drive is defined as the default app entry
- Pipeline is removed from normal user navigation
- guest and authenticated navigation states are documented
- the implementation direction for future mobile navigation work is clear
