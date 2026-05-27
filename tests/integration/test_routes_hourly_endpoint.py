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

  if response_json != {"count": 0, "data": []}:
    print("FAILED: legacy hourly route analytics must not be presented as live traffic.")
    print(response_json)
    return 0

  print("SUCCESS: Route hourly endpoint no longer exposes seeded traffic history.")
  return 1


print(test_routes_hourly_endpoint())
