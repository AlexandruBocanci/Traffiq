from src.extract.extract_traffic_csv import extract_traffic_csv
from src.transform.transform_traffic_data import transform_traffic_data

def test_transform_traffic_data(raw_data):
  clean_df = transform_traffic_data(raw_data)
  invalid_speed = clean_df["speed"].isna() | (clean_df["speed"] < 0)
  duplicated_entries = clean_df.duplicated(subset=["timestamp", "street_name", "speed", "weather"])
  if clean_df.empty or invalid_speed.any() or duplicated_entries.any():
      print("Transform test failed.")
  else:
      print("Transform test passed.")


raw_data = extract_traffic_csv("data/raw/traffic_raw.csv")
test_transform_traffic_data(raw_data)