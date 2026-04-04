import pandas as pd

def transform_weather_data(df):

  if df.empty:
    print("FAILED: Dataframe is empty, transformation failed.")
    return pd.DataFrame()
  
  df["temperature"] = pd.to_numeric(df["temperature"], errors='coerce')
  df["precipitation"] = pd.to_numeric(df["precipitation"], errors='coerce')
  df["wind_speed"] = pd.to_numeric(df["wind_speed"], errors='coerce')
  df["weather_code"] = pd.to_numeric(df["weather_code"], errors='coerce')
  df = df[df["timestamp"].notna()]
  df = df[df["temperature"].notna()]
  df = df[df["precipitation"].notna()]
  df = df[df["wind_speed"].notna()]
  df = df[df["weather_code"].notna()]
  df = df[df["precipitation"] >= 0]
  df = df[df["wind_speed"] >= 0]
  df = df.drop_duplicates(subset=["timestamp", "temperature", "precipitation", "wind_speed", "weather_code"])
  print("SUCCESS: Raw data transformed successfully.")
  return df