# Mobile Cognito Auth

## Purpose

This document records the Traffiq v3 mobile authentication implementation.

The goal of this task is to add user-facing auth screens to the Expo mobile app and connect them to the Amazon Cognito User Pool created in Task 10.

## What Was Added

Mobile auth files:

| File | Purpose |
| --- | --- |
| `mobile/src/config/auth.ts` | Cognito region, User Pool ID, App Client ID, callback URL, and endpoint |
| `mobile/src/types/auth.ts` | Auth session, token, user, and screen mode types |
| `mobile/src/services/cognitoAuth.ts` | Direct Cognito API calls through `fetch` |
| `mobile/src/context/AuthContext.tsx` | App-wide auth session state and secure token storage |
| `mobile/src/screens/AuthScreen.tsx` | Login, register, confirm email, forgot password, and reset password UI |
| `mobile/src/screens/AccountScreen.tsx` | Guest account prompt and signed-in account state |

Updated mobile files:

| File | Change |
| --- | --- |
| `mobile/App.tsx` | Wraps the app with `AuthProvider` |
| `mobile/src/navigation/AppNavigator.tsx` | Adds Account screen navigation |
| `mobile/src/screens/DriveScreen.tsx` | Adds Account button in the Drive header |
| `mobile/app.json` | Adds Expo scheme `traffiq` and Secure Store plugin |
| `mobile/package.json` | Adds `expo-secure-store` |

## Cognito Configuration Used By Mobile

```text
COGNITO_REGION=eu-central-1
COGNITO_USER_POOL_ID=eu-central-1_QLCNGVSM1
COGNITO_APP_CLIENT_ID=6vp5r1edjn8phjhfm2jk1f4dcp
COGNITO_CALLBACK_URL=traffiq://auth
```

These are configuration values, not secrets.

## Auth Flow

```text
User enters email/password
        |
        v
Expo app calls Cognito API
        |
        v
Cognito validates identity
        |
        v
Cognito returns JWT tokens
        |
        v
Expo app stores session with Secure Store
        |
        v
Account screen shows authenticated state
```

## Screens Implemented

The Account area now supports:

- guest state
- login
- register
- email confirmation
- forgot password request
- password reset confirmation
- signed-in account view
- logout

Public Drive features remain available without login.

## Token Storage

The mobile app uses:

```text
expo-secure-store
```

Purpose:

- store Cognito access token
- store Cognito ID token
- store Cognito refresh token if returned
- restore session when the app reopens

This is better than plain local state because the session can survive app restarts.

## Why Direct Cognito API Calls Are Used

The first auth version uses direct Cognito API calls through `fetch`.

Reason:

- keeps dependencies small
- makes the auth flow easy to inspect
- avoids adding a large auth framework before backend JWT validation exists

The Cognito App Client allows:

```text
ALLOW_USER_PASSWORD_AUTH
ALLOW_USER_SRP_AUTH
ALLOW_REFRESH_TOKEN_AUTH
```

`ALLOW_USER_PASSWORD_AUTH` is required by the current mobile login implementation.

## What Is Not Done Yet

This task does not:

- validate Cognito JWT tokens in FastAPI
- protect backend endpoints
- link saved routes to a Cognito user
- link ride history to a Cognito user
- add user preferences persistence
- build a standalone APK

Those belong to later v3 tasks.

## Validation

TypeScript validation:

```powershell
npx.cmd tsc --noEmit
```

Validated result:

```text
passed
```

Expo config validation:

```powershell
npx.cmd expo config --type public
```

Validated result:

```text
scheme: traffiq
plugins: expo-secure-store
```

Dependency audit:

```text
npm audit fix was run without --force.
The high severity transitive issue was removed.
Remaining audit items are moderate Expo/Metro transitive issues.
The npm proposed fix requires --force and would introduce a breaking Expo version change, so it was not applied in this task.
```

Cognito public sign-up validation:

```text
temporary sign-up user created successfully
temporary sign-up user deleted after validation
```

Cognito login validation:

```text
temporary confirmed user created
USER_PASSWORD_AUTH returned TokenType Bearer
temporary confirmed user deleted after validation
current Cognito user count after cleanup: 0
```

## How To Test Manually

Start the mobile app:

```powershell
npm.cmd start
```

In Expo Go:

1. Open Traffiq.
2. Tap the Account button in the Drive header.
3. Create an account with email and password.
4. Enter the confirmation code received by email.
5. Sign in.
6. Verify the Account screen shows the signed-in email.
7. Tap Sign out.

Expected result:

```text
guest users can still use Drive
authenticated users see Account state
logout returns the user to guest state
```

## Official References

- Cognito app clients: https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html
- Cognito InitiateAuth: https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_InitiateAuth.html
- Cognito SignUp: https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_SignUp.html
- Expo SecureStore: https://docs.expo.dev/versions/latest/sdk/securestore/
