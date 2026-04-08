import pandas as pd
import requests

def extract_weather_api(latitude, longitude):

  url = "https://api.open-meteo.com/v1/forecast"
  params = {
    "latitude": latitude,
    "longitude": longitude,
    "hourly": "temperature_2m,precipitation,wind_speed_10m,weather_code"
  }

  try:
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()

    weather_json = response.json()
    hourly = weather_json.get("hourly")
    if hourly is None:
      print("Hourly weather data is missing.")
      return pd.DataFrame()

    df = pd.DataFrame(hourly)
    df = df.rename(columns={
      "time": "timestamp",
      "temperature_2m": "temperature",
      "wind_speed_10m": "wind_speed"
    })

    return df

  except requests.RequestException as e:
    print("The request to the API failed:", e)
    return pd.DataFrame()
