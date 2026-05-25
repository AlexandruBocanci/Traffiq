from fastapi.testclient import TestClient

from src.api.auth import require_current_user
from src.api.main import app
from src.utils.db_utils import get_db_connection


client = TestClient(app)
TEST_USER_SUB = "test-user-sub-preferences"
OTHER_USER_SUB = "test-user-sub-preferences-other"


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


def cleanup_user_preferences():
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
      """
      DELETE FROM silver.user_preferences
      WHERE cognito_user_sub IN (%s, %s);
      """,
      (TEST_USER_SUB, OTHER_USER_SUB),
    )
    conn.commit()

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not clean user preferences test rows:", e)

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()


def build_preferences_payload():
  return {
    "distance_unit": "mi",
    "preferred_route_type": "less_congested",
    "theme_mode": "dark",
  }


def test_preferences_requires_auth():
  response = client.get("/preferences")

  if response.status_code != 401:
    print("FAILED: GET /preferences should reject guests.")
    print(response.status_code)
    print(response.text)
    return 0

  response = client.put("/preferences", json=build_preferences_payload())

  if response.status_code != 401:
    print("FAILED: PUT /preferences should reject guests.")
    print(response.status_code)
    print(response.text)
    return 0

  print("SUCCESS: /preferences rejects guests.")
  return 1


def test_authenticated_user_gets_default_preferences():
  cleanup_user_preferences()
  app.dependency_overrides[require_current_user] = get_test_user

  try:
    response = client.get("/preferences")
  finally:
    app.dependency_overrides = {}

  if response.status_code != 200:
    print("FAILED: authenticated user should get preferences.")
    print(response.status_code)
    print(response.text)
    cleanup_user_preferences()
    return 0

  response_json = response.json()
  preferences = response_json["data"]

  if preferences["distance_unit"] != "km":
    print("FAILED: default distance unit should be km.")
    print(response_json)
    cleanup_user_preferences()
    return 0

  if preferences["preferred_route_type"] != "balanced":
    print("FAILED: default route type should be balanced.")
    print(response_json)
    cleanup_user_preferences()
    return 0

  if preferences["theme_mode"] != "system":
    print("FAILED: default theme mode should be system.")
    print(response_json)
    cleanup_user_preferences()
    return 0

  cleanup_user_preferences()
  print("SUCCESS: authenticated user receives default preferences.")
  return 1


def test_authenticated_user_can_update_preferences():
  cleanup_user_preferences()
  app.dependency_overrides[require_current_user] = get_test_user

  try:
    update_response = client.put("/preferences", json=build_preferences_payload())
    get_response = client.get("/preferences")
  finally:
    app.dependency_overrides = {}

  if update_response.status_code != 200:
    print("FAILED: authenticated user should update preferences.")
    print(update_response.status_code)
    print(update_response.text)
    cleanup_user_preferences()
    return 0

  if get_response.status_code != 200:
    print("FAILED: authenticated user should read preferences after update.")
    print(get_response.status_code)
    print(get_response.text)
    cleanup_user_preferences()
    return 0

  preferences = get_response.json()["data"]

  if preferences["distance_unit"] != "mi":
    print("FAILED: updated distance unit should be mi.")
    print(preferences)
    cleanup_user_preferences()
    return 0

  if preferences["preferred_route_type"] != "less_congested":
    print("FAILED: updated route type should be less_congested.")
    print(preferences)
    cleanup_user_preferences()
    return 0

  if preferences["theme_mode"] != "dark":
    print("FAILED: updated theme mode should be dark.")
    print(preferences)
    cleanup_user_preferences()
    return 0

  cleanup_user_preferences()
  print("SUCCESS: authenticated user can update preferences.")
  return 1


def test_preferences_are_user_scoped():
  cleanup_user_preferences()
  app.dependency_overrides[require_current_user] = get_test_user

  try:
    update_response = client.put("/preferences", json=build_preferences_payload())
  finally:
    app.dependency_overrides = {}

  if update_response.status_code != 200:
    print("FAILED: test user should update preferences before scoping check.")
    print(update_response.text)
    cleanup_user_preferences()
    return 0

  app.dependency_overrides[require_current_user] = get_other_test_user

  try:
    other_user_response = client.get("/preferences")
  finally:
    app.dependency_overrides = {}

  if other_user_response.status_code != 200:
    print("FAILED: other authenticated user should receive own preferences.")
    print(other_user_response.text)
    cleanup_user_preferences()
    return 0

  other_preferences = other_user_response.json()["data"]

  if other_preferences["distance_unit"] != "km":
    print("FAILED: preferences should not leak across users.")
    print(other_preferences)
    cleanup_user_preferences()
    return 0

  if other_preferences["preferred_route_type"] != "balanced":
    print("FAILED: route type should not leak across users.")
    print(other_preferences)
    cleanup_user_preferences()
    return 0

  if other_preferences["theme_mode"] != "system":
    print("FAILED: theme mode should not leak across users.")
    print(other_preferences)
    cleanup_user_preferences()
    return 0

  cleanup_user_preferences()
  print("SUCCESS: preferences are scoped by Cognito user subject.")
  return 1


print(test_preferences_requires_auth())
print(test_authenticated_user_gets_default_preferences())
print(test_authenticated_user_can_update_preferences())
print(test_preferences_are_user_scoped())
