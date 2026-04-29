from datetime import datetime

from src.utils.db_utils import get_db_connection


def load_events_raw_to_bronze(df, source_file):
  if df.empty:
    print("FAILED: Events dataframe is empty.")
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
        INSERT INTO bronze.events_raw
        (source_file, ingested_at, raw_event_timestamp, raw_event_type, raw_street_name, raw_description, raw_severity)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
          source_file,
          ingested_at,
          row["event_timestamp"],
          row["event_type"],
          row["street_name"],
          row["description"],
          row["severity"],
        )
      )

    conn.commit()
    print(f"SUCCESS: {len(df)} rows inserted into bronze.events_raw.")
    return len(df)

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not load events raw data:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()
