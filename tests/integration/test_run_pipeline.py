from src.pipeline.run_pipeline import run_traffic_weather_pipeline


def test_run_traffic_weather_pipeline():
  result = run_traffic_weather_pipeline()

  if result.get("status") != "success":
    print("FAILED: Testing the traffic-weather pipeline failed, status should be success.")
    return 0

  required_keys = [
    "traffic_raw_rows",
    "traffic_silver_rows",
    "hourly_street_metrics_rows",
    "weather_raw_rows",
    "weather_silver_rows",
    "traffic_weather_enriched_rows",
    "weather_traffic_impact_rows",
  ]

  for key in required_keys:
    if result.get(key, 0) <= 0:
      print(f"FAILED: {key} should be greater than 0.")
      print(result)
      return 0

  if result.get("traffic_records_removed", -1) < 0:
    print("FAILED: traffic_records_removed should be greater than or equal to 0.")
    print(result)
    return 0

  if result.get("weather_records_removed", -1) < 0:
    print("FAILED: weather_records_removed should be greater than or equal to 0.")
    print(result)
    return 0

  print("SUCCESS: Full traffic-weather pipeline test passed.")
  print(result)
  return 1


print(test_run_traffic_weather_pipeline())
