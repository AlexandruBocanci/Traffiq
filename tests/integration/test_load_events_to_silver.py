from src.extract.extract_events_csv import extract_events_csv
from src.load.load_events_raw_to_bronze import load_events_raw_to_bronze
from src.load.load_events_to_silver import load_events_to_silver
from src.transform.transform_events_data import transform_events_data
from src.utils.db_utils import get_db_connection


def test_load_events_to_silver():
  conn = None
  cur = None
  source_file = "data/raw/events_raw.csv"

  try:
    raw_events_df = extract_events_csv(source_file)
    clean_events_df = transform_events_data(raw_events_df)

    if raw_events_df.empty or clean_events_df.empty:
      print("FAILED: raw_events_df or clean_events_df should not be empty.")
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

    if bronze_inserted_rows <= 0:
      print("FAILED: bronze_inserted_rows should be greater than 0.")
      return 0

    if silver_inserted_rows <= 0:
      print("FAILED: silver_inserted_rows should be greater than 0.")
      return 0

    cur.execute("SELECT COUNT(*) FROM silver.events_observations;")
    db_count = cur.fetchone()[0]

    if db_count != silver_inserted_rows:
      print("FAILED: db_count should be equal to silver_inserted_rows.")
      return 0

    cur.execute(
      """
      SELECT event_timestamp, event_type, street_name, event_description, severity
      FROM silver.events_observations
      ORDER BY event_obs_id;
      """
    )

    rows = cur.fetchall()
    allowed_event_types = ["accident", "roadwork", "hazard", "police"]
    allowed_severities = ["low", "medium", "high"]

    for row in rows:
      event_timestamp = row[0]
      event_type = row[1]
      street_name = row[2]
      event_description = row[3]
      severity = row[4]

      if event_timestamp is None:
        print("FAILED: event_timestamp should not be null.")
        return 0

      if event_type not in allowed_event_types:
        print("FAILED: event_type is not valid.")
        print(row)
        return 0

      if street_name is None or street_name == "":
        print("FAILED: street_name should not be empty.")
        return 0

      if event_description is None or event_description == "":
        print("FAILED: event_description should not be empty.")
        return 0

      if severity not in allowed_severities:
        print("FAILED: severity is not valid.")
        print(row)
        return 0

    print("SUCCESS: Silver events load test passed.")
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


print(test_load_events_to_silver())
