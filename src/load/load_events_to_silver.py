from src.utils.db_utils import get_db_connection


def load_events_to_silver(df):
  if df.empty:
    print("FAILED: Events dataframe is empty.")
    return 0

  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    for _, row in df.iterrows():
      cur.execute(
        """
        INSERT INTO silver.events_observations
        (event_timestamp, event_type, street_name, event_description, severity)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
          row["event_timestamp"],
          row["event_type"],
          row["street_name"],
          row["description"],
          row["severity"],
        ),
      )

    conn.commit()
    print(f"SUCCESS: {len(df)} rows inserted into silver.events_observations.")
    return len(df)

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not load events to silver:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()
