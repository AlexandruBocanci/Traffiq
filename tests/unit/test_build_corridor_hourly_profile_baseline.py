from src.transform.build_corridor_hourly_profile_baseline import (
    build_corridor_hourly_profile_baseline,
)


def test_build_corridor_hourly_profile_baseline():
    rows = build_corridor_hourly_profile_baseline()

    if len(rows) != 168:
        print("FAILED: expected 168 rows for 7 weekdays x 24 hours.")
        return 0

    keys = {(row["weekday_index"], row["hour_of_day"]) for row in rows}

    if len(keys) != 168:
        print("FAILED: weekday/hour keys should be unique.")
        return 0

    invalid_rows = [
        row
        for row in rows
        if row["baseline_congestion_score"] < 0
        or row["baseline_congestion_score"] > 100
    ]

    if invalid_rows:
        print("FAILED: baseline scores must be between 0 and 100.")
        print(invalid_rows[:3])
        return 0

    monday_8 = next(
        row
        for row in rows
        if row["weekday_index"] == 0 and row["hour_of_day"] == 8
    )
    monday_3 = next(
        row
        for row in rows
        if row["weekday_index"] == 0 and row["hour_of_day"] == 3
    )
    friday_16 = next(
        row
        for row in rows
        if row["weekday_index"] == 4 and row["hour_of_day"] == 16
    )
    sunday_8 = next(
        row
        for row in rows
        if row["weekday_index"] == 6 and row["hour_of_day"] == 8
    )

    if monday_8["baseline_congestion_score"] <= monday_3["baseline_congestion_score"]:
        print("FAILED: weekday morning commute should be higher than night traffic.")
        return 0

    if friday_16["baseline_congestion_score"] < monday_8["baseline_congestion_score"]:
        print("FAILED: Friday afternoon should remain a visible congestion peak.")
        return 0

    if sunday_8["baseline_congestion_score"] >= monday_8["baseline_congestion_score"]:
        print("FAILED: Sunday morning should be lighter than weekday commute.")
        return 0

    print("SUCCESS: Corridor hourly baseline profile has realistic 7x24 coverage.")
    return 1


print(test_build_corridor_hourly_profile_baseline())
