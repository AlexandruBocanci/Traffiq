from fastapi.testclient import TestClient

from src.api.auth import require_current_user
from src.api.main import app
from src.utils.db_utils import get_db_connection


client = TestClient(app)
TEST_USER_SUB = "test-user-sub-rides-history"
OTHER_USER_SUB = "test-user-sub-rides-history-other"


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


def cleanup_user_ride_history():
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
      """
      DELETE FROM silver.user_ride_history
      WHERE cognito_user_sub IN (%s, %s);
      """,
      (TEST_USER_SUB, OTHER_USER_SUB),
    )
    conn.commit()

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not clean ride history test rows:", e)

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()


def build_ride_history_payload():
  return {
    "origin": {
      "name": "City Center",
    },
    "destination": {
      "name": "Iulius Mall Suceava",
    },
    "route_name": "City Center to Iulius Mall Suceava",
    "distance_km": 3.42,
    "duration_minutes": 8.5,
    "congestion_score": 42,
    "ride_status": "completed",
  }


def test_rides_history_requires_auth():
  response = client.get("/rides/history")

  if response.status_code != 401:
    print("FAILED: /rides/history should reject guests.")
    print(response.status_code)
    print(response.text)
    return 0

  response = client.post("/rides/history", json=build_ride_history_payload())

  if response.status_code != 401:
    print("FAILED: POST /rides/history should reject guests.")
    print(response.status_code)
    print(response.text)
    return 0

  print("SUCCESS: /rides/history rejects guests.")
  return 1


def test_authenticated_user_can_add_and_view_own_ride_history():
  cleanup_user_ride_history()
  app.dependency_overrides[require_current_user] = get_test_user

  try:
    add_response = client.post("/rides/history", json=build_ride_history_payload())
    list_response = client.get("/rides/history")
  finally:
    app.dependency_overrides = {}

  if add_response.status_code != 200:
    print("FAILED: authenticated user should add ride history.")
    print(add_response.status_code)
    print(add_response.text)
    cleanup_user_ride_history()
    return 0

  if list_response.status_code != 200:
    print("FAILED: authenticated user should list ride history.")
    print(list_response.status_code)
    print(list_response.text)
    cleanup_user_ride_history()
    return 0

  response_json = list_response.json()

  if response_json["count"] != 1:
    print("FAILED: ride history list should contain one ride.")
    print(response_json)
    cleanup_user_ride_history()
    return 0

  ride = response_json["data"][0]
  required_keys = [
    "ride_id",
    "started_at",
    "ended_at",
    "origin_name",
    "destination_name",
    "route_name",
    "distance_km",
    "avg_speed",
    "congestion_score",
    "estimated_duration_minutes",
    "ride_status",
  ]

  for key in required_keys:
    if key not in ride:
      print(f"FAILED: missing key in ride history response: {key}")
      print(ride)
      cleanup_user_ride_history()
      return 0

  if ride["origin_name"] != "City Center":
    print("FAILED: ride origin should match request.")
    print(ride)
    cleanup_user_ride_history()
    return 0

  if ride["destination_name"] != "Iulius Mall Suceava":
    print("FAILED: ride destination should match request.")
    print(ride)
    cleanup_user_ride_history()
    return 0

  if ride["ride_status"] != "completed":
    print("FAILED: ride status should be completed.")
    print(ride)
    cleanup_user_ride_history()
    return 0

  cleanup_user_ride_history()
  print("SUCCESS: authenticated user can add and view own ride history.")
  return 1


def test_rides_history_is_user_scoped():
  cleanup_user_ride_history()
  app.dependency_overrides[require_current_user] = get_test_user

  try:
    add_response = client.post("/rides/history", json=build_ride_history_payload())
  finally:
    app.dependency_overrides = {}

  if add_response.status_code != 200:
    print("FAILED: test user should add ride before scoping check.")
    print(add_response.text)
    cleanup_user_ride_history()
    return 0

  app.dependency_overrides[require_current_user] = get_other_test_user

  try:
    other_user_response = client.get("/rides/history")
  finally:
    app.dependency_overrides = {}

  if other_user_response.status_code != 200:
    print("FAILED: other authenticated user should receive 200 with own list.")
    print(other_user_response.text)
    cleanup_user_ride_history()
    return 0

  if other_user_response.json()["count"] != 0:
    print("FAILED: ride history should not leak across users.")
    print(other_user_response.json())
    cleanup_user_ride_history()
    return 0

  cleanup_user_ride_history()
  print("SUCCESS: ride history is scoped by Cognito user subject.")
  return 1


print(test_rides_history_requires_auth())
print(test_authenticated_user_can_add_and_view_own_ride_history())
print(test_rides_history_is_user_scoped())
