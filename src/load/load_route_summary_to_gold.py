from src.utils.db_utils import get_db_connection


REFERENCE_SPEED_KMH = 60


def load_route_summary_to_gold(route_df, traffic_df):
  if route_df.empty or traffic_df.empty:
    print("FAILED: Route or traffic dataframe is empty.")
    return 0

  route_df = route_df.copy()
  traffic_df = traffic_df.copy()

  route_df["origin_key"] = route_df["origin_name"].str.strip().str.lower()
  route_df["destination_key"] = route_df["destination_name"].str.strip().str.lower()
  traffic_df["street_key"] = traffic_df["street_name"].str.strip().str.lower()

  route_summary_rows = []

  for _, route_row in route_df.iterrows():
    route_traffic_df = traffic_df[
      (traffic_df["street_key"] == route_row["origin_key"]) |
      (traffic_df["street_key"] == route_row["destination_key"])
    ]

    if route_traffic_df.empty:
      continue

    route_distance_km = float(route_row["route_distance_km"])
    avg_speed = float(route_traffic_df["avg_speed"].mean())

    if avg_speed is None or avg_speed <= 0:
      continue

    avg_congestion_score = ((REFERENCE_SPEED_KMH - avg_speed) / REFERENCE_SPEED_KMH) * 100
    avg_congestion_score = max(0, min(100, avg_congestion_score))
    estimated_duration_minutes = (route_distance_km / avg_speed) * 60

    route_summary_rows.append(
      {
        "route_id": route_row["route_id"],
        "route_name": route_row["route_name"],
        "origin_name": route_row["origin_name"],
        "destination_name": route_row["destination_name"],
        "route_distance_km": route_distance_km,
        "avg_speed": avg_speed,
        "avg_congestion_score": avg_congestion_score,
        "estimated_duration_minutes": estimated_duration_minutes,
      }
    )

  if len(route_summary_rows) == 0:
    print("FAILED: No route summary rows were created.")
    return 0

  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    for row in route_summary_rows:
      cur.execute(
        """
        INSERT INTO gold.route_summary
        (route_id, route_name, origin_name, destination_name, route_distance_km, avg_speed, avg_congestion_score, estimated_duration_minutes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
          row["route_id"],
          row["route_name"],
          row["origin_name"],
          row["destination_name"],
          row["route_distance_km"],
          row["avg_speed"],
          row["avg_congestion_score"],
          row["estimated_duration_minutes"],
        )
      )

    conn.commit()
    print(f"SUCCESS: {len(route_summary_rows)} rows inserted into gold.route_summary.")
    return len(route_summary_rows)

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not load route summary data:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()
