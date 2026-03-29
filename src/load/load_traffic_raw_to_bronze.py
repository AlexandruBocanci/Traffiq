from src.utils.db_utils import get_db_connection
from datetime import datetime

def load_traffic_raw_to_bronze(df, source_file):

  if df.empty:
    print("Dataframe is empty, nothing to load.")
    return 0
  
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()
    ingested_at = datetime.now().isoformat(sep=" ", timespec="seconds")

    for _, row in df.iterrows():
      cur.execute("INSERT INTO bronze.traffic_raw (source_file, ingested_at, raw_timestamp, raw_street_name, raw_speed, raw_weather) VALUES (%s, %s, %s, %s, %s, %s)", (source_file, ingested_at,row["timestamp"], row["street_name"], row["speed"], row["weather"]))

    conn.commit()
    print(f"{len(df)} rows inserted into bronze.traffic_raw successfully.")
    return len(df)
  
  except Exception as e:
      if conn is not None:
          conn.rollback()
      print("An error occurred:", e)
      return 0

  finally:
      if cur is not None:
          cur.close()
      if conn is not None:
          conn.close()

