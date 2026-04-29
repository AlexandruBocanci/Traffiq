from datetime import datetime

from src.utils.db_utils import get_db_connection


def load_rides_raw_to_bronze(df, source_file):
  if df.empty:
    print("FAILED: Rides history dataframe is empty.")
    return 0

  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    ingested_at = datetime.now().isoformat(sep=" ", timespec="seconds")

    for _, row in df.iterrows():
      cur.execute(
        """
        INSERT INTO bronze.rides_raw
        (
          source_file,
          ingested_at,
          raw_ride_id,
          raw_started_at,
          raw_ended_at,
          raw_origin_name,
          raw_destination_name,
          raw_route_name,
          raw_distance_km,
          raw_avg_speed,
          raw_congestion_score,
          raw_status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
          source_file,
          ingested_at,
          row["ride_id"],
          row["started_at"],
          row["ended_at"],
          row["origin_name"],
          row["destination_name"],
          row["route_name"],
          row["distance_km"],
          row["avg_speed"],
          row["congestion_score"],
          row["status"],
        ),
      )

    conn.commit()
    print(f"SUCCESS: {len(df)} rows inserted into bronze.rides_raw.")
    return len(df)

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not load rides raw data:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()
