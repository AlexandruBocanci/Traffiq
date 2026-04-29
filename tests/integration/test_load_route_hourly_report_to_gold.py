import pandas as pd

from src.load.load_route_hourly_report_to_gold import load_route_hourly_report_to_gold
from src.utils.db_utils import get_db_connection


def test_load_route_hourly_report_to_gold():
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

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

    if route_df.empty or traffic_df.empty:
      print("FAILED: route_df or traffic_df is empty.")
      return 0

    cur.execute("TRUNCATE TABLE gold.route_hourly_report RESTART IDENTITY;")
    conn.commit()

    inserted_rows = load_route_hourly_report_to_gold(route_df, traffic_df)

    if inserted_rows <= 0:
      print("FAILED: inserted_rows should be greater than 0.")
      return 0

    cur.execute("SELECT COUNT(*) FROM gold.route_hourly_report;")
    db_count = cur.fetchone()[0]

    if db_count != inserted_rows:
      print("FAILED: db_count should be equal to inserted_rows.")
      return 0

    cur.execute(
      """
      SELECT
        route_id,
        metric_date,
        hour_of_day,
        avg_speed,
        avg_congestion_score,
        estimated_duration_minutes
      FROM gold.route_hourly_report;
      """
    )

    rows = cur.fetchall()

    for row in rows:
      route_id = row[0]
      metric_date = row[1]
      hour_of_day = row[2]
      avg_speed = row[3]
      avg_congestion_score = row[4]
      estimated_duration_minutes = row[5]

      if route_id is None:
        print("FAILED: route_id should not be null.")
        return 0

      if metric_date is None:
        print("FAILED: metric_date should not be null.")
        return 0

      if hour_of_day is None or hour_of_day < 0 or hour_of_day > 23:
        print("FAILED: hour_of_day should be between 0 and 23.")
        return 0

      if avg_speed is None or avg_speed <= 0:
        print("FAILED: avg_speed should be greater than 0.")
        return 0

      if avg_congestion_score < 0 or avg_congestion_score > 100:
        print("FAILED: avg_congestion_score should be between 0 and 100.")
        return 0

      if estimated_duration_minutes <= 0:
        print("FAILED: estimated_duration_minutes should be greater than 0.")
        return 0

    print("SUCCESS: Route hourly report Gold load test passed.")
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


print(test_load_route_hourly_report_to_gold())
