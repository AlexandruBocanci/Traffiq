from src.utils.db_utils import get_db_connection

def load_traffic_to_silver(df):
  
  if df.empty:
    return 0
  
  conn = None
  cur = None
  try:
    conn = get_db_connection()
    cur = conn.cursor()

    for _, row in df.iterrows():
      cur.execute("INSERT INTO silver.traffic_observations (event_timestamp, street_name, avg_speed, weather_label) VALUES (%s, %s, %s, %s)",
                  (row["timestamp"], row["street_name"], row["speed"], row["weather"]))
    
    conn.commit()
    print(f"{len(df)} rows inserted into silver.traffic_observations successfully.")
    return len(df)
  
  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("An error occured", e)
    return 0
  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()