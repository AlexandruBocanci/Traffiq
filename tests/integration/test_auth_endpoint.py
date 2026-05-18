from fastapi.testclient import TestClient

from src.api.main import app


client = TestClient(app)


def test_public_health_endpoint_does_not_require_auth():
    response = client.get("/health")

    if response.status_code != 200:
        print("FAILED: /health should stay public.")
        print(response.text)
        return 0

    print("SUCCESS: /health stays public.")
    return 1


def test_auth_me_rejects_missing_token():
    response = client.get("/auth/me")

    if response.status_code != 401:
        print("FAILED: /auth/me should reject missing bearer token.")
        print(response.status_code)
        print(response.text)
        return 0

    print("SUCCESS: /auth/me rejects missing bearer token.")
    return 1


def test_auth_me_rejects_invalid_token():
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    if response.status_code != 401:
        print("FAILED: /auth/me should reject invalid bearer token.")
        print(response.status_code)
        print(response.text)
        return 0

    print("SUCCESS: /auth/me rejects invalid bearer token.")
    return 1


print(test_public_health_endpoint_does_not_require_auth())
print(test_auth_me_rejects_missing_token())
print(test_auth_me_rejects_invalid_token())
