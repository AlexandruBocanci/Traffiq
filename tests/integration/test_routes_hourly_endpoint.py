from fastapi.testclient import TestClient

from src.api.main import app


client = TestClient(app)


def test_routes_hourly_endpoint():
  response = client.get("/routes/hourly")

  if response.status_code != 200:
    print("FAILED: /routes/hourly should return status code 200.")
    print(response.text)
    return 0

  response_json = response.json()

  if "count" not in response_json:
    print("FAILED: response should contain count.")
    return 0

  if "data" not in response_json:
    print("FAILED: response should contain data.")
    return 0

  if response_json["count"] <= 0:
    print("FAILED: count should be greater than 0.")
    print(response_json)
    return 0

  if len(response_json["data"]) != response_json["count"]:
    print("FAILED: data length should match count.")
    print(response_json)
    return 0

  first_row = response_json["data"][0]

  required_keys = [
    "route_id",
    "route_name",
    "metric_date",
    "hour_of_day",
    "avg_speed",
    "avg_congestion_score",
    "estimated_duration_minutes",
  ]

  for key in required_keys:
    if key not in first_row:
      print(f"FAILED: missing key in route hourly response: {key}")
      print(first_row)
      return 0

  if first_row["hour_of_day"] < 0 or first_row["hour_of_day"] > 23:
    print("FAILED: hour_of_day should be between 0 and 23.")
    print(first_row)
    return 0

  if first_row["avg_speed"] <= 0:
    print("FAILED: avg_speed should be greater than 0.")
    print(first_row)
    return 0

  if first_row["avg_congestion_score"] < 0 or first_row["avg_congestion_score"] > 100:
    print("FAILED: avg_congestion_score should be between 0 and 100.")
    print(first_row)
    return 0

  if first_row["estimated_duration_minutes"] <= 0:
    print("FAILED: estimated_duration_minutes should be greater than 0.")
    print(first_row)
    return 0

  print("SUCCESS: Routes hourly endpoint test passed.")
  print(response_json)
  return 1


print(test_routes_hourly_endpoint())
