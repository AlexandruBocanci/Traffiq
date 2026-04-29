import pandas as pd


def transform_rides_history_data(df):
  if df.empty:
    print("FAILED: Rides history dataframe is empty.")
    return pd.DataFrame()

  df = df.copy()

  df["ride_id"] = pd.to_numeric(df["ride_id"], errors="coerce")
  df["started_at"] = pd.to_datetime(df["started_at"], errors="coerce")
  df["ended_at"] = pd.to_datetime(df["ended_at"], errors="coerce")
  df["origin_name"] = df["origin_name"].astype(str).str.strip()
  df["destination_name"] = df["destination_name"].astype(str).str.strip()
  df["route_name"] = df["route_name"].astype(str).str.strip()
  df["distance_km"] = pd.to_numeric(df["distance_km"], errors="coerce")
  df["avg_speed"] = pd.to_numeric(df["avg_speed"], errors="coerce")
  df["congestion_score"] = pd.to_numeric(df["congestion_score"], errors="coerce")
  df["ride_status"] = df["status"].astype(str).str.strip().str.lower()

  df = df.dropna(
    subset=[
      "ride_id",
      "started_at",
      "ended_at",
      "origin_name",
      "destination_name",
      "route_name",
      "distance_km",
      "avg_speed",
      "congestion_score",
      "ride_status",
    ]
  )

  df = df[df["ended_at"] > df["started_at"]]
  df = df[df["distance_km"] > 0]
  df = df[df["avg_speed"] > 0]
  df = df[(df["congestion_score"] >= 0) & (df["congestion_score"] <= 100)]

  allowed_statuses = ["completed", "cancelled"]
  df = df[df["ride_status"].isin(allowed_statuses)]

  df["estimated_duration_minutes"] = (
    (df["ended_at"] - df["started_at"]).dt.total_seconds() / 60
  ).round(2)

  df["ride_id"] = df["ride_id"].astype(int)
  df = df.drop_duplicates(subset=["ride_id"])

  print("SUCCESS: Rides history data transformed successfully.")

  return df[
    [
      "ride_id",
      "started_at",
      "ended_at",
      "origin_name",
      "destination_name",
      "route_name",
      "distance_km",
      "avg_speed",
      "congestion_score",
      "estimated_duration_minutes",
      "ride_status",
    ]
  ]
