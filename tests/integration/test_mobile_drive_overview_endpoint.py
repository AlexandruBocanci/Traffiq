from fastapi.testclient import TestClient

from src.api.main import app


client = TestClient(app)


def test_mobile_drive_overview_endpoint():
  response = client.get("/mobile/drive-overview")

  if response.status_code != 200:
    print("FAILED: /mobile/drive-overview should return status code 200.")
    print(response.text)
    return 0

  response_json = response.json()
  required_keys = [
    "routes",
    "events",
    "rides",
    "congested",
    "weather",
    "traffic_source",
    "traffic_scope",
    "traffic_observed_at",
  ]

  for key in required_keys:
    if key not in response_json:
      print(f"FAILED: missing key {key}.")
      print(response_json)
      return 0

  if response_json["routes"] != []:
    print("FAILED: controlled route recommendations must not be exposed as current traffic.")
    print(response_json["routes"])
    return 0

  if response_json["rides"] != []:
    print("FAILED: public mobile overview should not expose personal ride history.")
    print(response_json)
    return 0

  if response_json["traffic_source"] != "tomtom" or not response_json["traffic_observed_at"]:
    print("FAILED: mobile overview must identify a real TomTom snapshot.")
    print(response_json)
    return 0

  if len(response_json["congested"]) == 0 or len(response_json["weather"]) == 0:
    print("FAILED: real traffic and weather snapshot rows should be available.")
    print(response_json)
    return 0

  for row in response_json["congested"]:
    if row["source_provider"] != "tomtom":
      print("FAILED: a congestion row does not come from TomTom.")
      print(row)
      return 0

    if row["congestion_score"] < 0 or row["congestion_score"] > 100:
      print("FAILED: congestion score should be between 0 and 100.")
      print(row)
      return 0

  print("SUCCESS: Mobile overview exposes verified TomTom traffic without demo routes.")
  return 1


print(test_mobile_drive_overview_endpoint())
