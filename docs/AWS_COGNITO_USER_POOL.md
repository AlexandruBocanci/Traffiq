# AWS Cognito User Pool

## Purpose

This document records the Traffiq v3 Amazon Cognito setup.

The goal of this task is to create the AWS authentication foundation for personal features while keeping public app features available to guest users.

## What Cognito Is

Amazon Cognito is the AWS managed identity service used by Traffiq for user accounts.

For Traffiq, Cognito will handle:

- user registration
- user login
- email verification
- password reset
- issuing JWT tokens after successful login

The mobile app will authenticate users with Cognito, then send Cognito JWT tokens to the FastAPI backend for protected personal features.

## What Was Created

Created AWS resources:

| Setting | Value |
| --- | --- |
| Service | `Amazon Cognito` |
| Region | `eu-central-1` |
| User pool name | `User pool - 02wbh` |
| User pool ID | `eu-central-1_QLCNGVSM1` |
| User pool ARN | `arn:aws:cognito-idp:eu-central-1:896080425393:userpool/eu-central-1_QLCNGVSM1` |
| App client name | `traffiq-mobile` |
| App client ID | `6vp5r1edjn8phjhfm2jk1f4dcp` |
| Callback URL | `traffiq://auth` |
| Identity provider | `COGNITO` |

## Sign-In Model

Traffiq uses email-based sign-in:

```text
email + password -> Cognito -> JWT tokens -> mobile app -> FastAPI protected endpoints
```

Configured user identity settings:

- sign-in identifier: `email`
- required sign-up attribute: `email`
- auto-verified attribute: `email`
- self-registration: enabled
- phone number sign-in: not used
- username sign-in: not used

This matches the v3 product scope:

- guest users can use public traffic features
- authenticated users can access personal features

## App Client

The app client is:

```text
traffiq-mobile
```

App client ID:

```text
6vp5r1edjn8phjhfm2jk1f4dcp
```

The mobile app is a public client, so it must not rely on a client secret.

Reason:

```text
mobile apps cannot safely hide permanent secrets inside the installed application bundle
```

The app client ID is configuration, not a secret. It can be documented and used by the Expo mobile app in Task 11.

## Callback URL

Configured callback URL:

```text
traffiq://auth
```

This is a mobile deep link, not a web URL.

Its purpose is to let the authentication flow return control to the Traffiq mobile app after a Cognito-managed login flow.

## What This Enables

This task enables the next auth implementation tasks:

- mobile login screen
- mobile register screen
- mobile logout
- forgot password and reset password flow
- storing Cognito tokens on the device
- sending access tokens to FastAPI
- validating Cognito JWT tokens in the backend

## What Is Not Done Yet

This task does not:

- add mobile auth screens
- install mobile auth libraries
- store tokens in the mobile app
- validate JWT tokens in FastAPI
- protect backend endpoints
- create saved routes, personal ride history, or preferences

Those belong to Task 11, Task 12, and Task 13.

## Validation

User Pool validation command:

```powershell
aws cognito-idp describe-user-pool --user-pool-id eu-central-1_QLCNGVSM1 --region eu-central-1
```

Validated result:

```text
Name: User pool - 02wbh
Id: eu-central-1_QLCNGVSM1
UsernameAttributes: email
AutoVerifiedAttributes: email
```

App client validation command:

```powershell
aws cognito-idp describe-user-pool-client --user-pool-id eu-central-1_QLCNGVSM1 --client-id 6vp5r1edjn8phjhfm2jk1f4dcp --region eu-central-1
```

Validated result:

```text
ClientName: traffiq-mobile
ClientId: 6vp5r1edjn8phjhfm2jk1f4dcp
CallbackURLs: traffiq://auth
SupportedIdentityProviders: COGNITO
```

Temporary user creation validation:

```text
Temporary user created successfully with status FORCE_CHANGE_PASSWORD.
Temporary user deleted immediately after validation.
Current user count after cleanup: 0
```

## Where To Find It In AWS

AWS Console path:

```text
AWS Console
-> Amazon Cognito
-> User pools
-> User pool - 02wbh
```

App client path:

```text
User pool - 02wbh
-> Applications
-> App clients
-> traffiq-mobile
```

Users path:

```text
User pool - 02wbh
-> User management
-> Users
```

## Cost Guardrails

Cognito should stay low-cost for Traffiq v3 because the project uses a basic user pool and a small number of users.

Rules:

- use one User Pool
- use one mobile app client
- do not enable paid SMS flows
- do not enable enterprise identity provider features unless explicitly needed
- prefer email verification and password reset through Cognito default behavior

Cost guardrails are documented in:

- `docs/AWS_COST_GUARDRAILS.md`

## Official References

- Cognito user pools: https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools.html
- App clients: https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html
- Signing up users: https://docs.aws.amazon.com/cognito/latest/developerguide/signing-up-users-in-your-app.html
- Password reset and recovery: https://docs.aws.amazon.com/cognito/latest/developerguide/managing-users-passwords.html
