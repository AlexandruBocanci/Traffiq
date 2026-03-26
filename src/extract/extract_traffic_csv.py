import pandas as pd

def extract_traffic_csv(file_path):
  try:
    df = pd.read_csv(file_path)
    print("Successfully extracted the data from", file_path)
    return df
  except Exception as e:
    print("An error occured:", e)
    return pd.DataFrame()
