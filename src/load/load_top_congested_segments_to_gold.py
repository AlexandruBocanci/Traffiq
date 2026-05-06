from src.utils.db_utils import get_db_connection


REFERENCE_SPEED_KMH = 60


def load_top_congested_segments_to_gold(traffic_df, limit=10):
  if traffic_df.empty:
    print("FAILED: Traffic dataframe is empty.")
    return 0

  gold_df = traffic_df.copy()

  if "avg_speed" not in gold_df.columns and "speed" in gold_df.columns:
    gold_df = gold_df.rename(columns={"speed": "avg_speed"})

  gold_df["street_name"] = gold_df["street_name"].astype(str).str.strip().str.lower()
  gold_df = gold_df.dropna(subset=["street_name", "avg_speed"])
  gold_df = gold_df[gold_df["avg_speed"] > 0]

  if gold_df.empty:
    print("FAILED: No valid traffic rows available for top congested segments.")
    return 0

  gold_df = (
    gold_df.groupby("street_name", as_index=False)
    .agg(
      observation_count=("avg_speed", "count"),
      avg_speed=("avg_speed", "mean"),
    )
  )

  gold_df["avg_congestion_score"] = (
    (REFERENCE_SPEED_KMH - gold_df["avg_speed"]) / REFERENCE_SPEED_KMH
  ) * 100
  gold_df["avg_congestion_score"] = gold_df["avg_congestion_score"].clip(0, 100)

  gold_df = gold_df.sort_values(
    by=["avg_congestion_score", "avg_speed", "street_name"],
    ascending=[False, True, True],
  ).head(limit)

  gold_df = gold_df.reset_index(drop=True)
  gold_df["segment_rank"] = gold_df.index + 1

  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    for _, row in gold_df.iterrows():
      cur.execute(
        """
        INSERT INTO gold.top_congested_segments
        (segment_rank, street_name, observation_count, avg_speed, avg_congestion_score)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
          row["segment_rank"],
          row["street_name"],
          row["observation_count"],
          row["avg_speed"],
          row["avg_congestion_score"],
        ),
      )

    conn.commit()
    print(f"SUCCESS: {len(gold_df)} rows inserted into gold.top_congested_segments.")
    return len(gold_df)

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not load top congested segments to gold:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()
