from src.transform.transform_weather_data import transform_weather_data
from src.extract.extract_weather_api import extract_weather_api

def test_transform_weather_data(raw_data):

  clean_df = transform_weather_data(raw_data)
  if clean_df.empty:
    print("FAILED: Clean dataframe is empty.")
    return 0

  invalid_precipitation = clean_df["precipitation"].isna() | (clean_df["precipitation"] < 0)
  invalid_wind_speed = clean_df["wind_speed"].isna() | (clean_df["wind_speed"] < 0)

  invalid_weather_code = clean_df["weather_code"].isna()
  invalid_temperature = clean_df["temperature"].isna()
  invalid_timestamp = clean_df["timestamp"].isna()

  duplicated_entries = clean_df.duplicated(subset=["timestamp", "temperature", "precipitation", "wind_speed", "weather_code"])

  check_list = [invalid_precipitation.any(), invalid_wind_speed.any(), invalid_weather_code.any(), invalid_temperature.any(), invalid_timestamp.any(),
                duplicated_entries.any()]
  
  if True in check_list:
    print("FAILED: Transform test failed.")
    return 0
  
  print("SUCCESS: Transform test completed successfully.")
  return 1

raw_df = extract_weather_api(47.6514, 26.2556)
test_transform_weather_data(raw_df)