from src.extract.extract_rides_history_csv import extract_rides_history_csv
from src.load.load_ride_history_to_silver import load_ride_history_to_silver
from src.load.load_rides_raw_to_bronze import load_rides_raw_to_bronze
from src.transform.transform_rides_history_data import transform_rides_history_data
from src.utils.db_utils import get_db_connection


def test_load_ride_history_to_silver():
  conn = None
  cur = None
  source_file = "data/raw/rides_history_raw.csv"

  try:
    raw_rides_df = extract_rides_history_csv(source_file)
    clean_rides_df = transform_rides_history_data(raw_rides_df)

    if raw_rides_df.empty or clean_rides_df.empty:
      print("FAILED: raw_rides_df or clean_rides_df should not be empty.")
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

    if bronze_inserted_rows <= 0:
      print("FAILED: bronze_inserted_rows should be greater than 0.")
      return 0

    if silver_inserted_rows <= 0:
      print("FAILED: silver_inserted_rows should be greater than 0.")
      return 0

    cur.execute("SELECT COUNT(*) FROM silver.ride_history;")
    db_count = cur.fetchone()[0]

    if db_count != silver_inserted_rows:
      print("FAILED: db_count should be equal to silver_inserted_rows.")
      return 0

    cur.execute(
      """
      SELECT
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
      FROM silver.ride_history
      ORDER BY ride_id;
      """
    )

    rows = cur.fetchall()
    allowed_statuses = ["completed", "cancelled"]

    for row in rows:
      started_at = row[1]
      ended_at = row[2]
      origin_name = row[3]
      destination_name = row[4]
      route_name = row[5]
      distance_km = row[6]
      avg_speed = row[7]
      congestion_score = row[8]
      estimated_duration_minutes = row[9]
      ride_status = row[10]

      if started_at is None or ended_at is None or ended_at <= started_at:
        print("FAILED: ride timestamps are invalid.")
        print(row)
        return 0

      if origin_name == "" or destination_name == "" or route_name == "":
        print("FAILED: route names should not be empty.")
        print(row)
        return 0

      if distance_km <= 0:
        print("FAILED: distance_km should be greater than 0.")
        print(row)
        return 0

      if avg_speed <= 0:
        print("FAILED: avg_speed should be greater than 0.")
        print(row)
        return 0

      if congestion_score < 0 or congestion_score > 100:
        print("FAILED: congestion_score should be between 0 and 100.")
        print(row)
        return 0

      if estimated_duration_minutes <= 0:
        print("FAILED: estimated_duration_minutes should be greater than 0.")
        print(row)
        return 0

      if ride_status not in allowed_statuses:
        print("FAILED: ride_status is not valid.")
        print(row)
        return 0

    print("SUCCESS: Ride history Silver load test passed.")
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


print(test_load_ride_history_to_silver())
