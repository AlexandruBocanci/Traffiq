from fastapi.testclient import TestClient

from src.api.main import app
from src.extract.extract_route_reference_csv import extract_route_reference_csv
from src.extract.extract_traffic_csv import extract_traffic_csv
from src.load.load_route_reference_to_silver import load_route_reference_to_silver
from src.load.load_route_summary_to_gold import load_route_summary_to_gold
from src.load.load_traffic_to_silver import load_traffic_to_silver
from src.transform.transform_traffic_data import transform_traffic_data
from src.utils.db_utils import get_db_connection
import pandas as pd


client = TestClient(app)


def seed_route_summary_data():
  conn = None
  cur = None

  try:
    route_reference_df = extract_route_reference_csv("data/raw/route_reference.csv")
    raw_traffic_df = extract_traffic_csv("data/raw/traffic_raw.csv")
    clean_traffic_df = transform_traffic_data(raw_traffic_df)

    if route_reference_df.empty or clean_traffic_df.empty:
      print("FAILED: route report seed data should not be empty.")
      return 0

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
      """
      TRUNCATE TABLE
        silver.route_reference,
        silver.traffic_observations,
        gold.route_summary
      RESTART IDENTITY;
      """
    )
    conn.commit()

    route_reference_rows = load_route_reference_to_silver(route_reference_df)
    traffic_silver_rows = load_traffic_to_silver(clean_traffic_df)

    if route_reference_rows <= 0 or traffic_silver_rows <= 0:
      print("FAILED: route report seed inserts should be greater than 0.")
      return 0

    cur.execute(
      """
      SELECT route_id, origin_name, destination_name, route_name, route_distance_km, route_geometry_ref
      FROM silver.route_reference
      ORDER BY route_id;
      """
    )
    route_rows = cur.fetchall()
    route_df = pd.DataFrame(
      route_rows,
      columns=[
        "route_id",
        "origin_name",
        "destination_name",
        "route_name",
        "route_distance_km",
        "route_geometry_ref",
      ]
    )

    cur.execute(
      """
      SELECT event_timestamp, street_name, avg_speed, weather_label
      FROM silver.traffic_observations;
      """
    )
    traffic_rows = cur.fetchall()
    traffic_df = pd.DataFrame(
      traffic_rows,
      columns=[
        "event_timestamp",
        "street_name",
        "avg_speed",
        "weather_label",
      ]
    )

    return load_route_summary_to_gold(route_df, traffic_df)

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not seed routes report endpoint test data:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()


def test_routes_report_endpoint():
  seeded_rows = seed_route_summary_data()

  if seeded_rows <= 0:
    print("FAILED: seeded_rows should be greater than 0.")
    return 0

  response = client.get("/routes/report")

  if response.status_code != 200:
    print("FAILED: /routes/report should return status code 200.")
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
    "route_id",
    "route_name",
    "origin_name",
    "destination_name",
    "route_distance_km",
    "observation_count",
    "avg_speed",
    "min_speed",
    "max_speed",
    "avg_congestion_score",
    "estimated_duration_minutes",
    "congestion_level",
  ]

  for key in required_keys:
    if key not in first_row:
      print(f"FAILED: missing key in route report response: {key}")
      print(first_row)
      return 0

  if first_row["observation_count"] <= 0:
    print("FAILED: observation_count should be greater than 0.")
    print(first_row)
    return 0

  if first_row["min_speed"] <= 0 or first_row["max_speed"] <= 0:
    print("FAILED: min_speed and max_speed should be greater than 0.")
    print(first_row)
    return 0

  if first_row["min_speed"] > first_row["avg_speed"] or first_row["avg_speed"] > first_row["max_speed"]:
    print("FAILED: avg_speed should be between min_speed and max_speed.")
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

  if first_row["congestion_level"] not in ["low", "medium", "high"]:
    print("FAILED: congestion_level is not valid.")
    print(first_row)
    return 0

  print("SUCCESS: Routes report endpoint test passed.")
  print(response_json)
  return 1


print(test_routes_report_endpoint())
