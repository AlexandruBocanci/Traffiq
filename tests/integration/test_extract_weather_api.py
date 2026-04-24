from src.extract.extract_weather_api import extract_weather_api

def test_extract_weather_api():
  df = extract_weather_api(47.6514, 26.2556)
  if df.empty:
    print("The dataframe is empty")
    return 0

  expected_columns = ['timestamp', 'temperature', 'precipitation', 'wind_speed', 'weather_code']
  for column in expected_columns:
    if column not in df.columns:
      print("The columns in the dataframe do not match the expected columns")
      return 0
  
  print("SUCCESS: Extraction test passed successfully.")
  return 1

print(test_extract_weather_api())