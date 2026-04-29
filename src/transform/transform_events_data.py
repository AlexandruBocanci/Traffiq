import pandas as pd


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

  df = df.dropna(
    subset=[
      "event_timestamp",
      "event_type",
      "street_name",
      "description",
      "severity",
    ]
  )

  allowed_event_types = ["accident", "roadwork", "hazard", "police"]
  allowed_severities = ["low", "medium", "high"]

  df = df[df["event_type"].isin(allowed_event_types)]
  df = df[df["severity"].isin(allowed_severities)]

  df = df.drop_duplicates(
    subset=[
      "event_timestamp",
      "event_type",
      "street_name",
      "description",
      "severity",
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
    ]
  ]
