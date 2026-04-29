from src.utils.db_utils import get_db_connection


def load_ride_history_to_silver(df):
  if df.empty:
    print("FAILED: Rides history dataframe is empty.")
    return 0

  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    for _, row in df.iterrows():
      cur.execute(
        """
        INSERT INTO silver.ride_history
        (
          ride_id,
          started_at,
          ended_at,
          origin_name,
          destination_name,
          route_name,
          distance_km,
          avg_speed,
          congestion_score,
          estimated_duration_minutes,
          ride_status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
          row["ride_id"],
          row["started_at"],
          row["ended_at"],
          row["origin_name"],
          row["destination_name"],
          row["route_name"],
          row["distance_km"],
          row["avg_speed"],
          row["congestion_score"],
          row["estimated_duration_minutes"],
          row["ride_status"],
        ),
      )

    conn.commit()
    print(f"SUCCESS: {len(df)} rows inserted into silver.ride_history.")
    return len(df)

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not load ride history to silver:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()
