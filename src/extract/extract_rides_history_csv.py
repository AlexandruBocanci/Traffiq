import pandas as pd


def extract_rides_history_csv(file_path):
  try:
    df = pd.read_csv(file_path)
    print(f"SUCCESS: Rides history data extracted from {file_path}.")
    return df

  except Exception as e:
    print("FAILED: Could not extract rides history CSV:", e)
    return pd.DataFrame()
