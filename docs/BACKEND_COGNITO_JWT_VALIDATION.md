# Backend Cognito JWT Validation

## Purpose

This document records the Traffiq v3 backend JWT validation implementation.

The goal of this task is to let FastAPI verify Amazon Cognito access tokens before protected personal endpoints are added.

## What Was Added

Backend auth files:

| File | Purpose |
| --- | --- |
| `src/api/auth.py` | Cognito access token validation utility and FastAPI dependency |
| `src/api/routes/auth.py` | Protected auth validation endpoint |
| `src/api/cognito_jwks.json` | Public Cognito JWKS keys used for token signature validation |
| `tests/integration/test_auth_endpoint.py` | Auth behavior validation |

Updated files:

| File | Change |
| --- | --- |
| `src/api/main.py` | Registers the auth router |
| `src/config/settings.py` | Adds Cognito configuration values |
| `.env.example` | Documents Cognito config variables |
| `requirements.txt` | Adds `PyJWT[crypto]` |

## Cognito Backend Configuration

```text
COGNITO_REGION=eu-central-1
COGNITO_USER_POOL_ID=eu-central-1_QLCNGVSM1
COGNITO_APP_CLIENT_ID=6vp5r1edjn8phjhfm2jk1f4dcp
```

These values are configuration, not secrets.

The backend derives:

```text
COGNITO_ISSUER=https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_QLCNGVSM1
```

## Protected Test Endpoint

New endpoint:

```text
GET /auth/me
```

Behavior:

- missing bearer token returns `401`
- invalid bearer token returns `401`
- valid Cognito access token returns authenticated user context

Example successful response shape:

```json
{
  "authenticated": true,
  "user": {
    "sub": "...",
    "username": "...",
    "client_id": "6vp5r1edjn8phjhfm2jk1f4dcp",
    "scope": "...",
    "token_use": "access"
  }
}
```

## What The Backend Verifies

FastAPI verifies:

- token has a valid RS256 signature
- signing key exists in the Cognito User Pool JWKS
- issuer matches the Traffiq Cognito User Pool
- token is not expired
- token type is `access`
- token `client_id` matches the Traffiq mobile app client
- token contains a user subject

The backend also allows a small JWT clock skew:

```text
60 seconds
```

Reason:

```text
local machine time and AWS token issue time can differ by a few seconds
```

## Why JWKS Is Bundled

Normally, the backend can download JWKS from:

```text
https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_QLCNGVSM1/.well-known/jwks.json
```

In Traffiq v3, App Runner uses a VPC Connector to reach RDS.

Without a NAT Gateway, that App Runner runtime should not be expected to fetch public internet resources at request time.

To keep the deployment low-cost and avoid NAT Gateway, the current Cognito public JWKS keys are bundled in:

```text
src/api/cognito_jwks.json
```

Important:

```text
JWKS keys are public verification keys, not secrets.
```

Production note:

- if Cognito rotates signing keys, refresh `src/api/cognito_jwks.json`
- a larger production deployment could use controlled outbound internet, a cache refresh job, or a different network design

For this portfolio deployment, bundling JWKS keeps the auth validation working without adding expensive networking.

## What Is Not Done Yet

This task does not:

- protect ride history
- protect saved routes
- protect preferences
- attach user IDs to database rows
- send mobile tokens to existing API endpoints

Those belong to Task 13 and later product feature tasks.

## Local Validation

Compile validation:

```powershell
.\.venv\Scripts\python.exe -m compileall src\api src\config
```

Auth endpoint test:

```powershell
$env:PYTHONPATH='.'
.\.venv\Scripts\python.exe tests\integration\test_auth_endpoint.py
Remove-Item Env:\PYTHONPATH
```

Validated result:

```text
/health stays public
/auth/me rejects missing bearer token
/auth/me rejects invalid bearer token
```

Real Cognito token validation:

```text
temporary Cognito user created
temporary user password set
Cognito USER_PASSWORD_AUTH issued access token
local /auth/me accepted access token
temporary Cognito user deleted
current Cognito users after cleanup: 0
```

## Cloud Validation

The backend image was rebuilt and pushed to ECR:

```text
896080425393.dkr.ecr.eu-central-1.amazonaws.com/traffiq-api:latest
```

Current image digest:

```text
sha256:40a83ec75996351f8df59be63db916f18345ec8b943fa89cd04d7e1f60e61824
```

App Runner was redeployed and returned to:

```text
RUNNING
```

Public endpoint validation:

```text
GET /health -> 200
GET /auth/me without token -> 401
GET /auth/me with real Cognito access token -> 200
current Cognito users after cleanup: 0
```

## Official References

- Cognito user pool JWTs: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-access-token.html
- Cognito token verification: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html
- Cognito JWKS endpoint: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-id-token.html
