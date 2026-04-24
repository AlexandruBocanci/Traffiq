from src.extract.extract_traffic_csv import extract_traffic_csv

def test_extraction(file_path):
  df = extract_traffic_csv(file_path)
  
  if not df.empty:
    print("Extraction test passed.")
  else:
    print("Extraction test failed.")

test_extraction("data/raw/traffic_raw.csv")