from src.extract.extract_events_csv import extract_events_csv
from src.load.load_events_raw_to_bronze import load_events_raw_to_bronze
from src.utils.db_utils import get_db_connection


def test_load_events_raw_to_bronze():
  conn = None
  cur = None

  try:
    source_file = "data/raw/events_raw.csv"
    events_df = extract_events_csv(source_file)

    if events_df.empty:
      print("FAILED: events_df should not be empty.")
      return 0

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("TRUNCATE TABLE bronze.events_raw RESTART IDENTITY;")
    conn.commit()

    inserted_rows = load_events_raw_to_bronze(events_df, source_file)

    if inserted_rows <= 0:
      print("FAILED: inserted_rows should be greater than 0.")
      return 0

    cur.execute("SELECT COUNT(*) FROM bronze.events_raw;")
    db_count = cur.fetchone()[0]

    if db_count != inserted_rows:
      print("FAILED: db_count should be equal to inserted_rows.")
      return 0

    cur.execute(
      """
      SELECT
        raw_event_timestamp,
        raw_event_type,
        raw_street_name,
        raw_description,
        raw_severity
      FROM bronze.events_raw
      ORDER BY ingestion_id;
      """
    )

    rows = cur.fetchall()

    for row in rows:
      raw_event_timestamp = row[0]
      raw_event_type = row[1]
      raw_street_name = row[2]
      raw_description = row[3]
      raw_severity = row[4]

      if raw_event_timestamp is None:
        print("FAILED: raw_event_timestamp should not be null.")
        return 0

      if raw_event_type is None or raw_event_type == "":
        print("FAILED: raw_event_type should not be empty.")
        return 0

      if raw_street_name is None or raw_street_name == "":
        print("FAILED: raw_street_name should not be empty.")
        return 0

      if raw_description is None or raw_description == "":
        print("FAILED: raw_description should not be empty.")
        return 0

      if raw_severity is None or raw_severity == "":
        print("FAILED: raw_severity should not be empty.")
        return 0

    print("SUCCESS: Bronze events raw load test passed.")
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


print(test_load_events_raw_to_bronze())
