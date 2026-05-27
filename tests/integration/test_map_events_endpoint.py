from fastapi.testclient import TestClient

from src.api.main import app


client = TestClient(app)


def test_map_events_endpoint():
  response = client.get("/map/events")

  if response.status_code != 200:
    print("FAILED: /map/events should return status code 200.")
    print(response.text)
    return 0

  response_json = response.json()

  if "count" not in response_json or "data" not in response_json:
    print("FAILED: response should contain count and data.")
    print(response_json)
    return 0

  if len(response_json["data"]) != response_json["count"]:
    print("FAILED: data length should match count.")
    print(response_json)
    return 0

  required_keys = [
    "event_id",
    "event_timestamp",
    "event_type",
    "street_name",
    "event_description",
    "severity",
    "latitude",
    "longitude",
  ]
  allowed_severities = ["low", "medium", "high"]

  for row in response_json["data"]:
    for key in required_keys:
      if key not in row:
        print(f"FAILED: missing key in map events response: {key}")
        print(row)
        return 0

    if row["severity"] not in allowed_severities:
      print("FAILED: TomTom incident severity is not normalized.")
      print(row)
      return 0

    if row["latitude"] is None or row["longitude"] is None:
      print("FAILED: mapped TomTom incidents must contain coordinates.")
      print(row)
      return 0

  print("SUCCESS: Map events exposes only normalized current TomTom incidents.")
  return 1


print(test_map_events_endpoint())
