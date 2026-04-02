from src.utils.db_utils import get_db_connection
import pandas as pd

def load_hourly_street_metrics_to_gold(df):

  if df.empty:
    return 0
  
  gold_df = df.copy()
  gold_df["timestamp"] = pd.to_datetime(gold_df["timestamp"], errors="coerce")
  gold_df["metric_date"] = gold_df["timestamp"].dt.date
  gold_df["hour_of_day"] = gold_df["timestamp"].dt.hour


  gold_df = gold_df.groupby(
    ["metric_date", "hour_of_day", "street_name"],
    as_index=False
  )["speed"].mean()

  gold_df = gold_df.rename(columns={"speed": "avg_speed"})
  gold_df["congestion_score"] = ((60 - gold_df["avg_speed"]) / 60) * 100
  gold_df["congestion_score"] = gold_df["congestion_score"].clip(0, 100)

  conn = None
  cur = None
  try:
    conn = get_db_connection()
    cur = conn.cursor()
    
    for _, row in gold_df.iterrows():
      cur.execute("INSERT INTO gold.hourly_street_metrics (metric_date, hour_of_day, street_name, avg_speed, congestion_score) VALUES (%s, %s, %s, %s, %s)",
                  (row["metric_date"], row["hour_of_day"], row["street_name"], row["avg_speed"], row["congestion_score"]))
    
    conn.commit()
    print(f"{len(gold_df)} rows inserted into gold.hourly_street_metrics")
    return len(gold_df)
  
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
