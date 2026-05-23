import pandas as pd

from src.extract.extract_route_reference_csv import extract_route_reference_csv
from src.extract.extract_traffic_csv import extract_traffic_csv
from src.load.load_route_reference_to_silver import load_route_reference_to_silver
from src.load.load_route_summary_to_gold import load_route_summary_to_gold
from src.load.load_traffic_to_silver import load_traffic_to_silver
from src.pipeline.execution_safety import validate_configured_pipeline_target
from src.transform.transform_traffic_data import transform_traffic_data
from src.utils.db_utils import get_db_connection


validate_configured_pipeline_target()

def get_route_reference_df(cur):
  cur.execute(
    """
    SELECT route_id, origin_name, destination_name, route_name, route_distance_km, route_geometry_ref
    FROM silver.route_reference
    ORDER BY route_id;
    """
  )

  route_rows = cur.fetchall()
  return pd.DataFrame(
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


def get_silver_traffic_df(cur):
  cur.execute(
    """
    SELECT event_timestamp, street_name, avg_speed, weather_label
    FROM silver.traffic_observations;
    """
  )

  traffic_rows = cur.fetchall()
  return pd.DataFrame(
    traffic_rows,
    columns=[
      "event_timestamp",
      "street_name",
      "avg_speed",
      "weather_label",
    ]
  )


def test_load_route_summary_to_gold():
  conn = None
  cur = None

  try:
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

    route_reference_df = extract_route_reference_csv("data/raw/route_reference.csv")
    raw_traffic_df = extract_traffic_csv("data/raw/traffic_raw.csv")
    clean_traffic_df = transform_traffic_data(raw_traffic_df)

    route_reference_rows = load_route_reference_to_silver(route_reference_df)
    traffic_silver_rows = load_traffic_to_silver(clean_traffic_df)

    if route_reference_rows <= 0 or traffic_silver_rows <= 0:
      print("FAILED: route and traffic seed rows should be greater than 0.")
      return 0

    route_df = get_route_reference_df(cur)
    traffic_df = get_silver_traffic_df(cur)

    if route_df.empty or traffic_df.empty:
      print("FAILED: route_df or traffic_df is empty.")
      return 0

    inserted_rows = load_route_summary_to_gold(route_df, traffic_df)

    if inserted_rows <= 0:
      print("FAILED: inserted_rows should be greater than 0.")
      return 0

    cur.execute("SELECT COUNT(*) FROM gold.route_summary;")
    db_count = cur.fetchone()[0]

    if db_count != inserted_rows:
      print("FAILED: db_count should be equal to inserted_rows.")
      return 0

    cur.execute(
      """
      SELECT
        observation_count,
        avg_speed,
        min_speed,
        max_speed,
        avg_congestion_score,
        estimated_duration_minutes,
        congestion_level
      FROM gold.route_summary;
      """
    )

    rows = cur.fetchall()
    allowed_congestion_levels = ["low", "medium", "high"]

    for row in rows:
      observation_count = row[0]
      avg_speed = row[1]
      min_speed = row[2]
      max_speed = row[3]
      avg_congestion_score = row[4]
      estimated_duration_minutes = row[5]
      congestion_level = row[6]

      if observation_count <= 0:
        print("FAILED: observation_count should be greater than 0.")
        return 0

      if avg_speed is None:
        print("FAILED: avg_speed should not be null.")
        return 0

      if min_speed <= 0 or max_speed <= 0:
        print("FAILED: min_speed and max_speed should be greater than 0.")
        return 0

      if min_speed > avg_speed or avg_speed > max_speed:
        print("FAILED: avg_speed should be between min_speed and max_speed.")
        return 0

      if avg_congestion_score < 0 or avg_congestion_score > 100:
        print("FAILED: avg_congestion_score should be between 0 and 100.")
        return 0

      if estimated_duration_minutes <= 0:
        print("FAILED: estimated_duration_minutes should be greater than 0.")
        return 0

      if congestion_level not in allowed_congestion_levels:
        print("FAILED: congestion_level is not valid.")
        return 0

    print("SUCCESS: Test loading the route summary into gold passed successfully.")
    return 1

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("An error occured:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()


print(test_load_route_summary_to_gold())
