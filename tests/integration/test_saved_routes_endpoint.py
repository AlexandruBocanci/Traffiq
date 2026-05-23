from fastapi.testclient import TestClient

from src.api.auth import require_current_user
from src.api.main import app
from src.utils.db_utils import get_db_connection


client = TestClient(app)
TEST_USER_SUB = "test-user-sub-saved-routes"
OTHER_USER_SUB = "test-user-sub-other"


def get_test_user():
  return {
    "sub": TEST_USER_SUB,
    "username": "test-user",
    "client_id": "test-client",
    "scope": "",
    "token_use": "access",
  }


def get_other_test_user():
  return {
    "sub": OTHER_USER_SUB,
    "username": "other-test-user",
    "client_id": "test-client",
    "scope": "",
    "token_use": "access",
  }


def cleanup_saved_routes():
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
      """
      DELETE FROM silver.saved_routes
      WHERE cognito_user_sub IN (%s, %s);
      """,
      (TEST_USER_SUB, OTHER_USER_SUB),
    )
    conn.commit()

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not clean saved route test rows:", e)

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()


def build_saved_route_payload():
  return {
    "route_name": "City Center to Iulius Mall Suceava",
    "origin": {
      "name": "City Center",
      "latitude": 47.6514,
      "longitude": 26.2556,
    },
    "destination": {
      "name": "Iulius Mall Suceava",
      "latitude": 47.6703,
      "longitude": 26.2589,
    },
    "distance_km": 3.42,
    "duration_minutes": 8.5,
    "provider": "local_suceava_fallback",
  }


def test_saved_routes_requires_auth():
  response = client.get("/saved-routes")

  if response.status_code != 401:
    print("FAILED: /saved-routes should reject guests.")
    print(response.status_code)
    print(response.text)
    return 0

  response = client.post("/saved-routes", json=build_saved_route_payload())

  if response.status_code != 401:
    print("FAILED: POST /saved-routes should reject guests.")
    print(response.status_code)
    print(response.text)
    return 0

  print("SUCCESS: /saved-routes rejects guests.")
  return 1


def test_authenticated_user_can_save_and_view_routes():
  cleanup_saved_routes()
  app.dependency_overrides[require_current_user] = get_test_user

  try:
    save_response = client.post("/saved-routes", json=build_saved_route_payload())
    list_response = client.get("/saved-routes")
  finally:
    app.dependency_overrides = {}

  if save_response.status_code != 200:
    print("FAILED: authenticated user should save route.")
    print(save_response.status_code)
    print(save_response.text)
    cleanup_saved_routes()
    return 0

  if list_response.status_code != 200:
    print("FAILED: authenticated user should list saved routes.")
    print(list_response.status_code)
    print(list_response.text)
    cleanup_saved_routes()
    return 0

  response_json = list_response.json()

  if response_json["count"] != 1:
    print("FAILED: saved route list should contain one route.")
    print(response_json)
    cleanup_saved_routes()
    return 0

  saved_route = response_json["data"][0]
  required_keys = [
    "saved_route_id",
    "route_name",
    "origin_name",
    "origin_latitude",
    "origin_longitude",
    "destination_name",
    "destination_latitude",
    "destination_longitude",
    "distance_km",
    "duration_minutes",
    "provider",
    "created_at",
    "updated_at",
  ]

  for key in required_keys:
    if key not in saved_route:
      print(f"FAILED: missing key in saved route response: {key}")
      print(saved_route)
      cleanup_saved_routes()
      return 0

  if saved_route["origin_name"] != "City Center":
    print("FAILED: saved route origin should match request.")
    print(saved_route)
    cleanup_saved_routes()
    return 0

  if saved_route["destination_name"] != "Iulius Mall Suceava":
    print("FAILED: saved route destination should match request.")
    print(saved_route)
    cleanup_saved_routes()
    return 0

  cleanup_saved_routes()
  print("SUCCESS: authenticated user can save and view routes.")
  return 1


def test_saved_routes_are_user_scoped():
  cleanup_saved_routes()
  app.dependency_overrides[require_current_user] = get_test_user

  try:
    save_response = client.post("/saved-routes", json=build_saved_route_payload())
  finally:
    app.dependency_overrides = {}

  if save_response.status_code != 200:
    print("FAILED: test user should save route before scoping check.")
    print(save_response.text)
    cleanup_saved_routes()
    return 0

  app.dependency_overrides[require_current_user] = get_other_test_user

  try:
    other_user_response = client.get("/saved-routes")
  finally:
    app.dependency_overrides = {}

  if other_user_response.status_code != 200:
    print("FAILED: other authenticated user should receive 200 with own list.")
    print(other_user_response.text)
    cleanup_saved_routes()
    return 0

  if other_user_response.json()["count"] != 0:
    print("FAILED: saved routes should not leak across users.")
    print(other_user_response.json())
    cleanup_saved_routes()
    return 0

  cleanup_saved_routes()
  print("SUCCESS: saved routes are scoped by Cognito user subject.")
  return 1


print(test_saved_routes_requires_auth())
print(test_authenticated_user_can_save_and_view_routes())
print(test_saved_routes_are_user_scoped())
