import pandas as pd

def extract_route_reference_csv(file_path):
  try:
    df = pd.read_csv(file_path)
    print(f"SUCCESS: Route reference data extracted from {file_path}.")
    return df
  except Exception as e:
    print("FAILED: Could not extract route reference CSV:", e)
    return pd.DataFrame()