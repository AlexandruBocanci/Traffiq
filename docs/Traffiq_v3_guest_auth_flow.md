# Traffiq v3 Guest And Authenticated User Flow

## Status

This document defines the access model for Traffiq v3.

The rule is:

```text
Public traffic intelligence works without login.
Personal user data requires login.
```

## Why This Flow Exists

Traffiq v3 should not force users to create an account before seeing public traffic conditions.

For a mobility app, the first useful experience should be fast:

- open the app
- view Suceava traffic context
- preview a route
- understand weather and alerts

Login is only justified when the app stores or retrieves personal data.

## User Types

Traffiq v3 has two user states:

- guest user
- authenticated user

## Guest User

A guest user is any user who opens the app without logging in.

Guest users can access public features.

Guest users cannot access personal data.

## Authenticated User

An authenticated user is a user who logs in through Amazon Cognito.

Authenticated users can access:

- all guest features
- personal saved routes
- personal ride history
- saved destinations
- preferences
- account settings

## Public Features

These features must work without login:

| Feature | Access | Reason |
| --- | --- | --- |
| Map / Drive | Guest | Core public traffic experience |
| Route preview | Guest | Route checking should be available immediately |
| Weather context | Guest | Weather is public context data |
| Traffic alerts | Guest | Alerts are public city-level data |
| Route condition summary | Guest | Derived from public route, weather, and traffic data |
| General reports | Guest | Analytical public traffic summaries |
| API health check | Guest | Operational validation endpoint |

## Authenticated Features

These features require login:

| Feature | Access | Reason |
| --- | --- | --- |
| Saved routes | Authenticated | User-specific stored data |
| Personal ride history | Authenticated | User-specific historical data |
| Saved destinations | Authenticated | User-specific stored data |
| User preferences | Authenticated | User-specific settings |
| Account settings | Authenticated | Identity and profile management |

## Screen Classification

Final v3 screen access:

| Screen | Guest Access | Authenticated Access | Notes |
| --- | --- | --- | --- |
| Map / Drive | Full access | Full access | Main public product surface |
| Reports | Full access | Full access | General traffic reports only |
| History | Login prompt | Personal ride history | Must not show another user's data |
| Account | Login/register prompt | Account and preferences | Cognito-backed |
| Admin / Pipeline Status | Hidden or restricted | Admin/demo access | Not a normal user tab |

## Guest Fallback UI

When a guest opens a personal feature, the app should not fail.

It should show a clear fallback state:

```text
Sign in to use this feature.
```

Recommended fallback actions:

- primary action: `Sign in`
- secondary action: `Create account`
- tertiary action: `Continue as guest`

Examples:

- History screen: "Sign in to view your ride history."
- Saved routes screen: "Sign in to save and reuse routes."
- Preferences screen: "Sign in to manage your preferences."

## Backend Access Rules

Backend endpoints should follow the same split.

Public endpoints:

- `GET /health`
- `GET /mobile/drive-overview`
- `GET /routes/report`
- `GET /routes/hourly`
- `GET /map/events`
- `GET /weather-impact`
- `GET /streets/top-congested`
- future route preview endpoint
- future route condition summary endpoint

Protected endpoints:

- future saved routes endpoints
- future personal ride history endpoints
- future preferences endpoints
- future account endpoints

Protected endpoints must reject missing or invalid tokens after Cognito JWT validation is implemented.

## Mobile App Flow

Initial app launch:

```text
Open app -> Map / Drive as guest
```

Guest route preview:

```text
Map / Drive -> enter destination -> preview route -> view condition summary
```

Guest opens personal feature:

```text
History / Saved Routes / Preferences -> login prompt -> sign in or continue as guest
```

Authenticated flow:

```text
Open app -> optional login -> Map / Drive -> personal features available
```

Logout flow:

```text
Logout -> return to guest mode -> public features remain available
```

## Cognito Role In v3

Amazon Cognito is responsible for:

- user registration
- login
- logout
- password reset
- JWT token issuing

FastAPI is responsible for:

- validating Cognito JWT tokens for protected routes
- allowing public endpoints without authentication
- rejecting protected endpoint calls without a valid token

The mobile app is responsible for:

- storing the active auth session
- attaching tokens to protected API calls
- showing guest fallback UI when the user is not authenticated

## Non-Goals

Task 2 does not implement:

- Cognito User Pool creation
- mobile login screens
- backend JWT validation
- protected database tables
- saved routes
- personal ride history storage

Those belong to later v3 tasks.

## Definition Of Done

This task is complete when:

- every main screen is classified as public or authenticated
- guest users can still use public traffic features
- personal features have clear login fallback behavior
- backend endpoint categories are documented
- later Cognito tasks have a clear access model to implement
