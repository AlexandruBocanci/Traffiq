from fastapi.testclient import TestClient
import pandas as pd

from src.api.main import app
from src.extract.extract_events_csv import extract_events_csv
from src.extract.extract_rides_history_csv import extract_rides_history_csv
from src.extract.extract_route_reference_csv import extract_route_reference_csv
from src.extract.extract_traffic_csv import extract_traffic_csv
from src.load.load_events_raw_to_bronze import load_events_raw_to_bronze
from src.load.load_events_to_silver import load_events_to_silver
from src.load.load_ride_history_to_silver import load_ride_history_to_silver
from src.load.load_rides_raw_to_bronze import load_rides_raw_to_bronze
from src.load.load_route_reference_to_silver import load_route_reference_to_silver
from src.load.load_route_summary_to_gold import load_route_summary_to_gold
from src.load.load_top_congested_segments_to_gold import load_top_congested_segments_to_gold
from src.load.load_traffic_to_silver import load_traffic_to_silver
from src.transform.transform_events_data import transform_events_data
from src.transform.transform_rides_history_data import transform_rides_history_data
from src.transform.transform_traffic_data import transform_traffic_data
from src.utils.db_utils import get_db_connection


client = TestClient(app)


def get_silver_traffic_df(cur):
  cur.execute(
    """
    SELECT event_timestamp, street_name, avg_speed, weather_label
    FROM silver.traffic_observations;
    """
  )

  rows = cur.fetchall()
  return pd.DataFrame(
    rows,
    columns=["event_timestamp", "street_name", "avg_speed", "weather_label"],
  )


def seed_reports_overview_data():
  conn = None
  cur = None

  try:
    route_reference_df = extract_route_reference_csv("data/raw/route_reference.csv")
    raw_traffic_df = extract_traffic_csv("data/raw/traffic_raw.csv")
    clean_traffic_df = transform_traffic_data(raw_traffic_df)

    raw_events_df = extract_events_csv("data/raw/events_raw.csv")
    clean_events_df = transform_events_data(raw_events_df)

    raw_rides_df = extract_rides_history_csv("data/raw/rides_history_raw.csv")
    clean_rides_df = transform_rides_history_data(raw_rides_df)

    if (
      route_reference_df.empty
      or clean_traffic_df.empty
      or clean_events_df.empty
      or clean_rides_df.empty
    ):
      print("FAILED: reports overview seed data should not be empty.")
      return 0

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
      """
      TRUNCATE TABLE
        bronze.events_raw,
        bronze.rides_raw,
        silver.route_reference,
        silver.traffic_observations,
        silver.events_observations,
        silver.ride_history,
        gold.route_summary,
        gold.top_congested_segments
      RESTART IDENTITY;
      """
    )
    conn.commit()

    route_reference_rows = load_route_reference_to_silver(route_reference_df)
    traffic_silver_rows = load_traffic_to_silver(clean_traffic_df)

    silver_traffic_df = get_silver_traffic_df(cur)
    route_summary_rows = load_route_summary_to_gold(route_reference_df, silver_traffic_df)
    congested_segment_rows = load_top_congested_segments_to_gold(silver_traffic_df)

    events_bronze_rows = load_events_raw_to_bronze(raw_events_df, "data/raw/events_raw.csv")
    events_silver_rows = load_events_to_silver(clean_events_df)

    rides_bronze_rows = load_rides_raw_to_bronze(raw_rides_df, "data/raw/rides_history_raw.csv")
    rides_silver_rows = load_ride_history_to_silver(clean_rides_df)

    loaded_counts = [
      route_reference_rows,
      traffic_silver_rows,
      route_summary_rows,
      congested_segment_rows,
      events_bronze_rows,
      events_silver_rows,
      rides_bronze_rows,
      rides_silver_rows,
    ]

    if any(count <= 0 for count in loaded_counts):
      print("FAILED: all reports overview seed inserts should be greater than 0.")
      print(loaded_counts)
      return 0

    return 1

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not seed reports overview endpoint test data:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()


def test_reports_overview_endpoint():
  seed_result = seed_reports_overview_data()

  if seed_result != 1:
    print("FAILED: seed_result should be 1.")
    return 0

  response = client.get("/reports/overview")

  if response.status_code != 200:
    print("FAILED: /reports/overview should return status code 200.")
    print(response.text)
    return 0

  response_json = response.json()

  required_top_level_keys = [
    "summary",
    "route_highlights",
    "top_congested_segments",
    "recent_events",
  ]

  for key in required_top_level_keys:
    if key not in response_json:
      print(f"FAILED: missing top-level key: {key}")
      print(response_json)
      return 0

  summary = response_json["summary"]
  required_summary_keys = [
    "route_count",
    "congested_segment_count",
    "event_count",
    "avg_route_congestion_score",
    "avg_route_speed",
    "high_congestion_route_count",
  ]

  for key in required_summary_keys:
    if key not in summary:
      print(f"FAILED: missing summary key: {key}")
      print(summary)
      return 0

  if summary["route_count"] <= 0:
    print("FAILED: route_count should be greater than 0.")
    print(summary)
    return 0

  if summary["congested_segment_count"] <= 0:
    print("FAILED: congested_segment_count should be greater than 0.")
    print(summary)
    return 0

  if summary["event_count"] <= 0:
    print("FAILED: event_count should be greater than 0.")
    print(summary)
    return 0

  if summary["avg_route_congestion_score"] < 0 or summary["avg_route_congestion_score"] > 100:
    print("FAILED: avg_route_congestion_score should be between 0 and 100.")
    print(summary)
    return 0

  if len(response_json["route_highlights"]) == 0:
    print("FAILED: route_highlights should not be empty.")
    print(response_json)
    return 0

  if len(response_json["top_congested_segments"]) == 0:
    print("FAILED: top_congested_segments should not be empty.")
    print(response_json)
    return 0

  if len(response_json["recent_events"]) == 0:
    print("FAILED: recent_events should not be empty.")
    print(response_json)
    return 0

  if "recent_rides" in response_json or "ride_count" in summary:
    print("FAILED: public reports should not expose personal ride history.")
    print(response_json)
    return 0

  first_route = response_json["route_highlights"][0]
  route_required_keys = [
    "route_id",
    "route_name",
    "avg_speed",
    "avg_congestion_score",
    "estimated_duration_minutes",
    "congestion_level",
  ]

  for key in route_required_keys:
    if key not in first_route:
      print(f"FAILED: missing route highlight key: {key}")
      print(first_route)
      return 0

  print("SUCCESS: Reports overview endpoint test passed.")
  print(response_json)
  return 1


print(test_reports_overview_endpoint())
