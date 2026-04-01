import pandas as pd

def transform_traffic_data(df):
  df["speed"] = pd.to_numeric(df["speed"], errors="coerce")
  df = df[df["speed"].notna()]
  df = df[df["speed"] >= 0]
  df = df.drop_duplicates(subset=["timestamp", "street_name", "speed", "weather"])
  df["street_name"] = df["street_name"].str.strip().str.lower()
  df["weather"] = df["weather"].str.strip().str.lower()
  print("Raw data transformed successfully.")
  return df


