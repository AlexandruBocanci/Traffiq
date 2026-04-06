from src.utils.db_utils import get_db_connection


def load_weather_to_silver(df):
  if df.empty:
    print("FAILED: Dataframe empty, loading data to silver failed.")
    return 0

  conn = None
  cur = None
  try:
    conn = get_db_connection()
    cur = conn.cursor()

    for _, row in df.iterrows():
      cur.execute(
        "INSERT INTO silver.weather_observations (event_timestamp, temperature_c, precipitation_mm, wind_speed_kmh, weather_code) VALUES (%s, %s, %s, %s, %s)",
        (
          row["timestamp"],
          row["temperature"],
          row["precipitation"],
          row["wind_speed"],
          row["weather_code"],
        )
      )

    conn.commit()
    print(f"{len(df)} rows successfully loaded into silver.weather_observations.")
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
