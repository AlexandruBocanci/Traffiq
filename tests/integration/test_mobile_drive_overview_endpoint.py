from fastapi.testclient import TestClient

from src.api.main import app
from src.pipeline.seed_demo_data import seed_demo_data


client = TestClient(app)


def test_mobile_drive_overview_endpoint():
  seed_result = seed_demo_data()

  if seed_result.get("status") != "success":
    print("FAILED: seed_demo_data should return success.")
    print(seed_result)
    return 0

  response = client.get("/mobile/drive-overview")

  if response.status_code != 200:
    print("FAILED: /mobile/drive-overview should return status code 200.")
    print(response.text)
    return 0

  response_json = response.json()
  required_keys = ["routes", "events", "rides", "congested", "weather"]

  for key in required_keys:
    if key not in response_json:
      print(f"FAILED: missing key {key}.")
      print(response_json)
      return 0

    if key != "rides" and len(response_json[key]) == 0:
      print(f"FAILED: {key} should not be empty.")
      print(response_json)
      return 0

  if response_json["rides"] != []:
    print("FAILED: public mobile overview should not expose personal ride history.")
    print(response_json)
    return 0

  first_route = response_json["routes"][0]
  route_keys = [
    "route_id",
    "route_name",
    "origin_name",
    "destination_name",
    "avg_speed",
    "avg_congestion_score",
    "estimated_duration_minutes",
    "congestion_level",
  ]

  for key in route_keys:
    if key not in first_route:
      print(f"FAILED: missing route key {key}.")
      print(first_route)
      return 0

  print("SUCCESS: Mobile drive overview endpoint test passed.")
  print(response_json)
  return 1


print(test_mobile_drive_overview_endpoint())
