from src.utils.db_utils import get_db_connection
from datetime import datetime

def load_weather_raw_to_bronze(df):

  if df.empty:
    print("The dataframe is empty, nothing to load.")
    return 0
  
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()
    requested_at = datetime.now().isoformat(sep=" ", timespec="seconds")
    for _, row in df.iterrows():
      cur.execute(
      "INSERT INTO bronze.weather_raw (raw_timestamp, temperature, precipitation, wind_speed, weather_code, requested_at) VALUES (%s, %s, %s, %s, %s, %s)",
      (row["timestamp"], row["temperature"], row["precipitation"], row["wind_speed"], row["weather_code"], requested_at)
      )
    conn.commit()
    print(f"SUCCESS: {len(df)} rows inserted into bronze.weather_raw")
    return len(df)


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