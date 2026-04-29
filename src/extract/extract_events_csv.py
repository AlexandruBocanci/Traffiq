import pandas as pd


def extract_events_csv(file_path):
  try:
    df = pd.read_csv(file_path)
    print(f"SUCCESS: Events data extracted from {file_path}.")
    return df

  except Exception as e:
    print("FAILED: Could not extract events CSV:", e)
    return pd.DataFrame()
