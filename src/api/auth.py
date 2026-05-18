import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.algorithms import RSAAlgorithm

from src.config.settings import (
    COGNITO_APP_CLIENT_ID,
    COGNITO_ISSUER,
)


bearer_scheme = HTTPBearer(auto_error=False)


class CognitoAuthError(Exception):
    pass


@lru_cache(maxsize=1)
def get_jwks():
    jwks_path = Path(__file__).with_name("cognito_jwks.json")

    with jwks_path.open("r", encoding="utf-8") as jwks_file:
        return json.load(jwks_file)


def get_signing_key(token: str):
    token_header = jwt.get_unverified_header(token)
    token_kid = token_header.get("kid")

    for key in get_jwks()["keys"]:
        if key.get("kid") == token_kid:
            return RSAAlgorithm.from_jwk(json.dumps(key))

    raise CognitoAuthError("Token signing key is not trusted.")


def _unauthorized(detail: str):
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def verify_cognito_access_token(token: str) -> dict[str, Any]:
    try:
        signing_key = get_signing_key(token)
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=COGNITO_ISSUER,
            options={"verify_aud": False},
            leeway=60,
        )
    except jwt.ExpiredSignatureError as exc:
        raise CognitoAuthError("Token has expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise CognitoAuthError("Token is invalid.") from exc

    if payload.get("token_use") != "access":
        raise CognitoAuthError("Token must be a Cognito access token.")

    if payload.get("client_id") != COGNITO_APP_CLIENT_ID:
        raise CognitoAuthError("Token was issued for a different app client.")

    if not payload.get("sub"):
        raise CognitoAuthError("Token does not contain a user subject.")

    return payload


def require_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    if credentials is None:
        _unauthorized("Missing bearer token.")

    if credentials.scheme.lower() != "bearer":
        _unauthorized("Invalid authorization scheme.")

    try:
        claims = verify_cognito_access_token(credentials.credentials)
    except CognitoAuthError as exc:
        _unauthorized(str(exc))

    return {
        "sub": claims["sub"],
        "username": claims.get("username"),
        "client_id": claims.get("client_id"),
        "scope": claims.get("scope", ""),
        "token_use": claims.get("token_use"),
    }
