WEEKDAY_LABELS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]


WEEKDAY_BASELINE = [
    8,
    7,
    6,
    6,
    7,
    16,
    32,
    56,
    76,
    61,
    43,
    38,
    46,
    52,
    64,
    70,
    78,
    69,
    54,
    38,
    27,
    20,
    14,
    10,
]

FRIDAY_BASELINE = [
    9,
    8,
    7,
    7,
    8,
    17,
    34,
    58,
    78,
    63,
    45,
    42,
    50,
    58,
    70,
    78,
    82,
    74,
    60,
    44,
    32,
    24,
    18,
    13,
]

SATURDAY_BASELINE = [
    13,
    10,
    8,
    7,
    7,
    9,
    13,
    19,
    28,
    38,
    50,
    58,
    63,
    60,
    54,
    48,
    44,
    42,
    38,
    32,
    27,
    22,
    18,
    15,
]

SUNDAY_BASELINE = [
    10,
    8,
    7,
    6,
    6,
    7,
    9,
    12,
    18,
    26,
    34,
    42,
    48,
    45,
    40,
    37,
    35,
    34,
    31,
    25,
    20,
    16,
    13,
    10,
]


def _profile_for_weekday(weekday_index):
    if weekday_index == 4:
        return FRIDAY_BASELINE

    if weekday_index == 5:
        return SATURDAY_BASELINE

    if weekday_index == 6:
        return SUNDAY_BASELINE

    return WEEKDAY_BASELINE


def build_corridor_hourly_profile_baseline():
    rows = []

    for weekday_index, weekday_label in enumerate(WEEKDAY_LABELS):
        profile = _profile_for_weekday(weekday_index)

        for hour_of_day, score in enumerate(profile):
            rows.append(
                {
                    "weekday_index": weekday_index,
                    "weekday_label": weekday_label,
                    "hour_of_day": hour_of_day,
                    "baseline_congestion_score": score,
                }
            )

    return rows
