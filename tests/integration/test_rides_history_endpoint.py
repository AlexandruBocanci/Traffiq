from fastapi.testclient import TestClient

from src.api.main import app
from src.extract.extract_rides_history_csv import extract_rides_history_csv
from src.load.load_ride_history_to_silver import load_ride_history_to_silver
from src.load.load_rides_raw_to_bronze import load_rides_raw_to_bronze
from src.transform.transform_rides_history_data import transform_rides_history_data
from src.utils.db_utils import get_db_connection


client = TestClient(app)


def seed_ride_history_data():
  conn = None
  cur = None
  source_file = "data/raw/rides_history_raw.csv"

  try:
    raw_rides_df = extract_rides_history_csv(source_file)
    clean_rides_df = transform_rides_history_data(raw_rides_df)

    if raw_rides_df.empty or clean_rides_df.empty:
      print("FAILED: ride history test seed data should not be empty.")
      return 0

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
      """
      TRUNCATE TABLE
        bronze.rides_raw,
        silver.ride_history
      RESTART IDENTITY;
      """
    )
    conn.commit()

    bronze_inserted_rows = load_rides_raw_to_bronze(raw_rides_df, source_file)
    silver_inserted_rows = load_ride_history_to_silver(clean_rides_df)

    if bronze_inserted_rows <= 0 or silver_inserted_rows <= 0:
      print("FAILED: ride history seed inserts should be greater than 0.")
      return 0

    return silver_inserted_rows

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not seed ride history endpoint test data:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()


def test_rides_history_endpoint():
  seeded_rows = seed_ride_history_data()

  if seeded_rows <= 0:
    print("FAILED: seeded_rows should be greater than 0.")
    return 0

  response = client.get("/rides/history")

  if response.status_code != 200:
    print("FAILED: /rides/history should return status code 200.")
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
    if key not in first_row:
      print(f"FAILED: missing key in ride history response: {key}")
      print(first_row)
      return 0

  allowed_statuses = ["completed", "cancelled"]

  for row in response_json["data"]:
    if row["origin_name"] == "" or row["destination_name"] == "" or row["route_name"] == "":
      print("FAILED: ride route fields should not be empty.")
      print(row)
      return 0

    if row["distance_km"] <= 0:
      print("FAILED: distance_km should be greater than 0.")
      print(row)
      return 0

    if row["avg_speed"] <= 0:
      print("FAILED: avg_speed should be greater than 0.")
      print(row)
      return 0

    if row["congestion_score"] < 0 or row["congestion_score"] > 100:
      print("FAILED: congestion_score should be between 0 and 100.")
      print(row)
      return 0

    if row["estimated_duration_minutes"] <= 0:
      print("FAILED: estimated_duration_minutes should be greater than 0.")
      print(row)
      return 0

    if row["ride_status"] not in allowed_statuses:
      print("FAILED: ride_status is not valid.")
      print(row)
      return 0

  print("SUCCESS: Rides history endpoint test passed.")
  print(response_json)
  return 1


print(test_rides_history_endpoint())
