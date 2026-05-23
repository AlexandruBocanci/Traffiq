import pandas as pd


SUCEAVA_LATITUDE_BOUNDS = (47.60, 47.71)
SUCEAVA_LONGITUDE_BOUNDS = (26.18, 26.34)


def transform_events_data(df):
  if df.empty:
    print("FAILED: Events dataframe is empty.")
    return pd.DataFrame()

  df = df.copy()

  df["event_timestamp"] = pd.to_datetime(df["event_timestamp"], errors="coerce")
  df["event_type"] = df["event_type"].astype(str).str.strip().str.lower()
  df["street_name"] = df["street_name"].astype(str).str.strip().str.lower()
  df["description"] = df["description"].astype(str).str.strip()
  df["severity"] = df["severity"].astype(str).str.strip().str.lower()
  df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
  df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")

  df = df.dropna(
    subset=[
      "event_timestamp",
      "event_type",
      "street_name",
      "description",
      "severity",
      "latitude",
      "longitude",
    ]
  )

  allowed_event_types = ["accident", "roadwork", "hazard", "police"]
  allowed_severities = ["low", "medium", "high"]

  df = df[df["event_type"].isin(allowed_event_types)]
  df = df[df["severity"].isin(allowed_severities)]
  df = df[df["latitude"].between(*SUCEAVA_LATITUDE_BOUNDS)]
  df = df[df["longitude"].between(*SUCEAVA_LONGITUDE_BOUNDS)]

  df = df.drop_duplicates(
    subset=[
      "event_timestamp",
      "event_type",
      "street_name",
      "description",
      "severity",
      "latitude",
      "longitude",
    ]
  )

  print("SUCCESS: Events data transformed successfully.")

  return df[
    [
      "event_timestamp",
      "event_type",
      "street_name",
      "description",
      "severity",
      "latitude",
      "longitude",
    ]
  ]
