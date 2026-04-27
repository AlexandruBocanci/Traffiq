from src.utils.db_utils import get_db_connection

def load_route_reference_to_silver(df):

  if df.empty:
    print("FAILED: The dataframe is empty.")
    return 0
  
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    for _, row in df.iterrows():
      cur.execute("""
                  INSERT INTO silver.route_reference
                  (route_id, origin_name, destination_name, route_name, route_distance_km, route_geometry_ref)
                  VALUES
                  (%s, %s, %s, %s, %s, %s)
                  """,
                  (row["route_id"], row["origin_name"], row["destination_name"], row["route_name"], row["route_distance_km"], row["route_geometry_ref"])
                  )
    
    conn.commit()
      
    print(f"SUCCESS: {len(df)} rows inserted into silver.route_reference.")
    return len(df)
  
  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("An error occured:", e)
    return 0
  
  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()
