from src.extract.extract_route_reference_csv import extract_route_reference_csv
from src.load.load_route_reference_to_silver import load_route_reference_to_silver
from src.utils.db_utils import get_db_connection


def test_load_route_reference_to_silver():
  conn = None
  cur = None

  try:
    df = extract_route_reference_csv("data/raw/route_reference.csv")

    if df.empty:
      print("FAILED: Route reference dataframe is empty.")
      return 0

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("TRUNCATE TABLE silver.route_reference RESTART IDENTITY;")
    conn.commit()

    inserted_rows = load_route_reference_to_silver(df)

    if inserted_rows <= 0:
      print("FAILED: inserted_rows should be greater than 0.")
      return 0
    
    cur.execute("SELECT COUNT(*) FROM silver.route_reference")
    expected_rows = cur.fetchone()[0]

    if inserted_rows != expected_rows:
      print("FAILED: inserted_rows should be equal to expected_rows.")
      return 0

    print("SUCCESS: Test loading the route references passed successfully.")
    return 1
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



print(test_load_route_reference_to_silver())
