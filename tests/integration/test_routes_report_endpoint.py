from fastapi.testclient import TestClient

from src.api.main import app


client = TestClient(app)


def test_routes_report_endpoint():
  response = client.get("/routes/report")

  if response.status_code != 200:
    print("FAILED: /routes/report should return status code 200.")
    print(response.text)
    return 0

  response_json = response.json()

  if response_json != {"count": 0, "data": []}:
    print("FAILED: legacy route analytics must not be presented as live traffic.")
    print(response_json)
    return 0

  print("SUCCESS: Route report no longer exposes seeded route analytics.")
  return 1


print(test_routes_report_endpoint())
