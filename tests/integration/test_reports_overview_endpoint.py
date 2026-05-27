from fastapi.testclient import TestClient

from src.api.main import app


client = TestClient(app)


def test_reports_overview_endpoint():
  response = client.get("/reports/overview")

  if response.status_code != 200:
    print("FAILED: /reports/overview should return status code 200.")
    print(response.text)
    return 0

  response_json = response.json()
  required_keys = ["summary", "route_highlights", "top_congested_segments", "recent_events"]

  for key in required_keys:
    if key not in response_json:
      print(f"FAILED: missing top-level key: {key}")
      print(response_json)
      return 0

  summary = response_json["summary"]

  if summary["route_count"] != 0 or response_json["route_highlights"] != []:
    print("FAILED: seeded route analytics must not be served as real observations.")
    print(response_json)
    return 0

  if summary["congested_segment_count"] <= 0 or len(response_json["top_congested_segments"]) == 0:
    print("FAILED: TomTom monitored-corridor metrics should be served.")
    print(response_json)
    return 0

  if "recent_rides" in response_json or "ride_count" in summary:
    print("FAILED: public reports should not expose personal ride history.")
    print(response_json)
    return 0

  for segment in response_json["top_congested_segments"]:
    score = segment["avg_congestion_score"]
    if score < 0 or score > 100:
      print("FAILED: TomTom slowdown score should be between 0 and 100.")
      print(segment)
      return 0

  print("SUCCESS: Reports overview serves real corridor traffic and no seeded route highlights.")
  return 1


print(test_reports_overview_endpoint())
