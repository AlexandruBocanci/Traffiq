from fastapi.testclient import TestClient

from src.api.main import app
from src.extract.extract_events_csv import extract_events_csv
from src.load.load_events_raw_to_bronze import load_events_raw_to_bronze
from src.load.load_events_to_silver import load_events_to_silver
from src.transform.transform_events_data import transform_events_data
from src.utils.db_utils import get_db_connection


client = TestClient(app)


def seed_events_data():
  conn = None
  cur = None
  source_file = "data/raw/events_raw.csv"

  try:
    raw_events_df = extract_events_csv(source_file)
    clean_events_df = transform_events_data(raw_events_df)

    if raw_events_df.empty or clean_events_df.empty:
      print("FAILED: event test seed data should not be empty.")
      return 0

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
      """
      TRUNCATE TABLE
        bronze.events_raw,
        silver.events_observations
      RESTART IDENTITY;
      """
    )
    conn.commit()

    bronze_inserted_rows = load_events_raw_to_bronze(raw_events_df, source_file)
    silver_inserted_rows = load_events_to_silver(clean_events_df)

    if bronze_inserted_rows <= 0 or silver_inserted_rows <= 0:
      print("FAILED: event seed inserts should be greater than 0.")
      return 0

    return silver_inserted_rows

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not seed events endpoint test data:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()


def test_map_events_endpoint():
  seeded_rows = seed_events_data()

  if seeded_rows <= 0:
    print("FAILED: seeded_rows should be greater than 0.")
    return 0

  response = client.get("/map/events")

  if response.status_code != 200:
    print("FAILED: /map/events should return status code 200.")
    print(response.text)
    return 0

  response_json = response.json()

  if "count" not in response_json:
    print("FAILED: response should contain count.")
    return 0

  if "data" not in response_json:
    print("FAILED: response should contain data.")
    return 0

  if response_json["count"] != seeded_rows:
    print("FAILED: count should match seeded_rows.")
    print(response_json)
    return 0

  if len(response_json["data"]) != response_json["count"]:
    print("FAILED: data length should match count.")
    print(response_json)
    return 0

  first_row = response_json["data"][0]

  required_keys = [
    "event_id",
    "event_timestamp",
    "event_type",
    "street_name",
    "event_description",
    "severity",
  ]

  for key in required_keys:
    if key not in first_row:
      print(f"FAILED: missing key in map events response: {key}")
      print(first_row)
      return 0

  allowed_event_types = ["accident", "roadwork", "hazard", "police"]
  allowed_severities = ["low", "medium", "high"]

  for row in response_json["data"]:
    if row["event_type"] not in allowed_event_types:
      print("FAILED: event_type is not valid.")
      print(row)
      return 0

    if row["severity"] not in allowed_severities:
      print("FAILED: severity is not valid.")
      print(row)
      return 0

    if row["street_name"] == "":
      print("FAILED: street_name should not be empty.")
      print(row)
      return 0

    if row["event_description"] == "":
      print("FAILED: event_description should not be empty.")
      print(row)
      return 0

  print("SUCCESS: Map events endpoint test passed.")
  print(response_json)
  return 1


print(test_map_events_endpoint())
